# 烂笔头周刊（第1期）：好记性不如烂笔头

## 前言

自己平时摸鱼或者自由时间都会浏览一些比较感兴趣的博客文章，也会无意间发现一些比较有用的文章或者工具，但是大部分情况都是当时称赞连连，事后很容易忘记，后面再想找的时候不一定能记得。

正所谓“好记性不如烂笔头”，再好的记忆也有被清除的时候，因此，我决定把自己平时看到的一些有意思或者有用的文章以及工具都记录下来，然后统一到一个时间汇总分享一次，目前定的时间是每两周分享一次，取名为“烂笔头周刊”，希望自己坚持更新下去。


## 工具

### 1、[Fiddler Everywhere](https://juejin.cn/post/6888863697129701389)

![Fiddler Everywhere](https://cdn.jsdelivr.net/gh/Hopetree/blog-img@main/181c751122594c52aa9603fa49760319_tplv-k3u1fbpfcp-watermark.png)

多平台通用的免费抓包工具，功能跟fiddler类似，同时结合了postman的能力。


### 2、[Playwright](https://juejin.cn/post/6906866546094637064)

![Playwright](https://cdn.jsdelivr.net/gh/Hopetree/blog-img@main/91da3a38f52f4c598fd34017b7139b1d_tplv-k3u1fbpfcp-watermark.gif)

Playwright是一个强大的Python库，仅用一个API即可自动执行Chromium、Firefox、WebKit等主流浏览器自动化操作，并同时支持以无头模式、有头模式运行。

Playwright提供的自动化技术是绿色的、功能强大、可靠且快速，支持Linux、Mac以及Windows操作系统。

### 3、[FinalShell](https://mp.weixin.qq.com/s/YH--5AvbJ-czA6AuliFVmw)

![FinalShell](https://cdn.jsdelivr.net/gh/Hopetree/blog-img@main/3c8b5603e0155f9b.webp)

FinalShell是一款免费的国产的集SSH工具、服务器管理、远程桌面加速的良心软件,同时支持Windows,macOS,Linux，它不单单是一个SSH工具，完整的说法应该叫一体化的服务器/网络管理软件。

FinalShell在很大程度上可以免费替代XShell，是国产中不多见的良心产品，具有免费海外服务器远程桌面加速,ssh加速,双边tcp加速,内网穿透等特色功能。

### 4、[kafka-map](https://mp.weixin.qq.com/s/BgAMA42LnhenreYpahmVLw)

![kafka-map](https://cdn.jsdelivr.net/gh/Hopetree/blog-img@main/eb4c3dd0fe8bf145.png)

kafka map是使用Java11和React开发的一款kafka可视化工具。

目前支持的功能有：

多集群管理，
集群状态监控（分区数量、副本数量、存储大小、offset），
主题创建、删除、扩容（删除需配置delete.topic.enable = true），
broker状态监控，
消费者组查看、删除，
重置offset，
消息查询（支持String和json方式展示），
发送消息（支持向指定的topic和partition发送字符串消息）

使用 docker-compose 快速部署：

```yaml
version: "3"
services:
  kafka_map:
    image: dushixiang/kafka-map:latest
    restart: always
    environment:
      DEFAULT_USERNAME: admin
      DEFAULT_PASSWORD: admin
    volumes:
      - ./data:/usr/local/kafka-map/data
    ports:
      - "8080:8080"
```

### 5、[Chanify](https://github.com/chanify/chanify)

Chanify 是一个简单的消息推送工具。每一个人都可以利用提供的 API 来发送消息推送到自己的 iOS 设备上。

这个工具可以自己部署服务，然后安装app到手机，就可以利用接口推送信息到app，该工具还有浏览器插件可用，可以更加方便地随时随地推送信息到自己到app中。

分享一下我在服务器上自己搭建服务的docker-compose.yml文件内容

```yaml
version: "3"
services:

  hao:
    restart: always
    image: wizjin/chanify:latest
    container_name: chanify
    command: serve --name chanify-aliyun --endpoint=http://xxx.xxx.xx.xxx:8006
    volumes:
      - ./data:/root/.chanify
    ports:
      - "8006:80"

```