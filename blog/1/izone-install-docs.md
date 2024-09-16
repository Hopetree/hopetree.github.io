# izone 博客容器化部署、升级及迁移步骤最新版（随项目更新）

之前更新过好几篇关于平台部署和迁移的操作，但是很多操作内容可能已经跟不上项目的更新迭代，所以打算写一篇比较基础的项目部署、升级和迁移教程供需要的人使用。这篇部署教程将作为一个长期更新的文章，所有操作都将跟随项目的迭代进行更新。

::: primary

🎉 **关于时效性**

本文会持续更新（具体更新时间可以将鼠标放到发表日期上，就能显示最后修改日期），建议直接使用项目的 `master` 分支进行容器化部署，本文的所有步骤都是基于 `master` 分支的，其他分支或者版本可能已经滞后，因此不一定有效。

:::


## 环境准备

### 更新软件

如果是新系统，建议先更新一下系统和软件：

```bash
sudo yum update -y
```

### 安装必要软件

这里安装一些后面部署迁移可能会用到的常用工具，如网络工具、打包工具、git。

```bash
sudo yum install -y net-tools tar zip unzip git
```

## 安装docker环境

### 安装docker

直接使用安装脚本进行安装，将如下脚本内容写入到`docker_intall.sh`文件中，并执行脚本。

```shell
#/bin/bash
# 使用root用户安装docker

DOCKER_VERSION=docker-ce-18.09.9-3.el7
DOCKER_REGISTRY=https://docker.mirrors.ustc.edu.cn
YUN_REPO=http://mirrors.aliyun.com/docker-ce/linux/centos/docker-ce.repo

# 卸载原有的 docker
yum remove -y docker \
docker-ce \
docker-client \
docker-client-latest \
docker-common \
docker-latest \
docker-latest-logrotate \
docker-logrotate \
docker-engine

# 清理残留目录
rm -rf /var/lib/docker
rm -rf /var/run/docker

# 添加阿里yum源，并更新yum索引
yum install -y yum-utils
yum-config-manager --add-repo ${YUN_REPO}
yum makecache fast

# 安装docker-ce,可以自定义版本
yum install -y ${DOCKER_VERSION}

# 设置为系统服务并启动docker
systemctl enable docker && systemctl start docker

# 设置镜像仓库源
cat <<EOF >/etc/docker/daemon.json
{
 "registry-mirrors": ["${DOCKER_REGISTRY}"],
 "exec-opts": ["native.cgroupdriver=systemd"]
}
EOF

# 重启docker
systemctl daemon-reload
systemctl restart docker

```

使用vim将代码写入`docker_intall.sh`文件中后执行脚本：

```bash
sh docker_intall.sh
```

执行结束可以在命令行中执行`docker -v`查看是否正常显示。

```bash
[root@zero-0 ~]# docker -v
Docker version 24.0.6, build ed223bc
```

### 安装docker-compose

首先执行`pip --version`看一下是否有pip命令，如果命令没有，则执行pip包的安装：

```shell
sudo yum -y install epel-release
```

```shell
sudo yum -y install python-pip
```

```shell
sudo yum clean all
```

如果有pip命令，则查看pip版本是否有20.3，如果没有则执行升级（强烈建议执行升级操作，升级到20.3版本可以避免后续安装依赖的时候报错），升级命令如下：

```bash
sudo pip install --upgrade pip==20.3 -i http://mirrors.aliyun.com/pypi/simple/ --trusted-host mirrors.aliyun.com

```

安装好pip命令之后，使用pip的安装命令安装docker-compose即可，安装命令如下：

```bash
sudo pip install docker-compose -i http://mirrors.aliyun.com/pypi/simple/ --trusted-host mirrors.aliyun.com
```

安装完成之后，可以查看一下 docker-compose 的版本信息，查询命令如下：

```bash
docker-compose -v
```

## 镜像准备

### 下载第三方镜像

具体要准备的镜像可以查看我github项目中指定的第三方镜像版本，查看地址为<https://github.com/Hopetree/izone-docker/blob/master/env.template>，如果打开很慢，你也可以使用gitee的项目同步地址<https://gitee.com/hopetree-gitee/izone-docker/blob/master/env.template>，这两个地方的项目是同步更新的。

