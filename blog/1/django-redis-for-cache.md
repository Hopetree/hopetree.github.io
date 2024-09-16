# Django 使用 django-redis 作为缓存的正确用法，别忽略缓存的使用原则

一般的 web 服务都会设置缓存机制，特别是那些大型的服务，因为请求多，所以为了减少对数据库的查询，可以使用缓存来存储一些必要的信息给请求调用。Django 自身也有一套相对完善的缓存系统，这篇文章来介绍一下使用 redis 作为 Django 缓存的使用方法，并且说一下我在使用缓存的过程中遇到的问题。


redis 是一个 key-value 存储系统，常用于缓存的存储。先来简单说一下 redis 在 Windows 和 Ubuntu 上面的安装和配置方式。

## Windows 安装 redis
### 下载 redis
因为官方网站不提供 Windows 的版本，所以需要去其他地方下载，这里推荐一个 github 的资源：[redis for windows 下载](https://github.com/MSOpenTech/redis/releases)

推荐下载 zip 的压缩文件到本地即可。
### 安装 redis
将下载的 redis 压缩文件加压到本地的任意一个文件夹中（推荐放到重用软件安装的目录中）。可以看到解压后的文件如图所示：

![redis 解压目录文件](https://cdn.jsdelivr.net/gh/Hopetree/blog-img@main/article/180419/redis-dir.png)

使用 cmd 命令进入解压后的 redis 目录中，使用如下命令启动 redis 服务：

```shell
redis-server.exe
```
可以看到如下的结果，则表示 redis 服务已经开启了：

![redis server 开启](https://cdn.jsdelivr.net/gh/Hopetree/blog-img@main/article/180419/redis-server.png)

然后当前 cmd 窗口不要关闭，再在当前目录开一个 cmd 窗口，输入如下命令启动 redis 客户端：

```shell
redis-cli.exe
```
可以看到如下输出，即表示进入了 redis 客户端：

![redis-cli](https://cdn.jsdelivr.net/gh/Hopetree/blog-img@main/article/180419/redis-cli.png)

### 配置 redis 为系统服务
上面的操作虽然可以进入 redis，但是一旦服务窗口关闭，就会断掉与 redis 的链接，所以需要把 redis 服务设置成系统服务才行。

依然在当前目录下打开 cmd 并且输入下面的命令安装系统服务：

```shell
redis-server.exe --service-install redis.windows.conf
```
可以看到如下输出表示安装服务成功：

![redis-server安装](https://cdn.jsdelivr.net/gh/Hopetree/blog-img@main/article/180419/redis-server-ok.png)

然后进入 Windows 的系统服务中，开启 Redis 服务即可，如图所示：

![redis 系统服务开启](https://cdn.jsdelivr.net/gh/Hopetree/blog-img@main/article/180419/Windowsserver.png)

现在 redis 已经是系统服务了，可以在任何位置打开 cmd 窗口调用 redis 了。

## Ubuntu 安装 redis
Linux 其他的版本上安装和配置我不清楚，也没有试过，因为我的服务器和本地的虚拟机都是使用的 Ubuntu，所以只说这个的安装方式。

### 安装 redis-server
使用如下命令即可安装：

```shell
$ sudo apt-get update
$ sudo apt-get install redis-server
```
### 启动 redis-server

```shell
$ redis-server
```
### 查看 redis

```shell
$ redis-cli
```
## 使用 django-redis
django-redis 是一个可以让 django 使用 redis 作为缓存存储的第三方库，该库的地址可以查看 <https://github.com/niwinz/django-redis>

### 安装 django-redis
在项目使用的虚拟环境中使用 pip 安装即可：

```shell
pip install django-redis
```
不过需要提醒的是，因为 django-redis 是支持 django 1.11 以上的，所以如果你的 django 版本低于这个就会被自动升级为最新版（2.0的版本），所以我建议自己先把 django 自行升级到1.11的版本。

### 配置 django-redis 作为缓存
在你的 settings 文件中加入下面的配置代码即可：

```python
CACHES = {
    "default": {
        "BACKEND": "django_redis.cache.RedisCache",
        "LOCATION": "redis://127.0.0.1:6379/1",
        "OPTIONS": {
            "CLIENT_CLASS": "django_redis.client.DefaultClient",
        }
    }
}
```

## django 缓存的使用
### 视图函数中使用缓存
下面的代码表示将 my_view 这个视图函数缓存60*15秒，也就是15分钟，这个视图所能指向的每个 url 都会单独创建一个缓存。
```python
from django.views.decorators.cache import cache_page

@cache_page(60 * 15)
def my_view(request):
    return render(request, 'index.html')
```
但是，需要说明的是，给视图添加缓存是有风险的，如果视图所展示的网页中有经常动态变动的信息，那么被添加缓存命不可取。

缓存整个视图最实用的场景应该是这个视图所展示的网页的内容基本上不怎么变动，或者说在很长一段时间内不需要变动，这样使用缓存就非常有效。

### URLconf 中使用缓存
上面说了函数视图使用缓存，但是我们可能还有一种场景，那就是多个 URL 指向同一个函数视图，但是我只想缓存一部分的 URL，这时候就可以采用在 URLconf 中使用缓存，这样就指定了哪些 URL 需要缓存。

下面分别表示了函数视图和类视图的路由中使用缓存的方式，基本一致：
```python
from django.views.decorators.cache import cache_page

urlpatterns = [
    url(r'^foo/([0-9]{1,2})/$', cache_page(60 * 15)(my_view)),
    url(r'^$', cache_page(60 * 30)(IndexView.as_view()), name='index'),
]
```
URLconf 使用缓存和视图函数使用缓存需要注意的地方是一样的，因为它们都是缓存整个页面，所有都需要考虑是否整个页面都应该缓存。

### 函数中使用缓存
函数中使用缓存是最基本的使用方法，跟在其他非 django 中使用的方式一致，无非就是使用 set() 和 get() 方法。

例如我有一个使用场景：我的博客的文章是使用的 markdown 的格式输入的，所以每次展现到前端之前后端都需要把文章的内容进行一次 markdown 转化，这个渲染的过程难免会有点影响性能，所以我可以使用缓存来存放已经被渲染过的文章内容。具体的代码片段如下：

```python
ud = obj.update_date.strftime("%Y%m%d%H%M%S")
md_key = '{}_md_{}'.format(obj.id, ud)
cache_md = cache.get(md_key)
if cache_md:
    md = cache_md
else:
    md = markdown.Markdown(extensions=[
        'markdown.extensions.extra',
        'markdown.extensions.codehilite',
        TocExtension(slugify=slugify),
    ])
    cache.set(md_key, md, 60 * 60 * 12)
```
上面的代码中，我选择文章的 ID 和文章更新的日期作为缓存的 key，这样可以保证当文章更改的时候能够丢弃旧的缓存进而使用新的缓存，而当文章没有更新的时候，缓存可以一直被调用，知道缓存按照设置的过期时间过期。

### 模板中使用缓存
模板中使用缓存是我比较推荐的一种缓存方式，因为使用这种方式可以充分的考虑缓存的颗粒度，细分颗粒度，可以保证只缓存那些适合使用缓存的 HTML 片段。

具体的使用方式如下，首先加载 cache 过滤器，然后使用模板标签语法把需要缓存的片段包围起来即可。
```html
{% load cache %}
{% cache 500 'cache_name' %}
    <div>container</div>
{% endcache %}
```

这里有个技巧：在模板中使用缓存的时候需要很多时候不好控制过期时间，有新的数据添加进来了，但是还是使用的缓存，新数据就不显示。这种其实可以在缓存设置的时候添加一个动态的参数来设置缓存，比如下面这个例子，`cache`后面多加了一个动态参数，这样动态参数只要变动，缓存就会使用新的。

```html
{% get_new_timeline_id as new_timeline_id %}
{% cache 2592000 'template:timeline' new_timeline_id %}
```

在这个例子里面，使用一个标签函数去拿到最新的实例id,然后当作缓存参数，这样只要有新实例添加，就会自动刷新为新缓存。

### 缓存的使用原则
先说一下我在使用缓存的时候遇到的问题，我之前给我的很多视图函数还有URL路由添加了缓存，也就是缓存整个页面，后来发现出问题了，因为我的每个页面都有导航栏，而导航栏上面有登录和登出按钮，这样如果缓存起来的话，就无法让用户显示登录和登出了，并且，有表单的页面也无法提交表单，总之，缓存整个页面是一件有风险的行为。

那么到底哪些时候应该用缓存呢？

据我目前的理解，下面这些时候可以用缓存：

- 纯静态页面
- 读取了数据库信息，但是不经常变动的页面，比如文章热门排行榜，这个调用数据库信息并且还要排序的完全可以使用缓存，因为不需要实时展现最新的
- HTML 的片段，比如整个页面都经常变动，但是有个侧边栏不经常变动，就可以缓存侧边栏
- 需要使用复杂逻辑生成的 HTML 片段，使用缓存可以减少多次重复操作