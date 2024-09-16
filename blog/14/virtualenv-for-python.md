# Python 虚拟环境 Virtualenv 分别在 Windows 和 Linux 上的安装和使用

[virtualenv 是用来创建 Python 的虚拟环境的库，虚拟环境能够独立于真实环境存在，并且可以同时有多个互相独立的 Python 虚拟环境，每个虚拟环境都可以营造一个干净的开发环境，对于项目的依赖、版本的控制有着非常重要的作用。

虚拟环境有什么意义？打个比喻，现在有一个 Django 项目，使用的 Django 版本是1.8，但是系统的 Django 版本已经是更加新的1.11，如果使用系统的环境来运行项目，可能导致很多不兼容，于是，这个问题就可以使用一个虚拟环境来解决，使用 virtualenv 来创建一个只给这个项目运行的开发环境，既可以保证项目的正常运行，也方便了之后移植项目。

## virtualenv 的安装和使用
由于 virtualenv 在 Windows 和 linux 上的安装和使用有一点点不同，所以需要分别来讲。

### 安装 virtualenv
virtualenv 的安装在 Windows 和 linux 上面是一样的，所以不分开讲解。安装 virtualenv 跟安装一般的 Python 库是一样的操作，直接使用 pip 命令就行了：

```shell
pip install virtualenv
```
安装完成之后就可以使用 virtualenv 的命令来创建虚拟环境了，首先需要在 cmd 命令中进入需要创建虚拟环境的文件夹，比如 F 盘的 envs 文件夹，然后使用以下命令创建一个虚拟环境，暂且取名为 new_env：

```shell
virtualenv new_env
```
可以看到类似如下的结果：

```text
F:\envs>virtualenv new_env
Using base prefix 'f:\\python352'
New python executable in F:\envs\new_env\Scripts\python.exe
Installing setuptools, pip, wheel...done.

```
上面这段返回的意思是使用当前系统的 Python 版本创建一个虚拟环境

### 使用 virtualenv
- 在 Windows 系统上面使用 virtualenv

首先进入到虚拟环境目录中的 Scripts 目录：

```text
F:\envs>cd new_env\Scripts
```
然后输入`activate`就可以了，会出现如下的结果：

```text
(new_env) F:\envs\new_env\Scripts>
```
在地址的前面出现了一个括号和虚拟环境的名称，这个就表示现在已经在虚拟环境 new_env 中了，之后的所有操作都是在虚拟环境中进行的，直接输入`python`可以查看当前环境下的 Python 版本，可以得到如下输出:

```text
(new_env) F:\envs\new_env\Scripts>python
Python 3.5.2 (v3.5.2:4def2a2901a5, Jun 25 2016, 22:18:55) [MSC v.1900 64 bit (AMD64)] on win32
Type "help", "copyright", "credits" or "license" for more information.
>>>

```
使用`pip`的`list`命令可以查看当前环境下的所有包含的库的版本：

```text
(new_env) F:\envs\new_env\Scripts>pip list
DEPRECATION: The default format will switch to columns in the future. You can use --format=(legacy|columns) (or define a format=(legacy|columns) in your pip.co
nf under the [list] section) to disable this warning.
pip (9.0.1)
setuptools (38.5.2)
wheel (0.30.0)
```

- 在 Linux 上使用 virtualenv
Linux 上面进入虚拟环境的方式跟 Windows 稍微有点不同，可以直接使用命令来进入，比如同样在 Linux 上面的 envs 文件夹下面有个 new_env 虚拟环境，则直接输入以下命令就可以进入虚拟环境：

```shell
$ source new_env/bin/activate
```
同样可以看到类似如下的结果：

```shell
(new_env) alex@VirtualBox:~/www/envs$ 
```
进入了虚拟环境之后，Windows 和 Linux 上面的操作都是一样的，这里就不单独去说明了。

## 使用 virtualenvwrapper管理环境
virtualenvwrapper 是一个 virtualenv 虚拟环境的管理库，这个库可以更加方便的管理所有的虚拟环境，由于在 Windows 和 Linux 上面这个库的安装和配置不同，所以要单独做说明。

### Windows 上安装环境
1、Windows 上需要安装的是`virtualenvwrapper-win`，直接使用`pip`命令就可以了：

```shell
pip install virtualenvwrapper-win
```
2、配置虚拟环境的保存路径。首先需要在想要统一存放虚拟环境的地方创建一个文件夹（我在F盘建立了F:\space_env），然后把这个文件夹添加到系统的环境变量中，具体添加方式看截图：
![virtualenvwrapper-win系统环境配置](https://cdn.jsdelivr.net/gh/Hopetree/blog-img@main/article/180414/virtualenv001.png)

3、注意说明：
    - 如果不设置系统环境变量，那么创建的虚拟环境会保存到默认的地方，不方便管理
    - 添加了环境变量之后，需要重启 cmd 窗口，如果是使用的 pycharm 也要重启一下才行

### Linux 上安装环境
1、使用`pip`命令安装，如果系统上面有两个版本的 Python（一般默认是2.7和3.52两个版本），那么要看虚拟环境要什么默认 Python 版本了，比如要使用3.52的版本作为虚拟环境的 Python 版本，那么就应该使用如下命令：
```shell
pip3 install virtualenvwrapper
```

2、配置环境变量文件。首先修改（文件不存在就创建）文件~/.bashrc，然后添加如下语句：

```shell
export WORKON_HOME=$HOME/.virtualenvs
export PROJECT_HOME=$HOME/workspace
source /usr/local/bin/virtualenvwrapper.sh
```
然后运行：

```shell
source ~/.bashrc
```
如果没有报错，那么说明配置完成了，可以使用命令看看是否可以使用：

```shell
mkvirtualenv new_env
```

### 报错的解决方案
如果上述操作报错了，那么应该是你的 Linux 上面有两个版本的 Python，比如我的就报错了，我的上面有一个2.7的和一个3.5的版本。

如果报错如下提示：

```shell
/usr/local/bin/virtualenvwrapper.sh: No such file or directory
```
则说明这个文件不存在，可以使用`find`命令来查找正确的位置:

```shell
find / -name "virtualenvwrapper.sh"
```
比如我因为是在3.5版本的 Python 中安装的`virtualenvwrapper`，所以发现这个.sh文件在这个地址中

```shell
/home/alex/.local/bin/virtualenvwrapper.sh
```
所以上面的文件中的最后一个语句改成

```shell
source /home/alex/.local/bin/virtualenvwrapper.sh
```
改完这个地方应该还是会报错，大概是在说没有安装这个虚拟环境库，就像这样

```shell
/usr/bin/python: No module named virtualenvwrapper

```
之所以报错这个是因为我用的3.5版本安装的这个环境，系统的2.7版本是没有的，所以还需要添加一个语句：
```shell
export VIRTUALENVWRAPPER_PYTHON=/usr/bin/python3
```
其中表明了 python3 的位置，当然，这个位置需要你自己查看自己的系统上面安装的位置，查看方式可以使用：

```shell
which python3
```
最终我的~/.bashrc文件中的语句是这样的：

```shell
export WORKON_HOME=$HOME/.virtualenvs
export PROJECT_HOME=$HOME/workspace
export VIRTUALENVWRAPPER_PYTHON=/usr/bin/python3
source /home/alex/.local/bin/virtualenvwrapper.sh
```
然后可以运行这个文件：

```shell
source ~/.bashrc
```
没有报错就说明环境设置好了，现在可以开始使用环境了。

### virtualenvwrapper 命令
- 创建虚拟环境：`mkvirtualenv new_env`
- 使用虚拟环境：`workon new_env`
- 退出虚拟环境：`deactivate`
- 删除虚拟环境: `rmvirtualenv new_env`
- 查看所有虚拟环境：`lsvirtualenv`

## requirements.txt 文件的操作
### 生成文件

在虚拟环境中使用一下命令可以生成一个虚拟环境的安装包版本文件

```shell
(venv) $ pip freeze >F:A_FILE\requirements.txt
```
需要注意的地方：

- 指定生成文件的目录
- 文件生成之后，有时候需要调整安装包的顺序，例如一个安装包是依赖另一个的，则需要把依赖包放在靠前的位置
- 如果想安装某个包的最新版，则把==及后面的版本信息删除即可

### 复制环境

首先新建一个虚拟环境，然后把当前位置切换到需求文件所在目录下，然后在新建的虚拟环境中运行以下命令就可以安装需求文件中所有的依赖库，相当于复制了一个虚拟环境。

```shell
(venv) $ pip install -r requirements.txt
```
当然，如果不把当前目录切换到需求文件所在目录也是可以安装需求文件的依赖的，但是要指明需求文件的绝对地址，例如：

```shell
(venv) $ pip install -r >F:A_FILE\requirements.txt
```