具体看到的内容可能如下（以实际为准）：

```bash
# db
MYSQL_IMAGE=mysql:5.7
MYSQL_ROOT_PASSWORD=python

# redis
REDIS_IMAGE=redis:alpine

# web
IZONE_IMAGE=hopetree/izone:lts
IZONE_MYSQL_NAME=izone

# nginx
NGINX_IMAGE=nginx:stable-alpine
NGINX_PORT=8888
```

其中第三方镜像的版本已经在文件中写好了，这里我们只拉mysql、redis和nginx镜像，izone的镜像不用拉取，我们后面要在本地构建，镜像依次拉取的命令如下：

```bash
docker pull mysql:5.7
```

```bash
docker pull redis:alpine
```

```bash
docker pull nginx:stable-alpine
```

拉取镜像需要一定的时间，请耐心等待，镜像拉取完成，可以查询一下镜像：

```bash
[root@zero-0 ~]# docker images
REPOSITORY   TAG             IMAGE ID       CREATED       SIZE
redis        alpine          9bdff337981d   11 days ago   37.8MB
nginx        stable-alpine   6dae3976ee05   5 weeks ago   41.1MB
mysql        5.7             92034fe9a41f   6 weeks ago   581MB
```

### 本地构建izone镜像

::: primary 提示

如果只是想看博客部署后的效果，直接使用我项目仓库的代码构建镜像就行，而如果是打算部署到生产环境，那么建议你将代码 fork 到自己的代码仓库，以方便你可以进行一些个性化的修改。
:::

首先需要将项目代码克隆到本地，考虑到github的访问不稳定，可以直接使用gitee的同步代码：

```bash
git clone https://gitee.com/hopetree-gitee/izone.git
```

项目代码拉到本地后进入项目目录中执行镜像构建命令：

```bash
cd izone
```

```bash
DOCKER_BUILDKIT=0 docker build --build-arg pip_index_url=http://mirrors.aliyun.com/pypi/simple/ --build-arg pip_trusted_host=mirrors.aliyun.com -t hopetree/izone:lts .
```

构建需要等待一定的时间，构建完成可以再查看一下本地镜像：

```bash
[root@zero-0 izone]# docker images
REPOSITORY       TAG               IMAGE ID       CREATED         SIZE
hopetree/izone   lts               1f04a6fa2fc8   3 minutes ago   1.12GB
redis            alpine            9bdff337981d   11 days ago     37.8MB
python           3.9               deede88fe275   3 weeks ago     997MB
nginx            stable-alpine     6dae3976ee05   5 weeks ago     41.1MB
mysql            5.7               92034fe9a41f   6 weeks ago     581MB
```

此时可以看到izone的镜像`hopetree/izone:lts`已经出现在镜像列表中。


## 容器化部署

### 启动服务

首先克隆启动容器的项目izone-docker到本地:

```bash
git clone https://github.com/hopetree/izone-docker.git
```

然后进入项目

```bash
cd izone-docker
```

查看项目结构，如下：

```bash
[root@zero-0 izone-docker]# ll
total 24
drwxr-xr-x. 2 root root   20 Sep 18 14:37 db
-rw-r--r--. 1 root root 1548 Sep 18 14:37 docker-compose.yml
-rw-r--r--. 1 root root  205 Sep 18 14:37 env.template
-rw-r--r--. 1 root root  910 Sep 18 14:37 izone.env.template
-rw-r--r--. 1 root root 1266 Sep 18 14:37 Jenkinsfile
-rw-r--r--. 1 root root 1065 Sep 18 14:37 LICENSE
drwxr-xr-x. 3 root root   20 Sep 18 14:37 nginx
-rw-r--r--. 1 root root  647 Sep 18 14:37 README.md
drwxr-xr-x. 2 root root   22 Sep 18 14:37 web
```

此时需要复制默认的模板文件，执行复制命令：

```bash
cp env.template .env && cp izone.env.template izone.env
```

`.env` 文件决定了使用的镜像，以及izone的端口，基本不需要变动，`izone.env`是项目的配置文件的环境变量，可以根据自己的需要进行修改（初始可以不用改，等项目运行正常之后再去按需修改即可）。


然后执行容器启动命令：

```bash
docker-compose up
```

