# 关于 docker compose 的安装和升级问题

今天被通知了一个容器环境的漏洞需要整改，看了一下是关于 Docker Compose 版本的，正好前两天新搭建容器环境的时候安装 Docker Compose 的时候意外知道了现在的 Docker Compose 已经不是使用 python 库的方式安装，而是 golang 版本的，也是官方推荐的。因此，特意写个小篇幅记录一下 Docker Compose 的新方式的安装和升级。

## 老的安装方式

在这次搭建环境之前，我还是停留在老的安装方式上面，以前装过很多次 `docker-compose` 都是使用的 python 库的方式：

```bash
pip install docker-compose
```

并且使用方式也是如此：

```bash 
docker-compose -v
```

其实我之前也挺疑惑的，这么好用的一个库，居然不是内置的。

## 新的安装方式

新版的 docker 已经自带 compose 能力，这是一个插件命令。

可以直接执行命令验证是否有：

```bash
docker compose version
```

如果没有命令，没关系，可以手动安装，不过这次使用的方式不是 python 库，而是直接安装 golang 版本。

从 2021 年起，Docker 官方已弃用 Python 版 docker-compose，改用 Go 语言版 Compose V2。


```bash
sudo apt update
sudo apt install docker-compose-plugin -y
```

安装后验证：

```bash
docker compose version
```

## 版本升级

这次的安全漏洞就是说目前的版本太低了有风险，给了要求的版本，我这里看了官方已经有 v2.40.3 版本，因此就当做目标版本。

### 找到插件目录

由于 compose 现在是 docker 的一个插件，所以升级的方式就是下载最新的二进制软件包，替换掉原本的包即可，首先查找插件目录：

```bash
find / -type d -name "cli-plugins" 2>/dev/null
```

此时大概率看到的目录地址是：`/usr/libexec/docker/cli-plugins`

可以查看目录下面的插件，一般情况是有两个文件：`docker-buildx` 和 `docker-compose`

### 下载并替换包

去官方下载目标版本的包（注意跟系统架构一致），比如 v2.40.3 版本下载地址：https://github.com/docker/compose/releases/tag/v2.40.3

下载之后得到的是一个二进制的文件，可以重命名为 docker-compose 便于后续的替换操作。

只需要去替换掉插件目录中的 `docker-compose` 文件即可，别忘了查看是否有执行权限，没有就追加一下：

```bash
sudo chmod +x /usr/libexec/docker/cli-plugins/docker-compose
```

::: tip

新版 docker compose 的命令跟之前的 docker-compose 命令使用方式一致，只是命令中间没有横线而已

:::