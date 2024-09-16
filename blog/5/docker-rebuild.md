# 容器化部署博客（3）—— 更换服务器，5分钟完成项目迁移

我的服务器是之前花了九百多一年续费的一台阿里云的 1U1G 的云服务器，9月份就要到期了，所以趁着618的时候拼团了一台 1U2G 的服务器，今天就做了一下博客项目迁移，整个迁移过程大约只花了5分钟就完成了，虽然还没有达到我理想中完全自动化构建和部署的状态，但是这个迁移效率已经让我感觉很满意了。

> 这篇文件讲的是旧项目升级，如果想试一下新项目部署，不用再去看之前关于容器化部署的那篇文章了，因为代码有变动，可以直接去看 izone-docker 的 wiki ，上面的部署步骤会一直保持更新状态，wiki 地址是：<https://github.com/Hopetree/izone-docker/wiki/deploy>

现在就来分享一下我完成服务迁移的这5分钟到底都包含了哪些内容。

## 项目迁移过程

### 第1分钟：拷贝备份数据
由于项目是迁移而不是新建，所以必然是有备份数据需要从旧的服务器上面拷贝到新服务器，我博客项目需要备份的主要是两个文件（备份是定时任务触发），第一个自然是最重要的数据库 MySQL 的备份了，第二个就是 media 文件的备份，由于是服务器之前进行文件拷贝，所以可以使用 `scp` 命令来完成，这个命令的使用方法很简单，不会的可以自己去查一下用法，我服务器都设置了 ssh 密钥登陆，并且改了登陆端口，所以命令稍微复杂一点，具体命令如下：

```bash
# 从旧服务器拷贝数据库备份文件
scp -i /home/timo/tmp_key -P 8** alex@119.**.106.***:/home/alex/dbs/media_backup_20190704_050001.zip ~

# 从旧服务器拷贝 media 文件
scp -i /home/timo/tmp_key -P 8** alex@119.**.106.***:/home/alex/dbs/tendcode_20190704040001.sql ~
```

上面的两个命令（星号是我注释掉的敏感信息）表示使用密钥登陆的方式从其他服务器拷贝文件到本服务器，并把文件放到当前用户的跟目录下。由于备份文件都很小，所以拷贝基本是秒完成的，这1分钟实际上用到的大概只有10秒钟。

### 第2分钟：拉取镜像

由于我的项目目前的版本是使用的3个基础镜像外加1个项目镜像，所以总共有4个镜像，而且这4个镜像都是在镜像仓库可以拉取到的，不需要自己构建，所以拉取镜像的时间就是这个步骤的总用时。

拉取三个基础镜像的命令分别是：

```bash
docker pull nginx
docker pull redis
docker pull mysql:5.7
```

而我博客项目的镜像是由阿里云的镜像构建平台自动完成构建的（后续会发一篇文章分享一下这个构建过程），所以自然也就是自动推送到了阿里云的镜像仓库，拉取的命令如下：

```bash
docker pull registry.cn-shenzhen.aliyuncs.com/tendcode/izone:2.0
```

这个命令就是一个普通的镜像拉取命令，由于我把镜像公开了，所以任何可以联网的人都可以拉取这个镜像，目前镜像分为两个 tag，其中2.0是正式版本，latest 是自动化构建出来的版本，所以直接拉取2.0的 tag 就可以了。

上面这个4个镜像都不是很大，我服务器完成整个拉取过程花费的时间根本不需要1分钟，所以这个步骤的1分钟其实也是可以剩余很多时间。

### 第3分钟：克隆部署代码

完成了备份文件拷贝和镜像拉取之后，就要开始拉取服务的部署代码了，服务的部署项目代码是独立于服务的代码的，拉取的过程命令如下：

**重要提醒**：从这里开始，请把用户切换到 root 用户！请把用户切换到 root 用户！请把用户切换到 root 用户！重要的事情说三千遍！！！（原因：可以自行搜索“关于容器化挂载目录权限的问题”，这里直接使用 root 用户可以避免这些权限问题的发生。）

```bash
# 创建并进入服务运行的目录
mkdir -p /opt/cloud && cd /opt/cloud

# 拉取部署代码
git clone git@github.com:Hopetree/izone-docker.git
```

克隆项目代码的过程很简单，大约需要耗费10秒钟，此时可以看一下目前项目目录结果，如下：

