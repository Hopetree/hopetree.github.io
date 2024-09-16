# 快速组网工具TailScale的使用，可以平替Zerotier

TailScale实现远程访问的形式和Zerotier类似，它可以将多个局域网组成一个虚拟局域网，继而实现多个局域网之间的远程访问。TailScale是以Wireguard的协议加密，所以安全性更高，而且是P2P连线，流量不经伺服器，延迟更低、私密性更高。

## Tailscale 特点分析

**特点：**

- 基于 WireGuard，提供安全且高性能的网络
- 专注于使用集中式基于身份的控制平面创建安全的网状网络

**优点：**

- 免费使用，多种账号登录
- 设置和管理简单
- 强大的加密和安全功能
- 自动 NAT 穿透
- 支持多个平台

**缺点：**

- 中继服务器都是国外的，国内访问延迟和稳定性不太好，但是如果两个内网都有ipv6，就可以忽略这个缺点（跟zerotier一样）

## 注册账号

TailScale的使用方式跟Zerotier是非常相似的，首先也要注册一个官方账号，不需要手动创建网络，自动就有有一个虚拟局域网。

官方注册登录地址：<https://login.tailscale.com/admin/machines>

可以使用GitHub账号或者微软账号登录，这里建议使用微软账号。

[![](https://cdn.jsdelivr.net/gh/Hopetree/blog-img@main/2023/tailscale-login-2.png)](https://login.tailscale.com/login?next_url=%2Fwelcome)

## 安装客户端

注册登录之后，点击页面的 Download 就可以进入客户端下载页面，这里支持多种平台的客户端安装，按照需要安装即可。（IOS和macOS的安装都会跳转到App Store，大陆账号无法安装）

[![](https://cdn.jsdelivr.net/gh/Hopetree/blog-img@main/2023/tailscale-install.png)](https://tailscale.com/download/linux/centos-7)

### CentOS 安装

CentOS 的安装方式官方提供了一个脚本，也有详细[命令步骤](https://tailscale.com/download/linux/centos-7 "命令步骤")，建议按照详细步骤来执行安装。

1.Install the Yum repository manager（安装yum源管理软件）:

```bash
sudo yum install yum-utils
```

2.Add the Tailscale repository and install Tailscale（设置源，并安装 tailscale）:

```bash
sudo yum-config-manager --add-repo https://pkgs.tailscale.com/stable/centos/7/tailscale.repo
sudo yum install tailscale
```

::: tip

🔔 **温馨提示**

网络不好的话，这个地方可能会卡在下载 rpm 包这里，毕竟是墙外资源，此时如果你有“梯子”，建议你使用“梯子”的网络手动下载 rpm 包（安装的时候会显示下载地址）传到服务器上手动安装，比如 `yum install tailscale_1.62.1_x86_64.rpm `
:::

3.Use systemctl to enable and start the service（将tailscale设置成开机自启动服务）:

```bash
sudo systemctl enable --now tailscaled
```

4.Connect your machine to your Tailscale network and authenticate in your browser（连接机器，并且在浏览器打开认证）:

```bash
sudo tailscale up
```

当执行到这一步的时候，会在命令行中输出一个地址给你，点击地址可以访问，然后登录你的账号，那么这个Linux主机就自动加入了你的网络。

5.You’re connected! You can find your Tailscale IPv4 address by running（连接完成后，查询虚拟机局域网的内网ipv4）:

```bash
tailscale ip -4
```

### macOS 和 IOS 安装

由于 macOS 和 IOS 的安装在官网点击之后都会进入 App Store 进行安装，在国内会提示软件在所在区域无法访问，所以是不能安装的。（当然，你可以切换美服账号进行安装）

这里 macOS 可以使用离线安装包进行安装，也是官方的，地址为：<https://pkgs.tailscale.com/stable/> 这个地址里面包含了各种离线安装包，其中就有 macOS 的包。

安装之后，可以启动应用，然后登录自己的账号就可以加入到网络中：

![](https://cdn.jsdelivr.net/gh/Hopetree/blog-img@main/2023/tailscale-ui.png)

 IOS 的离线安装包就没有，这个要安装的话就要切换 App Store 的账号去安装。

## TailScale远程访问

设备都加入到网络之后，可以把需要长期使用的设备的过期时间设置成不过期：

![](https://cdn.jsdelivr.net/gh/Hopetree/blog-img@main/2023/tailscale-expiry.png)

然后直接使用分配的虚拟局域网IP进行访问即可。


## 参考文章

- [部署TailScale，实现内网设备全远程访问！最简单的远程访问、异地组网方案！群晖NAS部署tailscale](https://zhuanlan.zhihu.com/p/616014772)

- [TailScale 实现远端访问整段局域网(ZeroTier另一选择)](https://blog.csdn.net/sillydanny/article/details/120633276)