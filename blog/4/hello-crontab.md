# Linux 上使用 crontab 设置定时任务及运行 Python 代码不执行的解决方案

在使用 Linux 或者 Windows 的时候，我们有可能需要去定时运行一些代码，比如在每个凌晨备份一下数据库，如果这些操作都由人工控制就显得太傻了，使用 Linux 的 crontab 设置定时任务是一个非常不错的选择。但是我在使用的过程中还是遇到了一些问题。

## cron 与 crontab 的关系
### 关于 cron
cron 是 Linux 下的定时执行工具，是属于 Linux 的 service(deamon)，所以使用方式跟一般的服务类似：

```markdown
$ service crond reload    # 重新载入配置 
$ service crond start     # 启动服务 
$ service crond restart   # 重启服务 
$ service crond stop      # 关闭服务 
```

### 关于 crontab
根据我的理解，crontab 就是为 cron 提供命令的工具。比如使用 crontab 运行下面的命令可以启动 cron 的相关服务：

```markdown
$ crontab -u    # 设定某个用户的 cron 服务
$ crontab -e    # 编辑某个用户的 cron 服务 
$ crontab -l    # 列出某个用户 cron 服务详细 
$ crontab -r    # 删除某个用户的 cron 服务 
```

总之，根据我的理解：cron 才是 Linux 的执行定时任务的服务，而 crontab 是一个辅助 cron 进行命令操作的工具。

## crontab 的使用
### 开启 cron 服务的日志
为了方便在使用了定时任务之后可以查看定时任务的执行情况，所以应该开启服务的日志，操作如下步骤：

先查看一下自己的日志文件的目录中是否有 cron 的日志文件，默认是没有的，查看  /var/log 目录下面是否有 cron.log 即可，如果有那就不用下面的操作，没有的话按照下面操作开启日志：

1、修改 rsyslog 的配置文件

```
$ sudo vim /etc/rsyslog.d/50-default.conf
```
进入文件的编辑模式之后，将下面这句前面的注释符号#删除：

```
#cron.*              /var/log/cron.log
```
2、重启 rsyslog 服务

```
$ sudo service rsyslog restart
```
3、重启 cron 服务

```
$ sudo service cron restart
```
现在再去查看一下 /var/log 目录下面，可以发现多了一个 cron.log 文件。

### 写一个简单的定时任务
1、打开定时任务的编辑文件：

```
$ crontab -e
```
如果是第一次使用的话，可能让你选择编辑这个文件的方式，建议选择 vim 来编辑，当然这个看个人的习惯。

2、编辑第一个简单的任务：

```
* * * * * echo "crontab test" >> /home/alex/Desktop/mycodes/ctest.txt
```
编辑完成之后保存文件，应该可以看到如下的显示结果：

```
crontab: installing new crontab
```
说明已经添加了新的定时任务，可以使用命令来查看一下，命令如下：

```
$ crontab -l
```
3、查看任务的结果

上面的这个任务的意思是每分钟向指定的文件中写入字符串，任务分为两部分组成，前面的5个 \* 分别表示了任务启动的时间，这个具体的含义后面再说，然后后面的部分就是要执行的命令了，这里直接使用的 shell 命令，一般情况下可以把要执行的具体的命令写到 shell 脚本文件中，然后在任务中执行脚本就行了。

这个任务的结果可以去上面的命令中指定的文件中查看，是不是每隔1分钟写入了一条信息。

## cron 任务的参数解读
### 5个时间参数的含义
时间参数的基本含义见表格所示：

参数位置|第1个|第2个|第3个|第4个|第5个|
---|---|---|---|---|---
含义|分钟|小时|日期|月份|周|
参数范围|0-59|0-23|1-31|1-12|0-7|

补充说明：月份还可以使用 jan 这种月份的缩写形式，周也可以使用 mon 这种星期的英文缩写形式，周里面的0和7都是表示星期天。

### 参数的使用语法

- `*` 星号，表示任意时刻，列入表示每分钟执行一次，可以这样写：

```
* * * * * command
```

- `,` 逗号，可以表示分时段，如要表示每天的3、6、9点执行，则可以使用:

```
0 3,6,9 * * * command
```
- `-` 减号，表示一段时间内，是一个时间范围，比如要表示5到12点之间的每个小时的整点执行，可以这样写：

```
0 5-12 * * * command
```

- `/n` 斜线和数字，这个的意思是每隔n个单位时间执行一次，比如要表示每10分钟执行一次可以这样写：

```shell
*/10 * * * * command
```

### 更多例子


```
0 */2 10 * * command
```
上面表示在每个月的10号每隔2小时执行一次

```
0 0 31 * * command
```
上面表示在每个月的31号0点0分执行一次，那些没有31号的月份就不会执行

```
0 11 4 * mon-wed command
```
上面这个就复杂了，表示每个月的4号并且星期满足在周一到周三的时间内的11点整执行，所有日期上面要同时满足两个条件才行。


```
*/5 5-10,14-20 * 1-5,9-12 1-5 command
```
上面这个表示的是在1-5月和9-12这几个月份中的周一到周五之间的5-10和14-20点之间的时间，每隔5分钟执行一次


## cron 的实际应用
### 定时备份数据库
1、首先写一个备份数据的 shell 脚本文件，内容类似这样：

```
#！/usr/bin/bash
DATE=$(date +%Y%m%d-%H%M%S)
mysqldump -uusername -ppassword tendcode > /home/alex/dbs/tendcode_${DATE}.sql
```
2、然后在 crontab 任务中添加如下命令：

```
# 每天凌晨4点0分备份一次数据库
0 04 * * * sh /home/alex/codes/backup_mysql.sh
```
这就是每天凌晨4点整备份指定数据库的定时任务，其中需要注意，执行的命令脚本需要填写绝对地址，并且有时候执行的命令也要写绝对地址，比如这个例子中的 sh 有时候需要些上命令的绝对地址 /bin/sh

### 定时执行 Python 代码
1、写一个 Python 脚本，比如在 /home/alex/codes 文件夹下面创建一个 ptest.py 的 Python 脚本。

2、写一个执行 Python 脚本的 shell 脚本，可以命名为 ptest.sh 当然，这一步其实可以省略，可以直接在任务中运行 Python 脚本，但是我习惯只在任务中运行 shell 脚本。这个 shell 脚本需要这样写：

```shell
#！/usr/bin/bash
cd /home/alex/codes
/usr/bin/python3 ptest.py
```
注意这里首先进入了 Python 脚本所在的目录，当然，也可以把这个目录直接写在文件的前面，重点是关于 python3 的写法，这里不能直接使用 python3，必须写明 python3 的绝对地址才行，不然到时候任务就执行不了。

3、在任务中添加 shell 脚本命令，比如要每天凌晨5点执行 Python 脚本，可以这样写：

```
# 每天凌晨5点0分执行 Python 脚本
0 05 * * * sh /home/alex/codes/ptest.sh
```

总结：crontab 定时任务真的非常好用，特别是定时执行 Python 的爬虫，简直不要太方便。当然，还有很多 Linux 的技巧等着我去探索，学习不能停啊！