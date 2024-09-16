# Django博客评论区显示用户操作系统与浏览器信息

## 需求

### 预期效果

我见过一些博客的显示效果，大差不差，有的还显示了IP所在地，但是我觉得IP是一个比较隐私的信息，而且很多都是代理IP没有意义。下面是截取的几种效果，都是开源博客框架的。

效果一：直接显示浏览器版本和操作系统版本信息

![user-agent](https://cdn.jsdelivr.net/gh/Hopetree/blog-img@main/2024/04/202408251337011.png)

效果二：直接显示浏览器和操作系统的图标

![](https://cdn.jsdelivr.net/gh/Hopetree/blog-img@main/2024/04/202408251334384.png)

效果三：这个是 [wordpress 的插件](https://wordpress.org/plugins/show-useragent/ "wordpress 的插件")，显示IP所在国家的旗帜和操作系统、浏览器图标

![](https://cdn.jsdelivr.net/gh/Hopetree/blog-img@main/2024/04/202408251345641.png)


我的预期效果是结合上面的效果一和效果二，所以有两个点需要实现：

1. 只显示系统和浏览器的图标，没有匹配的则显示一个默认的图标
2. 并且鼠标移动到图标上面的时候可以显示系统和浏览器的具体版本信息，没有信息则显示 Unknown


### 需求分析

首先写过爬虫或者后端的都知道，HTTP 请求是有一个请求头的概念，而请求头里面有个字段叫 User-Agent 就是请求的浏览器信息，一般可以从这个信息中识别请求是什么操作系统和什么浏览器发出的，当然，也有是搜索引擎爬虫或者伪装的。

也就是说，我们可以从后端接口中去获取这个信息，然后分析 User-Agent 的信息进行分类，然后前端显示出来即可。

于是，基于这个需求，我们需要解决以下几个问题：

1. 如何将用户的请求 User-Agent 传递给后端以保证后端可以拿到这个信息？
2. 如何存储 User-Agent 信息？
3. 如何解析 User-Agent 信息？
4. 如何将解析后的 User-Agent 信息用图标的形式显示到前端？

## 功能实现

下面就上文提到的几个需求分析的问题展开说一下我是如何做的。

### User-Agent 的获取

后端想要获取到用户的 User-Agent 信息其实并不是一个很简单的事情，这需要分析一下从用户点击浏览器的提交按钮到后端收到接口请求的过程经历了些什么。

以我的博客为例，用户提交请求后，请求会先走到我云服务器的 Nginx，然后 Nginx 会把请求转发给反向代理的服务，也就是我 izone-docker 里面的 Nginx 容器，接着 Nginx 容器再把请求转发给 Django 容器，大致架构是这样的：

![](https://cdn.jsdelivr.net/gh/Hopetree/blog-img@main/2024/04/202408251408599.png)

也就是说用户要把 User-Agent 信息传到后端实际上是要走两个 Nginx，而 Nginx 要将请求头信息传递到反向代理的服务器，是需要进行配置的，具体配置这个 User-Agent 信息是这样的：

```nginx
proxy_set_header X-User-Agent $http_user_agent;
```

我的[容器 Nginx 里面的配置](https://github.com/Hopetree/izone-docker/blob/master/nginx/conf.d/izone.conf "容器 Nginx 里面的配置")是本身就配置了这个请求头的，所以只需要在服务器本地的 Nginx 的配置里也添加上这个配置就行。

此时在 Django 里面的视图函数中获取 User-Agent 就可以像这样：

```python
user_agent_string = request.META.get('HTTP_USER_AGENT', 'unknown')
```

### User-Agent 的存储

我的需求是显示每个评论信息的 User-Agent 信息，所以当然是需要给评论模型添加一个字段来存储这个信息，字段设置成可不填也可以填写空值：

```python
class Comment(models.Model):
    # 记录处理后的user-agent
    # 格式 PC / Mac OS X 10.15.7 / Chrome 128.0.0，可以使用 / 来拆分
    user_agent = models.CharField(max_length=255, blank=True, null=True)
```

新增模型字段，别忘了执行 `makemigrations` 和 `migrate` 命令更新数据表。

### User-Agent 的解析

由于 User-Agent 的信息会根据不同系统版本、浏览器版本等信息组合成不同的信息，直接存储这个信息没有太大的意义，所以需要处理成要显示的效果再存储，这里使用一个第三方库 `user-agents` 来处理。

先安装依赖：

```bash
pip install pyyaml ua-parser user-agents
```

然后进行解析和存储，这里我直接存储处理后的字符串：

```python
user_agent = parse(user_agent_string)

...

new_comment = ArticleComment(author=new_user, 
	content=new_content,
	belong=the_article,
	parent=None,
	rep_to=None,
	user_agent=str(user_agent))
```

这里的 `str(user_agent)` 内容是这样的 “PC / Mac OS X 10.15.7 / Chrome 128.0.0”，使用的 “/” 连接的三个信息，第一个是平台类型，第二个是系统版本，第三个是浏览器版本。

更多 `user-agents` 的用法可以自行查看官方指导的演示，非常简答：

```python
from user_agents import parse

# iPhone's user agent string
ua_string = 'Mozilla/5.0 (iPhone; CPU iPhone OS 5_1 like Mac OS X) AppleWebKit/534.46 (KHTML, like Gecko) Version/5.1 Mobile/9B179 Safari/7534.48.3'
user_agent = parse(ua_string)

# Accessing user agent's browser attributes
user_agent.browser  # returns Browser(family=u'Mobile Safari', version=(5, 1), version_string='5.1')
user_agent.browser.family  # returns 'Mobile Safari'
user_agent.browser.version  # returns (5, 1)
user_agent.browser.version_string   # returns '5.1'

# Accessing user agent's operating system properties
user_agent.os  # returns OperatingSystem(family=u'iOS', version=(5, 1), version_string='5.1')
user_agent.os.family  # returns 'iOS'
user_agent.os.version  # returns (5, 1)
user_agent.os.version_string  # returns '5.1'

# Accessing user agent's device properties
user_agent.device  # returns Device(family=u'iPhone', brand=u'Apple', model=u'iPhone')
user_agent.device.family  # returns 'iPhone'
user_agent.device.brand # returns 'Apple'
user_agent.device.model # returns 'iPhone'

# Viewing a pretty string version
str(user_agent) # returns "iPhone / iOS 5.1 / Mobile Safari 5.1"
```

### User-Agent 的显示

我存入模型字段的格式是 “PC / Mac OS X 10.15.7 / Chrome 128.0.0” 这种，而我需要的也就是操作系统版本和浏览器版本，于是直接读取评论的字段然后再次处理一下就行，处理就是把一些常见的系统设置成图标，于是需要更具系统和浏览器信息获取一个对应的图标名称。

#### 定义图标映射关系的标签函数

自定义一个标签函数，用来把存储的 user_agent 转成 html 中要显示的信息和图标名称，函数返回一个字典。

```python
@register.simple_tag
def split_user_agent(user_agent):
    """
    将评论中的浏览器信息解析成系统版本和浏览器版本
    @param user_agent: PC / Windows 7 / Chrome 55.0.2891
    @return: Windows 7,Chrome 55.0.2891,windows,chrome
    """
    system_dict = {
        'Windows': 'Windows',
        'Mac': 'Mac',
        'iOS': 'iOS',
        'Android': 'Android',
        'Ubuntu': 'Ubuntu',
        'Linux': 'Linux',
    }
    browser_dict = {
        'Chrome': 'Chrome',
        'Firefox': 'Firefox',
        'Safari': 'Safari',
        'Edge': 'Edge',
        'IE': 'IE',
        'Opera': 'Opera'
    }
    system_info, browser_info = 'Unknown', 'Unknown'
    system_img, browser_img = 'other_system', 'other_browser'
    if user_agent and len(user_agent.split(' / ')) == 3:
        _, system_info, browser_info = user_agent.split(' / ')
        for k, v in system_dict.items():
            if system_info.strip().startswith(k):
                system_img = v
                break
        for k, v in browser_dict.items():
            if browser_info.strip().startswith(k):
                browser_img = v
                break
    return {
        'system_info': system_info.strip(),
        'browser_info': browser_info.strip(),
        'system_img': system_img,
        'browser_img': browser_img
    }
```

#### 定义页面 html 和标签函数

首先创建一个 html 用来显示图标效果：

```html
{% load static comment_tags %}

{% split_user_agent user_agent as user_agent_dict %}
<img class="mx-1"
     src="{% static 'comment/img/'|add:user_agent_dict.browser_img|add:'.png' %}"
     alt="{{ user_agent_dict.browser_info }}" title="{{ user_agent_dict.browser_info }}"
     style="display: inline-block;height: 1rem;">
<img class="mx-0"
     src="{% static 'comment/img/'|add:user_agent_dict.system_img|add:'.png' %}"
     alt="{{ user_agent_dict.system_info }}" title="{{ user_agent_dict.system_info }}"
     style="display: inline-block;height: 1rem;">
```

然后再定义一个标签函数，用来返回这个 html 片段：

```python
@register.inclusion_tag('comment/tags/user_agent.html')
def load_user_agent_img(user_agent):
    """
    加载user_agent页面内容
    @param user_agent:
    @return:
    """
    return {'user_agent': user_agent}
```

最后在评论列表中显示这个片段：

```html
{% if each.user_agent %}
	{% load_user_agent_img each.user_agent %}
{% endif %}
```

#### 上传图标文件

在 html 里面是根据图标名称来显示具体的操作系统和浏览器图标的，因此只需按照前面定义的映射字典关系上传一些图标到指定目录即可，具体如下：

![](https://cdn.jsdelivr.net/gh/Hopetree/blog-img@main/2024/04/202408251456570.png)


## 🎉 实现效果

最后来看看我实现后的效果，完美按照我的预想实现的。

![](https://cdn.jsdelivr.net/gh/Hopetree/blog-img@main/2024/04/202408251438838.png)