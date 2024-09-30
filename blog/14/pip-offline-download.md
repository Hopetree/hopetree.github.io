# 使用pip下载python依赖包whl文件并进行离线安装

公司项目原因，经常需要到客户现场配置python开发环境，而客户现场提供的开发环境（Windows桌面）基本都是内网环境，无法访问公网，因此要安装python环境都是需要离线安装。为了能将离线搭建开发环境标准化，本文分享一下如何使用pip下载离线安装库whl文件，以及如何离线安装whl文件的经验。

## 场景描述

具体的场景是需要在一个内网Windows系统上面离线安装python2.7，并安装相关依赖，比如最基本的requets库。因此需要提前准备好python2.7的安装包，以及依赖库的离线安装包（whl文件）。

这个场景需要解决的几个重点如下：

1. 需要提前准备好离线依赖包的whl文件，并且要根据库直接的依赖关系下载所有依赖包，比如要安装requests包，则不仅仅要下载requests的whl文件，还要下载requests依赖的几个包文件
2. 下载的whl文件需要匹配开发环境的系统和python版本，如这里的windows x86,python2.7，所以下载的包必须能在这个系统架构上面安装才行

下面我会分别举例在本地为Windows系统环境和MacOS系统的情况下如何准备上述的离线安装包。

## 重新认识pip命令

让我们重现来认识一下pip的常用命令及其功能：

|命令|命令解释|功能描述|
|--|--|--|
|install|Install packages|在线或离线安装依赖包|
|download|Download packages|下载离线依赖包|
|uninstall|Uninstall packages|卸载依赖包|
|freeze|Output installed packages in requirements format|将已经安装的依赖包输出到文件|
|list|List installed packages|显示当前环境已经安装的依赖包|
|show|Show information about installed packages|显示已经安装的依赖包的详细信息，如版本、依赖库、被依赖库等|
|wheel|Build wheels from your requirements|构建适配当前环境的离线依赖包|

### install 离线安装包

当已经准备好离线包之后，可以使用install安装离线包，如下是安装指定库的例子：

```shell
python -m pip install --no-index --find-links=".\packages" requests
```

上面这个命令可以安装requests库，并且会自动到packages目录中查找依赖包进行安装。

```shell
python -m pip install --no-index --find-links=".\packages" -r requirements.txt
```

上面这个命令根据requirements.txt去安装所有库，前提是packages中包含所有库的whl文件。

### show 的用法

show命令可以显示已经安装的包的相关信息，比如版本、安装位置、依赖项、被依赖项等

```shell
D:\python_env> python -m pip show Flask   
Name: Flask
Version: 1.1.4
Summary: A simple framework for building complex web applications.
Home-page: https://palletsprojects.com/p/flask/
Author: Armin Ronacher
Author-email: armin.ronacher@active-4.com
License: BSD-3-Clause
Location: /Library/Frameworks/Python.framework/Versions/2.7/lib/python2.7/site-packages
Requires: click, itsdangerous, Jinja2, Werkzeug
Required-by: 

```

如上例子，可以看到要安装`Flask`包则需要先安装`click`, `itsdangerous`, `Jinja2`, `Werkzeug`这几个包。也就是说，当我们想要知道某个安装包的依赖关系的时候，可以使用show这个命令来查看。

### wheel 的用法

wheel 命令可以构建已经安装包的whl文件，通熟来说就是将本地已经安装的包构建成可以离线安装的whl文件。

看一个例子：

```bash
[root@ops-host zero]# python -m pip wheel requests
DEPRECATION: Python 2.7 reached the end of its life on January 1st, 2020. Please upgrade your Python as Python 2.7 is no longer maintained. pip 21.0 will drop support for Python 2.7 in January 2021. More details about Python 2 support in pip can be found at https://pip.pypa.io/en/latest/development/release-process/#python-2-support pip 21.0 will remove support for this functionality.
Collecting requests
  File was already downloaded /root/zero/requests-2.27.1-py2.py3-none-any.whl
Collecting idna<3,>=2.5; python_version < "3"
  File was already downloaded /root/zero/idna-2.10-py2.py3-none-any.whl
Collecting certifi>=2017.4.17
  File was already downloaded /root/zero/certifi-2021.10.8-py2.py3-none-any.whl
Collecting chardet<5,>=3.0.2; python_version < "3"
  File was already downloaded /root/zero/chardet-4.0.0-py2.py3-none-any.whl
Collecting urllib3<1.27,>=1.21.1
  File was already downloaded /root/zero/urllib3-1.26.16-py2.py3-none-any.whl
```
上面的命令就是生成requests包需要的离线包，这些就可以拷贝到其他平台进行离线安装。

值得注意的是：由于是将本地的安装包生成的whl文件，所以这些whl文件是适配当前的系统和python版本的，也就是说离线包可能不适配其他系统。所以如果是同类型的系统和python版本的环境，使用这个方式导出包是一个比较好的选择。

### download 的用法

