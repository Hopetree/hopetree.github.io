# 检查服务器端口连通性的几种方法

在日常运维工作中，经常会需要检查本机或者其他服务器的端口开放情况，虽然自己本身也会几个基本的查看端口连通性的命令，但是也会遇到某些服务器上面没有安装自己会的工具，所以收集了一些可以用来检测端口连通性的命令工具。

## 查看本机监听端口

### netstat


安装：yum -y install net-tools

使用：netstat -nplt

```bash
[zero@hopetree ~]$ netstat -nplt
(Not all processes could be identified, non-owned process info
 will not be shown, you would have to be root to see it all.)
Active Internet connections (only servers)
Proto Recv-Q Send-Q Local Address           Foreign Address         State       PID/Program name    
tcp        0      0 0.0.0.0:8888            0.0.0.0:*               LISTEN      -                   
tcp        0      0 127.0.0.1:25            0.0.0.0:*               LISTEN      -                   
tcp        0      0 0.0.0.0:443             0.0.0.0:*               LISTEN      -                   
tcp        0      0 0.0.0.0:5700            0.0.0.0:*               LISTEN      -                   
tcp        0      0 0.0.0.0:6789            0.0.0.0:*               LISTEN      -                   
tcp        0      0 0.0.0.0:8080            0.0.0.0:*               LISTEN      -                   
tcp        0      0 0.0.0.0:80              0.0.0.0:*               LISTEN      -                   
tcp        0      0 0.0.0.0:9527            0.0.0.0:*               LISTEN      -                   
tcp6       0      0 :::8888                 :::*                    LISTEN      -                   
tcp6       0      0 ::1:25                  :::*                    LISTEN      -                   
tcp6       0      0 :::5700                 :::*                    LISTEN      -                   
tcp6       0      0 :::6789                 :::*                    LISTEN      -                   
tcp6       0      0 :::8080                 :::*                    LISTEN      -                   
tcp6       0      0 :::80                   :::*                    LISTEN      - 
```

### ss

ss 命令是 netstat 命令的替代品，而且更加优秀。ss 执行的时候消耗资源以及消耗的时间都比netstat少很多。ss 的优势在于它能够显示更多更详细的有关 TCP 和连接状态的信息，而且比 netstat 更快速更高效。

使用: ss -nplt

```bash
[zero@hopetree ~]$ ss -nplt
State      Recv-Q Send-Q            Local Address:Port                           Peer Address:Port              
LISTEN     0      128                           *:8888                                      *:*                  
LISTEN     0      100                   127.0.0.1:25                                        *:*                  
LISTEN     0      128                           *:443                                       *:*                  
LISTEN     0      128                           *:5700                                      *:*                  
LISTEN     0      128                           *:6789                                      *:*                  
LISTEN     0      128                           *:8080                                      *:*                  
LISTEN     0      128                           *:80                                        *:*                  
LISTEN     0      128                           *:9527                                      *:*                  
LISTEN     0      128                        [::]:8888                                   [::]:*                  
LISTEN     0      100                       [::1]:25                                     [::]:*                  
LISTEN     0      128                        [::]:5700                                   [::]:*                  
LISTEN     0      128                        [::]:6789                                   [::]:*                  
LISTEN     0      128                        [::]:8080                                   [::]:*                  
LISTEN     0      128                        [::]:80                                     [::]:*   
```

## 检查服务器端口连通性

### telnet

