# 分享一些常用的更换各种“源”的经验

随着自己接触的领域越来越广，经常会遇到要配置和更换各种源的情况，比如更换 Linux 系统的系统源，使用 Python 的人需要配置 pip 源，使用 docker 的人需要配置 docker 源，使用 npm 的人也需要配置源，等等……这里我就整理了一些我用到的几个源的更换方式。

## Linux 系统源更换
生产环境基本都是使用的 Linux 系统，而无论是自己使用还是公司使用，一般都是需要更换系统源的。一般公司可能有自己的源，所以配置自己公司的源，而作为个人使用，当然最方便的是使用一些国内的开源系统源最好不过了。

由于 Linux 系统的类型比较多，而每种系统配置系统源的方式不尽相同，所以这里主要分享一下我使用的三种 Linux 系统的系统源更换方式。

### Ubuntu 系统配置源
Ubuntu 系统也分为好几个大版本，不同的版本系统源的配置信息不同，所以在使用配置源的时候需要根据自己的系统版本选择对应的版本的源。

1、首先备份一些当前的源信息

```
sudo cp /etc/apt/sources.list /etc/apt/sources.list.bak
```
2、然后配置国内的源信息即可，由于我的 Ubuntu 版本是16.04，这里是配置的阿里云 Ubuntu16.04 的源信息，内容如下：

```
deb http://mirrors.aliyun.com/ubuntu/ xenial main
deb-src http://mirrors.aliyun.com/ubuntu/ xenial main

deb http://mirrors.aliyun.com/ubuntu/ xenial-updates main
deb-src http://mirrors.aliyun.com/ubuntu/ xenial-updates main

deb http://mirrors.aliyun.com/ubuntu/ xenial universe
deb-src http://mirrors.aliyun.com/ubuntu/ xenial universe
deb http://mirrors.aliyun.com/ubuntu/ xenial-updates universe
deb-src http://mirrors.aliyun.com/ubuntu/ xenial-updates universe

deb http://mirrors.aliyun.com/ubuntu/ xenial-security main
deb-src http://mirrors.aliyun.com/ubuntu/ xenial-security main
deb http://mirrors.aliyun.com/ubuntu/ xenial-security universe
deb-src http://mirrors.aliyun.com/ubuntu/ xenial-security universe
```
3、更改了源之后最好执行一下更新

```
sudo apt-get update
```