```
drwxr-xr-x 3 root root 4096 Jul  3 22:37 db
-rw-r--r-- 1 root root 1630 Jul  3 21:52 docker-compose.yml
-rw-r--r-- 1 root root 1065 Jul  3 21:52 LICENSE
drwxr-xr-x 5 root root 4096 Jul  3 22:37 nginx
-rw-r--r-- 1 root root  223 Jul  3 21:52 README.md
drwxr-xr-x 5 root root 4096 Jul  3 22:37 web
```

当然，这个步骤不仅仅是克隆项目就结束了，还需要做一个比较重要的事情，那就是把第1分钟拷贝的 media 备份解压到 web 目录中，具体命令如下：

```bash
unzip /home/timo/media_backup_20190704_050001.zip  -d /opt/cloud/web
```

完成上述的项目克隆和备份文件导入大概需要的时间其实也就不到20多秒，这个1分钟其实也完全足够。

### 第4分钟：运行项目
上面三个步骤都是准备工作，完成之后就可以开始启动项目了，在运行项目之前，需要创建两个环境变量文件，分别是 .env 和 izone.env 文件，前者是 docker-compose 默认读取的环境变量参数，后者是专门给 izone 博客使用的，最终会被添加到 izone 的容器当中供使用。

.env 文件的内容参考如下：

```bash
# .env

# db
MYSQL_IMAGE=mysql:5.7
MYSQL_ROOT_PASSWORD=1314520@abc

# redis
REDIS_IMAGE=redis

# web
IZONE_IMAGE=registry.cn-shenzhen.aliyuncs.com/tendcode/izone:2.0
IZONE_MYSQL_NAME=izone

# nginx
NGINX_IMAGE=nginx

```

其中主要需要注意的是 `MYSQL_ROOT_PASSWORD` 是设置 MySQL 的默认密码，`IZONE_MYSQL_NAME` 是用来创建一个默认的数据库，也就是给 izone 使用的数据库名称，这2个值都是自己随意设定，其他的变量可以自己理解一下，无非就是镜像名称啥的。

izone.env 的内容参考如下：

```bash
# izone.env

# 个性化配置
IZONE_SECRET_KEY=#!kta!9e0)24p@9#=*=ra$r!0k0+p5@w+a%7g1bboo9+9080
IZONE_TOOL_FLAG=True
IZONE_API_FLAG=False
IZONE_DEBUG=False
IZONE_SITE_END_TITLE=TendCode
IZONE_SITE_DESCRIPTION=TendCode是一个Django搭建的博客，本网站后端使用Django框架搭建，前端使用Bootstrap框架，主要分享博主在Python以及其他编程语言的学习心得。
IZONE_SITE_KEYWORDS=Python自学,Python爬虫,Django博客,Python web开发,个人博客
IZONE_GITHUB=https://github.com/Hopetree
IZONE_PROTOCOL_HTTPS=https

# 邮箱配置
IZONE_EMAIL_HOST=smtp.163.com
IZONE_EMAIL_HOST_USER=your-email
IZONE_EMAIL_HOST_PASSWORD=77777
IZONE_EMAIL_PORT=465
IZONE_EMAIL_USE_SSL=True
IZONE_DEFAULT_FROM_EMAIL=TendCode博客 <tendcode@163.com>
IZONE_ACCOUNT_EMAIL_VERIFICATION=optional

# 非必须设置
IZONE_CNZZ_PROTOCOL=''
IZONE_BEIAN=''
IZONE_SITE_VERIFICATION=''

# 配置管理员邮箱，格式：name|test@test.com 多组用户用英文逗号隔开
IZONE_ADMIN_EMAIL_USER=name|test@test.com

```

这个配置里面的参数其实都是非必填项，具体的参数作用可以取看博客项目的 settings 文件中的参数注释，由于 settings 文件中都给了默认值，所以如果 izone.env 中没有给环境变量，项目运行也不会有问题，所以说这个文件主要是一些个性化配置和敏感信息。


环境变量文件创建好了之后就可以开始运行项目了，首先可以检查一下环境变量文件生效的效果，命令如下（此时应该在 izone-docker 路径下）：

```bash
docker-compose config
```

没问题的话，开始启动项目，命令如下：

```bash
# 后台运行容器
docker-compose up -d
```

容器启动非常快速，可以看到如下输出：
```
[root@LOL izone-docker]# docker-compose up -d
Creating network "izone-docker_frontend" with driver "bridge"
Creating network "izone-docker_backend" with driver "bridge"
Creating izone_db    ... done
Creating izone_redis ... done
Creating izone_web   ... done
Creating izone_nginx ... done

```

