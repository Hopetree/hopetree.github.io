# Python 进行 SSH 操作，实现本地与服务器的链接，进行文件的上传和下载

我本地和服务器的连接一直使用的是 Xshell 5，而在与服务器进行文件操作的时候使用的是 Xshell 推荐安装的一个工具 Xftp 5，然而，昨天自己想着从服务器下载备份好的的数据库文件到本地的时候发现这个文件传输工具居然过期不能用了，好气啊！于是没办法（机智如我）只好用 Python 来实现 SSH 的连接，顺便从服务器批量下载一些文件，实现自动化。

## 项目介绍

### SSH 使用的库
首先需要介绍一个 Python 实现 SSH 连接的第三方库，名字叫做 `paramiko`，经过一个短暂的熟悉，我发现这个库基本可以实现 SSH 连接中的一些常用方法，具体使用可以去看一些教程或者官方文档。

我还是比较喜欢从实际的应用出发来加深对一些新接触的第三方库的认知，所以有了这篇文章中涉及到的实际应用案例。

### 脚本思路
首先来介绍一下我这个简单的自动化脚本做的事情（由于想实现的事情比较单一且固定，所以直接写成了几个函数，写的比较随意）：

1. 首先创建一个配置文件，用来存放登录服务器的一些参数，例如服务器 host，端口 port，用户名称和密码等。
2. 读取配置文件的信息，返回一个字典以备后续调用
3. 使用 SSH 链接服务器，并且执行几个 shell 命令，返回需要下载的文件的绝对地址列表
4. 连接 SFTP 批量下载文件到本地

## 源码解读
### 源码展示

```python
# -*- coding: utf-8 -*-
import paramiko
import os
from configparser import ConfigParser


# 读取配置文件获取服务器的登录信息
def read_ini():
    info = dict()
    cf = ConfigParser()
    cf.read('config.ini', encoding='utf-8')
    keys = cf.options('ssh')
    for each in keys:
        info[each] = cf.get('ssh', each)
    print(info)
    return info


# 连接服务区并执行shell命令返回输出结果
def ssh_test(host, port, username, password):
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    # 连接服务器
    try:
        ssh.connect(hostname=host, port=port, username=username, password=password)
    except Exception as e:
        print(e)
        return

    # 设置一个内部函数，执行shell命令并返回输出结果
    def run_shell(cmd):
        ssh_in, ssh_out, ssh_error = ssh.exec_command(cmd)
        result = ssh_out.read() or ssh_error.read()
        return result.decode().strip()

    # 获取指定文件夹的绝对地址
    cmd_get_path = 'cd dbs;pwd'
    db_path = run_shell(cmd_get_path)

    # 获取指定文件夹中文件的名称，并跟上面得到的文件夹绝对地址组合起来
    cmd_get_sqls = 'cd dbs;ls'
    sqls = run_shell(cmd_get_sqls)
    lis = ['{}/{}'.format(db_path, each) for each in sqls.split('\n')]
    print(lis)

    # 关闭连接
    ssh.close()
    return lis


# 链接服务器进行文件传输
def sftp_test(host, port, username, password, from_file, to_file):
    transport = paramiko.Transport((host, port))
    try:
        transport.connect(username=username, password=password)
    except Exception as e:
        print(e)
        return
    sftp = paramiko.SFTPClient.from_transport(transport)

    # 将文件下载到本地，如果是上传使用 put
    sftp.get(from_file, to_file)
    transport.close()


if __name__ == '__main__':
    info = read_ini()
    h = info.get('host', None)
    p = int(info.get('port', None)) # 端口是int类型
    u = info.get('username', None)
    pw = info.get('password', None)
    files = ssh_test(h, p, u, pw)

    path = 'F:\\dbs'
    if files:
        for each in files:
            name = each.split('/')[-1]
            ss = sftp_test(h, p, u, pw, each, os.path.join(path, name))

```
### 配置文件读取
首先，配置文件是放在跟脚本同目录下的，文件名称为 config.ini，配置的信息格式遵循一般的配置文件的格式，如下：

