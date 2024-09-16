# 容器化部署博客（2）—— docker-compose 部署 izone 博客

在刚接触到微服务的时候就听说过容器化这个概念，很巧的是，我在公司目前主要负责的事情就是服务容器化，所以前段时间我已经把自己的博客支持了容器化部署，并且已经把服务器上面的虚拟化部署方式切换为容器化部署。

之前的那篇文章已经介绍了安装 docker 和 docker-compose 的方式，这篇文章就来正式讲一下我的博客，或者说同样使用 django 搭建的博客适用 docker 部署的流程吧！

## 准备工作

首先，我必须强调的一点是，容器化部署的方式是在 Linux 上进行的，Windows 毕竟不是用来当服务器的，所以没必要测试，只需要单独在 Windows 上执行 izone 项目就行了，可以直接使用 izone 的 dev 分支运行，具体的运行方式可以参考我 Github 中写道的方式，这里不做说明。

### 安装 docker
关于如何安装 docker 以及 docker-compose 的方式可以参考我上一篇文章的介绍 [容器化部署博客（1）——安装 docker 和 docker-compose](https://tendcode.com/article/install-docker/) 或者你有可以参考官方的教程。

### 下载镜像
由于我们的项目中会使用到 `python3` `mysql:57` `nginx` `redis` 4个镜像，所以可以提前准备好这些镜像，这样方便后续的部署可以不用等待镜像的拉取。

拉取镜像的命令可以参考如下，比如拉取 mysql5.7 的镜像，在任意目录执行命令即可：

```shell
~$ docker pull mysql:5.7
```
由于官方的镜像源很慢，所以建议使用国内的源，源怎么配置可以参考我上一篇文章，等待一段时间之后可以看到如下的输出：

```shell
tendcode@Ubuntu01:~/izone-docker/izone$ docker pull mysql:5.7
5.7: Pulling from library/mysql
177e7ef0df69: Pull complete
cac25352c4c8: Pull complete
8585afabb40a: Pull complete
1e4af4996053: Pull complete
c326522894da: Pull complete
9020d6b6b171: Pull complete
55eb37ec6e5f: Pull complete
1a9d2f77e0e7: Pull complete
d7e648ad64aa: Pull complete
4120d828ea6b: Pull complete
3b39dc5451af: Pull complete
Digest: sha256:bf17a7109057494c45fba5aab7fc805ca00ac1eef638dfdd42b38d5a7190c9bb
Status: Downloaded newer image for mysql:5.7
```
然后可以查看一下自己本机的镜像，看看是不是多了 mysql:5.7

```shell
~$ docker images
REPOSITORY          TAG                 IMAGE ID            CREATED             SIZE
mysql               5.7                 ba7a93aae2a8        3 weeks ago         372MB
```
使用同样的方式拉取其他的镜像（由于 python:3.5 的镜像很大，所以我选择了使用 frolvlad/alpine-python3 来代替，这2个镜像都可以使用，如果你想使用前者，只需要拉取前者，然后修改后面提到的环境变量 .env 中参数 DOCKERFILE_NAME=Dockerfile 即可），所有镜像拉取完毕，你查看看镜像应该可以看到如下内容：

```shell
~$ docker images
REPOSITORY                TAG                 IMAGE ID            CREATED             SIZE
mysql                     5.7                 ba7a93aae2a8        3 weeks ago         372MB
redis                     latest              5d2989ac9711        3 weeks ago         95MB
nginx                     latest              568c4670fa80        7 weeks ago         109MB
frolvlad/alpine-python3   latest              cf6d1297856f        3 months ago        54.3MB
```

至此，容器化部署的准备工作就已经结束了，接下来可以来正式进行项目的部署工作了。

## izone-docker 部署
### 项目结构
直接来看一下项目的文件构成和文件的作用，文件的作用直接看我的注释就行了：


```markdown
+----.env                 # 设置docker-compose的环境变量（文件需要自己创建）
+----db                   # db的挂载目录，挂载到容器
|    +----my.cnf          # db的配置文件，挂载到容器
+----docker-compose.yml   # docker-compose的运行文件
+----Dockerfile           # 生成python3镜像
+----Dockerfile-alpine    # 使用alpine生成python3镜像
+----nginx                # nginx挂载目录，挂载到容器
|    +----conf.d          # nginx服务配置目录，挂载到容器
|    |    +----nginx.conf # nginx服务配置文件，挂载到容器
```

上述是项目的目录结构，其中 .env 文件是需要自己单独创建的，因为这个是有关私有配置的一些信息，所以没有上传到 Github 上面。

### 获取项目代码
获取项目带的方式当然是使用 git 的 clone 命令，直接从我的项目仓库拉取到本地或者服务器都可以，具体可以参考一下步骤：

1、进入你想要放置代码的目录，然后执行如下命令：

```shell
~$ git clone git@github.com:Hopetree/izone-docker.git
```

2、拉取了 docker-compose 的代码之后，拉取 izone 博客项目代码（指定拉取的分支为 dev，只有这个分支是容器化部署），如下：

```shell
~$ cd izone-docker/
~/izone-docker$ git clone -b dev git@github.com:Hopetree/izone.git
```

### 创建环境变量文件
首先，确保上面拉取项目代码的步骤已经完成，并且 izone 的代码是 dev 分支，接下来就需要手动创建2个环境变量文件。

1、首先在 izone-docker 项目下面创建一个 .env 文件，文件的内容可以参考如下内容：

```shell
DOCKERFILE_NAME=Dockerfile-alpine
# db
MYSQL_ROOT_PASSWORD=python
MYSQL_DATABASE=izone
# web domain 
DOMAIN_NAME=testdomaintest.com
```

2、然后进入 izone 项目中，创建另一个环境变量文件 izone.env ，文件的内容可以参考如下：

```shell
# 个性化配置
IZONE_SECRET_KEY=#!kta!9e0)24p@9#=*=ra$r!0k0+85@w+a%7g1bboo9+ad@4_(
IZONE_TOOL_FLAG=True
IZONE_API_FLAG=False
IZONE_DEBUG=False
IZONE_ADD_ALLOWED_HOST=.testdomaintest.com
IZONE_SITE_END_TITLE=izone
IZONE_SITE_DESCRIPTION=izone 是一个Django搭建的博客，本网站后端使用Django框架搭建，前端使用Bootstrap框架，主要分享博主在Python以及其他编程语言的学习心得。
IZONE_SITE_KEYWORDS=Python自学,Python爬虫,Django博客,Python web开发,个人博客
IZONE_GITHUB=https://github.com/Hopetree

# MySQL配置
IZONE_MYSQL_HOST=db
IZONE_MYSQL_NAME=izone
IZONE_MYSQL_USER=root
IZONE_MYSQL_PASSWORD=python
IZONE_MYSQL_PORT=3306

# Redis配置
IZONE_REDIS_HOST=redis
IZONE_REDIS_PORT=6379
```

上面的2个配置文件中需要注意的是关于 db 的配置项，2个文件关于 db 的数据的名称和密码必须填写一样的，然后如果是本地运行，可以直接使用 上面的这个就行，因为这个域名只是容器中使用，如果是有自己的域名，则把域名替换成你的域名即可，比如我的就是都替换成了 tendcode.com ，`IZONE_ADD_ALLOWED_HOST` 这个参数的值建议写成 `.tendcode.com` 这种。

### 创建 nginx.conf
环境变量文件创建完毕，现在需要编辑 nginx.conf 文件，这个文件在 nginx 目录下面的 conf.d 目录里面，这个文件是存在的，你只需要修改跟域名有关的地方就行了。如果自己没有域名，可以参考如下的编辑：

```nginx
server {
    # 端口和域名
    listen 80;
    server_name localhost;

    # 不记录访问不到 favicon.ico 的报错日志
    location = /favicon.ico {
        access_log off;
        log_not_found off;
    }

    # static 和 media 的地址
    location /static/ {
        root /opt/izone;
    }
    location /media/ {
        root /opt/izone;
    }

    # web 服务使用80端口，并且添加别名跟本地域名保持一致
    location / {
        proxy_pass http://testdomaintest.com;
    }

    # 其他配置
    client_max_body_size 1m;
    client_header_buffer_size 128k;
    client_body_buffer_size 1m;
    proxy_buffer_size 32k;
    proxy_buffers 64 32k;
    proxy_busy_buffers_size 1m;
    proxy_temp_file_write_size 512k;
}

```
如果你有域名，那么只需要把原来的配置中 tendcode.com 改成你自己的域名就行了。

### 构建web镜像

由于 web 容器是基于 Linux 镜像进行了一些封装，也就是安装了一些依赖，所以需要另外生成一个镜像，这个过程可以由 docker-compose 自己完成，生成镜像的步骤是进入 docker-compose 目录，执行下面的命令，然后等待镜像生成即可：

```shell
~/izone-docker$ sudo docker-compose build
redis uses an image, skipping
db uses an image, skipping
nginx uses an image, skipping
Building web
Step 1/7 : FROM frolvlad/alpine-python3
 ---> cf6d1297856f
Step 2/7 : ENV PYTHONUNBUFFERED 1
 ---> Running in d34fb1b01074
 ---> 30eb623353fa
Removing intermediate container d34fb1b01074
Step 3/7 : RUN cp -a /etc/apk/repositories /etc/apk/repositories.bak   && sed -i "s@http://dl-cdn.alpinelinux.org/@https://mirrors.aliyun.com/@g" /etc/apk/repositories   && apk add -U jpeg-dev zlib-dev gcc python3-dev libc-dev tzdata   && cp /usr/share/zoneinfo/Asia/Shanghai /etc/localtime
 ---> Running in 6bef60941292
fetch https://mirrors.aliyun.com/alpine/v3.8/main/x86_64/APKINDEX.tar.gz
fetch https://mirrors.aliyun.com/alpine/v3.8/community/x86_64/APKINDEX.tar.gz
(1/19) Installing binutils (2.30-r5)
(2/19) Installing gmp (6.1.2-r1)
(3/19) Installing isl (0.18-r0)
(4/19) Installing libgomp (6.4.0-r9)
(5/19) Installing libatomic (6.4.0-r9)
(6/19) Installing pkgconf (1.5.3-r0)
(7/19) Installing libgcc (6.4.0-r9)
(8/19) Installing mpfr3 (3.1.5-r1)
(9/19) Installing mpc1 (1.0.3-r1)
(10/19) Installing libstdc++ (6.4.0-r9)
(11/19) Installing gcc (6.4.0-r9)
(12/19) Installing libjpeg-turbo (1.5.3-r4)
(13/19) Installing libjpeg-turbo-dev (1.5.3-r4)
(14/19) Installing jpeg-dev (8-r6)
(15/19) Installing musl-dev (1.1.19-r10)
(16/19) Installing libc-dev (0.7.1-r0)
(17/19) Installing python3-dev (3.6.6-r0)
(18/19) Installing tzdata (2018f-r0)
(19/19) Installing zlib-dev (1.2.11-r1)
Executing busybox-1.28.4-r1.trigger
OK: 179 MiB in 43 packages
 ---> e87447bb17fb
Removing intermediate container 6bef60941292
Step 4/7 : RUN mkdir -p /app/izone
 ---> Running in b53169d262be
 ---> d2a7559d7c88
Removing intermediate container b53169d262be
Step 5/7 : WORKDIR /app/izone
 ---> f360078d7dab
Removing intermediate container 2c798b03977f
Step 6/7 : COPY ./izone .
 ---> 8dfc94987f64
Removing intermediate container aeccbf2582d3
Step 7/7 : RUN pip install -r requirements.txt -i http://pypi.douban.com/simple --trusted-host pypi.douban.com
 ---> Running in b2f2bbfa2ee9
Looking in indexes: http://pypi.douban.com/simple
Collecting bleach==2.1.1 (from -r requirements.txt (line 1))
  Downloading http://pypi.doubanio.com/packages/bb/c9/c99cef21591ea872879b5ac104b794093d5354ce2b06846305bc6367b6ad/bleach-2.1.1-py2.py3-none-any.whl
Collecting bootstrap-admin==0.3.7.1 (from -r requirements.txt (line 2))
  Downloading http://pypi.doubanio.com/packages/ae/07/f34c923eeca9eaea5545382b42e3598105e5754761644e126a64b04d86ea/bootstrap_admin-0.3.7.1.tar.gz (192kB)

...其他日志省略
```

这个日志可以看到是分步骤执行的，总共有7个步骤，对应了 Dockerfile-alpine 里面的7个执行任务，最后一个任务是按照 izone 需要的依赖。

运行完毕，可以使用镜像查看的命令，当看到输出了新生成的web镜像就表示镜像创建完成，接着就可以去进行容器操作了：

```shell
~/izone-docker$ docker images
REPOSITORY                TAG                 IMAGE ID            CREATED             SIZE
izone-docker_web          latest              6f9e6c83b493        5 minutes ago       259 MB
redis                     latest              415381a6cb81        2 months ago        94.9 MB
nginx                     latest              62f816a209e6        2 months ago        109 MB
mysql                     5.7                 702fb0b7837f        3 months ago        372 MB
frolvlad/alpine-python3   latest              cf6d1297856f        3 months ago        54.3 MB
```
### 生成容器
经过上一个步骤，我们已经生成了所需要的所有镜像，现在我们可以把镜像生成容器来运行我们的项目了，只需要执行如下命令即可：
```shell
~/izone-docker$ docker-compose up
```

等待一会儿，会看到输出很多日志，当看到最后的日志类似于下面这种，就表示容器全部生成了：
```markdown
izone_db | 2019-01-21T13:23:21.864026Z 0 [Warning] 'db' entry 'performance_schema mysql.session@localhost' ignored in --skip-name-resolve mode.
izone_db | 2019-01-21T13:23:21.864244Z 0 [Warning] 'db' entry 'sys mysql.sys@localhost' ignored in --skip-name-resolve mode.
izone_db | 2019-01-21T13:23:21.864415Z 0 [Warning] 'proxies_priv' entry '@ root@localhost' ignored in --skip-name-resolve mode.
izone_db | 2019-01-21T13:23:21.870564Z 0 [Warning] 'tables_priv' entry 'user mysql.session@localhost' ignored in --skip-name-resolve mode.
izone_db | 2019-01-21T13:23:21.871151Z 0 [Warning] 'tables_priv' entry 'sys_config mysql.sys@localhost' ignored in --skip-name-resolve mode.
izone_db | 2019-01-21T13:23:21.902828Z 0 [Note] Event Scheduler: Loaded 0 events
izone_db | 2019-01-21T13:23:21.903911Z 0 [Note] mysqld: ready for connections.
izone_db | Version: '5.7.24'  socket: '/var/run/mysqld/mysqld.sock'  port: 3306  MySQL Community Server (GPL)
```

但是这个时候我们的服务还是不能成功运行的，因为我们还没有给 django 执行数据库的操作，这个时候我们可以停掉运行中的容器，直接 Ctrl+C 就可以了，然后继续看后续的操作。

### 创建表格和用户
进入 izone-docker 目录，执行如下命令可以单独启动 web 容器创建 django 的表格：

```shell
~/izone-docker$ docker-compose run web python manage.py makemigrations
```
第一次执行的话，可以看到如下的输出：
```
Creating network "izone-docker_default" with the default driver
Creating izone_redis ... done
Creating izone_db    ... done
Migrations for 'tool':
  apps/tool/migrations/0001_initial.py
    - Create model ToolCategory
    - Create model ToolLink
Migrations for 'blog':
  apps/blog/migrations/0001_initial.py
    - Create model Article
    - Create model Carousel
    - Create model Category
    - Create model FriendLink
    - Create model Keyword
    - Create model Silian
    - Create model Tag
    - Create model Timeline
... 其他日志省略
```

接着执行

```shell
~/izone-docker$ docker-compose run web python manage.py migrate
```
可以看到如下输出：

```shell
Starting izone_redis ... done
Starting izone_db    ... done
Operations to perform:
  Apply all migrations: account, admin, auth, blog, comment, contenttypes, oauth, sessions, sites, socialaccount, tool
Running migrations:
  Applying contenttypes.0001_initial... OK
  Applying contenttypes.0002_remove_content_type_name... OK
  Applying auth.0001_initial... OK
  Applying auth.0002_alter_permission_name_max_length... OK
  Applying auth.0003_alter_user_email_max_length... OK
  Applying auth.0004_alter_user_username_opts... OK
  Applying auth.0005_alter_user_last_login_null... OK
  Applying auth.0006_require_contenttypes_0002... OK
  Applying auth.0007_alter_validators_add_error_messages... OK
  Applying auth.0008_alter_user_username_max_length... OK
  Applying oauth.0001_initial... OK
  Applying account.0001_initial... OK
  Applying account.0002_email_max_length... OK
  Applying admin.0001_initial... OK
  Applying admin.0002_logentry_remove_auto_add... OK
  Applying blog.0001_initial... OK
  Applying blog.0002_auto_20190121_2238... OK
  Applying comment.0001_initial... OK
  Applying comment.0002_auto_20190121_2238... OK
  Applying sessions.0001_initial... OK
  Applying sites.0001_initial... OK
  Applying sites.0002_alter_domain_unique... OK
  Applying socialaccount.0001_initial... OK
  Applying socialaccount.0002_token_max_lengths... OK
  Applying socialaccount.0003_extra_data_default_dict... OK
  Applying tool.0001_initial... OK
```

然后是创建超级管理员的命令，如下，这个跟在本地运行 django 一样：

```shell
~/izone-docker$ docker-compose run web python manage.py createsuperuser
```

接着是需要收集静态文件，执行如下命令

```
~/izone-docker$ docker-compose run web python manage.py collectstatic
```

### 后台运行博客
之前只用 `docker-compose up` 命令是在当前命令行下运行博客，如果命令窗口关闭了容器就会停止，所以现在需要后台运行。

首先我们可以把之前生成的容器关闭，使用命令

```shell
~/izone-docker$ docker-compose down
```

可以看到类似如下的输出，就是把容器全部停止了：

```shell
Stopping izone-docker_web_run_c8dab7d0c059 ... done
Stopping izone-docker_web_run_921c2c931a9f ... done
Stopping izone-docker_web_run_c1207a819b1d ... done
Stopping izone-docker_web_run_817d2cff3fa7 ... done
Removing izone_nginx                       ... done
Removing izone_web                         ... done
Removing izone-docker_web_run_c8dab7d0c059 ... done
Removing izone-docker_web_run_921c2c931a9f ... done
Removing izone-docker_web_run_c1207a819b1d ... done
Removing izone-docker_web_run_817d2cff3fa7 ... done
Removing izone_db                          ... done
Removing izone_redis                       ... done
Removing network izone-docker_default
```

接着可以后天运行容器，执行命令：

```shell
~/izone-docker$ docker-compose up -d
```

可以看到如下输出：

```shell
Creating network "izone-docker_default" with the default driver
Creating izone_db    ... done
Creating izone_redis ... done
Creating izone_web   ... done
Creating izone_nginx ... done
```

现在可以查询一下当前运行的容器：

```shell
~/izone-docker$ docker-compose ps
```

可以看到如下输出：

```shell
   Name                  Command               State          Ports
--------------------------------------------------------------------------
izone_db      docker-entrypoint.sh mysqld      Up      3306/tcp, 33060/tcp
izone_nginx   nginx -g daemon off;             Up      0.0.0.0:80->80/tcp
izone_redis   docker-entrypoint.sh redis ...   Up      6379/tcp
izone_web     gunicorn izone.wsgi -b 0.0 ...   Up
```

去看看服务器上面是不是已经可以运行了？
下图是我的虚拟机运行的效果

![izone-docker](https://tendcode.com/cdn/article/190121/web.png)

## 迁移和升级
### 升级代码
上面的过程都是新部署服务，如果后续需要更新博客的代码，那就需要同步更新服务器上面的代码，更新代码可以分为两种情况，第一种是更新了 izone 的代码，需要做如下的操作：

1、首先进入 izone 的目录，然后更新 izone 的代码（记得要拉 dev 分支，或者你自己的项目分支）即可：

```shell
~/izone-docker$ cd izone
~/izone-docker/izone$ git pull origin dev
```

2、代码更新之后，如果涉及到静态文件的操作，需要执行一下静态文件收集；如果涉及到数据库的更新，就要执行数据库命令操作，具体的执行代码可以看上面部署的时候执行的命令。

3、更新完代码和其他操作之后，需要重启一下容器服务，一般我都是先删除当前的容器，重新生成并运行容器的，具体是依次执行下面2条命令：

```shell
~/izone-docker$ docker-compose down
~/izone-docker$ docker-compose up -d
```

第二种是更新了 docker-compose 的代码，比如更新了 .env 或者 izone.env 环境变量，这种情况比较简单，首先直接更新相关文件就行，然后也要执行一下容器的删除和重建命令，跟上面一样。

还有一种特殊的情况，那就是更新了 Dockerfile 文件，这种情况的话，就需要重新构建镜像了，比较耗时，命令也是执行容器的删除和重构。

### 服务迁移
所谓的服务迁移就是从一个服务器迁移到另一个服务器，这种情况就跟部署服务完全不同了，需要把部署服务的几个步骤去掉，具体的步骤改动点如下：

1、首先你需要把你旧的服务器或者本地的数据导出到一个 .sql 文件中，比如 izone.sql

2、在新的服务器上面同样执行镜像拉取、代码拉取、容器生成三个步骤，到了执行数据库创建和用户创建的时候不要执行，把你导出的 izone.sql 文件放到新的服务器中 `/izone-docker/db/sql` 中。

3、进入 mysql 容器中，进入容器的命令是

```shell
docker exec -it image_id bash
```

4、执行的命令如下：

```shell
mysql -uroot -p$MYSQL_ROOT_PASSWORD -D $MYSQL_DATABASE --default-character-set=utf8mb4 < /opt/sql/izone.sql
```

上面这个命令就是数据库导入备份，因为我在 docker-compose 中已经把本地的 /db/mysql 目录挂载到了容器中的 /opt/sql 目录下，所以放在本地的备份文件会传入到容器中，因为命令中的密码和数据库的名称都是读取的环境变量，所以不需要改动。

5、执行完数据库的导入，就可以直接执行容器的启动命令了，也就是

```shell
~/izone-docker$ docker-compose up -d
```

6、服务的迁移主要的操作就只是数据库的导入，执行完数据操作之后，还是要执行静态文件收集的操作，但是千万不要去执行 Django 里面的 makemigrations 和 migrate 操作，执行静态文件收集和全文搜索文件操作的命令是：


```shell
docker-compose run web python manage.py collectstatic
docker-compose run web python manage.py rebuild_index
```