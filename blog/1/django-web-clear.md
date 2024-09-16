# 给Django网站来一个大扫除——清理过期Session

今天在看session相关的文章的时候突然想看看我自己博客的session信息，这不看不知道，一看吓一跳，session表里面居然存量72万多条数据，占用了整个数据库95%以上的空间。因此我赶紧写了一个定时任务来定期清理Django的“过期”数据。

## 查看MySQL数据

### 查看每个表的数据条数

我是无意间发现session表有大量数据的，本意是想查一下当前的网站每个表里面的数据条数。使用的查询命令如下：

```sql
SELECT table_name, table_rows
FROM information_schema.tables
WHERE table_schema = 'izone'
ORDER BY table_rows DESC;

```

这个命令可以显示指定数据库中每个表的数据条数，并且按照多到少排列，返回数据如下：

```bash
mysql> SELECT table_name, table_rows
    -> FROM information_schema.tables
    -> WHERE table_schema = 'izone'
    -> ORDER BY table_rows DESC;
+-------------------------------------+------------+
| table_name                          | table_rows |
+-------------------------------------+------------+
| django_session                      |     726229 |
| django_admin_log                    |       xxxx |
| account_emailaddress                |       xxxx |
| oauth_ouser                         |       xxxx |
| comment_articlecomment              |       xxxx |
| django_celery_results_taskresult    |        xxx |
| socialaccount_socialtoken           |        xxx |
| socialaccount_socialaccount         |        xxx |
| blog_article_keywords               |        xxx |
| blog_article_tags                   |        xxx |
| auth_permission                     |        xxx |
| blog_keyword                        |        xxx |
```

当时看到session表的数据量我一下子惊到了，难怪我每次备份和迁移数据库的时候导出的数据文件都有200多M，我之前还再想我网站的数据量应该不算大啊，哪来这么多数据的，但是也只是疑惑，没有去追究。

### 查看每个表的空间占用

看完条数，再看一下空间占用：

```sql
SELECT table_name,
       ROUND(((data_length + index_length) / (1024 * 1024)), 2) AS size_mb
FROM information_schema.tables
WHERE table_schema = 'izone'
ORDER BY size_mb DESC;

```

这个命令可以显示指定数据库中每个表的空间占用，并排序，返回结果如下：

```bash
mysql> SELECT table_name,
    ->        ROUND(((data_length + index_length) / (1024 * 1024)), 2) AS size_mb
    -> FROM information_schema.tables
    -> WHERE table_schema = 'izone'
    -> ORDER BY size_mb DESC;
+-------------------------------------+---------+
| table_name                          | size_mb |
+-------------------------------------+---------+
| django_session                      |  207.69 |
| blog_article                        |    1.58 |
| socialaccount_socialaccount         |    1.55 |
| django_celery_results_taskresult    |    1.22 |
| django_admin_log                    |    0.42 |
| oauth_ouser                         |    0.30 |
| comment_articlecomment              |    0.28 |
| account_emailaddress                |    0.22 |
| blog_feedhub                        |    0.16 |
| blog_articleview                    |    0.11 |
| django_celery_beat_periodictask     |    0.09 |
| socialaccount_socialtoken           |    0.09 |
| django_tctip_tip                    |    0.08 |
| resume_resume                       |    0.06 |
```

所以说啊，整个数据库的大小基本都是被session表占用掉了。

### 查看session表的数据

此时我就好奇session表里面到底是些啥数据，于是查询了前10条数据：

```sql
SELECT * FROM django_session LIMIT 10;
```

通过这个查看就看到了，session表里面其实就是存的一些用户session，并且最关键的是有个字段`expire_date`记录了每个session的过期时间，也就是说这里是存储了所有时间的session，包括所有早就过期了的。

看到这里，我就马上想到了我应该定期清理掉过期的session，从而减小数据库的空间占用。

## 清理session表

### 命令行清理

经过咨询ChatGPT，我得知Django其实自带了一个命令用来清理过期的session，命令如下：

```bash
python manage.py clearsessions

```

关于为什么Django不自动清理过期session，ChatGPT是这样回答的：

- **性能考虑**： 清理会话表可能是一个资源密集型操作，如果Django自动执行，可能会对系统性能产生不必要的负担。通过手动执行，开发者可以更好地控制清理的时间和频率。

- **定制需求**： 不同的项目可能对会话数据的保留时间有不同的需求。有些项目可能希望保留会话数据较长时间，而另一些项目可能需要更频繁地清理。

- **分布式系统**： 在分布式系统中，清理会话数据可能涉及到更复杂的协调和同步问题。通过手动执行清理，可以更好地适应不同的系统架构。

总的来说，Django提供了清理会话数据的工具，但开发者需要根据项目的特定需求来决定何时以及如何执行这个清理操作。

### 定时任务清理

ChatGPT也说了，开发者可以自定义定时任务来清理过期session，因此我把这个清理的事情交给定时任务来做。

以下是我的定时任务函数：

```python
# easytask/tasks.py

from celery import shared_task
from django.core.management import call_command

@shared_task
def clear_expired_sessions():
    call_command('clearsessions')

```

这样就可以按需添加到定时任务中定期清理。

## 清理后效果

清理之后再来看看数据条数：

```bash
+-------------------------------------+------------+
| table_name                          | table_rows |
+-------------------------------------+------------+
| django_session                      |       6327 |
```

数据空间：

```bash
+-------------------------------------+---------+
| table_name                          | size_mb |
+-------------------------------------+---------+
| django_session                      |   89.05 |
```

看这数据好像不太对劲，明明数据条数从72万变成了6300，空间却只是从207M变成了89M，这明显不合理。

然后我查了一下是需要执行释放空间的命令才行，登录到MySQL里面执行：

```sql
use izone;
OPTIMIZE TABLE django_session;
```

再次查看空间就对了：

```bash
+-------------------------------------+---------+
| table_name                          | size_mb |
+-------------------------------------+---------+
| django_session                      |    1.83 |
```

不过这个是初次执行的时候需要释放空间，后面定时清理，数据量不大，就不用释放空间了，因为这部分空间是可以写入新内容的。

再来对比一下数据库的备份文件的大小变化：

```bash
# du -sh *
153M    izone_20240113_050001.sql
4.5M    izone_20240114_050001.sql
```

