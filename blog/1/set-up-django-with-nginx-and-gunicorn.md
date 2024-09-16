# 在 Linux 服务器上使用 Nginx + Gunicorn 部署 Django 项目的正确姿势

我的 Django 博客项目是部署在阿里云 ECS 服务器上面的，服务器的系统是64位的 Ubuntu 16.04 系统，部署的方式是使用 Nginx + Gunicorn 实现，数据使用的是 MySQL。部署其实是一个大坑，我在部署的过程中也是踩过很多坑，所以这篇文章就来介绍一下我的项目的完整部署过程，希望看到的人能少走弯路。

## 项目准备
首先需要把自己本地的项目放到服务器上面来，我使用的是 Github 克隆项目，这种从代码库克隆的方式是比较推荐的，因为可以持续的使用 pull 来让服务器上面的项目保持跟代码仓库中同步。Github 的安装、配置和使用这里省略，如果需要请自行去查阅相关资料完成操作。

### 从 Github 上克隆项目
选择一个放置项目的文件夹，比如我把项目统一放在了自己的一个用户的根目录下面，这个目录的路径是 /home/alex

于是可以切换到当前用户的目录下克隆项目：

```bash
~$ git clone git@github.com:Hopetree/izone.git tendcode
```
上面这句 git 的命令是意思是将 izone.git 这个项目克隆到本地并命名为 tendcode，当然，项目的名称你可以按照自己的喜欢去命名。

### 创建一个虚拟环境
项目移植成功了，我们还需要来移植一个单独给项目使用的环境，所以需要使用虚拟环境。虚拟环境的安装和配置操作方式这里也不做说明，这里只介绍创建虚拟环境的过程。

我虽然在本地的 Windows 上面一直使用的 virtualenvwrapper 来操作虚拟环境，但是在服务器上面还是比较喜欢直接使用 virtualenv，这里就来以这种创建虚拟环境的方式说明。

在当前用户根目录（跟刚才克隆项目同目录）下创建一个虚拟环境 izone_env，使用如下命令：

```bash
~$ virtualenv izone_env
```
此时当前目录的结构是这样的：

```bash
/home/alex/tendcode
/home/alex/izone_env
```
### 复制虚拟环境
虚拟环境虽然已经创建，但是环境中还没有安装项目的依赖，所以现在要根据项目的依赖文件去安装依赖。

首先在当前用户目录下使用如下命令进入虚拟环境：

```bash
~$ source izone_env/bin/activate

```
然后将当前目录切换到你的项目的依赖文件 requirements.txt 的目录下，比如我的项目的依赖文件就在项目的一级目录下面，比如它的地址是这样的：

```bash
/home/alex/tendcode/requirements.txt
```
那么此时应该切换到这样：
```bash
(izone_env) ~$ cd tendcode
```
然后使用如下命令安装依赖：

```bash
(izone_env) ~$ pip install -r requirements.txt
```
此时，项目的基本运行条件已经准备好了，下面开始运行项目。

## 项目运行
在部署项目之前，先要保证项目在服务器上面能够正常运行，这是最起码的条件。

### 创建数据库
如果项目同样适用的是 MySQL 数据库的话，在项目运行之前需要先创建数据库，比如我的项目中指定了数据库的基本信息，我创建数据库（进入mysql命令行下）的命令如下：

```bash
mysql > CREATE DATABASE `tendcode` DEFAULT CHARACTER SET utf8 COLLATE utf8_general_ci;
```
这句命令的意思是创建一个名称为 tendcode 的数据库，并且将数据库的编码设定为 utf8，这个按照自己的项目需求去创建即可。

### 迁移数据库
现在可以按照 Django 项目的数据库迁移步骤来操作了，当然，下面的操作都是在虚拟环境中进行的。

1、创建数据迁移，命令如下：

```bash
(izone_env) ~/tendcode$ python manage.py makemigrations
(izone_env) ~/tendcode$ python manage.py migrate
```
2、创建管理员账号：

```bash
(izone_env) ~/tendcode$ python manage.py createsuperuser
```
3、静态文件的收集：

```bash
(izone_env) ~/tendcode$ python manage.py collectstatic
```
### 启动项目

```bash
(izone_env) ~/tendcode$ python manage.py runserver 0.0.0.1:8000
```
如果你的服务器上面的8000端口开启了，那么可以访问你的服务器 IP 地址的8000端口看看项目是否正常运行：

```bash
http://server_domain_or_IP:8000
```
到这里顺便说一下，由于我的项目是有域名的，所以在项目中要先添加自己的域名，就像这样：
```python
ALLOWED_HOSTS = ['127.0.0.1', 'localhost', '.tendcode.com']
```
## 开始部署
### 安装和配置 Gunicorn

