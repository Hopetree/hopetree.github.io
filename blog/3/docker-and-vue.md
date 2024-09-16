# Jenkins 构建 vue 项目镜像并推送到阿里云镜像仓库

最近准备写一个只使用前端 vue 的项目，项目最终形态是一个导航页面，虽然页面很简单，但是为了学习一些 vue 的主要插件的用法，所以打算尽可能地使用更多的 vue 插件来完成。

正所谓两军交战，粮草先行，既然这个项目使用的是 vue，只涉及前端，所以最好的运行方式莫过于容器化，所以这里我把项目的基本结构创建了之后第一步就是创建 docker 支持，这样也方便随时部署到服务器。下面就来分享一下我构建 vue 项目的镜像并使用 Jenkins 推送到阿里云镜像仓库中的经验。

## 搭建 nodejs 环境
由于我项目推送到 github 上面的时候是不会推送 dist 目录（vue 项目打包文件，一般都不会推送到版本控制），所以在使用 Dockerfile 构建镜像之前必须先进行项目打包，这就依赖于 nodejs 环境。

### 安装 nodejs
安装 nodejs 的方式比较推荐的是直接下载官方的软件包解压到服务器，这里可以先创建一个目录用来当作 nodejs 的主目录（建议在 /usr 目录下创建）：

```bash
cd /usr && mkdir -p nodejs && cd nodejs
```

目录创建之后可以直接使用 wget 命令下载官方软件包，软件包的地址要根据自己需要的版本修改，我下载的版本是 10.16 的版本，命令如下:

```bash
wget https://nodejs.org/dist/v10.16.0/node-v10.16.0-linux-x64.tar.xz
```

这个时候软件包是在 /usr/nodejs 目录下面的，现在要开始进行解压，由于文件是 .tar.xz 的文件，所以需要先使用 xz 命令解压成 tar 压缩包，然后使用 tar 解压一次：

```bash
# 先解压成 tar 包
xz -d node-v10.16.0-linux-x64.tar.xz

# 接着解压成目录
tar -vxf node-v10.16.0-linux-x64.tar
```

解压之后 nodejs 的目录就已经好了，但是现在使用 node 命令是无法找到命令的，所以需要设置一下软链接，也就是把目前的 nodejs 目录的命令跟 /usr/bin 目录进行一下链接，依次执行下面两条命令即可：

```bash
ln -fs /usr/nodejs/node-v10.16.0-linux-x64/bin/node /usr/bin/node

ln -fs /usr/nodejs/node-v10.16.0-linux-x64/bin/npm /usr/bin/npm
```

这个时候可以试一下 node 和 npm 命令是否可以使用：

```bash
node -v
npm
```

### 配置 npm 源
由于 npm 的官方源在国内使用会非常慢（何止是慢，我深圳联通的网络根本就连不上），所以更换为国内源是非常有必要的，更换源（阿里源）的命令如下：

```bash
npm config set registry https://registry.npm.taobao.org/
```

更换完成之后可以查看一下 npm 的配置项，命令如下：

```
npm config ls

# 查看所有配置
npm config list -l
```

> 我在更换 npm 源之后发现一个问题，那就是配置的源好像只对当前用户生效，所以某个用户如果要使用 npm 命令需要再执行一次更换源命令，因此建议再使用 npm 命令之后先查看一下源配置信息，确保源已经更换为国内的。


## 镜像构建及推送

这里使用的是 Jenkins 创建镜像构建和推送的任务，任务主要包含以下几个操作步骤：

