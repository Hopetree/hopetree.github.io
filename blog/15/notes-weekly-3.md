# 烂笔头周刊（第3期）：笔头没烂，周刊倒是几乎烂尾

## 一些感想

真是难以置信，距离上一次更新这个系列的文章居然是时隔快两年了，当初想着学习阮一峰大佬的《科技爱好者周刊》自己也搞个周刊玩玩，主要是为了督促自己把工作和日常中所见所闻还有所学所用的知识点记录下来，但是没想到还是烂尾了……

我们经常会说“万事开头难”，但其实“打江山难，守江山更难”。自从我开始创建这个博客网站开始，也接触和见识到了很多跟我一样的个人博客建设者，他们好像都跟我一样，在博客创建的初期都很积极的更新博客分享自己的经验，但是随着网站的开发和完善告一段落，博客的更新也随之停滞，或者偶尔诈个尸，兴趣来了更新一篇博客，总之就是已经全然没有当初创建网站初期的那种积极性了。

正因如此，我更加佩服那些能够为一件事持续的坚持的人，比如阮一峰的周刊，每周一更，几乎无一例外。所以，可想而知，那些完全没有利益关系的开源项目维护者，为了维护开源项目所花费的精力和时间，如果不是真的热爱，是真的很难坚持下去。

回归正题，本期主要分享的东西是近期自己在项目和工作中的一些经历。

## 技能分享

### 1. Dockerfile 里面 ARG 的妙用

在 Dockerfile 里面可以使用 ARG 关键字来定义变量，而且使用这个关键字命令的变量可以在构建镜像的时候被重新设置变量值。

使用过 pip 的人应该都知道，在国内使用 pip 安装 python 依赖是需要设置源的（其实不仅仅是 pip 命令，包括其他涉及到源的都一样），而我的 Dockerfile 里面就要使用 pip 命令来安装依赖。

先来看看我在使用 ARG 关键字之前的 Dockerfile 内容:

```dockerfile
FROM python:3.9
ENV PYTHONUNBUFFERED=1
WORKDIR /opt/cloud/izone

RUN cp /usr/share/zoneinfo/Asia/Shanghai /etc/localtime
COPY requirements.txt requirements.txt
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
```

我这里是没有设置 pip 源的，因为我需要在 github 上使用 action 构建镜像，由于 github 本身就是国外的，所以使用默认的源没有任何问题，但是我在本地和服务器(阿里云)构建的时候都需要设置源，此时我就需要在第一次拉代码的时候执行一下额外的命令做这个事情，命令如下：

```bash
sed -i 's/RUN pip install --no-cache-dir -r requirements.txt/RUN pip install --no-cache-dir -r requirements.txt -i http:\/\/pypi.douban.com\/simple --trusted-host pypi.douban.com/' Dockerfile
```

这个就是很简单的使用 sed 命令来将原本没有设置 pip 源的命令替换成设置了豆瓣源的命令。

再来看看我修改之后的 Dockerfile 文件：

```dockerfile
FROM python:3.9
ARG pip_index_url=https://pypi.org/simple
ARG pip_trusted_host=pypi.org
ENV PYTHONUNBUFFERED=1
WORKDIR /opt/cloud/izone

RUN cp /usr/share/zoneinfo/Asia/Shanghai /etc/localtime
COPY requirements.txt requirements.txt
RUN pip install --no-cache-dir -r requirements.txt --index-url $pip_index_url --trusted-host $pip_trusted_host
COPY . .
```

这里主要的修改就是使用 ARG 设置了默认的 pip 源为官方的，但是由于使用了 ARG 设置参数，所以这个变量的值可以在执行 `docker build` 的时候进行覆盖，这样一来，我就可以在国内构建镜像的时候重新设置源，比如我的构建命令如下：

```bash
docker build --build-arg pip_index_url=http://pypi.douban.com/simple --build-arg pip_trusted_host=pypi.douban.com -t hopetree/izone:lts .
```

其中 `--build-arg`参数就是用来覆盖 Dockerfile 里面使用 ARG 设置的变量值。

**小结**：类似的用法还很多，简单来说就是当构建镜像的时候某些参数需要根据不同场景来设置的时候都可以使用 ARG 来设置变量。

### 2. `.dockerignore` 文件的作用

