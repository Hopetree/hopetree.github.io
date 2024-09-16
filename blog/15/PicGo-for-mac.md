# Mac 使用图床神器 PicGo 的踩坑指南

PicGo 是一个用于快速上传图片并获取图片 URL 链接的工具。经常使用 Markdown 写博客的都应该对图床非常熟悉了，但是每次上传图片到自己的图床都要经历打开网站，登录账号，选择 Bucket，上传图片，复制地址，转化成 Markdown 语法等一系列操作。

而 PicGo 就是简化这些操作，只需要简单的上传图片，就能得到一个 Markdown 语法的地址，并且 PicGo 支持配置多种图床，可谓真正的“麻雀虽小，五脏俱全”。

## Mac 安装

### 安装方式选择

1、使用 brew 命令安装：

```bash
brew install picgo --cask
```

不过这个方式下载包有点慢，至少是你不太好控制下载的包源，所以不太推荐。

2、直接下载安装包：

下载地址：[https://github.com/Molunerfinn/PicGo/releases](https://github.com/Molunerfinn/PicGo/releases "https://github.com/Molunerfinn/PicGo/releases")

根据自己系统类型选择即可，比如我是 M1 的系统，所以选择 arm64.dmg 的就行。

### 解决打开报错问题

下载之后直接安装即可，此时打开会报错：Picgo.app 文件已损坏，您应该将它移到废纸篓。

这是因为 macOS 为了保护用户不受恶意软件的攻击，macOS 会阻止安装未经过苹果认证的应用程序。

此时只需要在命令行中执行一个命令即可：

```bash
sudo xattr -d com.apple.quarantine "/Applications/PicGo.app"
```

执行完成后，再打开 Picgo.app 就可以正常使用了。

## 配置七牛云

直接参考官方文档：[七牛图床](https://picgo.github.io/PicGo-Doc/zh/guide/config.html#%E4%B8%83%E7%89%9B%E5%9B%BE%E5%BA%8A "https://picgo.github.io/PicGo-Doc/zh/guide/config.html#%E4%B8%83%E7%89%9B%E5%9B%BE%E5%BA%8A")

![](https://cdn.jsdelivr.net/gh/Hopetree/blog-img@main/2024/03/20240301_110648 (1).png)


### 存储区域的填写

可以在自己的空间里面看到自己空间的区域，然后可以看下面这个区域对照表填写，当然，你用可以查看当前页面的调试模式查看七牛的接口里面返回的区域码（我就是用的这个方式，最准确。）

![](https://cdn.jsdelivr.net/gh/Hopetree/blog-img@main/2024/03/20240301_110035 (1).png)

- 华东：z0
- 华北：z1
- 华南：z2
- 北美：na0
- 东南亚：as0