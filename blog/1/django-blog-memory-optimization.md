# 2C2G 服务器 Django 博客内存优化实录

这台跑博客的服务器是 2C2G 的小机器，最近总感觉内存吃紧：可用内存只剩 600MB 出头，swap 长期占着 666MB。趁周末把整条链路梳理了一遍，从进程结构、搜索方案到数据库参数做了几轮优化，最终把整机真实内存占用从 1.7GB 左右压到 870MB，swap 基本清零。这篇文章记录完整的定位和优化过程，都是生产环境实测数据。

## 1. 问题：内存到底去哪了

先看优化前的主机状态：

```text
              total        used        free      shared  buff/cache   available
Mem:           1837        1038          93           0         705         611
Swap:          2047         666        1381
```

2GB 的机器，可用内存 611MB，swap 已经吃掉 666MB。负载倒是不高，但任何内存波动都会触发换页，博客响应时间跟着抖动。

容器一共 5 个：nginx、web（Django）、db（MySQL 5.7）、redis，外加一个 Nginx Proxy Manager。`docker stats` 一看，最大的 web 容器 504MB，看起来"还好"。

## 2. 定位：docker stats 的假象

真正的坑在于：504MB 是假象。按进程看 RSS，web 容器里跑着 5 个 Python 进程，每个都完整加载了 Django（30 来个 INSTALLED_APPS）：

```text
gunicorn master             ~5MB
gunicorn worker            241MB    <- 跑了 3 天，无回收机制
celery worker 主进程         73MB
celery worker 子进程 x2    80 + 102MB <- prefork 默认并发 = CPU 核数 = 2
celery beat                 71MB
```

celery 的 prefork 池默认按 CPU 核数开子进程，2 核机器直接开出 2 个 worker，每个都完整 import 一遍 Django，加上 beat 又是一个完整进程。所谓 504MB，是内核把冷页面换到 swap 之后剩下的常驻部分——swap 里那 666MB 的大头其实就是这几个进程。

结论：问题不在"容器多"，而在单个容器里跑了 5 个完整 Django 进程，而且所有容器都没有内存上限约束。

## 3. 第一步：把进程数降下来

gunicorn 加回收参数（supervisord.conf）：

```ini
[program:gunicorn-django]
command=gunicorn izone.wsgi -b 0.0.0.0:8000 --workers 1 --max-requests 1000 --max-requests-jitter 100
```

`--max-requests` 让 worker 处理满 1000 个请求后自动重启，防止 Django 加 MySQL 长连接的缓慢泄漏，那个 241MB 的 worker 不会再无限涨下去。

celery 降低并发：

```ini
command=celery -A izone worker -l info --concurrency=1
```

博客的定时任务全是轻量 IO（缓存刷新、友链检查、推送、统计），2 个 prefork 子进程纯属浪费，砍掉一个直接省 100MB 左右。

这一步零代码改动，只改 supervisord.conf 重建镜像。生效后 swap 从 666MB 降到 146MB，不再有任何 Python 进程被换出。

## 4. 第二步：合并 worker 与 beat，加内存上限

beat 和 worker 都是完整 Django 进程，各占 190MB 左右，但 beat 只负责定时派发任务。单机部署完全可以用嵌入式 beat 合并：

```ini
[program:celery-worker]
command=celery -A izone worker -l info -B --pool=solo
```

`-B` 启用嵌入式 beat（Celery 会拉一个子进程跑调度），`--pool=solo` 让任务在主进程内执行，不再开 prefork 子进程。容器内从 5 个 Django 进程降到 4 个。

然后给所有容器加内存上限，防止单个容器失控拖垮整机：

```yaml
services:
  web:
    mem_limit: 1024m
  db:
    mem_limit: 512m
  redis:
    mem_limit: 256m
  nginx:
    mem_limit: 128m
```

这里有个坑：docker-compose v1 在 `version: "3"` 的文件里不认 `mem_limit`（v3 把它挪到了 deploy.resources 下，而 v1 的 up 并不应用 deploy 配置）。把 schema 改成 `version: "2.4"`，新旧两套 compose CLI 都兼容。

## 5. 第三步：搜索重构，卸掉最重的依赖

梳理依赖时发现了更大的问题：搜索用的是 django-haystack + Whoosh + jieba。Whoosh 是纯 Python 的全文索引引擎，2016 年就停更了；jieba 词典每个进程加载一遍；更麻烦的是 Whoosh 索引要靠 `rebuild_index` 手动维护——同一个关键词，旧的 Whoosh 索引只能搜出 6 篇文章，直接查库实际有 28 篇，索引早就和数据脱节了。

个人博客的搜索量，根本不需要独立索引引擎。MySQL 5.7 的 InnoDB 自带 FULLTEXT 加 ngram 分词，直接对标题、摘要、正文建索引：