```bash
[ssh]
host=119.23.106.34
port=22
username=user
password=password
```
只需要提供以上四个信息就可以连接到服务器。

读取配置信息的方式是函数 `read_ini()`，这个函数使用 Python 内置的库 `configparser` 去读取配置文件，并且返回一个键值对的字典，以供后续的函数调用。

```python
def read_ini():
    info = dict()
    cf = ConfigParser()
    cf.read('config.ini', encoding='utf-8')
    keys = cf.options('ssh')
    for each in keys:
        info[each] = cf.get('ssh', each)
    print(info)
    return info
```

### SSH 连接执行
`ssh_test` 函数是用来连接 SSH 的方法，这个方法接受4个参数，也就是上面的配置文件需要提供的参数。

首先需要创建一个 ssh 连接的实例：

```python
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
```
然后传入相关参数，尝试连接到远程服务器：

```python
try:
    ssh.connect(hostname=host, port=port, username=username, password=password)
except Exception as e:
    print(e)
    return
```
当服务器已经连接成功之后，可以进行 shell 命令的操作了，我把这个执行 shell 命令的操作过程写到一个内嵌的函数中，这样可以方便执行不同的命令：

```python
def run_shell(cmd):
    ssh_in, ssh_out, ssh_error = ssh.exec_command(cmd)
    result = ssh_out.read() or ssh_error.read()
    return result.decode().strip()
```
ssh.exec_command(cmd) 会得到三个对象，其中第二个就是命令执行成功的结果，第三个是命令执行失败的结果，所以我们可以取第二个的结果作为命令执行成功返回的结果，结果需要转码，并且要去掉末尾的换行符。

这里我首先执行了一条 shell 命令，多个命令直接需要使用分号隔开，这个命令是返回当前文件夹的绝对地址：

```python
cmd_get_path = 'cd dbs;pwd'
```
命令执行的结果放到一个变量中保存，后续需要调用：

```python
db_path = run_shell(cmd_get_path)
```
然后第二条 shell 命令是返回指定文件夹下的所有文件，我这里是返回的自己的服务器上面数据库备份的文件，通过看代码就能看到我这里处理了一下文件名称，让它们变成了绝对地址，这样方便后续下载文件。

最后这个函数返回的就是一个服务器上面的文件夹中包含的所有文件的绝对地址组成的列表。

### SFTP 下载文件
下载文件的操作写在函数 `sftp_test()` 中，这个函数除了要传递登录服务器的4个基本参数外，还要传递2个参数，第一个是服务器上面的文件的绝对地址，第二个是本地保存的文件的地址（相对地址和绝对地址都行）。

看代码，这里和连接 SSH 有一些区别，不过大体的思路一样，都是先创建实例，然后尝试连接：

```python
transport = paramiko.Transport((host, port))
try:
    transport.connect(username=username, password=password)
except Exception as e:
    print(e)
    return
sftp = paramiko.SFTPClient.from_transport(transport)
```
连接之后，就可以使用 `get()` 方法来下载文件了，如果要上传的话，可以使用与之对应的 `put()` 方法：

```python
sftp.get(from_file, to_file)
```

### 执行代码
最后执行代码的过程其实就是之前讲到的项目思路，首先运行配置文件读取的函数，读取配置：

```python
info = read_ini()
h = info.get('host', None)
p = int(info.get('port', None)) # 端口是int类型
u = info.get('username', None)
pw = info.get('password', None)
```
这里需要注意，由于端口接受的是一个 int 类型，而在配置中是字符串，所有需要转换一下才能使用，不然就会报错。

读取了配置就可以连接 SSH 然后返回文件的绝对地址：

```python
files = ssh_test(h, p, u, pw)
```
最后使用循环来分别下载每个文件到本地保存即可：

```python
path = 'F:\\dbs'
if files:
    for each in files:
        name = each.split('/')[-1]
        ss = sftp_test(h, p, u, pw, each, os.path.join(path, name))
```

总结：使用 Python 连接服务器进行操作在运维自动化中应该使用会比较多，这篇文章主要是通过一个实例来介绍一下 Python 连接 SSH 之后的基本操作，还有更多的操作有待读者自己去学习和实战。