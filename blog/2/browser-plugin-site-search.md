# 浏览器插件开发：一个简单的站外搜索插件

## 前言

继上次突发奇想使用 ChatGPT 成功开发出一个满足我个人需求的浏览器插件之后，我就对浏览器插件的开发有了一定了解，也基本掌握了插件开发流程。今天继续来分享新鲜出炉的浏览器插件，依旧是熟悉的配方，纯依靠 ChatGPT 开发，插件的功能是实现任意网站的站外搜索。

插件源码已发布到 github：[SiteSearch](https://github.com/Hopetree/SiteSearch "SiteSearch")

## 我的需求

我的需求就是实现任意网站的站外搜索功能，所谓的“站外搜索”当然是相对于“站内搜索”而言的，“站内搜索”一般是平台自带的搜索功能，需要平台自己实现，比如我的博客网站就有站内搜索。而“站外搜索”就是利用搜索引擎的搜索功能来搜索网站的内容，比如 v2ex 里面内嵌的搜索功能，其实就是跳转到 Google 搜索，效果如下：

这里是网站里面的搜索框：

![v2ex搜索框](https://cdn.jsdelivr.net/gh/Hopetree/blog-img@main/2024/202501151059273.png)

这里是点击搜索后新开的页面，直接到了搜索引擎里面搜内容：

![v2ex搜索](https://cdn.jsdelivr.net/gh/Hopetree/blog-img@main/2024/202501151056883.png)

这里其实也很简单，就是打开搜索引擎，然后以 `site:xxx.xxx` 开头，然后加上搜索的内容就是搜索某个网站在搜索引擎中收录的内容，这就是所谓的“站外搜索”。


## 功能开发

老规矩，给 ChatGPT 提需求，它来实现功能，具体的过程就不表了，反正我主打的就是一个零代码输出。

不过这次有点不同，我给了 ChatGPT 一个截图，让它实现我要的搜索框的效果，我给的截图是 newtab 的搜索框，预期效果如下：

![搜索效果图](https://cdn.jsdelivr.net/gh/Hopetree/blog-img@main/2024/202501151102838.png)

然后 ChatGPT 直接给我实现了这个效果，相当满意，插件的效果如下：

![插件效果](https://cdn.jsdelivr.net/gh/Hopetree/blog-img@main/2024/202501151104745.png)

搜索的效果：

![搜索结果](https://cdn.jsdelivr.net/gh/Hopetree/blog-img@main/2024/202501151347596.png)

插件的主要功能点：

1. 支持选择搜索引擎
2. 支持记住上一次使用的搜索引擎
3. 支持按照内容搜索全站，如果内容为空就是直接搜索全站
4. 可以点击搜索，也可以直接键盘输入 enter 进行搜索