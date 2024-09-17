# Go 学习笔记（1）：GoLand 安装并通过插件重置试用到期时间

GoLand 相对于 Go 就像 Pycharm 相对于 Python 一样，但是很遗憾的是 GoLand 没有像 Pycharm 一样的可以永久免费使用的社区版，只能试用后付费使用。本文分享一下 GoLand 安装并通过插件重置试用到期时间的方法。

总有人会说为什么不用 VSCode？不得不承认，VSCode 的确好用，小巧又强大，甚至可以做到依靠插件兼容各种语言，我一直都有在用 VSCode，不过仅作为一个高级的文本编辑器使用（取代 Notepad++）。VSCode 跟专业的 JetBrains IDEs 相比肯定是不可能比的过的，毕竟别人是收费的，而且是每种语言都有专门的 IDE 支撑，在项目比较大的时候实用 JetBrains IDEs 来管理项目就比 VSCode 要轻松多了。

废话不多说，直接来秀才艺。

## 安装 GoLand

因为要使用到一个可以重置 GoLand 试用期的的插件，而这个插件能支持的 JetBrains IDEs 的版本只能是 2021 年的，具体能支持到哪个版本我也不太清楚，于是直接参考我的 Pycharm 的版本，选择 GoLand 的 2021.1.3 版本进行下载。

下载地址：[https://www.jetbrains.com.cn/go/download/other.html](https://www.jetbrains.com.cn/go/download/other.html "https://www.jetbrains.com.cn/go/download/other.html")

![GoLand 2021.1.3 版本下载](https://cdn.jsdelivr.net/gh/Hopetree/blog-img@main/2024/01/goland-download-1.png "goland 下载")

## 安装插件

### 1. 安装 IDE Eval Reset

IDE Eval Reset 插件是一个可以将 JetBrains IDEs 的试用期无限重置的插件，所谓的无限重置是指每次运行 IDE Eval Reset 的重置操作都可以将 IDE 的试用期的到期时间重置成一个月后，如此只需要每个月到期前重新执行一次就能实现无限试用。

插件的安装方式如下：

**step 1：添加插件库**

在插件管理的设置里面添加插件库地址：https://plugins.zhile.io

**step 2：搜索并安装插件**

添加了插件库之后，可以在插件的 Marketplace 中搜索 IDE Eval Reset 并进行安装。

![IDE Eval Reset 安装](https://cdn.jsdelivr.net/gh/Hopetree/blog-img@main/2024/01/Snipaste_2024-01-23_09-44-49%20%281%29.png "1")

**step 3：使用 IDE Eval Reset**

IDE Eval Reset 安装好之后，可以使用一下，将 GoLand 的试用期到期时间重置一下。操作如下：

首先点击 GoLand 的帮助，此时可以看到最下面有个 Eval Reset，然后点击 Eval Reset，就可以看到下面如图的显示，这里可以看到 GoLand 的证书的到期时间，此时执行一下 Reset 就可以将到期时间重置为一个月后。

![IDE Eval Reset使用](https://cdn.jsdelivr.net/gh/Hopetree/blog-img@main/2024/01/Snipaste_2024-01-23_09-49-19%20%281%29.png "4")

这里勾选自动重置，只要每个月都使用 GoLand 就可以保证一直可以试用。

### 2. 安装中文语言包

虽然在插件市场中可以搜索到中文语言包插件“Chinese (Simplified) Language Pack”，但是由于插件支持的是最新版的 GoLand，所以不兼容我们老版本的，因此这里安装的时候会报错。

因此，我们需要使用离线安装的方式进行安装，具体操作如下（其他插件离线安装方式也是这样操作）：

**step 1：下载离线插件包**

下载地址：[https://plugins.jetbrains.com/plugin/13710-chinese-simplified-language-pack----/versions/stable](https://plugins.jetbrains.com/plugin/13710-chinese-simplified-language-pack----/versions/stable "https://plugins.jetbrains.com/plugin/13710-chinese-simplified-language-pack----/versions/stable")

这里需要选择跟我们 GoLand 版本的时间一致的版本，也就是 2021.1 — 2021.1.3，这样就可以兼容。

**step 2：离线安装插件**

进入插件的设置中，选择“Install Plugin from Disk.”，也就是从磁盘安装插件，然后选择下载好的插件包文件（应该是一个jar包）即可。

![Chinese (Simplified) Language Pack](https://cdn.jsdelivr.net/gh/Hopetree/blog-img@main/2024/01/Chinese%20%28Simplified%29%20Language%20Pack%20%281%29.png "d34")

**step 3：重启 GoLand**

中文语言包插件安装之后需要重启 GoLand 生效，重启后就可以看到全中文显示了。

## 安装 Go

我是 Mac 系统，这里只记录 Mac 安装 Go 的方式，其他系统类似。

### 下载 Go 安装包

Go 安装包下载地址：[https://go.dev/dl/](https://go.dev/dl/ "https://go.dev/dl/")

选择自己系统对应的包即可，我比较喜欢 tar.gz 的包，直接下载后解压，而不是使用执行包，M1 芯片的使用 go1.21.7.darwin-arm64.tar.gz 包。

![go](https://cdn.jsdelivr.net/gh/Hopetree/blog-img@main/2024/02/go1.21.7%20%281%29.png "go")

然后下载后将安装包放到 /usr/local 目录下面进行解压：

```bash
tar -zxvf go1.21.7.darwin-arm64.tar.gz
```

此时就会得到一个 /usr/local/go 目录，也就是 go 的根目录。

### 创建 GOPATH 目录

GOPATH 目录是项目的顶级目录，用来存放 go 的一些本地项目或者安装包。可以创建在用户目录下面，比如 /Users/xxx/go

此时还需要在该目录下面创建3个额外的目录：`src`、`bin`、`pkg`

```bash
mkdir ~/go
cd ~/go
mkdir src bin pkg
```

::: success 注意

不用太在意 GOPATH 目录管理项目的这种方式，后续项目管理都是使用 go mod 来管理，项目都是独立的依赖。
:::

### 设置环境变量

编辑 `~/.zshrc` 文件添加 go 相关环境变量：

```bash
export GOPATH="/Users/xxx/go"
export GO111MODULE=on
export GOROOT="/usr/local/go"
export PATH="$GOROOT/bin:$PATH"
export GOPROXY=https://goproxy.io,direct
```

然后加载一下：

```bash
source ~/.zshrc
```

然后执行命令查询 go 的版本：

```bash
$ go version
go version go1.21.7 darwin/arm64
```