1. 拉取 [github 项目代码](https://github.com/Hopetree/hao)
2. 打包 vue 项目
3. 构建 vue 镜像
4. 推送镜像到阿里云镜像仓库

### 构建 vue 项目镜像

vue 项目最终打包出来的其实就是普通的 html 文件和一些镜像资源文件，所以要构建一个 vue 项目的镜像可以直接使用 nginx 基础镜像，需要做的事情就是把 vue 打包文件移动到指定目录，然后配置一个 nginx 的配置文件即可。

在 Jenkins 中创建一个自由风格的任务，任务中添加 github 拉取操作，然后添加一些构建镜像的操作。拉取 github 项目代码的配置这里就不介绍了，可以去看之前写过的文章。

打包 vue 的命令如下：

```bash
# 打包vue
npm install
npm run build
```

打包完成之后就能得到一个 dist 目录，然后就可以进行镜像构建，先来看一下我的 Dockerfile 文件（文件在 vue 项目中）做的操作：


```dockerfile
FROM nginx:latest
ARG from_dir=dist
ARG to_dir=/usr/share/nginx/html

COPY ${from_dir} ${to_dir}
```

其实要做的操作很简单，只有一个步骤，那就是把打包好的 vue 项目目录添加到 nginx 镜像中。下面是 Jenkins 上面进行镜像构建的命令：


```bash
# 构建镜像
image_ids=`docker images|grep hao|awk '{print $1}'`
[ ! -z "$image_ids" ] && docker image rm $image_ids
docker images
docker build -t hao --no-cache .
image_ids=`docker images|grep none|awk '{print $3}'`
[ ! -z "$image_ids" ] && docker image rm $image_ids
docker images
```

上面的构建命令其实就只有一条 `docker build -t hao --no-cache .` 我这里其他的命令主要是删除多余的（有时候构建失败或者取消构建生成的临时）镜像。

### 推送镜像到阿里云

我一直都是使用阿里云的镜像仓库存放自己的镜像，所以这里在构建镜像完成之后可以把本地镜像推送到镜像仓库。

首先，可以看一下镜像仓库中关于推送镜像的说明，这里是阿里云的说明:

![image](https://tendcode.com/cdn/article/190721/tendcode_2019-07-21_17-35-51.png)

由于这里需要使用到用户名和密码，所以在 Jenkins 中添加两个参数，一个为字符串参数，添加用户名，另一个添加密码参数，也即是密码，之后再命令行中可以使用这2个参数来取代自己的账号。

![user](https://tendcode.com/cdn/article/190721/tendcode_2019-07-21_17-39-01.png)

然后根据阿里云镜像仓库的提示添加推送镜像的命令：

```bash
# 推送镜像
_tag=latest
hao_image_id=`docker images|grep hao|awk '{print $3}'`
docker login -u ${DOCKER_LOGIN_USER} -p ${DOCKER_LOGIN_PW} registry.cn-shenzhen.aliyuncs.com
docker tag ${hao_image_id} registry.cn-shenzhen.aliyuncs.com/tendcode/hao:${_tag}
docker push registry.cn-shenzhen.aliyuncs.com/tendcode/hao:${_tag}
```

这样整个 Jenkins 任务的所有命令就完成了，可以愉快的开始进行镜像构建和推送了。


## 运行容器
镜像构建完成之后，可以进镜像生成容器来运行，由于这里的 vue 的镜像是一个基于 nginx 的，所以在运行的时候需要挂载一个 nginx 的配置文件运行，使用挂载而非直接把配置放到镜像里的原有是挂载的方式比较方便后期修改配置。

我的 vue 项目里面已经上传了一个简单的 nginx 的配置，这个配置就是专门针对 vue 项目使用的，所以挂载的时候可以直接挂载这个配置文件。

镜像上传到阿里云之后，可以拉取镜像到本地（当然直接使用本地的镜像也是一样）：

```bash
docker pull registry.cn-shenzhen.aliyuncs.com/tendcode/hao:latest
```


运行容器的命令如下：

```bash
docker run --name hao \
-p 80:80 \
-v /home/alex/workspace/nodejs-hao/hao.conf:/etc/nginx/conf.d/default.conf:ro \
-d --restart=always \
registry.cn-shenzhen.aliyuncs.com/tendcode/hao:latest
```

其中 -v 后面就是挂载配置文件的命令，这个挂载的文件写成绝对地址比较好。

容器运行之后，可以输入服务器（或者虚拟机）的 IP 地址，查看一下 vue 项目的运行页面。我这边的显示效果如下图：

![vue](https://tendcode.com/cdn/article/190721/tendcode_2019-07-21_17-53-40.png)


参考文章：

- CentOS7 安装 nodejs：<https://www.jianshu.com/p/2cf49bb13a5d>
- npm 更换源：<https://www.jianshu.com/p/309645729b2e>