1、首先需要在虚拟环境中安装 Gunicorn：

```bash
(izone_env) ~/tendcode$ pip install gunicorn
```
2、创建项目的 Gunicorn 配置文件（退出虚拟环境）：

```bash
~$ sudo vim /etc/systemd/system/gunicorn_tendcode.service
```
3、配置信息如下：

```bash
[Unit]
Description=gunicorn daemon
After=network.target

[Service]
User=alex
Group=www-data
WorkingDirectory=/home/alex/tendcode
ExecStart=/home/alex/izone_env/bin/gunicorn --access-logfile - --workers 2 --bind unix:/home/alex/tendcode/tendcode.sock izone.wsgi:application

[Install]
WantedBy=multi-user.target
```
上面的配置信息中需要根据自己的项目改的有以下几个地方：

- User 填写自己当前用户名称
- WorkingDirectory 填写项目的地址
- ExecStart 中第一个地址是虚拟环境中 gunicorn 的目录，所以只需要改前半部分虚拟环境的地址即可
- workers 2 这里是表示2个进程，可以自己改
- unix 这里的地址是生成一个 sock 文件的地址，直接写在项目的根目录即可
- izone.wsgi 表示的是项目中 wsgi.py 的地址，我的项目中就是在 izone 文件夹下的

### 启动配置文件
文件配置完成之后，使用下面的命令启动服务：

```bash
~$ sudo systemctl start gunicorn_tendcode
~$ sudo systemctl enable gunicorn_tendcode
```
查看服务的状态可以使用命令：

```bash
~$ sudo systemctl status gunicorn_tendcode
```
上面的命令启动没有问题可以看看自己的项目的跟目录下面，应该会多一个 tendcod.sock 文件的。

后续如果对 gunicorn 配置文件做了修改，那么应该先使用这个命令之后重启：

```bash
~$ sudo systemctl daemon-reload
```
然后再使用重启命令：

```bash
~$ sudo systemctl restart gunicorn_tendcode
```
### 配置 Nginx
首先创建一个 Nginx 配置文件，不要使用默认的那个：

```bash
~$ sudo vi /etc/nginx/sites-available/mynginx
```
配置信息如下：

```nginx
server {
    # 端口和域名
    listen 80;
    server_name www.tendcode.com;
    
    # 日志
    access_log /home/alex/tendcode/logs/nginx.access.log;
    error_log /home/alex/tendcode/logs/nginx.error.log;

    # 不记录访问不到 favicon.ico 的报错日志
    location = /favicon.ico { access_log off; log_not_found off; }
    # static 和 media 的地址
    location /static/ {
        root /home/alex/tendcode;
    }
    location /media/ {
        root /home/alex/tendcode;
    }
    # gunicorn 中生成的文件的地址
    location / {
        include proxy_params;
        proxy_pass http://unix:/home/alex/tendcode/tendcode.sock;
    }
}

server {
    listen 80;
    server_name tendcode.com;
    rewrite ^(.*) http://www.tendcode.com$1 permanent;
}
```
第一个 server 是主要的配置，第二 server 是实现301跳转，即让不带 www 的域名跳转到带有 www 的域名上面。

### 连接 Nginx 配置
上面的配置检查好之后，使用下面的命令来将这个配置跟 Nginx 建立连接，使用命令：

```bash
~$ sudo ln -s /etc/nginx/sites-available/mynginx /etc/nginx/sites-enabled
```
运行完毕之后可以查看一下 Nginx 的运营情况，看看会不会报错：

```bash
~$ sudo nginx -t
```
如果上面这句没有报错，那么恭喜你，你的配置文件没有问题，可以继续下一步，如果报错了，需要按照报错的信息去更改配置文件中对应行的代码，好好检查一下吧！

没报错的话，重启一下 Nginx：

```bash
~$ sudo systemctl restart nginx
```
好了，重启 Nginx 之后可以登录自己配置的域名，看看自己的项目是不是已经成功的运行了呢！
## 后续维护
之后的项目维护中，如果更改了 gunicorn 的配置文件，那么需要依次执行下面两条语句去重启服务，如果只是修改了 Django 项目的内容，只需要单独执行第二条重启命令即可：
```bash
~$ sudo systemctl daemon-reload
~$ sudo systemctl restart gunicorn_tendcode
```
如果修改了 Nginx 的配置文件，那么需要依次执行下面两条语句去重启服务：
```bash
~$ sudo nginx -t
~$ sudo systemctl restart nginx
```

以上就是我的项目部署的全部过程，希望看到这篇文章的人如果想要使用同样的方式部署 Django 项目的话，可以参考一下，有问题也可以指出。