download 命令跟 wheel 命令的作用有点类似，都是可以生成whl文件，不同之处是download 命令采用的是下载的方式，也就是直接从pip源去下载需要的依赖包。

让我们看一个例子：

```bash
[root@ops-host zero]# pip download --only-binary=:all: --platform=win_amd64 --python-version=2.7 -d pk requests -i http://mirrors.aliyun.com/pypi/simple/ --trusted-host mirrors.aliyun.com
Looking in indexes: http://mirrors.aliyun.com/pypi/simple/
Collecting requests
  Downloading http://mirrors.aliyun.com/pypi/packages/2d/61/08076519c80041bc0ffa1a8af0cbd3bf3e2b62af10435d269a9d0f40564d/requests-2.27.1-py2.py3-none-any.whl (63 kB)
     |████████████████████████████████| 63 kB 636 kB/s             
  Downloading http://mirrors.aliyun.com/pypi/packages/47/01/f420e7add78110940639a958e5af0e3f8e07a8a8b62049bac55ee117aa91/requests-2.27.0-py2.py3-none-any.whl (63 kB)
     |████████████████████████████████| 63 kB 2.1 MB/s             
  Downloading http://mirrors.aliyun.com/pypi/packages/92/96/144f70b972a9c0eabbd4391ef93ccd49d0f2747f4f6a2a2738e99e5adc65/requests-2.26.0-py2.py3-none-any.whl (62 kB)
     |████████████████████████████████| 62 kB 960 kB/s             
  Downloading http://mirrors.aliyun.com/pypi/packages/29/c1/24814557f1d22c56d50280771a17307e6bf87b70727d975fd6b2ce6b014a/requests-2.25.1-py2.py3-none-any.whl (61 kB)
     |████████████████████████████████| 61 kB 4.4 MB/s             
Collecting idna<3,>=2.5
  Downloading http://mirrors.aliyun.com/pypi/packages/a2/38/928ddce2273eaa564f6f50de919327bf3a00f091b5baba8dfa9460f3a8a8/idna-2.10-py2.py3-none-any.whl (58 kB)
     |████████████████████████████████| 58 kB 1.2 MB/s             
Collecting certifi>=2017.4.17
  Downloading http://mirrors.aliyun.com/pypi/packages/37/45/946c02767aabb873146011e665728b680884cd8fe70dde973c640e45b775/certifi-2021.10.8-py2.py3-none-any.whl (149 kB)
     |████████████████████████████████| 149 kB 4.5 MB/s            
Collecting urllib3<1.27,>=1.21.1
  Downloading http://mirrors.aliyun.com/pypi/packages/c5/05/c214b32d21c0b465506f95c4f28ccbcba15022e000b043b72b3df7728471/urllib3-1.26.16-py2.py3-none-any.whl (143 kB)
     |████████████████████████████████| 143 kB 12.2 MB/s            
Collecting chardet<5,>=3.0.2
  Downloading http://mirrors.aliyun.com/pypi/packages/19/c7/fa589626997dd07bd87d9269342ccb74b1720384a4d739a1872bd84fbe68/chardet-4.0.0-py2.py3-none-any.whl (178 kB)
     |████████████████████████████████| 178 kB 9.6 MB/s            
Saved ./pk/requests-2.25.1-py2.py3-none-any.whl
Saved ./pk/certifi-2021.10.8-py2.py3-none-any.whl
Saved ./pk/chardet-4.0.0-py2.py3-none-any.whl
Saved ./pk/idna-2.10-py2.py3-none-any.whl
Saved ./pk/urllib3-1.26.16-py2.py3-none-any.whl
Successfully downloaded requests certifi chardet idna urllib3
```

上面这个命令就是从源下载whl文件，并且由于在命令中可以指定系统架构和python版本，所以下载的离线包可以脱离当前的环境的约束，也就是说，我当前环境是Mac的Python3，我也一样可以去下载适用于Windows系统的Python2的依赖包。

## 真实案例

一个真实的案例就是我使用的Mac系统，本地有Python3和Python2，然后客户现场是Windows系统，并且开发环境需要使用Python2，因此我需要在Mac系统上准备好离线安装包到Windows系统进行安装。

### Mac系统下载离线包

看了我上面的几个命令介绍，这里就很自然能想到需要使用download命令来下载依赖包：

```shell
python -m pip download --only-binary=:all: --platform=win_amd64 --python-version=2.7 -d ./packages -r requirements.txt -i http://mirrors.aliyun.com/pypi/simple/ --trusted-host mirrors.aliyun.com
```

我这里是直接将需要下载的所有依赖放到requirements.txt中，一次性下载所有需要的依赖包，并且根据目标环境的需要，我设置了系统架构是Windows 64位，并且Python2.7，下载好的包都在packages目录中。

### Windows系统安装离线包

将离线包以及requirements.txt文件统一拷贝到内网的Windows桌面中，然后执行离线安装命令即可：

```shell
python -m pip install --no-index --find-links=".\packages" -r requirements.txt
```

## 更多参数解释

