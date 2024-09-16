# rsync 实时同步方案

最近公司项目有个需求是需要在主环境和灾备环境中进行目录文件实时同步，对于文件同步这种需求，第一个想到的工具自然就是rsync了，而这次的同步跟以往不同的是需要进行实时同步，所以就需要提供一个完整的实现方案，本文记录一下这个方案。

## 需求

现在有两个服务器，源服务器IP为192.168.0.201，目标服务器的IP为192.168.0.204，现在的要求是需要实时地将源服务器的目录A中的文件同步到目标服务器的目录B中，并且要保持目录中文件的属主和属性一致。

**源服务器**：192.168.0.201，目录A

**目标服务器**：192.168.0.204，目录B

## 方案

本方案使用的就是rsync 守护进程模式，利用`rsync`+`inotify-tools`就可以实现远程实时同步。具体的思路就是在目标服务器上开启rsync 守护进程，然后在源服务器上启用`inotify-tools`的文件变动监听功能，只要源目录中文件有变动就自动进行rsync同步，也就是实现了实时同步。

这里需要在源服务器上安装`rsync`+`inotify-tools`，在目标服务器只需要安装`rsync`即可，并且需要提前开通源服务器到目标服务器的873端口的网络策略。

### 目标服务器配置

以下全部操作在目标服务器192.168.0.204上执行。

目标服务器需要配置rsync 守护进程，配置这个需要启动一个监听端口，默认是873，所以需要提前开通原服务器到目标服务器的873端口的网络策略。

#### 1. 安装rsync

```bash
yum install rsync
```

#### 2. 编辑配置文件/etc/rsyncd.conf

安装了rsync就自带这个文件，只需要进行编辑即可,让其工作在守护进程模式

```bash
uid = root
gid = root
use chroot = yes
max connections = 200
pid file = /var/run/rsyncd.pid
lock file = /var/run/rsync.lock
log file = /var/log/rsync.log

[easy_core_org]
path = /opt/easy_core_org
comment = sync easy_core data
read only = no
list = yes
hosts allow = 192.168.0.201,192.168.0.203
secrets file = /etc/rsync.pass
```

#### 3. 创建密码文件/etc/rsync.pass


创建一个/etc/rsync.pass文件，在其中设置一个密码，并将文件权限改成600

```bash
chmod 600 /etc/rsync.pass
```

#### 4. 启动daemon模式

手动启动守护进程：

```bash
rsync --daemon --config=/etc/rsyncd.conf
```

此时可以看到本地监听了873端口。

至此，目标服务器的配置完成。

#### 5. 将 rsync 设置成系统服务

手动设置成守护进程还不够，为了保证虚拟机重启服务也能正常启动，可以设置成系统服务。创建系统服务文件 /etc/systemd/system/rsyncd.service 内容如下：

```ini
[Unit]  
Description=rsync daemon  

[Service]  
Type=forking  
ExecStart=/usr/bin/rsync --daemon --config=/etc/rsyncd.conf  
Restart=always  

[Install]  
WantedBy=multi-user.target
```

然后执行服务启动：

```shell
sudo systemctl daemon-reload
sudo systemctl enable rsyncd
sudo systemctl start rsyncd
sudo systemctl status rsyncd
```

### 源服务器配置

#### 1. 安装rsync和inotify-tools

```bash
yum install rsync
yum install inotify-tools
```

#### 2. 创建认证密码文件

跟目标服务器上创建的/etc/rsync.pass一样，创建一个/etc/rsync.pass文件，在其中设置一个密码，密码跟目标服务器上面配置的一样，并将文件权限改成600

```bash
chmod 600 /etc/rsync.pass
```

#### 3. 查看服务器内核是否支持inotify

如果有这三个max开头的文件则表示服务器内核支持inotify

```bash
[root@home-201 opt]# ll /proc/sys/fs/inotify/
total 0
-rw-r--r--. 1 root root 0 Oct 24 09:32 max_queued_events
-rw-r--r--. 1 root root 0 Oct 24 09:32 max_user_instances
-rw-r--r--. 1 root root 0 Oct 24 09:32 max_user_watches
```

#### 4. 手动执行同步命令

手动执行同步命令，验证rsync配置是否正确

```bash
rsync -avz --delete --password-file=/etc/rsync.pass /opt/easy_core_org/ admin@192.168.0.204::easy_core_org/
```

####  5. 使用实时同步脚本

先创建一个日志目录/var/log/rsync/ 并设置权限可读写，然后创建一个同步脚本放到可以执行目录即可，名称随意，比如/opt/rsync_easy_core.sh，并设置脚本的可执行权限，

```bash
mkdir /var/log/rsync/
chmod 755 /var/log/rsync/
chmod 700 /opt/rsync_easy_core.sh
```

```bash
#!/bin/bash

SOURCE_DIR="/opt/easy_core_org"
DESTINATION_DIR="admin@192.168.0.204::easy_core_org"
PASSWORD_FILE="/etc/rsync.pass"

while inotifywait -r -e modify,create,delete,move $SOURCE_DIR; do
    rsync -avz --delete --password-file="$PASSWORD_FILE" $SOURCE_DIR/ $DESTINATION_DIR/ >>/var/log/rsync_easy_core.log.`date +"%Y%m%d"` 2>&1
done
```

####  6. 将同步脚本设置成系统服务

由于是实时同步，所以肯定不能让同步脚本停了，这里可以将同步脚本设置成系统服务去运行和管理，这样重启服务器也能自动执行。

编辑服务配置文件/etc/systemd/system/rsync-sync.service

```bash
[Unit]
Description=Sync Service for easy_core data

[Service]
Type=simple
ExecStart=/opt/rsync_easy_core.sh  # 指向您的同步脚本的实际路径，注意：脚本必须有可执行权限，不然服务会失败
Restart=always

[Install]
WantedBy=multi-user.target

```

然后重新加载配置，并启动服务，设置成开机自启动等操作

```bash
sudo systemctl daemon-reload
sudo systemctl enable rsync-sync
sudo systemctl start rsync-sync

# 停止操作
sudo systemctl stop rsync-sync
sudo systemctl disable rsync-sync

```


## 参考文档

- [rsync的介绍和配置](https://www.cnblogs.com/leixixi/p/14751914.html)
- [rsync常见问题及解决办法](https://www.cnblogs.com/faithfu/p/11978279.html)
- [rsync 用法教程](https://www.ruanyifeng.com/blog/2020/08/rsync.html)