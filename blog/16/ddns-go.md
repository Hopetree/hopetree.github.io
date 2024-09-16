# ddns-go 的使用，实现公网 IPv6 下动态域名解析

ddns-go 是一个开源的动态域名解析服务，可以实现多个域名管理平台的域名解析，同时支持 IPv4 和 IPv6，也就是说只要有公网IP就可以实现动态域名解析将内网服务暴露到公网。

ddns-go 项目地址：<https://github.com/jeessy2/ddns-go>

## ddns-go 安装部署

其实项目的github说明里面已经写的很清楚，这个程序支持各种平台的安装，可以根据需要自行实践，我这里就说一下我在linux下安装的步骤。

首先去下载自己系统的版本的安装包，比如[ddns-go_5.6.2_linux_x86_64.tar.gz](https://github.com/jeessy2/ddns-go/releases/tag/v5.6.2)

放到服务器上面解压之后直接执行启动命令就行：

```bash
./ddns-go -s install -l :9877
```

启动之后可以查看到已经监听端口，并且已经自动创建了系统服务，可以使用守护进程来管理服务：

```bash
# 查看服务状态
systemctl status ddns-go
```

更多命令参数见帮助：

```bash
[root@home-201 ddns-go]# ./ddns-go -h
Usage of ./ddns-go:
  -c string
        自定义配置文件路径 (default "/root/.ddns_go_config.yaml")
  -cacheTimes int
        间隔N次与服务商比对 (default 5)
  -dns string
        自定义 DNS 服务器（例如 1.1.1.1）
  -f int
        同步间隔时间(秒) (default 300)
  -l string
        监听地址 (default ":9876")
  -noweb
        不启动 web 服务
  -s string
        服务管理, 支持install, uninstall
  -skipVerify
        跳过验证证书, 适合不能升级的老系统
  -u    更新 ddns-go
  -v    ddns-go 版本
```

## 添加动态域名解析

我在阿里云和百度云都有域名，两个平台的动态解析我都试过，基本没啥区别，这里拿阿里云的为例。

### 添加阿里云密钥

当启动ddns-go服务后，默认的端口是9876，当然，看具体的命令的端口参数。这个时候访问服务器的这个端口就可以进入配置的页面进行配置。

这里直接选择DNS服务商阿里云，然后点击创建AccessKey就进入到了阿里云的创建密钥的页面，自定登录创建即可，然后输入到页面的输入框中就行。

![](https://tendcode.com/cdn/2023/10/ddns-1.png)

### 添加IPv6域名解析

由于我家里的服务器没有公网IPv4，但是有公网IPv6，所以直接不开启IPv4的配置，而是开启IPv6的配置。

![](https://tendcode.com/cdn/2023/10/ddns-2.png)

这里直接使用网卡获取就能拿到公网IPv6，此时可以去查看一下确认一下。

> 顺便说一下，三大运营商的IPv6特征是：240e 为中国电信的 IP 段，2408 中国联通，2409 中国移动。

然后添加自己要解析的域名。


### 验证

保存配置去查看日志就能看到域名会被动态解析，这个时候可以去查看阿里云的域名解析页面，可以查看到有一条解析记录，也就是ddns-go 自动提交的。

不过域名解析需要一定时间生效，需要等一段时间才能访问解析的域名。

::: warning 注意

本地要访问IPv6解析的域名需要本地也支持IPv6(移动流量现在默认都是支持，所以可以使用手机热点来验证，Macbook连上热点还要开启IPv6才行，具体操作自行查)，否则无法访问成功
:::


检查本地是否支持IPv6很简单，只需要访问[IPv6的检查网站](https://www.test-ipv6.com/index.html.zh_CN)就能知道，本地支持IPv6的返回如下：

![](https://tendcode.com/cdn/2023/10/ddns-3.png)

### 后续维护

1. 如果是要修改配置信息，比如新增域名、供应商等，可以直接登录页面修改，也可以直接修改配置文件 `/root/.ddns_go_config.yaml`，改完需要重启服务
2. 如果是想要改监听端口，则需要修改服务配置 `/etc/systemd/system/ddns-go.service` 然后执行重新加载服务配置文件，并重启服务