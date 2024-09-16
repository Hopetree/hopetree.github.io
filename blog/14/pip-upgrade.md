# CentOS下使用pip安装python依赖报错的解决思路

前两天在CentOS上安装docker-compose的时候遇到了pip安装依赖报错，并且经过一番查找，也得到了解决方案，最关键的是经过这个经验，我知道了pip在python2的版本中也有一个官方指定的最后一个支持版本，这篇文章就来记录这个事情，以便后续同类报错可以少走弯路。

## 问题背景

先来看看这个问题的背景：

1. 需要在linux系统的python中安装docker-compose，也就是使用python2安装，安装的方式是pip
2. 系统的python版本是2.7.5
3. pip的版本是8.1.2

## 问题描述

当我执行 `pip install docker-compose` 安装命令的时候，报错如下：

```bash
[root@host-ip-202 ~]# pip install docker-compose -i http://mirrors.aliyun.com/pypi/simple/ --trusted-host mirrors.aliyun.com
Collecting docker-compose
  Downloading http://mirrors.aliyun.com/pypi/packages/f3/3e/ca05e486d44e38eb495ca60b8ca526b192071717387346ed1031ecf78966/docker_compose-1.29.2-py2.py3-none-any.whl (114kB)
    100% |████████████████████████████████| 122kB 5.6MB/s 
Collecting cached-property<2,>=1.2.0; python_version < "3.8" (from docker-compose)
  Downloading http://mirrors.aliyun.com/pypi/packages/48/19/f2090f7dad41e225c7f2326e4cfe6fff49e57dedb5b53636c9551f86b069/cached_property-1.5.2-py2.py3-none-any.whl
Requirement already satisfied (use --upgrade to upgrade): backports.ssl-match-hostname<4,>=3.5; python_version < "3.5" in /usr/lib/python2.7/site-packages (from docker-compose)
Collecting distro<2,>=1.5.0 (from docker-compose)
  Downloading http://mirrors.aliyun.com/pypi/packages/4b/89/eaa3a3587ebf8bed93e45aa79be8c2af77d50790d15b53f6dfc85b57f398/distro-1.8.0.tar.gz (59kB)
    100% |████████████████████████████████| 61kB 4.9MB/s 
    Complete output from command python setup.py egg_info:
    Traceback (most recent call last):
      File "<string>", line 1, in <module>
    IOError: [Errno 2] No such file or directory: '/tmp/pip-build-FGvUoJ/distro/setup.py'
    
    ----------------------------------------
Command "python setup.py egg_info" failed with error code 1 in /tmp/pip-build-FGvUoJ/distro/
You are using pip version 8.1.2, however version 23.2.1 is available.
You should consider upgrading via the 'pip install --upgrade pip' command.
```

这里大概的意思是说安装 `distro` 的时候找不到 `setup.py` 文件，然后我在stackoverflow上找到了类似报错的原因和处理方式，看回答里面是提供了两个方案，第一个方案是直接去下载相关包的whl文件进行安装，这个回答也得到了提问者的肯定，想必是方案可行，第二个方案是让升级pip的版本然后再去安装依赖，我就是采用这个方案。

于是，我先准备升级pip，根据上面的提示执行升级命令：

```bash
pip install --upgrade pip
```

发现又报错了:

```bash
[root@host-ip-202 ~]# pip install --upgrade pip
Collecting pip
  Downloading https://files.pythonhosted.org/packages/ba/19/e63fb4e0d20e48bd2167bb7e857abc0e21679e24805ba921a224df8977c0/pip-23.2.1.tar.gz (2.1MB)
    100% |████████████████████████████████| 2.1MB 234kB/s 
    Complete output from command python setup.py egg_info:
    Traceback (most recent call last):
      File "<string>", line 1, in <module>
      File "/tmp/pip-build-bGHpDG/pip/setup.py", line 7
        def read(rel_path: str) -> str:
                         ^
    SyntaxError: invalid syntax
    
    ----------------------------------------
Command "python setup.py egg_info" failed with error code 1 in /tmp/pip-build-bGHpDG/pip/
You are using pip version 8.1.2, however version 23.2.1 is available.
You should consider upgrading via the 'pip install --upgrade pip' command.
```

然后经过一番查找，我终于知道了原因，是因为pip的版本对于python2有一个最终版本，就是20.3，也就是说python2不能安装超过这个版本的pip，所以提示里面的23.2.1其实是pip的最新版，但是并不适用python2，此时应该在升级pip的时候指定版本才行，如是我执行了如下命令：

```bash
pip install --upgrade pip==20.3
```

执行之后成功升级pip到20.3，此时重新执行docker-compose的安装命令，发现也不再报错了，问题成功解决。

## 总结

CentOS自带的python2的版本和安装的pip版本都比较低，当适用低版本的pip安装第三方库的时候，可能导致安装包编译失败，此时可以优先升级pip版本到比较高的版本，但是需要指定具体的版本，因为pip最新版不支持python2，推荐的pip版本是20.3，升级pip到高版本之后，可以避免一些第三方库的安装报错。

## 参考文档

- [pip install FileNotFoundError: [Errno 2] No such file or directory:](https://stackoverflow.com/questions/51405580/pip-install-filenotfounderror-errno-2-no-such-file-or-directory)
- [Python 2 Support](https://pip.pypa.io/en/latest/development/release-process/#python-2-support)