经常使用 git 的人应该都知道项目里面都是需要创建 `.gitignore` 文件的，该文件用来在提交代码到 git 的时候忽略某些文件，比如一些安装依赖、临时文件、构建产物等等。同理，`.dockerignore` 文件就是在镜像 docker 的构建的时候忽略某些文件的定义文件。

前段时间我在 github 上 fork 了一个前端项目，我把项目拉到本地执行 `npm` 构建都是没问题的，但是我使用自己创建的 Dockerfile 文件去构建镜像的时候老是发现构建之后的 dist 目录里面缺少内容，但是一度以为是自己使用的 docker 基础镜像不对，可能是 node 版本不符合要求导致的（由于自己对前端了解不深，只能产生这种怀疑）。后来我试过好几个版本的基础镜像，甚至直接把基础镜像的 node 环境保持跟我本地一模一样，但是依然是打包之后缺少文件。

后面折腾了几个小时都没找打问题，然后在原项目提了一个 [issues](https://github.com/jaywcjlove/reference/issues/380 "issues") 去咨询作者，后面得到了作者的提示，让我去检查在 COPY 的时候是否有漏掉什么文件，其实我之前自己在 Dockerfile 里面就每做一个步骤打印了一下当前目录的结构进行了核对，当时是自己核对漏掉了关系的目录。后面经过提醒，我再次核对发现的确是漏掉了 docs 目录（该目录里面的内容是项目打包的关键输出），而这个目录一般都是 github 上作为说明文档的目录，很多时候是在 `.dockerignore` 被忽略掉的，这个项目也是如此，所以才导致我在构建的时候直接缺少了 docs 目录里面的内容。

后来作者也知道了这个地方的确是有问题的，所以进行了修复操作，将 `.dockerignore` 里面添加的 docs 去掉了。

**小结**：我们在给项目创建 `.dockerignore` 和 `.gitignore` 这类过滤文件的时候，还是应该在使用模板或者复制其他项目的文件的时候需要结合自己项目的情况进行核对和检查，避免出现类似情况。

### 3. 项目设置多个代码仓库

众所周知，github 在国内如果不使用代理访问的话，经常会抽风，虽然我本地是有代理所以无压力，但是我经常需要在阿里云服务器上拉代码进行本地镜像构建，这就导致经常会出现从 github 拉代码超时，每次拉代码感觉都是在碰运气。

其实可以利用国内的代码仓库 gitee 来同步管理远程代码，具体就是本地的代码仓库同时添加 github 和 gitee 作为远程仓库，每次提交的时候都同时给两个远程仓库提交代码，这样就可以保证两边代码同步。于是，服务器上就完全不需要从 github 去拉代码，而是直接从 gitee 拉代码。

我本地项目做的事情：

```bash
# 先删除origin远程，这个是之前添加为github的
git remote remove origin
# 重新添加origin为gitee的仓库
git remote add origin git@gitee.com:hopetree-gitee/izone.git
# 再添加一条github的
git remote add github git@github.com:Hopetree/izone.git
```

至此，本地就绑定了两个远程仓库，后面要推送代码就可以分别给两边推送。

**小结**：其实作为在国内的用户，我们应该认清一个事实，那就是 github 迟早会在不使用代理的情况下完全不可用，所以早日使用上 gitee 这种国内的仓库管理很有必要，倒不是说完全弃用 github，而是将代码两边同时推，这样可以保证某些无法科学上网的人也能正常访问自己的代码。

### 4. Django 的信号的使用

其实我的项目很早就使用了 Django 的信号，就是在生成评论之后根据不通的场景去创建消息通知，这个之前也分享过。

这次设置信号是为了实现一个功能：当有新用户创建的时候，给新用户随机分配一个头像，而不是统一分配默认的头像。

这次的方案完全是 ChatGPT 给我提供的，因为我差不多已经忘记了信号的使用。

先来看看在用户应用下面新增加的一个文件的内容

```python
# oauth/signals.py
# -*- coding: utf-8 -*-
import random
from django.db.models.signals import pre_save
from django.dispatch import receiver
from .models import Ouser


@receiver(pre_save, sender=Ouser)
def generate_avatar(sender, instance, **kwargs):
    if instance._state.adding:
        # 随机选择一个头像地址
        random_avatar = 'avatar/default{}.png'.format(random.randint(1, 10))
        instance.avatar = random_avatar

```

这里使用到了 `pre_save` 信号，也就是在创建一个实例之前会调用，这里需要判断 `instance._state.adding` 是为了保证只有第一次创建的时候才执行后续逻辑，而如果是更新操作就不要执行。这个判断 ChatGPT 在我要求仅创建时执行的补充需求下写的，如果不是 ChatGPT 给我写，我根本不知道可以这样用，因为我之前使用过 `post_save` 信号，里面判断是不是创建是可以通过一个 cteated 参数来判断的，但是我试过`pre_save` 信号的没有这个参数。

然后可以在 models.py 或者 views.py 里面去添加这个 signals 的引用即可，但是我发现我把引用放到 models.py 里面的时候会产生循环引用的错误，这是因为 signals.py 里面引用了 Ouser 然后自己又调用，就会循环引用。

此时我让 ChatGPT 给我提供一个官方推荐的引用方案，它给了我方案，而且是我完全没见过的：

```python
# oauth/apps.py
from django.apps import AppConfig


class OauthConfig(AppConfig):
    name = 'oauth'
    verbose_name = '用户管理'

    def ready(self):
        from . import signals  # 导入信号处理程序模块

```

**小结**：ChatGPT 给的方案是在应用程序的 apps.py 文件中注册信号处理程序，这个方式就是添加一个 ready 函数，在这个里面添加信号模块的倒入，这个方式真的非常的优雅。

### 5. 代码块显示苹果样式

之前见过一些网站的代码块可以显示苹果的按钮样式，感觉效果很扁平，但是之前我见过的就是使用的背景图片实现的，最近看到一个项目发现其实直接 css 就可以，于是给自己的代码块加了样式。

```css
.code-wrapper:before {
    margin-top: 0.5rem;
    margin-left: 1rem;
    content: " ";
    -webkit-border-radius: 50%;
    background: #fc625d;
    width: 0.7rem;
    height: 0.7rem;
    -webkit-box-shadow: 20px 0 #fdbc40, 40px 0 #35cd4b;
}
```

## 开源项目

### [1. Hub Mirror Action](https://github.com/Yikun/hub-mirror-action)

项目介绍：一个用于在hub间（例如Github，Gitee）账户代码仓库同步的action

项目体验：这个项目不仅仅是可以将一个项目同步到另一个平台，而是可以直接将一个平台的所有项目同步到另一个平台，比如将自己 github 上所有的项目同步到 gitee。而且是使用的 github actions 的方式，可以做到自动同步，定时同步等效果。

下面是我之前添加的 actions 内容：

```yaml
name: Github sync to Gitee

on:
  push:
    branches:
      - master

jobs:
  build:
    if: github.repository == 'Hopetree/izone'
    runs-on: ubuntu-latest
    steps:
      - name: Mirror the Github organization repos to Gitee.
        uses: Yikun/hub-mirror-action@master
        with:
          src: github/Hopetree
          dst: gitee/hopetree-gitee
          dst_key: ${{ secrets.GITEE_PRIVATE_KEY }}
          dst_token: ${{ secrets.GITEE_TOKEN }}
          force_update: true
          static_list: "izone"
```

其实最开始我想要让自己的 github 代码同步到 gitee 不是通过本地同时给两边推送，而是在 github 设置了一个 actions 来自动同步到 gitee，于是找到了这个开源项目提供的 actions。

### [2. Quick Reference](https://github.com/jaywcjlove/reference)

![reference](https://tendcode.com/cdn/article/2306/reference.png "reference")

项目介绍：为开发人员分享快速参考备忘清单【速查表】。该项目其实就是一个命令速查网站，也可以当作一个 wiki 网站使用，作者收集了很多常用的编程命令和工具的常用命令。

项目体验：可以直接用作者的项目构建成自己的网站，也可以自己 fork 之后当作备忘录或者笔记、文档之类的来用，颜值很高，非常符合我的审美。


### [3. GitHub Readme Stats](https://github.com/anuraghazra/github-readme-stats)

项目介绍：在你的 README 中获取动态生成的 GitHub 统计信息！

项目体验：直接看效果吧！很多人的 GitHub 显示的项目统计图就是这个项目生成的。

![GitHub stats](https://tendcode.com/cdn/article/2306/github-me-start.png)