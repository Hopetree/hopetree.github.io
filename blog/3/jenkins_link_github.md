# 【Jenkins 插件】使用 github 插件从 GitHub 上拉取项目代码

Jenkins 常用的就是项目构建，一般构建都需要从版本控制平台上面拉取项目代码到 Jenkins 服务器上构建。我主要使用的版本控制平台是 GitHub，所以这里就分享一下 Jenkins + GitHub 的基本构建配置过程。

## 准备工作
Jenkins 要从 GitHub 上面拉取代码需要安装相关插件，插件可以在 Jenkins 的插件管理中搜索下载。有时候安装一个插件的时候可能会依赖其他插件，所以安装一个插件不一定只安装一个插件包，如果联网安装失败了，可以多试几次，如果还是失败了，可以直接下载失败的那个插件包然后从本地上传插件包安装（插件包高级管理中）。

### 安装 GitHub 插件
首先，需要连接 GitHub 有一个基本的插件要安装，可以在插件管理中搜索 GitHub，然后找到 `GitHub` 这个插件进行安装即可。


### 安装 Git Parameter
安装了 `GitHub` 插件就已经实现了连接 GitHub，虽然这个基本的插件本身也有选择分支的参数，但是分支参数没有限制，无法做到根据实际的分支和 Tag 名称去选择，所以最好另外安装一个可以支持选择分支和 Tag 的插件，这个支持分支的插件的名字是 `	
Git Parameter`，这个插件可以实现在拉取 GitHub 的代码的时候选择分支和 Tag 并通过参数的形式传入到拉取过程中。

### 添加凭据
进入 Jenkins 的凭据管理中，添加一个全局凭据，添加的信息如下：

![GitHub 凭证](https://tendcode.com/cdn/article/190706/tendcode_2019-07-06_22-52-26.png)

其中的私钥可以到当前用户的用户目录下的 .ssh 目录下面找到。

## 配置 GitHub 任务
准备工作完成之后，可以开始创建一个 GitHub 任务。

### 基本配置
添加一个 github 项目：

![GitHub](https://tendcode.com/cdn/tendcode_2019-07-06_23-14-01.png)

设置分支配置：

![分支](https://tendcode.com/cdn/tendcode_2019-07-06_23-21-56.png)

这个分支信息设置最终会在构建任务的时候形成一个可选参数，选项就是当前项目的所有分支和 Tag。

### 项目配置

项目配置中主要需要添加项目地址，添加用户凭证，然后配置分支参数：

![branch config](https://tendcode.com/cdn/tendcode_2019-07-06_23-27-38.png)

### 其他配置

构建触发器里面关于构建频率的设置这里就不涉及，这个要看自己的需要去设置出发的时间。

执行命令里面作为测试，由于我是 Linux 服务器构建，所以选择 shell 命令，可以输入一个最简单命令，来查看一下项目拉取之后当前目录的信息，看看是否满足需求：

```shell
ls -l
```
构建完成可以查看一下构建的过程日志：

![github log](https://tendcode.com/cdn/tendcode_2019-07-07_00-22-40.png)

## 阿里云自动构建

前段时间意外发现阿里云不仅提供了免费的容器镜像仓库，而且还可以设置自动化构建，现在就分享一下设置的方式。

阿里云的镜像控制台地址是：<https://cr.console.aliyun.com/cn-shenzhen/instances/source>

### 绑定 GitHub 账号
类比上面配置 Jenkins 的步骤，这里第一个步骤也先配置一下 GitHub 账号的绑定，选择添加账号的时候会跳转到 GitHub 的授权页面，授权一下就行了。

![aliyun](https://tendcode.com/cdn/article/190706/tendcode_2019-07-06_23-48-22.png)

### 创建镜像仓库

首先需要创建一个命名空间：

![空间](https://tendcode.com/cdn/tendcode_2019-07-06_23-53-50.png)

有了命名空间之后才可以创建一个仓库，可以选择仓库是否公开，如果选择公开，则任何人都可以拉取，如果不公开，那么要拉取需要登陆才行：

![image](https://tendcode.com/cdn/tendcode_2019-07-06_23-54-19.png)

### 配置构建规则

创建了镜像仓库之后可以进入仓库的管理中，然后选择构建，构建自动触发构建：

![构建](https://tendcode.com/cdn/tendcode_2019-07-07_00-00-17.png)

可以添加多个构建规则，比如我添加了一个从 develop 的分支构建的镜像，Tag 设置为 latest，表示需要测试的镜像，然后设置从 master 构建的 Tag 设置为正式版本。

![image](https://tendcode.com/cdn/tendcode_2019-07-07_00-02-33.png)

构建的过程中可以查看构建日志，查看构建的镜像层级，构建完成之后可以去镜像版本中查看存在的镜像版本。


总结：使用容器化部署必然会使用到镜像构建，而镜像构建这个过程最好不要跟部署过程放到一起来做，而是应该提前完成并保存起来，而无论是 Jenkins 还是阿里云提供的构建平台，都能很方便的让我们做到这一点。

**涉及插件：**

- GitHub: <https://plugins.jenkins.io/github>
- Git Parameter: <https://plugins.jenkins.io/git-parameter>