此时可以查看一下容器的状态，命令和效果如下：
```
[root@LOL izone-docker]# docker ps
CONTAINER ID        IMAGE                                                  COMMAND                  CREATED              STATUS              PORTS                                      NAMES
cd6d0c377d14        nginx                                                  "nginx -g 'daemon of…"   About a minute ago   Up About a minute   0.0.0.0:80->80/tcp, 0.0.0.0:443->443/tcp   izone_nginx
9b261f35f242        registry.cn-shenzhen.aliyuncs.com/tendcode/izone:2.0   "gunicorn izone.wsgi…"   About a minute ago   Up About a minute                                              izone_web
b89d5d719483        mysql:5.7                                              "docker-entrypoint.s…"   About a minute ago   Up About a minute   3306/tcp, 33060/tcp                        izone_db
e20bb2736f9e        redis                                                  "docker-entrypoint.s…"   About a minute ago   Up About a minute   6379/tcp                                   izone_redis
```

当然，这里并没有结束，虽然容器启动了，但是数据库是空的，里面一个表也没有，这个时候就要开始进行数据库的导入了，我使用的步骤大概是下面的思路：

1. 首先将数据库备份文件从主机拷贝到容器中
2. 在容器中执行备份文件的导入

首先进行主机和容器之间的文件拷贝，这个需要使用 `docker cp` 命令，如下：

```shell
docker cp /home/timo/tendcode_20190704040001.sql izone_db:/tmp/
```

这个命令的意思就是把主机 sql 文件拷贝到指定容器（可以使用容器ID或者名称，这里使用名称，因为名称是自己设定的不会变），拷贝到容器的 /tmp 目录下了。

然后登陆数据容器：
```bash
docker exec -it izone_db bash
```

然后在容器中执行备份文件导入操作：
```bash
mysql -uroot -p$MYSQL_ROOT_PASSWORD -D $MYSQL_DATABASE --default-character-set=utf8 < /tmp/tendcode_20190704040001.sql
```

这个命令中使用到了两个环境变量，这两个环境变量其实就是 .env 里面设置的，这里不需要使用具体的值，就使用环境变量是最好的方式，记住要设置一下编码格式。

当完成数据库的备份导入之后，还需要执行一下博客项目的静态资源收集和搜索文件的生成（也即是 static 目录和 whoosh_index)，这个不需要进入容器中就可以执行，命令如下：

```bash
docker exec -it izone_web python manage.py collectstatic
docker exec -it izone_web python manage.py update_index
```

好了，所有步骤完成之后，可以来重启一下服务了，命令如下：

```bash
docker-compose down
docker-compose up -d
```

这个步骤看起来分了好几个小步骤来完成，但是在时间的使用上，其实也完全不需要花费1分钟。

### 第5分钟：检查服务状态

完成以上4个步骤之后，可以开始查看服务是否运行 OK，怎么检查不用我说吧？！当然是打开浏览器看看自己的博客是否运行完好。

如果服务已经运行健康，那么这1分钟你可以去泡杯咖啡来享受一下，让时间自己一秒一秒过去吧，管他呢，反正愉快的时光总是过得飞快！！！

## 总结

还记得我之前那个服务器快要到期的时候我考虑是否续费的纠结，那时候服务并不是使用的容器化部署，所以当时运行服务其实还挺麻烦的，大概需要以下操作：

- 安装 MySQL 并进行配置
- 安装 Redis 并进行配置
- 安装 Nginx 并进行配置
- 安装虚拟环境并安装相关依赖
- 配置 gunicorn 启动服务

反正当时就是联想到换个服务器还需要重复以上的麻烦事，所以就懒得换服务器了，而是花了900多块钱续费了一年。

后来我工作上开始负责容器化的事情，让我接触并掌握了基本的容器化技术，我开始把自己的服务实现容器化，想的就是有一天我想换服务器的时候可以毫不犹豫的换，实现服务迁移分分钟搞定，而现在，我基本已经做到了这一点。也正是我知道我现在可以在几分钟之内完成一个服务的迁移，所以换服务器对我来说变得非常容易。

这个事实告诉我一个道理：掌握一门新技术不一定能够让你赚到钱，但是可能让你省钱。

以下是对各种云平台对老用户的恶意的感慨：

> 续费是不可能续费的，这辈子都不可能续费的。新人优惠又不能参加，只有靠活动拼个团购，才能维持的了生活的样子。