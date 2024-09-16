# Django使用Celery实现异步和定时任务功能

##  安装celery依赖

我在使用celery之前也是看了一些相关教程的，很多Django使用celery的教程会让安装`django-celery`这个库，但是我对比了一些指导后觉得没必要，具体需要安装的依赖以我这篇文章为参考即可。

以下几个库可以直接安装：

```bash
celery==4.4.2
django-celery-beat==2.2.0
django-celery-results==2.0.1
```

顺便附带一下我Django的版本信息，以及redis的版本信息，因为celery会使用到redis，所以redis库是前提，我博客本身就有redis作为缓存，所以就不单独安装，只是附带一下相关的版本信息.

```bash
Django==2.2.28
redis==3.3.8
```

为什么我这里会强调版本信息呢？因为我是踩过坑的，我第一次没有指定celery版本的时候默认给我安装了一个5+的版本，然后使用的时候一直会报错，查了一堆相关说发现是版本兼容问题，所以我根据Django的版本发布时间去找了那个时间段celery的版本，也就是上面使用的4.4左右的版本。所以如果你使用的Django版本跟我这个差别很大，可以使用同样的方式去找到合适的依赖版本。

## 添加配置信息

首先说明一下上面安装的3个依赖是干嘛的：

- `celery` 是主要的依赖库，就是python使用的celery的sdk
- `django-celery-beat` 是一个Django应用，主要是方便用后台管理定时任务，非必需单推荐安装
- `django-celery-results` 也是一个Django应用，用来记录celery定时任务的结果，非必需单推荐安装

### 添加应用

安装完依赖之后，把上面的两个应用添加到Django配置文件的`INSTALLED_APPS`里面：

```python
INSTALLED_APPS = [
	...
	'django_celery_results',  # celery结果
	'django_celery_beat',     # celery定时任务
]
```

### 添加celery配置信息

在项目的配置文件中添加如下配置信息，具体的配置作用见注释：

```python
# 跟缓存的redis配置类似，使用不同的库就行
CELERY_BROKER_URL = "redis://{}:{}/1".format(izone_redis_host, izone_redis_port)
# 时区跟Django的一致
CELERY_TIMEZONE = TIME_ZONE
# 不使用utc，所以在定时任务里面的时间应该比上海时间少8小时，比如要设置本地16:00执行，那么应该在定时里面设置成8:00
CELERY_ENABLE_UTC = False
# 应对django在使用mysql的时候设置USE_TZ = False导致的报错
DJANGO_CELERY_BEAT_TZ_AWARE = False
# 支持数据库django-db和缓存django-cache存储任务状态及结果
CELERY_RESULT_BACKEND = "django-db"
CELERY_CACHE_BACKEND = 'django-cache'
# 将任务调度器设为DatabaseScheduler
CELERY_BEAT_SCHEDULER = 'django_celery_beat.schedulers:DatabaseScheduler'
# celery内容等消息的格式设置，默认json
CELERY_ACCEPT_CONTENT = ['application/json', ]
CELERY_TASK_SERIALIZER = 'json'
CELERY_RESULT_SERIALIZER = 'json'
# 每个 worker 最多执行n个任务就会被销毁，可防止内存泄露
CELERY_WORKER_MAX_TASKS_PER_CHILD = 100
# 为存储结果设置过期日期，默认1天过期。如果beat开启，Celery每天会自动清除，0表示永不清理
# 这里可以设置成0，然后自己创建清理结果的机制，比较好控制
CELERY_RESULT_EXPIRES = 0
```

这里主要对几个配置进行一下强调：

- `CELERY_BROKER_URL` 这个是配置缓存的数据库地址，可以直接跟项目的redis配置保持一致，然后换一个库即可，比如Django自身用0，celery可以用1
- `CELERY_TIMEZONE` 这个是时区，直接使用Django的配置
- `CELERY_ENABLE_UTC` 是否用UTC，跟Django配置保持一致
- `DJANGO_CELERY_BEAT_TZ_AWARE` 如果使用了mysql当Django数据库的，这个必须填写False，因为mysql不支持TZ，这个配置可以避免报错，但是使用了这个之后，后台管理里面定时任务的时间会比上海时间差8小时，也就是现实是8点，在后台里面显示0点
- `CELERY_RESULT_EXPIRES` 这个参数是为了配置一个定时清理任务结果的定时任务，强烈建议设置0，不要内置的清理策略，自己定义一个清理策略更方便可控

## 添加celery文件

配置设置完成后，需要在项目的配置文件的同目录添加一个celery.py文件用来作为django调用celery的文件，具体内容如下:

```baseh
├── izone
│   ├── __init__.py
│   ├── celery.py
│   ├── settings.py
│   ├── urls.py
│   └── wsgi.py

```

```python
# izone/celery.py
# -*- coding:utf-8 -*-
import os
from celery import Celery

# 设置环境变量
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'izone.settings')

# 实例化
app = Celery('izone')

# namespace='CELERY'作用是允许你在Django配置文件中对Celery进行配置
# 但所有Celery配置项必须以CELERY开头，防止冲突
app.config_from_object('django.conf:settings', namespace='CELERY')

# 自动从Django的已注册app中发现任务
app.autodiscover_tasks()
```

