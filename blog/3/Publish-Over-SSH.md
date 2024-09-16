# 【Jenkins 插件】使用 Publish Over SSH 远程传输文件和自动部署

一般来说，使用 Jenkins 可以完成整个 CI/CD 的操作，之前关于源码下载、镜像构建、镜像推送等操作都只能算是 CI 的步骤，而这篇文章就来分享一下使用 Jenkins 完成一系列包括构建和部署的操作，同时记录一下我对 Publish Over SSH 插件的用法的理解。

## 需求分析

### 需求场景

一般情况下，通过 Jenkins 完成一个项目的上线，至少应该包括三台虚拟机，一台用来运行 Jenkins 服务，作为主节点，第二台（正常情况可能不止一台）是一个从节点，由主节点分配任务，执行构建操作，之所以从节点会很多是因为每个从节点可能配置的不同的环境，可以完成特定的构建任务，比如某个从节点配置了 nodejs 环境，所以可以执行前端项目构建，而另一个配置了 Java 环境所以可以构建 Java 项目；第三台虚拟机就是项目部署的服务器了（有时候可能也不止一台），可以通过 Jenkins 远程控制服务器完成构建后的部署。

现在我就有3个虚拟机，1个 Jenkins 主机点，使用容器运行的，1个 Jenkins 从节点，配置了 nodejs 环境和 Java 环境，所以可以完成 vue 项目的构建，最后一个是一台仅仅配置了 docker 环境的虚拟机，只能运行容器。这个场景很服务实际的项目场景。

### 解决方案

Jenkins 主节点由于是在容器中运行的，所以根本不具备任何其他环境，所以只做任务分配；从节点需要完成的事情是从 GitHub 拉取代码，并打包 vue 项目，最后构建成镜像，构建完成之后可以推送到远程仓库，也可以打包成 tar 包（这里为了使用 Publish Over SSH 的文件传输功能，所以使用 tar 包镜像）；从节点构建完成之后，把镜像和部署代码一并传到服务器节点上面，然后在服务器节点执行部署命令，这几个步骤都是 Publish Over SSH 可以完成的。

## 使用 Publish Over SSH

Publish Over SSH 是 Jenkins 的一个插件，可以使用 SSH 的方式远程连接服务器，并进行文件的传输和命令执行。

### 安装插件

直接在 Jenkins 插件管理中搜索“Publish Over SSH”即可进行安装，直接按照失败的话可以下载失败的依赖包进行安装。

> 这里顺便推荐另一个插件“Workspace Cleanup Plugin”，这个插件的作用是可以在构建之后对构建任务的工作目录进行清理。

### 添加系统配置

安装完插件之后，需要到 Jenkins 系统配置中添加 Publish Over SSH 的配置项，其实就是添加一些远程节点的登陆信息，后续可以用到任务中。

配置项有点类似添加凭证：

