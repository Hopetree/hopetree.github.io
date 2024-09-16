# 分享一个给 Django 镜像瘦身 50% 的经验

这两天搞了一个专门玩容器的虚拟机，然后就重新构建了一些我博客的镜像，并且成功将容器体检减少了接近 50%，由于之前就尝试过瘦身，但是由于依赖关系导致失败，这次成功了，所以这篇文章就分享一下这次成功瘦身的经验。

## 先看效果

先直接来看一下瘦身前后的效果对比吧，瘦身的目的肯定是为了在不影响使用的前提下减少空间，这里我主要记录了两个数据，分别是镜像大小和容器运行的内存消耗情况。

### 镜像大小对比

```bash
[root@home-203 izone-docker]# docker images
REPOSITORY       TAG             IMAGE ID       CREATED          SIZE
hopetree/izone   latest          0b217ebea46f   32 minutes ago   1.13GB
hopetree/izone   lts             d21afda2b967   18 hours ago     623MB
```

瘦身前镜像大小为 1.13GB，瘦身后为 623MB

### 容器内存占用对比

先看一下空载的内存占用，不启动服务的时候内存占用为 480M：

```bash
[root@home-203 izone-docker]# free -h
              total        used        free      shared  buff/cache   available
Mem:           3.7G        480M        896M        8.4M        2.4G        2.9G
Swap:          2.0G        1.5M        2.0G
```

在看一下启动容器（izone项目，不仅仅只有Django容器），内存占用变成了 1201M，也就是项目需要 720M 左右。

```bash
[root@home-203 izone-docker]# free -m
              total        used        free      shared  buff/cache   available
Mem:           3788        1201         157           8        2429        2295
Swap:          2047           1        2046
```

在看一下使用瘦身后的镜像的内存占用情况，有点可惜，内存占用是一样的：

```bash
[root@home-203 izone-docker]# free -m
              total        used        free      shared  buff/cache   available
Mem:           3788        1200         157           8        2431        2297
Swap:          2047           1        2046
```

### 小结

经过对比，瘦身前后镜像的大小是有巨大提升，这种提升对于镜像的上传和归档都是有很大意义的，但是可惜的是容器运行的内存占用没有提升，但是相比执行资源占用应该还是有提升的。

|   | 镜像大小  | 容器内存占用  |
| ------------ | ------------ | ------------ |
|  瘦身前 | 1.13GB  |  720M |
| 瘦身后  | 623M  | 720M  |
| 前后对比  |  减少47% |  持平 |

## 镜像瘦身的方法

其实给镜像瘦身很简单，就是使用一个更加轻量的基础镜像就行，但是并不是越轻量越好。

### 镜像的选择

经常使用 docker 的都知道，大部分的基础镜像多有很多个版本，比如 python 镜像，不同的基础镜像的大小也是不同的。

