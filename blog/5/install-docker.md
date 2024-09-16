# 容器化部署博客（1）—— 安装 docker 和 docker-compose

我的博客已经在前段时间变更为容器化部署了，部署的方式改变之后，部署时间和需要做的准备工作缩短了很多，现在如果环境上面容器的相关环境已经准备好，部署一次博客只需要10分钟就够了，速度相当快。

由于我的博客部署使用的是 docker-compose 所以，这篇文章作为博客容器化部署的前提文章来介绍一下我安装 docker 和 docker-compose 的方式，有需求的人可以参考一下。

## 安装docker

首先来说一下 docker 版本的选择问题，可以看一下下面这段引言，就能知道一个大概的选择了。

> docker-io, docker-engin 是以前早期的版本，版本号是 1.*，默认centos7 安装的是docker-io，最新版是 1.13;Ubuntu默认安装的是docker-ce ,docker-ce 是社区版本，适用于刚刚开始docker 和开发基于docker研发的应用开发者或者小型团队,所以这里统一为安装docker-ce

### 更新软件

Ubuntu 执行：

```bash
sudo apt-get update;sudo apt-get upgrade
```

CentOS 执行：

```bash
sudo yum update
```

### Ubuntu 安装docker

Ubuntu 使用 apt-get 命令安装 docker，命令如下：

```bash
sudo apt-get install docker.io
```

安装完成之后可以查看一下 docker 的版本信息：

```bash
~$ docker -v
Docker version 18.06.1-ce, build e68fc7a
```
不过，现在虽然安装了 docker，但是当前用户是无法使用 docker 命令的，所以需要把当前用户加入到 docker 用户组中，命令如下：

```bash
sudo usermod -aG docker $USER
```
添加完用户之后，需要把当前用户退出登录一下，重新登录之后就可以使用 docker 命令了，比如查看 docker 的信息：

```bash
docker info
```

### CentOS 安装 docker
- 卸载原有的 docker
```bash
sudo yum remove -y docker \
                  docker-client \
                  docker-client-latest \
                  docker-common \
                  docker-latest \
                  docker-latest-logrotate \
                  docker-logrotate \
                  docker-engine
```

- 清理残留目录
```bash
sudo rm -rf /var/lib/docker
sudo rm -rf /var/run/docker
```

- 安装 yum-utils，它提供了 yum-config-manager，可用来管理yum源
```bash
sudo yum install -y yum-utils
```

- 添加yum源
```bash
sudo yum-config-manager --add-repo http://mirrors.aliyun.com/docker-ce/linux/centos/docker-ce.repo
```

- 更新yum索引
```bash
sudo yum makecache fast
```

- 安装 docker-ce
```bash
sudo yum install -y docker-ce
```

- 设置为系统服务
```bash
sudo systemctl enable docker
```

### 设置镜像仓库源
默认的镜像仓库是国外的，拉取镜像的速度很慢，所以为了方便镜像获取，可以更改镜像源，方法是添加一个配置文件 
```bash
sudo vi /etc/docker/daemon.json
```
添加的信息如下：
```bash
{
 "registry-mirrors": ["https://registry.docker-cn.com"]
}
```

添加完命令之后，需要重启一下容器服务：
```bash
sudo systemctl daemon-reload 
sudo systemctl restart docker
```

现在执行一下 info 命令，可以查看到 docker 的镜像源已经更改为国内的了，信息如下：
```bash
Registry Mirrors:
 https://registry.docker-cn.com/
```

docker 已经按照好了，现在，可以试一下拉取一个镜像了
```bash
docker pull nginx
```

### 一键安装脚本

```bash
#/bin/bash
# 使用root用户安装docker

DOCKER_VERSION=docker-ce-18.09.9-3.el7
DOCKER_REGISTRY=https://registry.docker-cn.com
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

## 安装 docker-compose

如果是 CentOS 系统，没有安装 pip ，可以使用如下命令安装 pip：
```bash
sudo yum -y install epel-release
sudo yum -y install python-pip
sudo yum clean all
# 升级pip到python2可用的最版本，避免安装依赖报错
sudo pip install --upgrade pip==20.3
```

然后可以直接使用 pip 来安装，需要 sudo 权限
```bash
sudo pip install docker-compose -i http://pypi.douban.com/simple --trusted-host pypi.douban.com
```

更多安装方式：<https://blog.csdn.net/ytangdigl/article/details/103831739>

安装完成之后，可以查看一下 docker-compose 的版本信息
```bash
~$ docker-compose -v
docker-compose version 1.23.2, build 1110ad0
```

好了，现在 docker 和 docker-compose 都安装好了，可以开始尝试容器化部署服务了，一些简单的容器使用可以参考我 Github 上列举的几个例子，地址是 <https://github.com/Hopetree/docker-demos>。

另外：博客的容器化部署方式之后的文章会更新，敬请关注！

## 常用镜像

### 官方安装文档
文档地址：<https://docs.docker.com/install/>

### 官方 Dockerfile
- nginx: <https://github.com/nginxinc/docker-nginx>
- mysql: <https://github.com/docker-library/mysql>
- python: <https://github.com/docker-library/python>
- redis: <https://github.com/docker-library/redis>

### 镜像 Tag 查询
v2 接口：`https://registry.hub.docker.com/v2/repositories/{repo_name}/{image_name}/tags/`

这个接口可以查看到镜像比较详细的信息，接口是分页显示，个人觉得这个接口适合用来对比 tag ，用来选择。

例子：
```bash
# 官方镜像查询
https://registry.hub.docker.com/v2/repositories/library/jenkins/tags/
# 其他仓库镜像查询
https://registry.hub.docker.com/v2/repositories/jenkins/jenkins/tags/
```

v1 接口：`https://registry.hub.docker.com/v1/repositories/{repo_name}/tags`

这个接口直接显示一个镜像的所有 tag ，但是只有 tag 的名称没有其他信息，所以个人觉得这个接口比较适合查找 tag 是否存在。

例子：

```bash
# 官方镜像
https://registry.hub.docker.com/v1/repositories/jenkins/tags
# 其他仓库镜像
https://registry.hub.docker.com/v1/repositories/jenkins/jenkins/tags
```