![ssh](https://tendcode.com/cdn/article/190729/tendcode_2019-07-30_19-06-07.png)

### 任务中使用

添加一个 GitHub 项目，然后按照之前那篇 vue 构建的操作完成 vue 静态资源的打包和镜像构建，这些操作之前的文章分享过，所以这里就不重复说明，不过这次跟之前不同的是，构建好镜像之后不要推送到远程仓库，而是打包成一个 tar 格式的压缩包，具体要执行的命令如下：

```bash
ls -l

# 打包vue
npm install
npm audit fix
npm run build

# 构建镜像
docker build -t hao --no-cache .
image_ids=`docker images|grep none|awk '{print $3}'`
[ ! -z "$image_ids" ] && docker image rm $image_ids
docker images


# 打包镜像
docker save hao:latest > image_hao.tar
```

这样之后，任务目录下的文件会像这样：

```bash
drwxrwxr-x.   2 alex alex       188 Jul 29 20:05 build
drwxrwxr-x.   2 alex alex        59 Jul 29 20:05 config
drwxrwxr-x.   3 alex alex        38 Jul 29 20:48 dist
-rw-rw-r--.   1 alex alex       195 Jul 29 20:36 docker-compose.yml
-rw-rw-r--.   1 alex alex        96 Jul 29 20:05 Dockerfile
-rw-rw-r--.   1 alex alex       340 Jul 29 20:05 hao.conf
-rw-rw-r--.   1 alex alex 113950720 Jul 29 20:48 image_hao.tar
-rw-rw-r--.   1 alex alex       312 Jul 29 20:05 index.html
drwxrwxr-x. 723 alex alex     24576 Jul 29 20:48 node_modules
-rw-rw-r--.   1 alex alex      1799 Jul 29 20:05 package.json
-rw-rw-r--.   1 alex alex    336952 Jul 29 21:26 package-lock.json
-rw-rw-r--.   1 alex alex       746 Jul 29 20:05 README.md
drwxrwxr-x.   7 alex alex       107 Jul 29 20:05 src
drwxrwxr-x.   2 alex alex        22 Jul 29 20:05 static
```

其中需要上传到服务器上面的文件有：

- docker-compose.yml：编排文件，用来启动容器
- hao.conf：nginx配置文件
- image_hao.tar：镜像包

构建完成之后，在 Jenkins 的构建后操作的步骤中找到“Send build artifacts over SSH”的操作步骤，这个就是 Publish Over SSH 的操作动作。

下面是我添加的操作：

![command](https://tendcode.com/cdn/article/190729/tendcode_2019-07-30_00-27-35.png)

可以看一下这个里面命令里面的用法说明：

> A command to execute on the remote server.This command will be executed on the remote server after any files are transferred.
The SSH Transfer Set must include either a Source Files pattern, an Exec command, or both. If both are present, the files are transferred before the command is executed. If you want to Exec before the files are transferred, use 2 Transfer Sets and move the Exec command before the Transfer set that includes a Source files pattern.

这个说明的意思是每个操作至少要添加一个文件传输的操作或者命令执行操作，但是在单个操作里面，命令是在文件传输之后才会执行，所以如果你想在某个文件传输之前执行命令，那你就要把这个命令分离出去，放到文件传输前面的操作中执行。就像我这里，我这个里是先会执行 `docker load` 操作，然后才会传输 hao.conf 文件。

理解了上面这个说明就很容易掌握用法，这里其实就是把构建后的步骤可以分成多个小步骤去传文件或者运行命令。

之前说到了，需要传入到服务器的有三个文件，传入完成之后可以添加启动容器的命令，还是放到 Publish Over SSH 任务中：

```bash
cd /opt/cloud/hao
docker-compose down > /dev/null 2>&1
docker-compose up -d
```

这里需要注意，文件存放的目录不是当前目录（当前目录是远程用户登陆主目录），所以这里要进入指定目录，这个指定的目录是之前添加的系统配置目录下面的目录。

### 查看运行结果
可以查看 Jenkins 任务直接完成后的日志，查看是否所以文件传输正常，命令是否执行正常:

![log](https://tendcode.com/cdn/article/190729/tendcode_2019-07-30_19-13-54.png)


同时，可以前往远程服务器查看服务运行结果：

```bash
[root@centos-3 hao]# pwd
/opt/cloud/hao
[root@centos-3 hao]# ll
total 8
-rw-r--r--. 1 root root 195 Jul 30 19:01 docker-compose.yml
-rw-r--r--. 1 root root 340 Jul 30 19:01 hao.conf
[root@centos-3 hao]# docker-compose ps
  Name            Command          State         Ports
-------------------------------------------------------------
hao_nginx   nginx -g daemon off;   Up      0.0.0.0:80->80/tcp
```

到这里为止，整个构建到部署的任务就结束了，可以登陆远程服务器的地址查看运行的 vue 项目的启动效果，这里就不显示了。


最后，可以构建后步骤中找到“Delete workspace when build is done”勾选上，这个就是之前安装的清理任务目录的插件，每次任务完成都可以根据自定义的方式清理任务目录。

**总结**：这里其实只是一个比较小的项目使用 Jenkins 完成的打包、构建、部署，但是麻雀虽小，五脏俱全，就算是大型的项目的部署流程，其实也可以使用 Jenkins 完成自动化，后续我打算把自己的博客项目弄成 Jenkins 自动化部署和升级。