此时可以看到容器运行的输出，此时的容器已经运行了，但是数据还没有初始化，可以直接Ctrl+C断开。


### 初始化数据

执行数据表创建:

```bash
docker-compose run web python manage.py migrate
```

可以看到如下输出：

```bash
[root@zero-0 izone-docker]# docker-compose run web python manage.py migrate
/usr/lib/python2.7/site-packages/paramiko/transport.py:33: CryptographyDeprecationWarning: Python 2 is no longer supported by the Python core team. Support for it is now deprecated in cryptography, and will be removed in the next release.
  from cryptography.hazmat.backends import default_backend
Starting izone_redis ... done
Starting izone_db    ... done
Operations to perform:
  Apply all migrations: account, admin, auth, blog, comment, contenttypes, django_celery_beat, django_celery_results, django_tctip, oauth, resume, sessions, sites, socialaccount, tool, webstack
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
  Applying auth.0009_alter_user_last_name_max_length... OK
  Applying auth.0010_alter_group_name_max_length... OK
  Applying auth.0011_update_proxy_permissions... OK
  Applying oauth.0001_initial... OK
  Applying account.0001_initial... OK
  Applying account.0002_email_max_length... OK
  Applying admin.0001_initial... OK
  Applying admin.0002_logentry_remove_auto_add... OK
  Applying admin.0003_logentry_add_action_flag_choices... OK
  Applying blog.0001_initial... OK
  Applying blog.0002_article_is_publish... OK
  Applying blog.0003_auto_20230702_1043... OK
  Applying blog.0004_auto_20230702_1134... OK
  Applying blog.0005_auto_20230702_1623... OK
  Applying blog.0006_auto_20230708_0641... OK
  Applying blog.0007_auto_20230709_1237... OK
  Applying blog.0008_auto_20230710_1613... OK
  Applying blog.0009_auto_20230713_1223... OK
  Applying blog.0010_auto_20230715_1407... OK
  Applying blog.0011_auto_20230715_1443... OK
  Applying blog.0012_auto_20230727_1929... OK
  Applying comment.0001_initial... OK
  Applying comment.0002_systemnotification... OK
  Applying comment.0003_auto_20230708_0641... OK
  Applying django_celery_beat.0001_initial... OK
  Applying django_celery_beat.0002_auto_20161118_0346... OK
  Applying django_celery_beat.0003_auto_20161209_0049... OK
  Applying django_celery_beat.0004_auto_20170221_0000... OK
  Applying django_celery_beat.0005_add_solarschedule_events_choices... OK
  Applying django_celery_beat.0006_auto_20180322_0932... OK
  Applying django_celery_beat.0007_auto_20180521_0826... OK
  Applying django_celery_beat.0008_auto_20180914_1922... OK
  Applying django_celery_beat.0006_auto_20180210_1226... OK
  Applying django_celery_beat.0006_periodictask_priority... OK
  Applying django_celery_beat.0009_periodictask_headers... OK
  Applying django_celery_beat.0010_auto_20190429_0326... OK
  Applying django_celery_beat.0011_auto_20190508_0153... OK
  Applying django_celery_beat.0012_periodictask_expire_seconds... OK
  Applying django_celery_beat.0013_auto_20200609_0727... OK
  Applying django_celery_beat.0014_remove_clockedschedule_enabled... OK
  Applying django_celery_beat.0015_edit_solarschedule_events_choices... OK
  Applying django_celery_results.0001_initial... OK
  Applying django_celery_results.0002_add_task_name_args_kwargs... OK
  Applying django_celery_results.0003_auto_20181106_1101... OK
  Applying django_celery_results.0004_auto_20190516_0412... OK
  Applying django_celery_results.0005_taskresult_worker... OK
  Applying django_celery_results.0006_taskresult_date_created... OK
  Applying django_celery_results.0007_remove_taskresult_hidden... OK
  Applying django_celery_results.0008_chordcounter... OK
  Applying django_tctip.0001_initial... OK
  Applying oauth.0002_auto_20230423_1145... OK
  Applying oauth.0003_auto_20230709_1237... OK
  Applying resume.0001_initial... OK
  Applying sessions.0001_initial... OK
  Applying sites.0001_initial... OK
  Applying sites.0002_alter_domain_unique... OK
  Applying socialaccount.0001_initial... OK
  Applying socialaccount.0002_token_max_lengths... OK
  Applying socialaccount.0003_extra_data_default_dict... OK
  Applying tool.0001_initial... OK
  Applying webstack.0001_initial... OK
  Applying webstack.0002_auto_20230724_1835... OK
  Applying webstack.0003_auto_20230725_1401... OK
```

