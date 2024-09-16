# MongoDB单实例部署

MongoDB的单实例部署在实际的项目中很少会用到，这种部署方式是缺乏高可用性的，但是作为测试和开发环境倒是非常常用。本文就记录一下MongoDB单实例部署的一些基本操作。


## Linux系统

这里以CentOS7为例，因为这个版本的系统在商用和个人生产环境使用最为普遍。

### 安装依赖

```bash
sudo yum install libcurl openssl
```

### 下载安装包

前往官网下载对应平台的安装包即可，地址：<https://www.mongodb.com/try/download/community>

根据自己的需要选择要下载的版本、平台，然后选择下载为tgz格式并复制下载链接

![](https://cdn.jsdelivr.net/gh/Hopetree/blog-img@main/2023/10/mongo-pkg%20%281%29.png)

然后登录到服务器下载安装包

```bash
wget https://fastdl.mongodb.org/linux/mongodb-linux-x86_64-rhel70-4.4.25.tgz
```

下载完成之后将安装包解压并移动到指定目录

```bash
tar -zxvf mongodb-linux-x86_64-rhel70-4.4.25.tgz
mv mongodb-linux-x86_64-rhel70-4.4.25 /usr/local/mongodb4
```

### 启动MongoDB服务

首先需要创建MongoDB的数据存放目录和日志目录，并设置对应的权限

```bash
sudo mkdir -p /var/lib/mongo
sudo mkdir -p /var/log/mongodb
sudo chown `whoami` /var/lib/mongo
sudo chown `whoami` /var/log/mongodb
```

接着就可以启动服务

```bash
/usr/local/mongodb4/bin/mongod --dbpath /var/lib/mongo --logpath /var/log/mongodb/mongod.log --fork
```

此时可以查看日志，可以看到服务已经启动并运行在后台

### 登录MongoDB

直接使用登录命令登录到mongodb的shell

```bash
cd /usr/local/mongodb4/bin
./mongo
```