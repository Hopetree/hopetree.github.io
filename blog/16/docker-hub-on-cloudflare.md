# 使用 Cloudflare 搭建自己的 Docker Hub 镜像代理

Cloudflare是一家提供内容分发网络（CDN）、互联网安全性、抗DDoS（分布式拒绝服务）和分布式DNS服务的美国公司。Cloudflare 提供了很多免费使用的功能，个人用户可以很好的白嫖它的服务，因此Cloudflare又称“赛博佛祖”。

本文分享一下使用Cloudflare搭建Docker Hub 镜像代理的方法。

## Cloudflare 常用操作

### 添加域名

Cloudflare 可以作为域名解析服务使用，可以将自己的域名托管到 Cloudflare 平台，具体方式如下：

第一步：在 Cloudflare 中添加一个网站（域名）

![](https://tendcode.com/cdn/2024/04/202407081305140.png)

此时会给你分配两个 DNS 地址

第二步：在域名服务平台替换 DNS 服务名称为 Cloudflare 提供的，比如我的域名是阿里云注册的

![](https://tendcode.com/cdn/2024/04/202407090900035.png)

第三步：回到 Cloudflare 刷新并等待域名解析，当域名状态为激活状态则表示托管成功

### 创建 Pages

Pages 是静态网站托管功能，可以非常方便的部署一个 GitHub  上面的静态网站项目，只需要绑定自己的 GitHub 账号，然后选择一个自己的项目，就可以轻松部署上线并获得 Cloudflare 免费提供的域名作为网站访问地址。

首先创建一个 Page，此时需要连接到 Git，可以直接使用 Github 账号绑定：

![](https://tendcode.com/cdn/2024/04/202407081119520.png)

然后选择一个自己的项目进行部署，选择之后会让你根据项目的类型选择部署方式，包括打包命令和资源目录的选择等。

![](https://tendcode.com/cdn/2024/04/202407081120400.png)

![](https://tendcode.com/cdn/2024/04/202407081123298.png)

部署完成之后，会自动生成一个域名，访问域名即可访问网站。

在部署完成后，还可以配置自己的域名（前提是自己的域名已经托管到 Cloudflare）以方便自己访问，此操作完成后，使用默认给的域名和自己配置的子域名都可以访问网站：

![](https://tendcode.com/cdn/2024/04/202407081124383.png)

### 创建 Worker

Worker 提供 Serverless 服务，可以直接使用 JavaScript 启动一个服务，现在也支持 Python 启动服务。

首先创建一个 Worker：

![](https://tendcode.com/cdn/2024/04/202407081114513.png)

然后输入 js 代码（一般是别人提供的，GitHub 上面有很多）：

![](https://tendcode.com/cdn/2024/04/202407081113135.png)

然后一直往下一步即可，部署完成之后可以直接访问。

### 给 Worker 添加自定义域名

Pages 服务部署之后可以在配置中直接添加自定义域名，而 Worker 服务没有此项配置，但是 Worker 服务一样可以配置自定义域名，步骤如下：

Step1: 添加一个域名解析规则

进入自己托管的域名，进入 DNS 的记录中，添加一个规则，类型为 A，名称就是子域名的前缀，比如 dockerhub，内容可以随便填写一个IP，这个IP实际上不会用到，比如推荐的是 192.0.2.1，然后开启橙色云。

![](https://tendcode.com/cdn/2024/04/202407081131289.png)

Step2: 添加路由到 Worker

还是在域名管理的页面，进入 Workers 路由管理页面，添加一个路由：

![](https://tendcode.com/cdn/2024/04/202407081133563.png)

此时填写路由规则，也就是第一步配置的子域名的完整域名，后面加上反斜杠和星号，比如子域名是 `github.abc.com` 就填写 `github.abc.com/*`，然后选择要路由的 Worker 服务即可。

![](https://tendcode.com/cdn/2024/04/202407081136892.png)

这两个步骤完成之后，就可以通过自己的子域名来访问 Worker 页面了。

## Cloudflare 实战项目演示

### 创建 dockerhub 代理

使用 docker 的应该都知道，前段时间开始国内的众多镜像仓库都宣布关闭了，导致国内拉取镜像出现超时问题，而这个项目可以使用 Cloudflare 部署一个官方镜像仓库的代理，让国内用户可以直接使用。

项目地址为：[https://github.com/cmliu/CF-Workers-docker.io](https://github.com/cmliu/CF-Workers-docker.io "https://github.com/cmliu/CF-Workers-docker.io")

使用方式如下：

1. 将项目 fork 到自己的 github 账号下
2. 使用 Cloudflare 的 Pages 服务部署该项目
3. 配置自己的域名作为自定义域名（可选）
4. 在 `/etc/docker/daemon.json` 中配置部署生成的地址，并重启 docker 服务

网站部署效果：

![](https://tendcode.com/cdn/2024/04/202407081255733.png)

### 创建 github 代理

国内用户不用魔法的话，目前访问 github 也经常出现超时问题，特别是要拉取项目代码的时候，这个时候就可以使用 Cloudflare 做一个代理。

项目地址：[https://github.com/hunshcn/gh-proxy](https://github.com/hunshcn/gh-proxy "https://github.com/hunshcn/gh-proxy")

1. 直接复制项目中 index.js 内容备用
2. 使用 Cloudflare 创建一个 Worker，将 index.js 粘贴到 worker.js 中，然后部署项目
3. 配置自己的域名作为路由（可选）
4. 使用项目地址访问 github 资源

网站部署效果：

![](https://tendcode.com/cdn/2024/04/202407081251648.png)

::: primary 提示

非常可惜的是，目前我发现使用 Cloudflare 部署的 Pages 项目使用默认的域名和自定义域名都可以访问，但是使用 Worker 部署的应用无论使用默认域名还是自己定义的域名都不能访问（需要魔法），因为两种方式给的域名后缀不同，想必是国内把 Worker 的域名禁用了还是怎么的。

:::

### 部署 vitepress 项目

vitepress 项目是一个文档网站的框架，可以使用 github 提供的编排能力部署到 github 作为自己的主页，比如我的是这个 [https://hopetree.github.io/](https://hopetree.github.io/ "https://hopetree.github.io/")，具体的方法可以自行搜索 github 部署个人主页的方式了解。

这里使用 Cloudflare 来部署 vitepress 项目，步骤如下：

1. github 中创建并调试 vitepress 项目，保证项目可以运行
2. 使用 Cloudflare 的 Pages 服务部署该项目，部署的时候选择 vitepress 项目框架，此时需要填写构建命令和输出配置，具体根据自己项目的构建命令填写 ![](https://tendcode.com/cdn/2024/04/202407081300093.png)
3. 配置自己的域名作为自定义域名（可选）

项目效果：

![](https://tendcode.com/cdn/2024/04/202407081302233.png)

## Awesome Cloudflare

想尝试更多可以部署到 Cloudflare 上的服务可以收藏这个项目 [Awesome Cloudflare](https://github.com/zhuima/awesome-cloudflare "Awesome Cloudflare") 进行体验，该项目收集了很多可以快速部署的应用。

## 参考文章

- [吊打公有云的赛博佛祖 Cloudflare](https://zhuanlan.zhihu.com/p/690622926 "吊打公有云的赛博佛祖 Cloudflare")