继续执行命令，收集静态文件

```bash
docker-compose run web python manage.py collectstatic
```

然后创建一个超级用户

```bash
docker-compose run web python manage.py createsuperuser
```

然后执行重启，把容器放到后台运行：

```bash
docker-compose down
docker-compose up -d
```

看到如下输出就是容器已经在后台运行了：

```bash
[root@zero-0 izone-docker]# docker-compose up -d
/usr/lib/python2.7/site-packages/paramiko/transport.py:33: CryptographyDeprecationWarning: Python 2 is no longer supported by the Python core team. Support for it is now deprecated in cryptography, and will be removed in the next release.
  from cryptography.hazmat.backends import default_backend
Creating network "izone-docker_frontend" with driver "bridge"
Creating network "izone-docker_backend" with driver "bridge"
Creating izone_redis ... done
Creating izone_db    ... done
Creating izone_web   ... done
Creating izone_nginx ... done
```


此时可以查看容器的运行情况和暴露的端口:

```bash
[root@zero-0 izone-docker]# docker ps
CONTAINER ID   IMAGE                           COMMAND                  CREATED          STATUS          PORTS                  NAMES
b7a8d044f268   nginx:stable-alpine             "/docker-entrypoint.…"   36 seconds ago   Up 35 seconds   0.0.0.0:8888->80/tcp   izone_nginx
77f0c7a54014   hopetree/izone:lts              "supervisord -n -c s…"   37 seconds ago   Up 36 seconds                          izone_web
c2edbb383480   mysql:5.7                       "docker-entrypoint.s…"   38 seconds ago   Up 37 seconds   3306/tcp, 33060/tcp    izone_db
3e4d235061cb   redis:alpine                    "docker-entrypoint.s…"   38 seconds ago   Up 37 seconds   6379/tcp               izone_redis
d10bf7b555e7   moby/buildkit:buildx-stable-1   "buildkitd"              33 minutes ago   Up 33 minutes                          buildx_buildkit_default
```


### 访问平台

访问平台的话使用服务器或者虚拟机的IP+8888端口就可以访问了，至此，平台的容器化部署就完成了。

效果如下，可以去后台添加数据：