下面是更多与 `pip` 参数 `--platform` 对应的平台标识表，涵盖了各种操作系统和架构组合。这些平台标识帮助 `pip` 下载特定平台的二进制文件（如 `.whl` 文件）。

### 常见平台标识对照表

| 平台                   | 架构                     | `--platform` 值                        |
|------------------------|--------------------------|----------------------------------------|
| **Linux**              | x86 (32-bit)             | `manylinux1_i686`, `manylinux2014_i686`|
| **Linux**              | x86_64 (64-bit)          | `manylinux1_x86_64`, `manylinux2014_x86_64` |
| **Linux**              | ARM (32-bit)             | `manylinux2014_armv7l`                 |
| **Linux**              | ARM (64-bit)             | `manylinux2014_aarch64`                |
| **Linux**              | PowerPC (64-bit)         | `manylinux2014_ppc64le`                |
| **Linux**              | IBM Z (s390x)            | `manylinux2014_s390x`                  |
| **Windows**            | x86 (32-bit)             | `win32`                                |
| **Windows**            | x86_64 (64-bit)          | `win_amd64`                            |
| **macOS**              | x86_64 (64-bit)          | `macosx_10_9_x86_64`, `macosx_11_0_x86_64` |
| **macOS**              | ARM64 (Apple Silicon)    | `macosx_11_0_arm64`, `macosx_12_0_arm64` |
| **Linux**              | RISC-V (64-bit)          | `manylinux2014_riscv64`                |
| **FreeBSD**            | x86_64 (64-bit)          | `freebsd_11_0_x86_64`, `freebsd_12_0_x86_64` |
| **Solaris**            | SPARC (64-bit)           | `solaris_2_11_sparc`                   |
| **Solaris**            | x86_64 (64-bit)          | `solaris_2_11_x86_64`                  |
| **AIX**                | PowerPC (64-bit)         | `aix_7_2_ppc64`                        |

### 详细解释：

- **`manylinux1` / `manylinux2014`**: 是一类 Linux 平台上的兼容二进制打包标准，适用于不同架构。`manylinux1` 是早期版本，`manylinux2014` 是新版标准，支持更多架构（如 ARM 和 IBM Z）。
  
- **Windows**:
	- `win32`: 用于 Windows 32 位系统。
	- `win_amd64`: 用于 Windows 64 位系统。

- **macOS**:
	- `macosx_10_9_x86_64`: 针对 macOS 10.9 及更高版本的 64 位 Intel 机器。
	- `macosx_11_0_arm64`: 针对 Apple Silicon (ARM64) 架构的 macOS 11.0 及更高版本。

- **FreeBSD**:
	- `freebsd_11_0_x86_64`: 用于 FreeBSD 11.0 的 64 位架构。
	- `freebsd_12_0_x86_64`: 用于 FreeBSD 12.0 的 64 位架构。

- **Solaris**:
	- `solaris_2_11_x86_64`: 针对 Solaris 11 上的 64 位 x86 架构。
	- `solaris_2_11_sparc`: 针对 Solaris 11 上的 64 位 SPARC 架构。

- **AIX**:
	- `aix_7_2_ppc64`: 针对 IBM AIX 系统上的 PowerPC 架构。

### 使用 `--platform` 参数下载示例

假设你在 Windows 系统上，但是你想为 Linux ARM 架构下载包，你可以使用如下命令：

```bash
pip download <package_name> --platform manylinux2014_aarch64 --python-version 38 --only-binary=:all: --dest .
```

其中：
- `<package_name>`: 你要下载的包名。
- `manylinux2014_aarch64`: 目标平台的标识，代表 Linux 64-bit ARM 架构。
- `--python-version 38`: 表示目标平台上使用 Python 3.8。
- `--only-binary=:all:`: 强制下载 `.whl` 二进制文件，而不下载源代码。
- `--dest .`: 指定下载到当前目录。

这样可以确保你下载的包与指定平台和架构兼容。

### 结论：
- `--platform` 参数允许你为不同的操作系统和架构下载兼容的 Python 包。
- 确保你下载的 `.whl` 文件与目标 Python 版本、平台和架构匹配。

## 总结

在了解到`wheel`和`download`的用法之前，我下载离线包都是在本地准备一个干净的Python虚拟环境，然后安装我需要的依赖库，然后去查看当前总共安装了那些包，然后拿着这包的版本去pypi的官网一个一个的下载离线whl文件，经常会因为漏掉某些依赖或者下载的依赖不适合当前的环境导致要重复的拷贝离线包，非常麻烦。

重新认识`wheel`和`download`的用法之后，我可以形成一个标准的离线包下载和安装流程，可以节省很多时间。

## 参考文档

- [Python3离线安装requests模块](https://blog.csdn.net/weixin_38367022/article/details/113737793)
- [python pip常用指令（install,list,freeze,show,help）](https://blog.csdn.net/fulk6667g78o8/article/details/122690658)
- [Difference "pip wheel" and "pip download"?](https://stackoverflow.com/questions/63615283/difference-pip-wheel-and-pip-download)