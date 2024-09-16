# 快速组网工具Zerotier的使用笔记

ZeroTier 是一款非常简单易用的内网穿透工具，不需要像frp一样进行重复的配置和端口映射就能实现虚拟局域网的组建，让你可以在外也能连回家中、办公室的电脑和数据。

## ZeroTier 特点分析

**特点：**

- 创建安全的点对点（P2P）网络
- 使用自己的协议，不基于 WireGuard
- 支持软件定义网络（SDN）

**优点：**

- 设置和使用简单
- 支持多个平台
- 高度可扩展，支持大型网络
- 自动 NAT 穿透

**缺点：**

- 中继服务器都在国外，国内访问延迟比较高，且不稳定，不过如果组网内的客户端都有公网IP（ipv4或ipv6）就可以直接直连，延迟和速度直接拉满

## 概念

### Network

每一个 Network 包含的所有设备都在同一个网络里，可以理解为一个局域网。每个网络有一个 Network ID。各客户端通过这个 ID 连接到此网络。一个账号是可以创建多个网络的。

网络分为 Public 和 Private。一般我们自己组网是要用 Private，需要在页面授权设备才可以进行访问。

### PLANET

星球，指的是官方提供的服务器节点。各客户端都是通过这些服务来互相寻址的。

### MOON

自定义的 Planet，官方称之为Private Root Servers，也即是私有根服务。由于 Zerotier 没有国内节点，导致创建连接的速度偏慢。在自己的网络里搭建 Moon 可以使连接提速，一般都是国内有公网的服务器。

### LEAF

客户端。就是连接到网络上的每一个设备。Moon 也是客户端的一种。这里特指没有额外功能，单纯用于连接的客户端。


## 创建网络

### 注册账号

