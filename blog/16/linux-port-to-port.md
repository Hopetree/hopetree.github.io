# Linux 端口转发的几种方法

很多情况下，由于网络隔离或者防火墙的原因，我们无法直接访问某个服务器的IP或者端口，这个时候，我们就可以使用端口转发的功能间接访问目标服务器，这篇文章就记录一些我从网上看到的并且实际操作过的方案。

首先说一个比较具体的案例：我有两个服务器，分别是服务器A（服务器A实际上有两个内网IP，一个可以跟服务器B连接的192.168.0.203，一个可以被我本地连接的100.104.64.100）和服务器B，但是我本机只能访问服务器A，而服务器A能直接访问服务器B，我本地无法直接访问服务器B。我需要在服务器A上面配置端口转发，实现我本地可以间接访问服务器B的需求。

![](https://cdn.jsdelivr.net/gh/Hopetree/blog-img@main/2023/10/port2port.png)

如上图所示，服务器B上面有一个服务监听的端口是8080，此时我需要在服务器A上面启动一个监听端口为18080，当我访问服务器A的这个端口的时候会转发到服务器B。

## ssh 端口转发

**步骤1**：首先在服务器B上面执行一个端口转发命令，将服务器B的端口8080映射到服务器A（使用A的其中一个内网IP，也就是能被服务器B访问的那个）的18080上面：

```bash
ssh -NfR 18080:localhost:8080 root@192.168.0.203
```

此时需要输入服务器A的密码，然后就可以去服务器A上面查看，已经监听了18080端口了

```bash
[root@home-203 ~]# netstat -nplt
Active Internet connections (only servers)
Proto Recv-Q Send-Q Local Address           Foreign Address         State       PID/Program name    
tcp        0      0 0.0.0.0:80              0.0.0.0:*               LISTEN      1054/nginx: master  
tcp        0      0 0.0.0.0:22              0.0.0.0:*               LISTEN      29583/sshd          
tcp        0      0 127.0.0.1:25            0.0.0.0:*               LISTEN      1314/master         
tcp        0      0 127.0.0.1:18080         0.0.0.0:*               LISTEN      12801/sshd: root         
tcp6       0      0 :::22                   :::*                    LISTEN      29583/sshd          
tcp6       0      0 ::1:25                  :::*                    LISTEN      1314/master         
tcp6       0      0 ::1:18080               :::*                    LISTEN      12801/sshd: root    
```

但是，这里可以明显看到，服务器A虽然监听了18080端口，但是使用的是127.0.0.1去监听的，所以这个时候使用其他机器是无法访问服务器A的18080的，所以这个事情还没完。。。

**步骤2**：此时登录到服务器A上面执行本地端口转发命令，将本机的18080端口转发到本机的局域网IP地址（100.104.64.100）上面：

```bash
ssh -N -f -L 100.104.64.100:18080:127.0.0.1:18080 root@100.104.64.100
```

执行完这个命令，再去查看端口情况就会发现本地已经在局域网的IP上监听了18080端口，此时同一个局域网的其他用户就可以通过服务器A来访问服务器B的服务了。

SSH参数说明：

- -N：指定这个SSH连接只进行端口消息转发，不执行任何SSH远程命令；
- -L：指定本地监听的地址和端口；
- -f: 这个SSH会话放入后台运行，不加这个参数的话，当退出当前SSH -L指定的终端时，端口转发进程就结束了，端口转发送也就结束了。所以务必要加上-f参数。

## nc 端口转发

netcat(简称nc)被誉为网络安全界的“瑞士军刀”，一个简单而有用的工具。之前介绍过这个工具可以用来检查端口监听的能力，这里介绍一种使用netcat实现端口转发的方法。

安装：yum install -y nc

使用：nc --sh-exec "nc $remote_ip $remote_port" -l $local_port  --keep-open

使用nc来实现我的需求的命令如下（在服务器A上面执行）：

```bash
nc --sh-exec "nc 192.168.0.204 8080" -l 18080  --keep-open
```

后台运行：

```bash
nc --sh-exec "nc 192.168.0.204 8080" -l 18080  --keep-open &
```

## socat 端口转发

socat 是一个多功能的网络工具，使用socat进行端口转发。

安装：yum install -y socat 

使用socat来实现我的需求的命令如下（在服务器A上面执行）：

```bash
socat TCP4-LISTEN:18080,reuseaddr,fork TCP4:192.168.0.204:8080
```

## 参考文章

- [使用SSH反向代理和端口转发](https://www.jianshu.com/p/dafbbbe4c43b)
- [Linux端口转发的九种常用方法](https://blog.csdn.net/JineD/article/details/118254041)