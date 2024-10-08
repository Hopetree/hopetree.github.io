# 使用 PicGo 配置 GitHub 图床

## 前言

之前我文章分享过，由于网站备案被注销，导致七牛云的空间里面配置的子域名被冻结，进而导致我博客中使用的七牛云的图床访问全部失效，博客基本属于瘫痪状态。

图床失效这个问题可以说是影响相当大，比备案注销本身的影响还大。以至于我不得不临时关掉网站解决图床问题，不过当时我很快就找到了解决方案，就是把图床的文件使用 `rclone` 全部同步到本地，然后使用本地文件访问图床资源就行了。

但是我后来又想了很多关系网站备案的事情，假设后续由于备案或者其他原因导致我不得不放弃使用服务器和域名，那么我的网站内容是否有其他方式保留下来？

带着这个问题，我想到了一个比较稳妥的方案，就是将博客内容定期导出成静态网站的格式，反正主要内容就是 markdown，现代静态博客都是支持的，唯一需要解决的问题就是内容中使用的图床地址，于是我开始研究免费图床……

而将 GitHub 当做免费图床可谓是一种相当稳妥的方案。

## GitHub 图床配置步骤

### 1. 创建一个图床项目

其实图床的本质就是文件访问，而 GitHub 作为代码托管平台，本身就可以上传图片然后供人访问，所以 GitHub 本身就是一个图床。

为了方便管理自己的图床文件，可以单独创建一个项目只放静态资源，比如我创建了一个名为 img 的项目：

![](https://cdn.jsdelivr.net/gh/Hopetree/blog-img@main/2024/202409141318014.png)


我们只需要在项目中上传图片，然后就可以使用 GitHub 的地址访问图片，并且更重要的是这种图片地址也是可以直接被自己的博客引用的。

### 2. 创建一个 token

虽然我们创建了项目并可以直接上传图片访问，但是这种方式非常麻烦，每次上传图片都要登录 GitHub 上传，引用也要自己手动去设置格式，所以我们需要实现自动化。

直接访问 GitHub 的配置地址：[https://github.com/settings/tokens?type=beta](https://github.com/settings/tokens?type=beta "https://github.com/settings/tokens?type=beta") 来创建一个 token

![](https://cdn.jsdelivr.net/gh/Hopetree/blog-img@main/2024/202409141324091.png)

可以给这个 token 赋权给所有项目，也可以单独选择赋权给图床这一个项目，然后添加权限点，至少需要将 `Contents` 这里设置成读写。

![](https://cdn.jsdelivr.net/gh/Hopetree/blog-img@main/2024/202409141326369.png)

然后复制保存一下生成的 token 备用。

### 3. PicGo 添加 GitHub 配置

首先在 PicGo 设置中勾选上 GitHub

![](https://cdn.jsdelivr.net/gh/Hopetree/blog-img@main/2024/202409141329525.png)

然后在 GitHub 配置中添加配置：

- 图床配置名：按需取名即可
- 设定仓库名：格式是用户名/仓库名
- 设定分支名：分支名如 master 或 main
- 设定Token：这个就是在 GitHub 创建的 token
- 设定存储路径：项目中的路径，从项目的首层开始
- 设定自定义域名：设置代理地址，用来加速访问，格式参考 `https://cdn.jsdelivr.net/gh/Hopetree/img@main`

![](https://cdn.jsdelivr.net/gh/Hopetree/blog-img@main/2024/202409141330095.png)

这里需要注意的就是自定义域名的配置，这个配置就是 GitHub 当做图床的精髓所在。经常访问 GitHub 的都知道，GitHub 现在是越来越难不适用魔法访问了，更别说当做图床来访问，但是很幸运的是，有一些 CDN 服务商提供了专门用来代理访问 GitHub 的专用 CDN，只需要使用这些代理地址就可以快速访问 GitHub 资源。

我这里收集了两个地址：

```text
https://cdn.jsdelivr.net/gh/
https://cdn.jsdmirror.com/gh/
```

使用方法一致，比如 GitHub 原始地址是

```text
https://github.com/Hopetree/img/blob/main/tmp/202409091126166.png
```

则使用代理的地址就是

```text
https://cdn.jsdelivr.net/gh/Hopetree/img@main/tmp/202409091126166.png
```

PicGo 配置完成后可以直接上传文件验证一下，正常的话，文件会自动上传到 GitHub 中并显示上传提交信息为“Upload by PicGo”，并且可以在 PicGo 中得到一个经过代理转换后的图片地址，可以直接放到 markdown 中使用。

## 后续

GitHub 图床的关键其实在于代理访问，毕竟是图片资源，如果访问速度不行或者必须依靠魔法访问那基本也没啥用。

搞定了 GitHub 图床之后，我想的是后续实现自动将七牛云的图床文件同步到 GitHub 中，这样一旦七牛云图床失效，只需要修改一下图片的前缀就可以实现图床切换，而这个前缀替换可以直接使用 Nginx 配置解决，或者随便写个脚本正则匹配后搞个 `replace` 替换就行，具体操作后续如果我做了可以再写个文章分享一下。