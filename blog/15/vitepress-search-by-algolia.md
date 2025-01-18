# VitePress 网站配置 Algolia 搜索

## 前言

我的博客之前分享过将博客内容全量同步到 VitePress 文档网站的经验，我个人还是非常喜欢 VitePress 网站这种文档风格的样式的，虽然这个网站只是当做自己博客网站的一个备用，但是我还是尽量把网站的功能完善好，这次来分享一下给 VitePress 网站添加搜索的方式。

VitePress 网站可以进行的搜索配置方式可以见官方文档：[https://vitepress.dev/zh/reference/default-theme-search](https://vitepress.dev/zh/reference/default-theme-search "https://vitepress.dev/zh/reference/default-theme-search")

我这里使用 [Algolia Search](https://docsearch.algolia.com/docs/what-is-docsearch/ "Algolia Search")

我的文档地址：[https://hopetree.github.io/](https://hopetree.github.io/ "https://hopetree.github.io/")

## 配置 Algolia 的步骤

### 1. 提交申请

打开 Algolia 的网站提交一个申请，申请地址（科学上网）：[https://docsearch.algolia.com/apply/](https://docsearch.algolia.com/apply/ "https://docsearch.algolia.com/apply/")

![申请](https://cdn.jsdelivr.net/gh/Hopetree/blog-img@main/2024/202501160922480.png)

这里要填写的几个内容：

1. 网站地址
2. 个人邮箱
3. 项目地址
4. 确认项

提交成功后会得到一个说明，告知会通过邮件发送信息给你：

![提交成功](https://cdn.jsdelivr.net/gh/Hopetree/blog-img@main/2024/202501160921756.png)

### 2. 收取邮件

过几分钟你会收到一个邮件，大致内容如下：

![邮箱内容](https://cdn.jsdelivr.net/gh/Hopetree/blog-img@main/2024/202501160924046.png)

收到邮件不要急着回复，看邮件里面的信息有一条是：

```text
no need to respond until we process your application (typically 1-2 business days).
```

然后可以看邮件的内容说了他们需要的步骤是先用爬虫去爬数据，他们需要1-2个工作日进行准备工作，所以此时需要等待。

### 3. 收取配置信息

大概过一天你会收到一个回复邮件，邮件里面会提供一个 Algolia 的网站，打开该网站（需要登录）就可以看到给你提供的相关配置信息。

### 4. config.js 添加配置

按照配置示例补充上 Algolia 给的配置信息就可以添加到 `.vitepress/config.ts` 中，具体内容是：

```js
import { defineConfig } from 'vitepress'

export default defineConfig({
  themeConfig: {
    search: {
      provider: 'algolia',
      options: {
        appId: '...',
        apiKey: '...',
        indexName: '...'
      }
    }
  }
})
```

### 5. 查看效果

效果如图：

![效果](https://cdn.jsdelivr.net/gh/Hopetree/blog-img@main/2024/202501170927001.png)