telnet 在windows电脑不可用的时候需要开启服务，具体方式参考：[Windows10系统开启telnet功能](https://www.cnblogs.com/miracle-luna/p/15947184.html "Windows10系统开启telnet功能")

安装：yum install -y telnet-server & yum install -y telnet

使用：telnet ip port

端口通的回显：

```bash
[root@hopetree zero]# telnet 172.17.120.246 443
Trying 172.17.120.246...
Connected to 172.17.120.246.
Escape character is '^]'.
```

端口不通的回显：

```bash
[root@hopetree zero]# telnet 172.17.120.246 1234
Trying 172.17.120.246...
telnet: connect to address 172.17.120.246: Connection refused
```

### ssh

ssh 命令一般用于登录服务器，也可以作为端口连通性的检查。

使用：ssh -v -p port ip

端口通的回显(关键信息是 debug1: Connection established.)：

```bash
[root@hopetree zero]# ssh -v -p 443 172.17.120.246
OpenSSH_7.4p1, OpenSSL 1.0.2k-fips  26 Jan 2017
debug1: Reading configuration data /etc/ssh/ssh_config
debug1: /etc/ssh/ssh_config line 58: Applying options for *
debug1: Connecting to 172.17.120.246 [172.17.120.246] port 443.
debug1: Connection established.
debug1: permanently_set_uid: 0/0
debug1: identity file /root/.ssh/id_rsa type 1
debug1: key_load_public: No such file or directory
debug1: identity file /root/.ssh/id_rsa-cert type -1
debug1: key_load_public: No such file or directory
debug1: identity file /root/.ssh/id_dsa type -1
debug1: key_load_public: No such file or directory
debug1: identity file /root/.ssh/id_dsa-cert type -1
debug1: key_load_public: No such file or directory
debug1: identity file /root/.ssh/id_ecdsa type -1
debug1: key_load_public: No such file or directory
debug1: identity file /root/.ssh/id_ecdsa-cert type -1
debug1: key_load_public: No such file or directory
debug1: identity file /root/.ssh/id_ed25519 type -1
debug1: key_load_public: No such file or directory
debug1: identity file /root/.ssh/id_ed25519-cert type -1
debug1: Enabling compatibility mode for protocol 2.0
debug1: Local version string SSH-2.0-OpenSSH_7.4
debug1: ssh_exchange_identification: HTTP/1.1 400 Bad Request
```

端口不通的回显：

```bash
[root@hopetree zero]# ssh -v -p 1234 172.17.120.246
OpenSSH_7.4p1, OpenSSL 1.0.2k-fips  26 Jan 2017
debug1: Reading configuration data /etc/ssh/ssh_config
debug1: /etc/ssh/ssh_config line 58: Applying options for *
debug1: Connecting to 172.17.120.246 [172.17.120.246] port 1234.
debug1: connect to address 172.17.120.246 port 1234: Connection refused
ssh: connect to host 172.17.120.246 port 1234: Connection refused
```

### curl

curl 一般情况下用来进行请求，实际上也可以检测端口是否能通.

使用：curl ip:port

端口通的回显

```bash
[zero@hopetree ~]$ curl 172.17.120.246:443
<html>
<head><title>400 The plain HTTP request was sent to HTTPS port</title></head>
<body>
<center><h1>400 Bad Request</h1></center>
<center>The plain HTTP request was sent to HTTPS port</center>
<hr><center>nginx/1.20.1</center>
</body>
</html>
```

端口不通的回显：

```bash
[zero@hopetree ~]$ curl 172.17.120.246:1234
curl: (7) Failed connect to 172.17.120.246:1234; Connection refused
```

### wget

安装：yum install -y wget

使用 ：wget ip:port

端口通的回显：

```bash
[zero@hopetree ~]$ wget 172.17.120.246:443
--2022-04-13 14:35:48--  http://172.17.120.246:443/
Connecting to 172.17.120.246:443... connected.
HTTP request sent, awaiting response... 400 Bad Request
2022-04-13 14:35:48 ERROR 400: Bad Request.
```
端口不通的回显：

```text
[zero@hopetree ~]$ wget 172.17.120.246:1234
--2022-04-13 14:36:29--  http://172.17.120.246:1234/
Connecting to 172.17.120.246:1234... failed: Connection refused.
```

### nc

nc命令 全称netcat，用于设置路由器。它能通过 TCP 和 UDP 在网络中读写数据。通过与其他工具结合和重定向，你可以在脚本中以多种方式使用它。使用 netcat 命令所能完成的事情令人惊讶。

安装：yum install -y nc

使用：nc -vz ip port

端口通的回显:

```bash
[zero@hopetree ~]$ nc -vz 172.17.120.246 443
Ncat: Version 7.50 ( https://nmap.org/ncat )
Ncat: Connected to 172.17.120.246:443.
Ncat: 0 bytes sent, 0 bytes received in 0.01 seconds.
```
端口不通的回显：

```bash
[zero@hopetree ~]$ nc -vz 172.17.120.246 1234
Ncat: Version 7.50 ( https://nmap.org/ncat )
Ncat: Connection refused.
```

### nmap

安装：yum install -y nmap

使用：nmap -p port ip

端口通的回显:

```bash
[zero@hopetree ~]$ nmap -p 443 172.17.120.246

Starting Nmap 6.40 ( http://nmap.org ) at 2022-04-13 14:46 CST
Nmap scan report for iZwz91obh1cwf52kgsc0fgZ (172.17.120.246)
Host is up (0.000054s latency).
PORT    STATE SERVICE
443/tcp open  https

Nmap done: 1 IP address (1 host up) scanned in 0.03 seconds
```

端口不通的回显：

```bash
[zero@hopetree ~]$ nmap -p 1234 172.17.120.246

Starting Nmap 6.40 ( http://nmap.org ) at 2022-04-13 14:46 CST
Nmap scan report for iZwz91obh1cwf52kgsc0fgZ (172.17.120.246)
Host is up (0.000066s latency).
PORT     STATE  SERVICE
1234/tcp closed hotline

Nmap done: 1 IP address (1 host up) scanned in 0.03 seconds
```