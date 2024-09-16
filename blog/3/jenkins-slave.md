# 【Jenkins 插件】使用 SSH Slaves 创建从节点执行任务

我的 Jenkins 是运行在容器中的（之前有文章已经分享过容器运行 Jenkins 的方式），所以很显然，容器能执行的任务非常有限，甚至可以说是基本没啥用。但是那都不是事儿，毕竟 Jenkins 一般来说也不是单机执行，而是会配置主从节多节点执行任务，不同的节点分配不同的任务去执行，所以只需要执行节点有环境就可以执行对应环境需求的任务，根本不需要主节点配置任务环境。

## Java 环境配置
由于 Jenkins 是 Java 驱动的一个服务，所以一个节点想要成为 Jenkins 的从节点，必须配置 Java 环境（当然，这个说的很绝对，因为是目前我对 Jenkins 的了解，所以这个说法不一定是对的）。

当选定了一个虚拟机或者服务器准备当作从节点之后，就需要给这个节点配置 Java 环境，其实就是安装 Java，所以如果已经安装过了就可以跳过这个步骤。

我这里使用的是 CentOS 的虚拟机，所以以下所有操作都是针对的 CentOS 系统。

### 下载 Java 安装包
虽然使用 yum install 命令也是可以安装 java 的，但是据我所了解的是通过 yum 安装的 java 可能会缺少一些包，所以一般的文章都是推荐使用官方的安装包解压到服务器。

现在都是使用的 jdk8，官方 jdk8 安装包的下载地址是 [jdk8 安装地址](https://www.oracle.com/technetwork/java/javase/downloads/jdk8-downloads-2133151.html)，可以选择 8u211 或者 8u212 的版本，选择下载的时候需要勾选官方的同意协议，然后选择下载，下载需要登陆官方网站，所以需要注册一个账号登陆才能下载。

![官方jdk8下载](https://cdn.jsdelivr.net/gh/Hopetree/blog-img@main/article/190710/tendcode_2019-07-10_21-37-42.png)

这里我下载之后的包是 jdk-8u211-linux-x64.tar.gz

### 配置 Java 环境
本地下载好 java 安装包之后，可以把安装包传送的服务器上面，然后在服务器上面创建一个目录 /usr/jvm/ 把安装包放到这个目录中。下命命令都是 root 用户操作的。

```bash
mkdir /usr/jvm
cp /tmp/jdk-8u211-linux-x64.tar.gz /usr/jvm/
```

然后解压 jdk 包到当前目录：
```bash
cd /usr/jvm/
tar -xzvf jdk-8u211-linux-x64.tar.gz
```

接着需要配置 Java 环境变量，编辑 /etc/profile 文件，添加 java 相关环境变量:

```bash
#/etc/profile

JAVA_HOME=/usr/jvm/jdk1.8.0_211        
JRE_HOME=/usr/jvm/jdk1.8.0_211/jre     
CLASS_PATH=.:$JAVA_HOME/lib/dt.jar:$JAVA_HOME/lib/tools.jar:$JRE_HOME/lib
PATH=$PATH:$JAVA_HOME/bin:$JRE_HOME/bin
export JAVA_HOME JRE_HOME CLASS_PATH PATH
```

编辑完成之后，执行 source /etc/profile 命令使环境变量生效。

然后可以查看以下 java 命令是否可用：

```bash
[root@CentOS-2 jvm]# java -version
java version "1.8.0_211"
Java(TM) SE Runtime Environment (build 1.8.0_211-b12)
Java HotSpot(TM) 64-Bit Server VM (build 25.211-b12, mixed mode)
```

## 添加从节点
选中的从节点配置好 Java 环境之后，现在可以开始在 Jenkins 页面来配置从节点。

### 安装 SSH Slaves 插件
在插件管理中搜索 SSH Slaves 就可以找到这个插件，直接安装即可，这个插件的作用就是支持 SSH 连接。

安装完成之后可以看到插件管理中已经按照的插件中有这个：

![SSH Slaves](https://cdn.jsdelivr.net/gh/Hopetree/blog-img@main/article/190710/tendcode_2019-07-10_22-00-58.png)

### 添加凭证
插件安装之后需要在 Jenkins 上面添加一个凭证，也就是用来登陆从节点的账号。凭证可以选择密码登陆也可以选择密钥，这里我选择的密码登陆因为我的虚拟机是密码，之前 GitHub 那篇是密码登陆。

![user](https://cdn.jsdelivr.net/gh/Hopetree/blog-img@main/article/190710/tendcode_2019-07-10_22-39-34.png)

### 配置从节点
插件和凭证都准备好了就可以开始配置一个从节点了，基本配置可以看截图，主要是启动方式要选择 Launch agent agents via SSH，而且这个选项只有在安装了插件才会有。

![ssh](https://cdn.jsdelivr.net/gh/Hopetree/blog-img@main/article/190710/tendcode_2019-07-11_23-05-03.png)

基本配置一目了然，然后还要配置一个高级配置项，这个里面比较重要的是 java 路径，这个也就是为什么要从节点安装 java 环境的原因。

![java](https://cdn.jsdelivr.net/gh/Hopetree/blog-img@main/article/190710/tendcode_2019-07-10_23-00-17.png)

其他的设置就看个人需求了，标签很重要，这个必须填写至少一个标签，因为这个是任务选择执行机的一个方式。

### 从节点执行任务
执行任务的时候，在任务的基础信息里面的限制项目的运行节点中选择配置的从节点的标签即可。


总结：Jenkins 主从节点的模式非常适合多种语言或者环境的构建，可以把执行不同任务的主机当作从节点去执行任务，这样就做到了一个主节点分配任务，其他节点执行。

**涉及插件：**

- SSH Slaves: <https://plugins.jenkins.io/ssh-slaves>