```python
# 迁移：给文章表建 ngram 全文索引
migrations.RunSQL(
    sql="ALTER TABLE blog_article ADD FULLTEXT INDEX article_ft_fulltext "
        "(title, body, summary) WITH PARSER ngram",
    reverse_sql="ALTER TABLE blog_article DROP INDEX article_ft_fulltext",
)
```

搜索视图从 haystack 的 SearchQuerySet 换成普通 ListView：

```python
term = re.sub(r'[+\-<>\\(\\)~*"@\\]', ' ', query)  # 剥离布尔语法操作符
queryset = queryset.extra(
    where=["MATCH(title, body, summary) AGAINST (%s IN BOOLEAN MODE)"],
    params=[term],
)
# n-gram 对英文会产生宽泛命中，用子串过滤收紧
for word in term.split():
    queryset = queryset.filter(
        Q(title__icontains=word) | Q(body__icontains=word) | Q(summary__icontains=word)
    )
```

顺带的收获：搜索结果永远和数据库一致，不用再手动重建索引。jieba 因为词云工具还在用所以保留，但改成函数内延迟导入，进程启动时不再加载词典。

haystack、Whoosh 两个依赖整体移除，每个 Django 进程省下几十 MB，4 个进程累计约 200MB。

## 6. 第四步：MySQL 内存调优

搜索重构之后又盯上了 MySQL。`izone_db` 容器的内存一路涨到 286MB，而 `my.cnf` 里只有字符集配置，其余全是 5.7 的默认值——默认值是按通用服务器设计的，放在 2G 的小机器上并不合适。

先看两个关键事实：

```sql
-- 业务库（数据+索引）总共只有 30.1MB
SELECT ROUND(SUM(data_length+index_length)/1024/1024, 1)
FROM information_schema.tables
WHERE table_schema = 'izone';

-- performance_schema 默认开启，这一项就要吃 100MB 以上
SHOW VARIABLES LIKE 'performance_schema';        -- ON
SHOW VARIABLES LIKE 'innodb_buffer_pool_size';   -- 128M 默认值
```

给一个 30MB 的库配 128M 缓冲池纯属浪费。调整 `my.cnf`：

```ini
[mysqld]
# 关闭 performance_schema（5.7 默认开启，占用 100MB+，博客无需）
performance_schema=OFF
# 缓冲池：数据+索引共约 30MB，64M 足够（默认 128M）
innodb_buffer_pool_size=64M
# 连接与缓存按博客流量收敛
max_connections=60
table_open_cache=400
thread_cache_size=8
tmp_table_size=16M
max_heap_table_size=16M
innodb_log_buffer_size=8M
sort_buffer_size=256K
join_buffer_size=256K
```

改完 `docker compose restart db`，几秒钟生效。`max_connections=60` 看着激进，其实重启前实测只有 2 个连接，博客的并发水平离 60 还很远。

结果：`izone_db` 从 286MB 直接降到 52MB，比预估的还好。

## 7. 优化效果汇总

| 阶段 | 变化最大的容器 | 主机可用 | 主机 swap |
|------|------------|---------|-----------|
| 优化前 | web 504MB（真实约 700MB） | 438MB | 666MB |
| 进程调优 | web 约 600MB | 338MB | 146MB |
| 合并 beat 加 mem_limit | web 398MB | 614MB | 150MB |
| 搜索重构 | web 212MB | 750MB | 150MB |
| MySQL 调优 | db 286MB 降到 52MB | 928MB | 151MB |

第二行 web 容器数值"变高"是假象：优化前的 504MB 里有 200 多 MB 被换到了 swap，`docker stats` 只统计常驻部分；进程调优后所有页面回到内存，数字才显示真实大小。

看整机总账更直观：容器总内存从约 780MB 降到约 377MB，整机真实占用（used 加 swap）从约 1.7GB 降到约 870MB，全程网站正常响应，用户无感知。

## 8. 几点体会

- 内存优化的第一刀应该砍向"跑了几个进程"，而不是"哪个参数没调"。celery 默认并发按核数开子进程、独立 beat 进程，这些默认值是按多核服务器设计的，小机器上全是浪费。
- `docker stats` 的数字要结合 swap 看，被换出的内存不在统计里，否则容易被"504MB 还好"误导。
- 依赖一个停更的索引引擎，不如用数据库自带的能力。MySQL FULLTEXT 加 ngram 对中文博客完全够用，还省掉了索引同步的心智负担。
- 数据库的默认参数也是按通用服务器设计的。5.7 的 performance_schema 一项就能吃掉 100MB 以上，对个人博客毫无用处；缓冲池大小要按真实数据量配，不是越大越好。
- 给每个容器设 mem_limit 是廉价的保险，任何一个容器泄漏都不会拖垮整机。