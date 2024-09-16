# JetBrains 全家桶免费使用的方法

我之前分享过[使用无限刷新试用期的方式来免费使用 Goland 的方法](https://tendcode.com/subject/article/GoLand-install/ "使用无限刷新试用期的方式来免费使用 Goland 的方法")，这种方法也同样可以使用在其他 IDE 上面，比如 Pycharm 也行。但是在这个方法对 IDE 的版本支持有限，只支持 2021.3 之前的版本，于是这次来分享一个可以支持最新版的方法。

## Goland 版本太低导致的问题

我之所以会想要换一种免费使用的方法是因为在使用 Goland 的 2021.1 版本的时候出现了一个与 Golang 版本不兼容导致的问题，具体问题如下：

![goland 报错](https://tendcode.com/cdn/2024/02/goland11.png "goland 报错")

具体是体现就是当在代码中引入 `net/http` 以及 `time` 模块的时候，编辑器就提示这种包重复的错误，但是实际上并没有错误。后来我找到了网上的说法就是因为 Goland 的版本太低了，跟 Golang 的版本产生了不适配，只需要升级 Goland 到新版本就可以解决。

于是不能再使用刷新试用期的方法了，只能另辟蹊径。

## 注册码激活方式

首先需要说明一点的是，激活码并不是随便找个就行的，这里不仅仅需要激活码，还需要一个工具支持，具体步骤看下面介绍。

### 下载并安装 Goland

这个不用过多介绍了，建议下载上个月的最后一个版本而不是当前的最新版。下载之后直接安装即可，不用打开。

### 安装 ja-netfilter

#### 1. 下载  ja-netfilter 包

ja-netfilter 是一个插件，但是不需要用插件的安装方式来做，这里直接打开这个注册码收集的网站 [https://3.jetbra.in/](https://3.jetbra.in/ "https://3.jetbra.in/") 随便点开一个能访问的地址，然后就可以看到可以下载一个文件包 jetbra.zip

![jatbra](https://tendcode.com/cdn/2024/02/jerbra.png "jatbra")


::: warning 注意

jetbra.zip 下载之后请放到一个不带中文的目录里面解压，并且保证这个目录不会被移动或删除。
:::

#### 2. 执行 ja-netfilter 安装

![脚本地址](https://tendcode.com/cdn/2024/02/111.png "脚本地址")

在 jetbra.zip 的解压目录里有个 scripts 目录，进入这个目录，执行安装脚本（不同系统的安装脚本不同，这个根据自己系统的执行，比如 Windows 的执行 install-current-user.vbs，Mac 的执行 install.sh ）：

```sh
cd ~/Documents/Mac/ide/jetbra/scripts
sh install.sh
```

#### 3. 注册码激活

直接去 [https://3.jetbra.in/](https://3.jetbra.in/ "https://3.jetbra.in/") 里面提供的网站复制一个注册码就行

![pycharm注册](https://tendcode.com/cdn/2024/02/pycharm.png "pycharm注册")

![pycharm注册2](https://tendcode.com/cdn/2024/02/pycharm2.png "pycharm注册2")

看看这个激活效果，直接2年半。

::: danger

**⚠️ 警告**

以上操作仅作为学习和测试用，测试完请卸载软件，请大家支持正版软件，购买正版激活码！！！
:::