这个文件的主要作用就是导入celery库，并且指定celery的配置信息从Django的配置文件中读取，然后给celery分配了一个命名空间为项目名称，比如这里的izoned。

添加完celery.py之后，还需要在同目录的`__init__.py`文件中加入如下代码用来在Django启动的时候加载celery。

```python
# izone/__init__.py
from .celery import app as celery_app

__all__ = ('celery_app',)
```

然后可以在同目录或者应用的目录里面添加一个tasks.py用来添加自定义的任务，比如下面添加一个简单的任务，用来模拟耗时的任务：

```python
# izone/tasks.py
# -*- coding: utf-8 -*-
import time

from celery import shared_task

@shared_task
def simple_task(x, y):
    time.sleep(5)
    return x + y
```

到此，配置文件就都完成了。

## 迁移数据库

配置信息和celery相关文件添加完成后，可以迁移数据库，主要是迁移的上面新增的两个应用的表。

```bash
python manage.py makemigrations
python manage.py migrate
```

此时可以看到上面新增的应用创建的表信息，此时可以登录到后台看到两个应用的表。

![](https://cdn.jsdelivr.net/gh/Hopetree/blog-img@main/article/2307/celery-db.png)

简单介绍一下这些表的作用：

- Task results：顾名思义，这个表是存放的任务的结果，也就是`django-celery-results`应用创建的表
- Clocked：这个是定时任务的定时设置，可以添加一些定时的具体时间的实例
- Crontabs：这个看表名称就很容易理解，可以设置crontab的定时任务
- Intervals：这个是可以设置重复性任务，比如每小时执行，每天执行，每月执行这种
- Periodic tasks：这个表才是真正用来添加定时任务的，上面的三个表都是添加的任务执行的时间和策略，这个表添加具体的任务，并且需要绑定上面的三个策略
- Solar events：这个表可以忽略，根本用不到，感兴趣的可以去查一下是干嘛的

## 启动celery

完成数据迁移只是能看到数据表，任务是不能运行的，我们需要启动celery才行。

项目启动之后，重新创建一个命令行窗口，执行如下命令启动 celery的，celery的路径就是你项目的路径，比如我这里的一个虚拟环境

```bash
/Users/timo/.pyenv/versions/3.9.2/bin/celery -A izone worker -l info
```

不出意外的话，可以看到如下输出：


```bash
 
 -------------- celery@MacBook-Air.local v4.4.2 (cliffs)
--- ***** ----- 
-- ******* ---- macOS-13.4.1-arm64-arm-64bit 2023-07-16 12:45:20
- *** --- * --- 
- ** ---------- [config]
- ** ---------- .> app:         izone:0x103ebbcd0
- ** ---------- .> transport:   redis://127.0.0.1:6379/1
- ** ---------- .> results:     
- *** --- * --- .> concurrency: 8 (prefork)
-- ******* ---- .> task events: OFF (enable -E to monitor tasks in this worker)
--- ***** ----- 
 -------------- [queues]
                .> celery           exchange=celery(direct) key=celery
                

[tasks]
  . easytask.tasks.baidu_push
  . easytask.tasks.check_friend
  . easytask.tasks.cleanup_task_result
  . easytask.tasks.clear_notification
  . easytask.tasks.simple_task
  . easytask.tasks.update_cache
  . imagekit.cachefiles.backends._generate_file

[2023-07-16 12:45:20,896: INFO/MainProcess] Connected to redis://127.0.0.1:6379/1
[2023-07-16 12:45:20,903: INFO/MainProcess] mingle: searching for neighbors
[2023-07-16 12:45:21,923: INFO/MainProcess] mingle: all alone
[2023-07-16 12:45:21,948: WARNING/MainProcess] /Users/timo/.pyenv/versions/3.9.2/lib/python3.9/site-packages/celery/fixups/django.py:202: UserWarning: Using settings.DEBUG leads to a memory
            leak, never use this setting in production environments!
  warnings.warn('''Using settings.DEBUG leads to a memory
[2023-07-16 12:45:21,948: INFO/MainProcess] celery@MacBook-Air.local ready.

```

这就说明任务正常启动了，接着还有重新开一个窗口，启动定时任务:

```bash
/Users/timo/.pyenv/versions/3.9.2/bin/celery  -A izone beat -l info
```

可以看到类似如下输出：

```bash
celery beat v4.4.2 (cliffs) is starting.
__    -    ... __   -        _
LocalTime -> 2023-07-16 12:50:17
Configuration ->
    . broker -> redis://127.0.0.1:6379/1
    . loader -> celery.loaders.app.AppLoader
    . scheduler -> django_celery_beat.schedulers.DatabaseScheduler

    . logfile -> [stderr]@%INFO
    . maxinterval -> 5.00 seconds (5s)
[2023-07-16 12:50:17,444: INFO/MainProcess] beat: Starting...
[2023-07-16 12:50:17,534: INFO/MainProcess] Scheduler: Sending due task 更新缓存 (easytask.tasks.update_cache)
[2023-07-16 12:50:17,583: INFO/MainProcess] Scheduler: Sending due task 检查友链 (easytask.tasks.check_friend)
[2023-07-16 12:50:17,595: INFO/MainProcess] Scheduler: Sending due task 清理任务结果 (easytask.tasks.cleanup_task_result)
[2023-07-16 12:50:17,605: INFO/MainProcess] Scheduler: Sending due task 百度推送最近文章 (easytask.tasks.baidu_push)

```

> 记住：每次在项目的tasks.py 中更新或者添加了定时任务都需要重新运行上面的两个命令重新加载任务，在后台添加的任务是不需要重新启动的。

## 添加定时任务

以上准备工作都做好了，可以去后台添加定时任务。

### 添加一个策略

首先需要添加定时任务的执行策略，比如添加一个一分钟执行一次的策略，可以到Intervals表中添加：

![](https://cdn.jsdelivr.net/gh/Hopetree/blog-img@main/article/2307/celery-inerval.png)

其他策略也是类似的方式，具体使用三钟策略方式的哪个看需求。

### 添加定时任务

策略添加之后，可以去任务的表`Periodic tasks`中添加一个定时任务，这里就选择我们添加的那个简单的任务

![](https://cdn.jsdelivr.net/gh/Hopetree/blog-img@main/article/2307/celery-task.png)

这里会让你选择一个任务，可选的任务就是我们在tasks.py中定义的任务，然后还需要选择一个执行策略，选择刚才添加的1分钟执行一次。

任务里面还可以配置执行参数，如果我们的任务函数可以添加参数的话，这里就可以进行配置，格式是json格式。比如我们添加的这个任务就是必须添加参数的，参数是x,y，我们可以在参数里面添加：

![](https://cdn.jsdelivr.net/gh/Hopetree/blog-img@main/article/2307/task-args.png)

添加参数的方式有两种，一种是列表形式，另一种是字典形式，都可以，记住格式是json，后台会自动转化成python的参数。

我们这里就计算1+9等于多少。

### 查看执行结果

当添加完成任务后，可以去之前运行命令的窗口看一下日志，那个`celery  -A izone beat -l info`的命令行中会提示有新的任务更新，等待一分钟还可以看到有任务执行的记录

```bash
[2023-07-16 13:06:06,927: INFO/MainProcess] DatabaseScheduler: Schedule changed.
[2023-07-16 13:06:31,783: INFO/MainProcess] Scheduler: Sending due task 任务测试 (easytask.tasks.simple_task)
[2023-07-16 13:07:31,799: INFO/MainProcess] Scheduler: Sending due task 任务测试 (easytask.tasks.simple_task)
```

然后去看另一个窗口，就是执行`celery -A izone worker -l info`的窗口，可以看到输出了任务的执行结果：

```bash
[2023-07-16 13:06:31,788: INFO/MainProcess] Received task: easytask.tasks.simple_task[c49d8905-77eb-4db8-95d5-4f9456ae05a3]  
[2023-07-16 13:06:33,838: INFO/ForkPoolWorker-8] Task easytask.tasks.simple_task[c49d8905-77eb-4db8-95d5-4f9456ae05a3] succeeded in 2.0387562920000164s: 10
[2023-07-16 13:07:31,802: INFO/MainProcess] Received task: easytask.tasks.simple_task[a518cbc9-acc0-45ea-8652-c537873d0415]  
[2023-07-16 13:07:33,831: INFO/ForkPoolWorker-8] Task easytask.tasks.simple_task[a518cbc9-acc0-45ea-8652-c537873d0415] succeeded in 2.027986415999976s: 10
```

## supervisor启动celery

经过上面的操作，我们已经成功在Django里面使用上了celery，可以灵活的添加定时任务，但是目前有个问题，就是需要开启三个窗口去分别运行项目和celery的服务，这在生产环境应该怎么做呢？

我之前的文章讲supervisor的使用的时候就提到了，我是因为要使用celery所以才将项目的运行方式换成supervisor的，所以现在就来添加进程配置。

在supervisord.conf中添加服务配置，用来启动celery的两个进程，具体的配置类似Django项目本身的配置，具体如下：

```conf
[program:celery-worker]
command=celery -A izone worker -l info
directory=/opt/cloud/izone
stdout_logfile=log/celery.worker.log
stderr_logfile=log/celery.worker.log
autostart=true
autorestart=true
startsecs=3
stopwaitsecs=3
priority=102

[program:celery-beat]
command=celery -A izone beat -l info
directory=/opt/cloud/izone
stdout_logfile=log/celery.beat.log
stderr_logfile=log/celery.beat.log
autostart=true
autorestart=true
startsecs=2
stopwaitsecs=2
priority=101
```

这样，在生产环境使用supervisor启动Django的同时也能启动celery服务。

## 后续

这篇文章主要是分享Django使用Celery执行定时任务的步骤，经过文章描述的操作，已经可以正常的添加和执行定时任务。

后续我会分享一些我目前的网站定义和添加的定时任务。