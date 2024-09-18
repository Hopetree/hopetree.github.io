# 博客灾备方案（2）：博客文章同步到VitePress静态站

我的博客灾备方案已经验证通过并完成自动化同步，上一篇文章分享了将图传数据从七牛云同步到GitHub，从而实现了媒体文件的静态化，这篇文章分享将博客文章同步到 VitePress 项目中，将文章内容实现静态化。

使用过 VitePress 框架的人看到我的博客应该有种很熟悉的感觉，因为我博客的文章页面的布局就是参考的 VitePress 的文档样式设计的，当然现在很多文档类的网站都是这种布局，比如语雀。

所以，我的博客同步到 VitePress 基本可以做到毫无违和感，下面就分享一下这个通过方案。

## VitePress 效果

先来看一下 [VitePress 显示效果](https://hopetree.github.io/ "VitePress 显示效果")，这是主页的效果，可以按照我博客的专题的分类展示：

![主页的效果](https://cdn.jsdelivr.net/gh/Hopetree/blog-img@main/2024/202409171404954.webp)

然后是文章页面的效果，跟我文章的页面基本一样，左边是专题中主题的导航，右边是文章的标题大纲，并且图片自动替换成了GitHub的图片地址：

![文章页面的效果](https://cdn.jsdelivr.net/gh/Hopetree/blog-img@main/2024/202409171404953.webp)

## 同步方案

同步方案主要包括以下几点：

1. 将博客文章的 markdown 内容全部同步到 GitHub 中 VitePress 项目的指定目录中，这样方便管理，同时也方便核对校验，最重要的是，还可以兼容项目原本的自定义内容。
2. 将博客的专题分类同步到 VitePress 中，也就是 VitePress 主页配置 index.md 中的 `features` 块的内容
3. 将专题下所有文章的的导航同步到 VitePress 中，形成每个文章页面的左侧导航，也就对应了 VitePress 中项目配置文件 config.ts 中 `sidebar` 的内容
4. 需要实现自动同步，支持全量同步、增量同步、白名单强制同步三种方式
5. 需要实现自动同步后，VitePress 项目自动构建部署，及时更新同步的内容。

::: tip 经验分享

同步之后要保证 VitePress 项目进行构建和部署才算真的完成同步，要做到这一点，只需要利用 GitHub 的 action 功能就行，action 可以识别到文件变动，只要变动就出发打包和部署操作，但是由于同步是一个持续提交操作，每次提交一个文件就触发一次编译肯定不合理。

<br>

解决方案其实也很简单，就是利用 action 的触发条件配置，配置触发条件为 config.ts 文件更新了才触发，然后在同步的时候保证 config.ts 每次都更新并且最后一个提交就行，这样就可以保证每次同步后会执行打包部署，并且只会执行一次。
:::

## 同步具体步骤

### 1. 上传文章内容

我博客是Django项目驱动的，我之前就配置过 Django REST framework 对外开放一些资源查询的接口，比如查询所有文章，接口效果如下：

![接口效果](https://cdn.jsdelivr.net/gh/Hopetree/blog-img@main/2024/202409171429341.png)

这里需要给文章添加一个额外的属性，就是文章所属的专题，目的是在上传文章的时候可以按照专题分目录存储，方便后续配置左侧导航。

具体的上传代码我这里有两个函数参考，利用递归查询文章，然后上传：

```python
def upload_all_articles(self, url):
    """
    递归请求接口上传所有文章
    @param url:
    @return:
    """
    resp = requests.get(url, timeout=10)
    results = resp.json()['results']
    for item in results:
        self.result['blog']['total'] += 1
        self.upload_article(item)
    if resp.json()['next']:
        self.upload_all_articles(resp.json()['next'])

def upload_article(self, item):
    """
    上传一篇文章
    1. 有主题的传到主题pk下的路径中
    2. 没有主题的直接放到前缀下面
    @param item:
    @return:
    """
    if not item.get('subject'):
        file_path = f'{self.prefix}/{item["slug"]}.md'
    else:
        file_path = f'{self.prefix}/{item["subject"]}/{item["slug"]}.md'

    # ******************* 过滤器 *******************
    # 全量更新则直接进入更新逻辑
    # 增量更新，要判断是否在白名单，当有白名单则强制更新白名单的，否则只添加新文件
    if not self.full:
        if self.white_list:
            if item['slug'] not in self.white_list:
                return
        else:
            if file_path in self.target:
                return
    # ******************* 过滤器 *******************

    # 能走到这里说明是要提交的文件，需要判断是否已经存在，存在则获取sha来更新
    self.result['blog']['need_download'] += 1
    if file_path in self.target:
        sha = self.github_manager.get_file_sha(file_path)
    else:
        sha = None

    body = self.deal_with_body(item['body'], title=item['title'])
    response = self.github_manager.upload_file(file_path, body, sha=sha)
    if response:
        self.result['github']['upload_success'] += 1
    else:
        self.result['github']['upload_failed'] += 1
```

文章上传利用的就是 GitHub 的提交接口，这个之前在分享图床同步的时候介绍过，代码我都是复用的原来封装好的，所以 GitHub 操作的代码就不介绍了。

::: tip 关键点

我这里在上传的时候做了一个简单的过滤器，就是可以支持三种模式的同步，首先是优先级最高的全量更新，会强制更新所有的文章内容，其次是白名单模式，场景是需要强制更新指定的几个文章，最后就是增量提交，就是日常定时任务场景，只会提交最新的文章。
:::

上传文章之前我还对文章内容进行了一些操作，就是替换内容，比如将媒体文件地址全部替换成 GitHub 图床地址，还有就是替换一些我博客的个性化 markdown 拓展语法，使其兼容到 VitePress 中，具体替换代码：

```python
def deal_with_body(self, body, title=None):
    """
    处理文章内容
    1. 替换图床地址
    2. 替换个性化的markdown语法
    @param title:
    @param body:
    @return:
    """
    # 添加标题
    if title:
        body = f"# {title}\n\n" + body

    # 处理绝对路径的媒体文件
    pattern = r'!\[.*?\]\(\s*({url}.*?)\s*(?:"|\))'.format(url=self.source_media_url)
    media_list = re.findall(pattern, body)
    if media_list:
        for old_url in media_list:
            new_url = old_url.replace(self.source_media_url, self.target_media_url)
            body = body.replace(old_url, new_url)

    # 处理相对路径的媒体文件
    pattern = r'!\[.*?\]\(\s*(/cdn/.*?)\s*(?:"|\))'
    media_list = re.findall(pattern, body)
    if media_list:
        for old_url in media_list:
            new_url = old_url.replace('/cdn/', self.target_media_url)
            body = body.replace(old_url, new_url)

    # 处理markdown个性化语法: 消息块
    body = body.replace('::: tip', '::: tip')

    return body
```

### 2. 上传主页配置文件 index.md

文章上传之后，就可以保证 VitePress 中能通过地址访问到具体的文章了，但是没有导航，所以根本看不到文章的清单，非常不方便。

于是我将我博客的专题配置到了 VitePress 主页中，形成了分类，具体就是使用接口查询到博客的所有专题，并且转成 yaml 格式更新到 [index.md](https://github.com/Hopetree/hopetree.github.io/blob/main/index.md?plain=1 "index.md") 中，具体效果：

```yaml
features:
- details: 这个专题将涵盖使用Django框架开发博客的相关内容
  icon: 📚
  link: /blog/1/
  linkText: 查看主题文章
  title: Django博客开发
- details: 这个专题汇总跟容器相关的文章，比如镜像构建，容器部署，docker-compose等
  icon: 📚
  link: /blog/5/
  linkText: 查看主题文章
  title: Docker
- details: 收集Python的技巧和实战经验
  icon: 📚
  link: /blog/14/
  linkText: 查看主题文章
  title: Python
```

### 3. 上传项目配置文件 config.ts

有了主页导航还不够，还需要配置文章的左侧导航，这样才能保证访问每个文章可以有清晰的层次结构，具体就是修改项目中的 .vitepress/config.ts 文件中的 `sidebar` 内容，文件的内容有点多，具体可以看[源码文件](https://github.com/Hopetree/hopetree.github.io/blob/main/.vitepress/config.ts "源码文件")。

::: warning 注意

由于提交内容与原文件内容一样的时候，不会进行 commit 操作，也就不会触发 action，所以在提交 config.ts 文件的时候，为了保证每次都能提交变更，我特意加了一个日期当做注释，这样既不会影响内容也可以保证每次都提交。
:::

### 4. 配置成定时任务

配置成博客的定时任务，运行频率一天两次就够了，反正只是一个灾备同步，具体的配置就不说了，之前分享过很多次我博客的定时任务配置。

这里主要说一下定时运行参数的考虑，由于我需要支持三种模式的同步，所以在参数中就需要暴露相关参数：

- `full` 参数：布尔值，用来设置是否全量同步
- `white_list` 参数：列表，用来设置白名单文章，强制同步白名单

更多参数：

![更多参数](https://cdn.jsdelivr.net/gh/Hopetree/blog-img@main/2024/202409171701763.png)

### 5. 配置 GitHub workflows

我的 VitePress 项目从一开始就配置过 GitHub workflows，一直通过 action 自动构建发布的，这次的同步方案实施后，主要需要改动的一个点就是触发条件需要加一下，仅当 config.ts 文件变动时才触发，修改 .github/workflows/deploy.yml 文件，配置 paths 内容如下：

```yaml
name: Deploy
on:
  workflow_dispatch: {}
  push:
    branches:
      - main
    paths:
      - '.vitepress/config.ts'  # 仅当配置文件修改才出发动作，保证API更新的时候不会频繁触发
```

看一下同步后触发的 action 执行效果，相当完美：

![action 效果](https://cdn.jsdelivr.net/gh/Hopetree/blog-img@main/2024/202409171404952.webp)

## 遇到的问题

其实整个同步方案的实施花了我基本一天时间完成，而这一天里面写同步代码和调试的时间并不长，因为方案我一早就想好了，思路理清了写起来很快，调试都没调几次就OK了，真正浪费了大量时间的是同步后遇到的 vitepress 的构建问题，解决这些问题浪费了我 70% 的时间。

### 1. 媒体文件访问失败

最开始在 `build` 的时候报错了媒体文件加载失败问题，大意是我文章里面使用了一些相对地址的静态路径，但是这种路径找不到资源所以报错。

![媒体文件访问失败](https://cdn.jsdelivr.net/gh/Hopetree/blog-img@main/2024/202409170239536.png)

提示是让我可以使用配置把这种资源添加到配置中来忽略，但是很明显，我不能这样做，因为这种文件不是固定的，我无法一个配置。

我的解决方案是从根本上解决，就是在上传文章之前对内容进行处理，替换掉这种相对地址，变成绝对地址。

### 2. DeadLinks 问题

解决完媒体文件问题后又遇到了死链问题，就是说我文章中使用的有的连接无法访问，所以打包失败，报错如下：

![](https://cdn.jsdelivr.net/gh/Hopetree/blog-img@main/2024/202409171348614.png)

这个报错说明 vitepress 在编译的时候会去请求每个引用的地址，从而识别不可访问的，难怪打包有点慢。但是很明显，我不需要它给我检查，于是我找到了方案忽略这种检查，就是在配置文件 `config.ts` 中添加配置项到 `defineConfig` 里面，具体配置项如下：

```js
ignoreDeadLinks: true
```

### 3. markdown 语法问题

在 build 的时候有两个语法问题报错，导致构建失败，第一处是下面这段：

```markdown
这里的主要部分其实就跟工具里面的一致，然后就是把默认的内容换成 `{{ article.body }}`，也就是说我们的视图里面肯定是要传入 article 对象的。
```

报错提示如下，当时一脸懵，查了很久都不知道报错是什么原因，直到我猜测是不是文章中有什么内容导致渲染 markdown 报错才排查到是上面那段中的标签函数的语法导致的。

![](https://cdn.jsdelivr.net/gh/Hopetree/blog-img@main/2024/202409170233014.png)


第二个报错是下面这段，跟第一个比较类似，也是这种标签函数的语法：

```markdown
我这里的做法是，首先通过上下文拿到 `${{ github.ref }}` 这个信息就是当前的 tag，然后提取版本号，进而修改打包文件中版本号进行推送。
```

![](https://cdn.jsdelivr.net/gh/Hopetree/blog-img@main/2024/202409170253561.png)

关于上面的两处错误，我没有找到解决方案，临时解决方案就是直接把文本改到代码块里面，这样就不会报错了。而关于这里的标签函数，我基本已经确认了原因，是因为 vitepress 支持使用标签函数的方式给 markdown 添加额外内容，该功能是 `frontmatter 配置` 能力，所以可能是把上面的语法误认为是 `frontmatter` 语法了，但是又无法渲染出值，所以直接报错。

不过我比较疑惑的是，我都在标签外层加了代码格式，这里居然还能被识别成 `frontmatter` 语法就很无语。

## 总结

这篇文章主要分享了我博客文章同步到 VitePress 项目中实现自动化构建更新的经验，结合之前分享的那篇七牛云图床同步到 GitHub 图床的经验，就做到了整个博客的文章完整的静态化同步到 GitHub 管理，这样以后就算我的博客本身出问题不能访问，也可以保证有平台可以访问博客文章。