登录[官方网站](https://my.zerotier.com/network "官方网站")进行注册，可以使用github或者谷歌账号登录。

### 创建网络

账号注册后可以创建网络，一个账号可以创建多个网络

![创建网络](https://tendcode.com/cdn/article/2308/zerotier-one-2.png "创建网络")

记住这个 Network ID，后面加入网络都需要用到这个。

## 安装客户端

Linux下安装直接执行命令：

```bash
curl -s https://install.zerotier.com | sudo bash
```

更多安装方式见官网 <https://www.zerotier.com/download/>

安装之后使用命令 `zerotier-cli join  <network ID>`加入网络，其中network ID就是自己创建的网络里面的ID。

加入网络之后，需要到网络的管理页面进行授权，通过授权的客户端才算正式加入网络。

## 常用命令

### 列出所有网络：

```bash
[root@k8s-master-225 ~]# zerotier-cli listnetworks
200 listnetworks <nwid> <name> <mac> <status> <type> <dev> <ZT assigned ips>
200 listnetworks b6*************** insane_tattam ee:**:**:2f:46:c1 OK PRIVATE zt***** 172.24.185.26/16
```

其中status是属于网络中的状态，网络状态 OK 表示正常，REQUEST_CONFIGURATION 表示没有 uPNP，连不上，ACCESS_DENIED 表示还没有授权。

### 加入网络

使用命令 `zerotier-cli join  <network ID>`

```bash
[root@k8s-master-225 ~]#  zerotier-cli join b6***************
200 join OK
```

### 查看连接情况

使用命令 `zerotier-cli info`

```bash
[root@k8s-master-225 ~]#  zerotier-cli info
200 info 064fa33397 1.12.1 ONLINE
```

### 查看组网连接

使用命令 `zerotier-cli peers`，可以查看到当前所在网络中其他节点的连接情况。

```bash
[root@k8s-master-225 ~]# zerotier-cli peers
200 peers
<ztaddr>   <ver>  <role> <lat> <link>   <lastTX> <lastRX> <path>
62f865ae71 -      PLANET    -1 RELAY
72e1ccb8fc 1.12.1 LEAF      -1 RELAY
778cde7190 -      PLANET    -1 RELAY
b6079f73c6 1.12.0 LEAF     230 DIRECT   3182     3182     35.208.177.26/32269
cafe04eba9 -      PLANET    -1 RELAY
cafe9efeb9 -      PLANET    -1 RELAY
```

其中 link 代表了连接状况。DIRECT 代表可以直接连接，RELAY 代表需要转发。

### 服务操作

zerotier的服务名称是`zerotier-one`，所以可以使用service来管理：

```bash
service zerotier-one status
service zerotier-one restart
service zerotier-one stop
```
也可以使用`systemctl`来管理：

```bash
# 启动服务
systemctl start zerotier-one
# 停止服务
systemctl stop zerotier-one
# 重启服务
systemctl restart zerotier-one
# 查看服务状态
systemctl status zerotier-one
# 开机自启
systemctl enable zerotier-one
# 关闭开机自启
systemctl disable zerotier-one
```

## 高级用法

### 自定义 Moon

官方文档为<https://docs.zerotier.com/zerotier/moons/>

MOON节点的作用是替代官方的PLANET以便能减少网络带来的延迟甚至超时，所以MOON应该是一个拥有公网IP的LEAF。

**第一步**：进入/var/lib/zerotier-one目录

**第二步**：执行 `zerotier-idtool initmoon identity.public >>moon.json` 生成moon配置文件

文件内容大概如下：

```json
{
 "id": "064faxxxx",
 "objtype": "world",
 "roots": [
  {
   "identity": "064fa33397:0:8699b284254226d46fb9c811406585fc88b8abbaea7f425244ca3d9c3cf7b94716ec97a51387d88b2fcd5617f667724d4faed24aee1ef6236303201abxxxx996d",
   "stableEndpoints": []
  }
 ],
 "signingKey": "abf607960fa34e55a7d143c2bb9a7e7467832b9a51238d05aeae031f0fd8786291b224bcea14fa3d9d8afbbe24a4757b2c2f557e7b57c68efdcc318858xxxx",
 "signingKey_SECRET": "2a8927367e23fff88deae15dba3f8e6bae81e84a13cdb28a802ec7a05af1383312c419a856763b8d45f63606708f39c6f114dcdf777a1e10cff72c02xxxx9de7",
 "updatesMustBeSignedBy": "abf607960fa34e55a7d143c2bb9a7e7467832b9a51238d05aeae031f0fd8786291b224bcea14fa3d9d8afbbe24a4757b2c2f557e7b57c68efdcc318xxxxd5740",
 "worldType": "moon"
}
```

需要记下这个文件里面的id，这个就是world id，后续会用到。

**第三步**：添加本机内网地址和端口

具体操作是拿到这个moon的内网IP，也就是加入网络后生成的内网IP（包括IPv4和IPv6），还有端口9993（默认），然后添加到上面步骤的moon.json里面的stableEndpoints字段中，格式如下：

```json
"stableEndpoints": ["172.24.34.132/9993","fe80::ecd4:65ff:fe65:4008/9993"]
```

**第四步**：执行命令`zerotier-idtool genmoon moon.json`

此时会在当前目录生成一个000000064fa3xxxx.moon的文件，需要在当前目录创建一个moons.d目录，然后把这个文件移动到moons.d目录中

**第五步**：重启服务

执行下面两个命令（重启前把目录权限改一下）：

```bash
chown zerotier-one:zerotier-one -R /var/lib/zerotier-one/
systemctl restart zerotier-one
```

**第六步**：LEAF节点加入MOON

上面步骤都是在MOON节点操作的，完成之后MOON节点就算完成了创建，此时可以将任意LEAF加入到MOON中，执行命令`zerotier-cli orbit 064faxxxx 064faxxxx`即可，其中064faxxxx就是前面记下的world id。

```bash
[root@k8s-master-225 ~]# zerotier-cli orbit 064faxxxx  064faxxxx
200 orbit OK
```

## 参考文章

- [Zerotier - 分分钟组网工具最全食用方案](https://zhuanlan.zhihu.com/p/507274316)