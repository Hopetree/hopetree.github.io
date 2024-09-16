# 使用 Docker 运行 Jenkins 容器

Jenkins 是一个开源的、可扩展的持续集成、交付、部署（软件/代码的编译、打包、部署）的基于web界面的平台。学会 Jenkins 是步入持续集成的重要一步，将 docker 和 Jenkins 结合起来可以发挥各自更大的作用，本篇就分享一下自己使用 docker 运行 Jenkins 的经验。 

## 准备工作
在运行 Jenkins 容器之前需要做一下准备工作，这里主要就是选择和拉取镜像，还有创建本地挂载卷。

### 拉取镜像
> 后续更新：发现可以直接使用 Jenkins 的长期支持版本的镜像，也就是 jenkins/jenkins:lts 版本的镜像，这个 Tag 的版本是长期支持的，比较稳定，目前的是属于 2.171.1 版本，这个版本支持的插件更完整一些，而且镜像也小了很多。

Jenkins 本身的版本是持续更新中的，所有有非常多的版本可供选择，不过对于这种主要靠插件来生存的开源工具，我非常不建议使用最新版本，因为很多插件可能根本没有适配新版本，所以选择最稳定的版本才是最好的，经过我多个版本的尝试，发现了一个比较合适的版本（这个版本也是我 Windows 上面安装的时候默认安装的版本），这个版本就是 2.164.3，所以选择对应的 tag 就行了，不过这里需要注意镜像不是官方仓库的，而是 jenkins 下面的 jenkins。
```shell
docker pull jenkins/jenkins:2.164.3
```

### 创建本地挂载卷
由于 Jenkins 有很多的插件需要安装，还有使用的时候会创建很多的数据，需要保存，所以在运行的时候必须挂载到本地，这个挂载卷在 Jenkins 的 Dockerfile 里面也可以看到被设置成了挂载卷。

所以，先在本地创建一个挂载卷，自己随便给个名字：
```shell
docker volume create jenkins_default
```

## 运行容器

### 启动容器
启动一个 Jenkins 容器最主要的命令参数就是端口映射，为了持久化，选择挂载卷，我使用的命令如下：
```shell
docker run --name my_jenkins -p 8080:8080 -p 50000:50000 \
-v jenkins_default:/var/jenkins_home \
--restart=always -d \
docker.io/jenkins/jenkins:2.164.3
```

上面的命令中 -p 即使端口映射，其中8080端口是运行 Jenkins web 服务的端口，到时候可以使用这个端口登陆页面；-v 参数就是挂载卷了，把指定的容器目录挂载到自己创建的卷上面即可；`--restart=always` 表示的是随系统自启动，-d 表示后台运行容器

### 初始化 jenkins

容器启动之后，可以在浏览器输入 ip:8080 启动 jenkins 服务，等待一段时间让服务初始化一下，然后会看到一个提示要输入初始化密码的表单，这个密码可以根据提示到容器中指定目录中查看，也可以直接在本机的挂载目录中查看，我选择后者。

首先查看挂载目录的地址，命令及结果如下：
```
[root@CentOS-1 ~]# docker volume inspect jenkins_default
[
    {
        "Driver": "local",
        "Labels": {},
        "Mountpoint": "/var/lib/docker/volumes/jenkins_default/_data",
        "Name": "jenkins_default",
        "Options": {},
        "Scope": "local"
    }
]

```

可以看到挂载的卷的路径是 `/var/lib/docker/volumes/jenkins_default/_data` 接着按照提示的目录查看对应位置的文件即可看到密码：
```
[root@CentOS-1 secrets]# cd /var/lib/docker/volumes/jenkins_default/_data
[root@CentOS-1 _data]# cat secrets/initialAdminPassword
72012733f08044dc990353c3febe9be8
```

填写完密码之后就是选择按照插件的步骤了，插件后面可以自己安装，所以这里我选择了安装0个插件，直接跳过了插件安装步骤，进入了设置管理账号添加的界面，添加一个账号就行了。

### 修改插件源

上面之所以我跳过了插件安装的过程是因为我之前安装的时候就发现了，国内的话，使用默认的插件源很可能出现请求超时的问题（毕竟墙厚，认怂），所以需要更换一下插件源。

进入“插件管理”的高级设置“Advanced”，然后拉到页面最下面就是设置源的地方，可以将默认的源更换成国内的：
```
https://mirrors.tuna.tsinghua.edu.cn/jenkins/updates/update-center.json
```
### 安装插件
安装插件需要根据自己的需求去安装，插件除了可以直接在插件管理里面搜索安装之外，还可以使用高级功能，直接上传插件的安装包进行安装，不过插件之前都有一些依赖关系，所以优先选择使用管理里面的安装，因为会自动安装依赖的插件，当这种方式安装失败的时候再使用插件包的安装方式，哪个失败了就去安装哪个。

我一般第一个必须按照的插件就是中文支持插件，特别是比较新的 Jenkins 版本，全是英文的，我都会第一时间去安装中文插件。之前在网上搜索说支持中文的插件可以搜索 `locale`，不过经过几次实验发现这个插件有时候根本没用，而且就是有中文也不是全部的中文，比较是个多语言支持的插件，不是针对中文的，所以支持的不够好，不过后来我查到了一个专门的中文支持插件，名字是  Localization: Chinese (Simplified)  这个插件看名字就知道，就是为了中文而生的，是 Jenkins 中文社区的插件，安装之后重启一下就行了，就可以发现界面都汉化了，而且翻译的也比较靠普。

其他的插件就看个人需要了，反正 Jenkins 的插件几千个，总有你需要的。 

### 使用 docker-compose
上面是直接启动的 Jenkins 容器，虽然也没有任何问题，但是为了更方便的启动容器以及实现版本控制，可以创建 docker-compose.yml 文件来启动容器，这样方便管理配置项，也便于其他人知道这个容器的启动使用了一些什么参数，我的 yml 文件如下：
```yml
version: "3"
services:

  jenkins:
    restart: always
    image: jenkins/jenkins:2.164.3
    container_name: my_jenkins
    volumes:
      - jenkins_default:/var/jenkins_home
    ports:
      - "8080:8080"
      - "50000:50000"

volumes:
  jenkins_default:
```
## 其他

### 资源整理
- Jenkins 项目资源：<https://github.com/jenkinsci> 
- Jenkins 插件文档：<https://plugins.jenkins.io/>

总结：使用 docker 启动 jenkins 非常的简单，也不用单独去配一个 Java 环境和安装 Jenkins，不过用容器运行 Jenkins 也是局限性非常大，最局限的问题在于容器的环境是隔离的，如果不做特殊处理（安装构建需要的其他软件，比如 docker、nodejs 等），无法进行很多本机上的操作，不过这个也不算问题，因为可以设置 Jenkins 分机，涉及某些操作的任务可以分派给指定的分机去执行。