当然，你也可以使用其他的系统源，比如清华大学的源也挺有名的 [https://mirrors.tuna.tsinghua.edu.cn/help/ubuntu/](https://mirrors.tuna.tsinghua.edu.cn/help/ubuntu/)

### CentOS 系统配置源
CentOS 也要根据自己的系统版本去配置源，这里我使用了阿里云的 CentOS 7 更换源的步骤：

1、备份当前系统源
```
sudo mv /etc/yum.repos.d/CentOS-Base.repo /etc/yum.repos.d/CentOS-Base.repo.backup
```
2、下载新的 `CentOS-Base.repo` 到 `/etc/yum.repos.d/`，这里是针对  CentOS 7 的系统源，你可以去查找其他版本的源

```shell
sudo wget -O /etc/yum.repos.d/CentOS-Base.repo http://mirrors.aliyun.com/repo/Centos-7.repo

# 也可以使用curl命令
sudo curl -o /etc/yum.repos.d/CentOS-Base.repo http://mirrors.aliyun.com/repo/Centos-7.repo
```

3、之后运行 `yum makecache` 生成缓存

### alpine 系统配置源
alpine 系统是一款非常小的 Linux 系统，多半是作为容器的镜像使用，这里分享我在制作镜像的时候使用的更换源的方式，可以直接执行 shell 命令：

```shell
# 1.先备份当前源文件
cp -a /etc/apk/repositories /etc/apk/repositories.bak

# 2.将源地址替换成阿里云的地址即可
sed -i "s@http://dl-cdn.alpinelinux.org/@https://mirrors.aliyun.com/@g" /etc/apk/repositories

# 3.更新索引
apk update
```

## pip 源更换

使用 Python 的人对 pip 应该是非常熟悉的，这是最常用的 Python 包管理工具。默认的 pip 命令安装包的源也是国外的，有时候安装依赖包会非常慢，所以一般情况是需要更换成国内源的。

由于我只使用 Windows 系统和 Linux 系统，所以只涉及过这两种系统的 pip 源更换，Mac 系统应该也是同理的，这里就不做研究了。

### Windows 系统配置源
1、首先，进入用户的根目录，在文件管理中输入 `%HOMEPATH%` 即可跳转到

2、在用户根目录中创建一个文件夹，名称是 pip

3、在 pip 目录中创建一个 pip.ini 配置文件，配置需要的源即可，比如这里分别配置的是阿里云和豆瓣的 pip 源：
```
[global]
index-url = http://mirrors.aliyun.com/pypi/simple/

[install]
trusted-host=mirrors.aliyun.com
```

```
[global]
index-url = http://pypi.douban.com/simple

[install]
trusted-host=pypi.douban.com
```

### Linux 系统配置源
Linux 系统配置 pip 源的方式跟 Windows 类似，主要的区别是文件的目录和文件名称不同。生成 Linux 系统的配置文件命令如下

```shell
mkdir -p ~/.pip
vi ~/.pip/pip.conf
```

生成了配置文件之后，配置的信息和 Windows 都是一样的，这里就不重复了。


### 命令行配置源
除了可以使用配置文件更换 pip 源以外，还可以直接在使用 `pip install` 命令的时候设置临时的源。

```shell
# 安装单个依赖库
pip install requests -i http://mirrors.aliyun.com/pypi/simple/ --trusted-host mirrors.aliyun.com

# 根据依赖文件批量安装依赖库
pip install -r requirements.txt -i http://mirrors.aliyun.com/pypi/simple/ --trusted-host mirrors.aliyun.com
```
命令中的 -i 也就是 --index-url参数，后面是用来设置 pip 源的完整地址，--trusted-host 参数是设置源的域名，这个参数可以省略，这两个参数跟配置文件中的格式一样。

### 使用 Python 脚本配置源
下面是我根据 pip 读取源配置文件的一些源码改写的一个自动化生成 pip 源配置文件的脚本，脚本在 Python3 版本运行 OK ，Python2 不行。这个脚本同时适用于 Windows 和 Linux 系统，只是都需要使用 Python3 来运行。


```
# -*- coding:utf-8 -*-
# 2018-11-20
# 创建pip的源配置文件
import os
import platform

PIP_CONFIG = '''[global]
index-url = http://mirrors.aliyun.com/pypi/simple/

[install]
trusted-host=mirrors.aliyun.com
'''

def create_file():
    file_name = get_file_path()
    dirname = os.path.dirname(file_name)
    filename = os.path.basename(file_name)
    if os.path.isfile(file_name):
        back_name = filename + '.bak'
        if os.path.isfile(os.path.join(dirname, back_name)):
            os.remove(os.path.join(dirname, back_name))
        os.rename(file_name, os.path.join(dirname, back_name))
        print('生成配置文件备份 %s' % os.path.join(dirname, back_name))
    else:
        if not os.path.isdir(dirname):
            os.mkdir(dirname)
    with open(file_name, 'w', encoding='utf-8') as f:
        f.write(PIP_CONFIG)
    print('生成配置文件 %s' % file_name)


def get_file_path():
    user_dir = expanduser('~')
    SYSTEM = platform.system()
    print('当前系统类型是 %s' % SYSTEM)
    if SYSTEM.lower() == 'windows':
        config_basename = 'pip.ini'
        legacy_storage_dir = os.path.join(user_dir, 'pip')
    else:
        config_basename = 'pip.conf'
        legacy_storage_dir = os.path.join(user_dir, '.pip')
    legacy_config_file = os.path.join(
        legacy_storage_dir,
        config_basename,
    )
    return legacy_config_file


def expanduser(path):
    expanded = os.path.expanduser(path)
    if path.startswith('~/') and expanded.startswith('//'):
        expanded = expanded[1:]
    return expanded


if __name__ == '__main__':
    create_file()
```

## Docker 源更换
容器化的 docker 默认的源也是国外的，这导致下载基础镜像的速度非常慢，所以非常有必要配置成国内的源。设置 docker 源的方式我之前关于安装 docker 的文章里面其实就分享过了，这里再一次分享一下。

1、编辑配置文件

```shell
sudo vi /etc/docker/daemon.json
```
配置国内源

```
{
 "registry-mirrors": ["https://registry.docker-cn.com"]
}
```

2、配置好源之后，重启一下 docker 服务

```shell
systemctl daemon-reload 
systemctl restart docker
```

3、确保源已经更换，可以用 `docker info` 命令来查看一下，可以看到信息的最后有如下信息即可：

```shell
Registry Mirrors:
 https://registry.docker-cn.com
```

## 开源镜像站整理

### 企业站

- 阿里云：<https://mirrors.aliyun.com>
- 网易：<http://mirrors.163.com/>
- 华为：<https://mirrors.huaweicloud.com/>
- 腾讯云：<https://mirrors.cloud.tencent.com/>

### 教育站

- 清华大学：<https://mirrors.tuna.tsinghua.edu.cn/>
- 中国科学技术大学：<http://mirrors.ustc.edu.cn/>
- 华中科技大学：<http://mirrors.hust.edu.cn/>
- 上海交通大学：<http://ftp.sjtu.edu.cn/>
- 浙江大学：<http://mirrors.zju.edu.cn/>
- 兰州大学：<http://mirror.lzu.edu.cn/>
- 重庆大学：<http://mirrors.cqu.edu.cn/>
- 大连东软信息学院：<http://mirrors.neusoft.edu.cn/>
- 大连理工大学：<http://mirror.dlut.edu.cn/>