# Redis “Cannot assign requested address” 故障排查实录

## 🧩 背景描述

由于意外的断电，服务器重启之后发现有服务无法连接上 redis，客户端报错 “telnet: connect to address 127.0.0.1: Cannot assign requested address ”。


## 🔍 排查过程

### 1. 确认 Redis 已监听 127.0.0.1

执行端口检查命令：

```bash
netstat -nplt | grep 6379
```

输出：

```bash
tcp        0      0 127.0.0.1:6379              0.0.0.0:*                   LISTEN      24147/./bin/redis-s 
tcp        0      0 ::1:6379                    :::*                        LISTEN      24147/./bin/redis-s 
```

说明 Redis 正常监听 127.0.0.1，无监听异常。

### 2. telnet 检查

netstat 已经知道 redis 服务监听没问题，此时需要排查网络问题，因为有可能是防火墙端口设置导致无法访问 6379

先检查 127 的 6379：

```bash
$ telnet 127.0.0.1 6379
Trying 127.0.0.1...
telnet: connect to address 127.0.0.1: Cannot assign requested address
```

跟客户端报错一样，就是无法访问

然后看看 localhost 的 6379：

```bash
$ telnet localhost 6379
Trying ::1...
Connected to localhost.
Escape character is '^]'.
```

居然是正常的

进一步看看其他端口的 127 访问：

```bash
$ telnet localhost 8079
Trying ::1...
Connected to localhost.
Escape character is '^]'.
```

也是正常的，这说明防火墙没问题，当然我还是检查了防火墙配置，没有对端口有任何限制

```bash
iptables -L -n -v 
```

### 3. 确认 loopback 网卡配置正常

```bash
ip addr show lo
```

输出正常，127.0.0.1/8 正确配置于 lo 接口。

```bash
ip route show | grep 127
```

输出包含：

```bash
127.0.0.0/8 dev lo scope link
```

说明路由层无误。

### 4. 检查网络命名空间

由于我的内网中使用了 Tailscale 内网穿透，因为需要确认 Redis 与 shell 同处 namespace

```bash
readlink /proc/$(pidof redis-server)/ns/net
readlink /proc/$$/ns/net
```

两者一致，无隔离容器情况。

### 5. strace 报错定位

```bash
strace -e trace=network telnet 127.0.0.1 6379
```

输出：

```bash
Trying 127.0.0.1...
socket(AF_INET, SOCK_STREAM, IPPROTO_TCP) = 3
setsockopt(3, SOL_IP, IP_TOS, [16], 4)  = 0
connect(3, {sa_family=AF_INET, sin_port=htons(6379), sin_addr=inet_addr("127.0.0.1")}, 16) = -1 EADDRNOTAVAIL (Cannot assign requested address)
telnet: connect to address 127.0.0.1: Cannot assign requested address
+++ exited with 1 +++
```

说明是本地临时端口耗尽，无法建立连接。

### 6. 检查 TIME_WAIT 数量

```bash
ss -s
```

输出:

```bash
Total: 4589 (kernel 4892)
TCP:   32670 (estab 3794, closed 28681, orphaned 0, synrecv 0, timewait 28605/0), ports 0

Transport Total     IP        IPv6
*         4892      -         -        
RAW       5         2         3        
UDP       18        7         11       
TCP       3989      3510      479      
INET      4012      3519      493      
FRAG      0         0         0  
```

TCP 中显示 timewait 28xxx/0，数量异常。

### 7. 临时解决措施

```bash
sysctl -w net.ipv4.tcp_tw_reuse=1
sysctl -w net.ipv4.tcp_tw_recycle=0
sysctl -w net.ipv4.tcp_fin_timeout=10
```

随后重新执行：

```bash
telnet 127.0.0.1 6379
```

连接恢复正常。

### 8. redis 密码问题

虽然上面解决了 redis 的访问问题，但是客户端又开始报错 “redis.exceptions.ResponseError: AUTH <password> called without any password configured for the default user. Are you sure your configuration is correct?”

这个问题麻烦就看出来，是因为客户端在使用密码连接 Redis，但是 Redis 根本没有密码，所以进一步解决这个问题。关于这个密码配置丢失的问题就不展开记录了，反正就是保证 Redis 有密码就行了。

## 📌 根本原因

由于 Redis 配置文件中的 requirepass 丢失，服务启动后无密码保护，多个客户端错误配置依旧尝试带密码连接 Redis，导致 Redis 拒绝连接。大量连接反复建立失败，系统产生了异常多的 TIME_WAIT 状态连接，最终导致本地临时端口枯竭，引发 EADDRNOTAVAIL 错误。

🔧 最终解决

内核参数优化（推荐配置）

编辑 /etc/sysctl.conf 添加以下内容：

```ini
# 开启 TIME_WAIT socket 的重用
net.ipv4.tcp_tw_reuse = 1

# 禁用 recycle，避免与内网穿透、Tailscale 冲突
net.ipv4.tcp_tw_recycle = 0

# 缩短 TCP 连接生命周期，释放系统资源
net.ipv4.tcp_fin_timeout = 10
```

使其生效：

```bash
sysctl -p
```

## 🧠 教训总结

本次故障复盘：

| 项目       | 内容                                                                 |
|------------|----------------------------------------------------------------------|
| 故障表现   | `telnet 127.0.0.1 6379` 报错 `Cannot assign requested address`       |
| 根本原因   | Redis 无密码导致客户端频繁连接失败，`TIME_WAIT` 累积过多             |
| 解决方案   | 设置 `tcp_tw_reuse=1`、缩短 `tcp_fin_timeout`                         |



这次故障之所以我需要记录，是因为现象让我不能理解，毕竟从端口监听可以明确看到 redis 是启动了并正常监听 127.0.0.1:6379 的，而且通过检查网络请求也可以访问其他服务的端口，此时就排除了网络问题，并且使用 localhost:6379 也可以访问Redis，说明服务也是正常，那就出现了奇怪的现象，只有 127.0.0.1:6379 不能访问，所以到这里我就非常不理解。

当然，本次的问题排查和解决的功臣依然是 ChatGPT，虽然整个过程也花费了一个多小时，但是从结果上看还是很高效的，真的无法想象以前没有 ChatGPT 的日子我们这种运维过的是什么苦日子。