![izone显示](https://tendcode.com/cdn/2023/izone-install.png "izone显示")

后续需要设置端口转发和域名访问的话可以自行查看网上其他教程，一般都是使用nginx进行反向代理，具体怎么配置本文就不说了。

## 平台升级

平台的升级是只izone项目代码有更新，需要将更新的内容升级到平台的部署环境的操作。这里可以将更新的内容分为几种类型，每种类型需要进行的操作稍微不同。

### 只涉及逻辑更新

只涉及逻辑代码的更新是只项目的更新只有一些模板、视图、URL等逻辑的变动，这种更新只需要重新构建镜像然后重新启动izone容器即可，具体操作参考：

构建镜像的操作就不再重复描述了，这里说一下如何使用新镜像重新启动izone容器的操作，进入项目的启动目录izone-docker中，执行命令：

```bash
docker-compose restart web
```

### 涉及静态文件更新

如果涉及静态文件的变动，也就是css文件，ji文件和图片这些，那么除了重新构建镜像之外并且重新启动容器之外，还需要执行静态文件收集：

```bash
docker-compose restart web
```

```bash
docker-compose run web python manage.py collectstatic
```

### 涉及模型变动

如果涉及模型的变动，除了重启容器服务，还需要进行数据迁移：


```bash
docker-compose restart web
```

```bash
docker-compose run web python manage.py migrate
```

### 涉及配置变更

如果项目的更新涉及到配置的变动，主要是指的`izone.env`的变动，则需要按照项目的更新模板`izone.env.template`来更新`izone.env`配置，然后重启容器即可。

## 平台迁移

上面的步骤足够完成新平台的搭建，如果涉及到平台的迁移，比如更换服务器，可以参考下面的步骤进行操作。

### 数据备份

平台需要备份的数据包括两部分：数据库，静态文件。

可以直接参考我的备份脚本，我一般的都是在平台上面设置成定时任务进行自动备份。

首先是静态文件备份脚本:

```shell
#!/bin/bash

# crontab -e
# 0 05 * * * sh /home/zero/scripts/backup_media.sh

input_dir=/opt/cloud/izone-docker/web
backup_dir=/home/zero/backup
maxnum=15
backup_name=media_$(date +'%Y%m%d_%H%M%S').zip

# 备份 media 目录到指定目录
cd $input_dir
zip -r $backup_dir/$backup_name ./media

function check_files()
{
    cd $backup_dir
    local file_lis=$(ls | grep media.*zip)
    for file in ${file_lis[@]}
    do
        num=$(ls | grep media.*zip | wc -l)
        if [[ $num -lt $maxnum ]]; then
            break
        else
            rm -f $file && echo "remove ${file}"
        fi
    done
    echo "$(ls)"
}

check_files
```

然后是数据库备份脚本：

```shell
#!/bin/bash

# crontab -e
# 0 05 * * * sh /home/zero/scripts/backup_mysql.sh

backup_dir=/home/zero/backup
backup_name=izone_$(date +'%Y%m%d_%H%M%S').sql
maxnum=15
db_name=izone_db

# 执行 db 容器的备份命令
docker exec $db_name sh -c 'exec mysqldump -uroot -p$MYSQL_ROOT_PASSWORD $MYSQL_DATABASE' > ${backup_dir}/${backup_name}
[[ $? -eq 0 ]] && echo "backup $backup_name successfully." || echo "backup $backup_name failed."

# 检查备份文件数量，如果多余最大保存数量，就删除多余的备份
function check_files()
{
    cd $backup_dir
    local file_lis=$(ls | grep izone.*sql)
    for file in ${file_lis[@]}
    do
        num=$(ls | grep izone.*sql | wc -l)
        if [[ $num -lt $maxnum ]]; then
            break
        else
            rm -f $file && echo "remove ${file}"
        fi
    done
    echo "$(ls)"
}

check_files
```

### 拷贝备份数据

将备份数据拷贝到新的平台中，包括数据库备份和静态资源备份，还有项目的环境变量文件(.env和izone.env)，这里只有izone.env是自定义的配置，所以只拷贝这个就行。当然，你也应该把备份脚本、Nginx配置等拷贝到新平台。

这里只说平台的备份文件：

```bash
[root@zero-0 ~]# ll
total 148300
-rw-------. 1 root root      1244 Sep 15 21:26 anaconda-ks.cfg
-rw-r--r--. 1 root root       979 Sep 18 13:35 docker_install.sh
drwxr-xr-x. 8 root root       264 Sep 18 14:23 izone
-rw-r--r--. 1 root root 149309999 Sep 18 16:25 izone_20230918_050001.sql
drwxr-xr-x. 6 root root       222 Sep 18 14:39 izone-docker
-rw-r--r--. 1 root root      2195 Sep 18 16:52 izone.env
-rw-r--r--. 1 root root   2531706 Sep 18 16:06 media_20230918_050001.zip
```

### 数据还原

1、还原配置文件

将`izone.env`文件覆盖项目的`izone.env`

```bash
mv -f izone.env
```

2、还原静态文件

执行还原命令，注意根据实际的目录修改命令：

```bash
unzip /root/media_20230918_050001.zip -d /root/izone-docker/web
```

这个解压会把压缩包中的media目录解压到/root/izone-docker/web中的media，可以解压后查看验证。

3、还原数据库

首先将数据库备份文件复制到mysql容器中，直接放到/tmp目录下面即可：

```bash
docker cp /root/izone_20230918_050001.sql izone_db:/tmp/
```

然后登录数据库容器：

```bash
docker exec -it izone_db bash
```

然后执行数据库还原命令：

```bash
mysql -uroot -p$MYSQL_ROOT_PASSWORD -D $MYSQL_DATABASE --default-character-set=utf8 < /tmp/izone_20230918_050001.sql
```


执行完成输入exit后退出容器即可。

以上几个命令的输入输出如下：

```bash
[root@zero-0 media]# docker cp /root/izone_20230918_050001.sql izone_db:/tmp/
Successfully copied 149MB to izone_db:/tmp/
[root@zero-0 media]# docker exec -it izone_db bash
bash-4.2# mysql -uroot -p$MYSQL_ROOT_PASSWORD -D $MYSQL_DATABASE --default-character-set=utf8 < /tmp/izone_20230918_050001.sqlmysql: [Warning] Using a password on the command line interface can be insecure.
bash-4.2# exit
exit
[root@zero-0 media]# 
```

### 更新资源

由于静态文件和数据都是导入的，所以需要在Django里面进行更新，执行静态资源收集和搜索索引更新命令:

```bash
docker exec -it izone_web python manage.py collectstatic
```

```bash
docker exec -it izone_web python manage.py update_index
```

然后进入izone-docker的项目中，重启容器：

```bash
docker-compose down
docker-compose up -d
```

输入输出如下：

```bash
[root@zero-0 izone-docker]# docker-compose down
/usr/lib/python2.7/site-packages/paramiko/transport.py:33: CryptographyDeprecationWarning: Python 2 is no longer supported by the Python core team. Support for it is now deprecated in cryptography, and will be removed in the next release.
  from cryptography.hazmat.backends import default_backend
Stopping izone_nginx ... done
Stopping izone_web   ... done
Stopping izone_db    ... done
Stopping izone_redis ... done
Removing izone_nginx ... done
Removing izone_web   ... done
Removing izone_db    ... done
Removing izone_redis ... done
Removing network izone-docker_frontend
Removing network izone-docker_backend
[root@zero-0 izone-docker]# docker-compose up -d
/usr/lib/python2.7/site-packages/paramiko/transport.py:33: CryptographyDeprecationWarning: Python 2 is no longer supported by the Python core team. Support for it is now deprecated in cryptography, and will be removed in the next release.
  from cryptography.hazmat.backends import default_backend
Creating network "izone-docker_frontend" with driver "bridge"
Creating network "izone-docker_backend" with driver "bridge"
Creating izone_db    ... done
Creating izone_redis ... done
Creating izone_web   ... done
Creating izone_nginx ... done
```

此时再访问一下服务器IP+8888端口看看效果，可以看到数据已经完美还原：

![izone显示](https://tendcode.com/cdn/2023/izone-backup (1).png "izone显示")

## 常见问题和解答

- Q: **运行博客的时候提示缺少了一些模块怎么办？**
<br>A: 首先，我强烈建议使用虚拟环境来运行项目，如何使用虚拟环境自行查看我的文章，然后，博客的依赖请按照项目里面的依赖文件 requirements.txt 安装所有依赖。

- Q: **生成（迁移）数据库的使用报错怎么办？**
<br>A: 首先如果是数据库迁移，请查看我数据库迁移的文章，如果是新生成数据请看安装教程，最后也是最重要的一点，因为我的博客支持 emoji 表情，所以如果是用 MySQL 的话，需要数据库支持 utf8mb4 的格式，所以对数据库的版本有要求，据我所以要5.7+才行。

- Q: **为什么我在博客后台添加了东西但是前端不显示？**
<br>A: 博客使用了缓存技术，很多地方是有缓存的，比如主页右边栏、归档页面等，所以如果发现添加了信息没有更新，可以重启一下博客或者手动去把缓存时间设置短一点。

- Q: **博客打开都是乱的（静态文件没有加载）？**
<br>A: 如果是开发环境，看看是不是关闭了 DEBUG 模式，开发环境必须打开才行；如果在生产环境出现这个问题，那么肯定缺少了收集静态文件的步骤，具体操作查看我部署博客的文章。

- Q: **博主，我看你的图片也是博客这个域名，你图片怎么上传的？**
<br>A: 我使用的七牛云，绑定了自己的域名，就是一个图床，先把图片放到上面然后得到连接即可，所有你随便找个图床都行。

- Q: **博主，你后台编辑文章用的什么编辑器？为什么不添加一个后台编辑器？**
<br>A: 后台我不会去花时间和精力添加编辑器，因为真的没必要。我博客其实提供了一个markdown编辑器工具，只需要添加保存文章，然后去文章页面就可以进入编辑器工具进行文章的修改。