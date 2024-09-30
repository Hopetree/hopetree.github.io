# 使用 frp 进行内网穿透的基本操作

frp 是一个专注于内网穿透的高性能的反向代理应用，支持 TCP、UDP、HTTP、HTTPS 等多种协议，且支持 P2P 通信。可以将内网服务以安全、便捷的方式通过具有公网 IP 节点的中转暴露到公网。


| 因素  | 信息 |
| ------------ | ------------ |
|   前提条件| 需要一个有公网IP的服务器，并且开放对应端口  |
|  优势 | 配置简单  |
|  劣势 | 公网服务器的带宽决定访问带宽，每个映射的端口都需要单独配置|


## frp 的概念

### 原理

frp 主要由 客户端(frpc) 和 服务端(frps) 组成，服务端通常部署在具有公网 IP 的机器上，客户端通常部署在需要穿透的内网服务所在的机器上。

内网服务由于没有公网 IP，不能被非局域网内的其他用户访问。

用户通过访问服务端的 frps，由 frp 负责根据请求的端口或其他信息将请求路由到对应的内网机器，从而实现通信。

### frp 的架构

看一下frp的架构

![frp](https://cdn.jsdelivr.net/gh/Hopetree/blog-img@main/article/2307/frp.png "frp")

## 服务端搭建

### 下载安装包

选择适合自己服务器的安装包下载即可，[下载地址](https://github.com/fatedier/frp/releases/tag/v0.51.0)

```bash
# 下载
wget https://github.com/fatedier/frp/releases/download/v0.51.0/frp_0.51.0_linux_amd64.tar.gz
# 解压
tar -zxvf frp_0.51.0_linux_amd64.tar.gz
# 修改目录名称，和权限
mv frp_0.51.0_linux_amd64 frp
chown -R root:root frp
```

查看目录结构如下：

```bash
-rwxr-xr-x. 1 root root 13230080 Jul  5 20:44 frpc
-rw-r--r--. 1 root root    12669 Jul  5 20:49 frpc_full.ini
-rw-r--r--. 1 root root      266 Jul 19 16:15 frpc.ini
-rwxr-xr-x. 1 root root 16052224 Jul  5 20:44 frps
-rw-r--r--. 1 root root     5933 Jul  5 20:49 frps_full.ini
-rw-r--r--. 1 root root       26 Jul  5 20:49 frps.ini
-rw-r--r--. 1 root root    11358 Jul  5 20:49 LICENSE
```

### 修改服务端配置

编辑frps.ini文件，设置指定的端口，这个端口是客户端连接服务端的口端

```bash
[common]
bind_port = 7000
# token 认证
token=123456
```

### 使用 systemd 启动服务

在 Linux 系统下，使用systemd 可以方便地控制 frp 服务端 frps 的启动和停止、配置后台运行和开启自启。

要使用 systemd 来控制 frps，需要先安装 systemd，然后在 /etc/systemd/system 目录下创建一个 frps.service 文件。

**1、如Linux服务端上没有安装 systemd，可以使用 yum 或 apt 等命令安装 systemd**

```bash
# yum
yum install systemd
# apt
apt install systemd
```

**2、使用文本编辑器，如 vim 创建并编辑 frps.service 文件**

```bash
$ vi /etc/systemd/system/frps.service
```

写入内容

```bash
[Unit]
# 服务名称，可自定义
Description = frp server
After = network.target syslog.target
Wants = network.target

[Service]
Type = simple
# 启动frps的命令，需修改为您的frps的安装路径
ExecStart = /opt/cloud/frp/frps -c /opt/cloud/frp/frps.ini

[Install]
WantedBy = multi-user.target
```

**3、使用 systemd 命令，管理 frps**

```bash
# 重新加载配置
systemctl daemon-reload
# 启动frp
systemctl start frps
# 停止frp
systemctl stop frps
# 重启frp
systemctl restart frps
# 查看frp状态
systemctl status frps
```

**4、配置 frps 开机自启**

```bash
systemctl enable frps
```

## 客户端搭建

客户端的软件包跟服务端是同一个，安装方式相同。

### 修改客户端配置

安装之后修复服务端的配置文件frpc.ini

```bash
[common]
# 改成服务端的IP
server_addr = xxx.xxx.xxx.xx    
# 改成服务端的bind_port端口
server_port = 7000
# token 认证，跟服务端一致
token=123456

[ssh203]             
type = tcp
local_ip = 127.0.0.1
local_port = 22
# 设置映射端口，也就是22映射给7203
remote_port = 7203          

```

### 客户端启动服务

跟服务端一样，创建一个系统服务文件，文件名称跟服务端区分(服务端是frps.service，客户端是frpc.service)

```bash
$ vi /etc/systemd/system/frpc.service
```

输入内容

```bash
[Unit]
# 服务名称，可自定义
Description = frp client
After = network.target syslog.target
Wants = network.target

[Service]
Type = simple
# 启动frps的命令，需修改为您的frpc的安装路径
ExecStart = /root/frp/frpc -c /root/frp/frpc.ini

[Install]
WantedBy = multi-user.target
```

然后跟服务端一样，启动服务即可。

```bash
# 重新加载配置
systemctl daemon-reload
# 启动frp
systemctl start frpc
# 停止frp
systemctl stop frpc
# 重启frp
systemctl restart frpc
# 查看frp状态
systemctl status frpc
# 开机自启
systemctl enable frpc
```

## 端口开放

服务端需要开放frp的端口，如上配置的bind_port的7000端口，然后还有客户端配置的remote_port的端口


## ssh 登录

服务端和客户端都正常启动服务之后，可以验证一下ssh登录

```bash
ssh root@xx.xxx.xx.xx -p 7203
```

- xx.xxx.xx.xx：即服务端的IP地址，也就是代理服务器公网IP
- 7203：这个端口是客户端配置的端口，也就是客户端将22端口转发给服务端的7203端口

不出意外的话，ssh可以正常登录，如果出了意外，需要去检查服务端和客户端的frp服务是否正常启动，如果正常，则去排查服务端和客户端的配置是否OK，如果正常，则可以去排查服务端和客户端的防火墙是否开放对应端口。

## 多个内网ssh配置

配置多个内网穿透跟配置一个差不多，服务端是一样的配置，客户端配置不同的名称和端口即可，下面是两个内网的配置：

内网192.168.0.201的配置：

```bash
[common]
# 改成服务端的IP
server_addr = xx.xx.xx.xx
# 改成服务端的bind_port端口
server_port = 7000

[ssh201]
type = tcp
local_ip = 127.0.0.1
local_port = 22
# 设置映射端口，也就是22映射给7201
remote_port = 7201
```

内网192.168.0.202的配置：

```bash
[common]
# 改成服务端的IP
server_addr = xx.xx.xx.xx
# 改成服务端的bind_port端口
server_port = 7000

[ssh202]
type = tcp
local_ip = 127.0.0.1
local_port = 22
# 设置映射端口，也就是22映射给7202
remote_port = 7202
```

::: tip 提示

客户端配置中的[ssh201]和[ssh202]是全局唯一的，比如你如果要再配置另一台内网服务器，则这里的名称不能与其他客户端里的名称重复
:::

## 官方指导

- [官方项目仓库](https://github.com/fatedier/frp)
- [官方文档](https://gofrp.org/docs/examples/)