![python](https://cdn.jsdelivr.net/gh/Hopetree/blog-img@main/2024/04/202404211620302.png)

一般镜像会有三种基本的版本：

1. 默认版本：这种版本一般都是最大的，使用Debian的bullseye做为默认镜像基础系统
2. slim 版本：瘦身版本，相对默认版本小一些，同时也缺一些非常用的依赖
3. alpine 版本：最小镜像，体检很小，但是一般只能运行原始的代码，如果有依赖的话要么自己安装，要么就直接无法运行，很适合无依赖的软件运行，比如Nginx，redis这种

### 解决 mysqlclient 安装问题

我将Python镜像从默认的 `python:3.9` 换成了 `python:3.9-slim`，虽然可以减小镜像大小，但是会发现安装 mysqlclient==2.0.3 的时候会报错，具体报错如下：

```bash
Collecting mysqlclient==2.0.3
  Downloading http://mirrors.aliyun.com/pypi/packages/3c/df/59cd2fa5e48d0804d213bdcb1acb4d08c403b61c7ff7ed4dd4a6a2deb3f7/mysqlclient-2.0.3.tar.gz (88 kB)
     ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 88.9/88.9 kB 1.9 MB/s eta 0:00:00
  Preparing metadata (setup.py): started
  Preparing metadata (setup.py): finished with status 'error'
  error: subprocess-exited-with-error
  
  × python setup.py egg_info did not run successfully.
  │ exit code: 1
  ╰─> [16 lines of output]
      mysql_config --version
      /bin/sh: 1: mysql_config: not found
      mariadb_config --version
      /bin/sh: 1: mariadb_config: not found
      mysql_config --libs
      /bin/sh: 1: mysql_config: not found
      Traceback (most recent call last):
        File "<string>", line 2, in <module>
        File "<pip-setuptools-caller>", line 34, in <module>
        File "/tmp/pip-install-i45k40lm/mysqlclient_bdf5e6c2ea1043cd9286023d10d10ba8/setup.py", line 15, in <module>
          metadata, options = get_config()
        File "/tmp/pip-install-i45k40lm/mysqlclient_bdf5e6c2ea1043cd9286023d10d10ba8/setup_posix.py", line 70, in get_config
          libs = mysql_config("libs")
        File "/tmp/pip-install-i45k40lm/mysqlclient_bdf5e6c2ea1043cd9286023d10d10ba8/setup_posix.py", line 31, in mysql_config
          raise OSError("{} not found".format(_mysql_config_path))
      OSError: mysql_config not found
      [end of output]
  
  note: This error originates from a subprocess, and is likely not a problem with pip.
error: metadata-generation-failed

× Encountered error while generating package metadata.
╰─> See above for output.

note: This is an issue with the package mentioned above, not pip.
```

这个情况其实之前我就知道，但是没有去找解决方案，为了方便直接使用的默认的镜像。

这次找到了方案，只需要安装一些依赖软件就可以（要替换debian源）：

```dockerfile
# 安装sqlclient的依赖，slim镜像中缺少
RUN apt-get update && apt-get install -y \
    default-libmysqlclient-dev \
    build-essential \
    && rm -rf /var/lib/apt/lists/*
```

可以参考：[如何在python:3-slim Docker镜像中安装mysqlclient而不使镜像变得臃肿？](https://www.volcengine.com/theme/7380144-R-7-1)

### 充分的验证

换了基础镜像之后，镜像的构建没问题大概率在运行的时候没问题，但是也不一定，所以需要进行充分验证才行。

### 新的 Dockerfile

查看一下我使用 slim 基础镜像的 Dockerfile 文件吧：

```dockerfile
FROM python:3.9-slim

# 国内用户构建命令参考
# DOCKER_BUILDKIT=0 docker build --build-arg pip_index_url=http://mirrors.aliyun.com/pypi/simple/ --build-arg pip_trusted_host=mirrors.aliyun.com --build-arg debian_host=mirrors.ustc.edu.cn -f Dockerfile-slim -t hopetree/izone:lts .

# 默认的系统源和pypi源都使用国外的，国内构建的时候可以用命令行参数替换成国内源
ARG debian_host=deb.debian.org
ARG pip_index_url=https://pypi.org/simple
ARG pip_trusted_host=pypi.org


ENV PYTHONUNBUFFERED=1
WORKDIR /opt/cloud/izone

# 替换系统源，要注意这里不同版本的debian源文件不同
RUN sed -i "s/deb.debian.org/${debian_host}/g" /etc/apt/sources.list.d/debian.sources

# 安装sqlclient的依赖，slim镜像中缺少
RUN apt-get update && apt-get install -y \
    default-libmysqlclient-dev \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

RUN cp /usr/share/zoneinfo/Asia/Shanghai /etc/localtime
COPY requirements.txt requirements.txt
RUN pip install --no-cache-dir -r requirements.txt --index-url $pip_index_url --trusted-host $pip_trusted_host
RUN mkdir -p log && chmod -R 755 log

COPY . .

# 设置镜像的创建时间，当做网站更新时间
RUN sed -i "s/web_update_time=\"\"/web_update_time=\"$(date +'%Y-%m-%d %H:%M')\"/g" ./apps/blog/templates/blog/base.html

CMD ["supervisord", "-n", "-c", "supervisord.conf"]
```

## 参考文档

- [Python Docker 镜像的选择](https://blog.csdn.net/zyy247796143/article/details/124387806)
- [如何在python:3-slim Docker镜像中安装mysqlclient而不使镜像变得臃肿？](https://www.volcengine.com/theme/7380144-R-7-1)