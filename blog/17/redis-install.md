# Redis单机部署

redis 是最常用的缓存数据库（正确说是中间件），虽然redis的安装很简单，网上也一大堆，但是为了便于后面继续写 redis 的集群部署，这里就记录一下单机部署 redis 的方式。

## Linux 安装

本文安装系统为CentOS7.8

### 下载安装包

访问官网安装包下载地址：<https://redis.io/download/#redis-downloads>

按照自己的系统选择对应的安装包即可，不如这里我需要选择的是CentOS7的x86版本

![redis安装包下载](https://tendcode.com/cdn/2023/10/redis-download%20%281%29.png)

复制下载地址，使用wget命令下载（这里使用-O参数自定义一下包的名称）：

```bash
wget -O redis-pkg.tgz https://packages.redis.io/redis-stack/redis-stack-server-7.2.0-v4.rhel7.x86_64.tar.gz?_gl=1*1qn2s6n*_ga*MTIwNjcwNTA1OS4xNjk4MzcxODAw*_ga_8BKGRQKRPV*MTY5ODM3MTc5OS4xLjAuMTY5ODM3MTgwOS41MC4wLjA.*_gcl_au*NTc2MjEzMjA0LjE2OTgzNzE4MDA.
```

### 解压安装包

将下载的安装包解压，可以得到一个类似redis-stack-server-7.2.0-v4的目录

```bash
tar -zxvf redis-pkg.tgz
```

将目录移动到安装目录

```bash
mv redis-stack-server-7.2.0-v4 /var/local/redis
```

### 启动 redis 服务

```bash
cd /var/local/redis && ./bin/redis-server ./etc/redis-stack.conf
```
执行之后redis就在后台运行了，这个redis-stack.conf文件是安装包自带的配置。

更多的配置，可以查看官方的默认配置文档：<https://redis.io/docs/management/config/>

比如7.2版本的redis.conf文件：<https://raw.githubusercontent.com/redis/redis/7.2/redis.conf>

### 登录 redis

```bash
[root@zero-1 redis]# cd /var/local/redis && ./bin/redis-cli
127.0.0.1:6379> 
```

执行之后就登录到redis的shell命令行了。