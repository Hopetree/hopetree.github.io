# [博客搭建]  通过用户邮箱认证来介绍 django-allauth 的使用思路

我的博客使用了 django-allauth 应用插件，所以是支持 Oauth2.0 协议的第三方账号登录（Github 和 Weibo）。同时，博客支持邮箱注册登录，不过我之前关闭了邮箱认证，现在已经开启验证功能，用户注册和登录之后都可以选择是否进行认证，当然，认证的用户肯定会有特权，至于什么特权，请看本文介绍。

## 认证用户
所谓认证用户也就是被系统认定为真实有效的用户，其实何为真实何为有效，这个概念不能扯得太远，毕竟现在使用代码批量注册账号也不是什么难事，特别是像这种个人博客。所以我把认证的用户的有效性概念划分的简单一点，**也即是只要邮箱被认证是真实有效的即可**。

### 判定认证的依据
因为用户可以选择使用第三方账号绑定登录也可以使用邮箱注册登录博客，所以关于用户认证就要分开考虑：

- 首先，使用第三方账号绑定登录的用户会直接被判定为已经认证通过，即使你的邮箱状态属于未认证状态。
- 其次，使用邮箱注册的用户，在注册的时候会收到一条邮箱验证的邮件，是否验证取决于你自己，这个不影响你登录博客，如果注册的时候没有在有效时间内确认验证邮箱，那么后续登录之后也可以在个人主页中跳转到邮箱验证页面进行邮箱验证。只有验证过邮箱并确认验证的用户（也即是邮箱状态为已认证）会被判定为认证用户。
- 补充说明：现阶段使用无效邮箱注册的用户也不用担心认证不了邮箱，因为你可以在邮箱页面重新添加一个真实的邮箱，并且把这个邮箱设置为主邮箱进行验证即可，删不删除无效邮箱随你。

### 认证用户的特权
既然要把用户分为认证用户和非认证用户，当然要给认证用户一些特权了。目前认证用户的特权暂时实现了以下两点：

- 认证用户在评论列表中名称后面会出现相对应的认证方式的图标（Github、Weibo、邮箱认证）
- 认证用户可以在评论列表中名称出现自己个人网站的跳转链接，跳转链接有优先级别，其中个人资料中填写的网址优先级最高，其次是 Github 登录用户的个人主页，微博用户不展示微博主页，因为考虑到很多人并不想暴露自己的微博，所以强烈建议认证的用户添加个人博客网址到个人资料中享有这个特权

当然，目前实现的这两个小特权并不会影响用户在博客中的一般性操作，但是既然开始区分认证和非认证，后续肯定会支持更多认证用户才能行使的特权。

## django-allauth 使用
这篇文章并不会详细介绍 django-allauth 的使用，因为我觉得官方的文档写的还算比较清晰，可以作为参考文档，等遇到问题的时候再带着问题去找相关资料是很好的学习过程。所以，这里我只介绍我在做用户认证和判定用户认证状态的时候涉及到的一些相关的代码片段。

### 系统配置
首先，django 的第三方插件都是会把一些全局配置通过读取 settings 文件来使用的，这个概念要清楚。而涉及到用户邮箱认证的配置是下面这个参数：

```python
# 注册中邮件验证方法:“强制（mandatory）”,“可选（optional）【默认】”或“否（none）”之一。
# 开启邮箱验证的话，如果邮箱配置不可用会报错，所以默认关闭，根据需要自行开启
# ACCOUNT_EMAIL_VERIFICATION = 'none'
ACCOUNT_EMAIL_VERIFICATION = os.getenv('IZONE_ACCOUNT_EMAIL_VERIFICATION', 'none')
```
我上面的注释说的很清楚了，这个参数的默认值是 `optional` 也就是可选，但是我之前是设置为关闭状态，这是因为如果不设置关闭状态，用户注册就会发送认证邮件，但是很多人在开始使用博客的时候可能根本不会去配置邮箱的信息（在邮箱配置中），所以会导致运行报错，所以我强制关闭认证避免报错。如果设置为强制认证，那么用户在注册的时候必须认证邮箱，否则无法登陆博客。这个参数目前我改成了读取环境变量，所以可以根据自己的需求设置，我目前设置成可选，这样方便用户根据自己的需要选择是否认证。

### socialaccount 属性
首先，allauth 这个插件其实是有两个 app 的，查看官方文档的时候也可以看到说明，其中 account 这个 app 主要针对的是 django 的 user，而 socialaccount 这个 app 就是针对的第三方账号，所以如果要获取第三方账号的信息，都需要去这个 app 里面看代码。

当然，我可不是叫你去看源码，毕竟源码这种东西没那么容易搞清楚，但是很多时候我们可以去源码中搜索关键词，这样可以得到一些有用的信息，比如我下面这个标签函数就是以源码的标签函数为依据写出来的。

```python
@register.simple_tag
def get_user_link(user):
    '''
    获取认证用户的link，并判断用户是哪种认证方式（Github，Weibo，邮箱）
    参考 get_social_accounts(user) 的用法
    :param user: 一个USER对象
    :return: 返回用户的link和注册方式以及是否验证过邮箱地址,link的优先顺序是user.link，其次是github主页，
            考虑到很多人不愿意展示微博主页，所以不展示weibo主页
    '''
    info = {
        'link': None,
        'provider': None,
        'is_verified': False
    }
    accounts = {}
    for account in user.socialaccount_set.all().iterator():
        providers = accounts.setdefault(account.provider, [])
        providers.append(account)
    if accounts:
        for key in ['github', 'weibo']:
            account_users = accounts.get(key)
            if account_users:
                account_user = account_users[0]
                the_link = account_user.get_profile_url()
                the_provider = account_user.get_provider().name
                if key == 'github':
                    info['link'] = the_link
                if user.link:
                    info['link'] = user.link
                info['provider'] = the_provider
                info['is_verified'] = True
    else:
        the_link = user.link
        if the_link:
            info['link'] = the_link
        for emailaddress in user.emailaddress_set.all().iterator():
            if emailaddress.verified:
                info['is_verified'] = True
    return info
```

上面这段代码是自定义的一个标签函数，这个标签函数传入的是一个 user 对象，返回了一个字典，这个字典包含三个参数，分别是 `is_verified` 用户的认证状态，`link` 用户的个人网站，`provider` 用户的注册方式。其中用户的 `link` 和 `provider` 都涉及到从第三方账号的信息中提取，具体的提取方式可以看代码。

你可能会有疑问，为什么我知道第三方账号的信息的提取方式是上面代码这样？其实我也是一点一点试探出来的，首先，我在查看官方文档的时候，看到了这样一个使用方法，文档页面是：<https://django-allauth.readthedocs.io/en/latest/templates.html>

```html
{% get_social_accounts user as accounts %}
```

于是，我去源码中搜索 `get_social_accounts` 这个关键词，发现它果然是一个标签函数（看用法就能知道），然后可以查看到这个标签函数其实很简单，代码如下：

```python
@simple_tag
def get_social_accounts(user):
    """
    {% get_social_accounts user as accounts %}

    Then:
        {{accounts.twitter}} -- a list of connected Twitter accounts
        {{accounts.twitter.0}} -- the first Twitter account
        {% if accounts %} -- if there is at least one social account
    """
    accounts = {}
    for account in user.socialaccount_set.all().iterator():
        providers = accounts.setdefault(account.provider, [])
        providers.append(account)
    return accounts
```

好了，对比一下我写的标签函数和这个源码中的标签函数，有哪些相同的地方？没错，`accounts` 这个字典就是我的标签函数和源码相同的地方，这也是这个标签函数的关键，我甚至都不用知道为什么要这么写，因为我只需要知道得到的这个字典可以怎么用就行，别忘了，Python 有一个非常有用的内置函数，可以用来查看对象的属性，当我得到了这个 `accounts` 之后，我只需要在前端使用一下这个标签函数，然后在代码中打印一下它的属性就行了。

```python
print(dir(accounts))
```

然后依次类推，每次得到一个未知对象，都打印一下它的属性，看看它有什么方法可以调用，有什么属性可以获取，于是一步一步试探之下，我就写出了上面那个自定义的标签函数。

其实我上面写的自定义标签函数使用的内容并不多，但是关键在于，我是怎样的思路去写出这个标签函数的，在我们接触 Python 的第三方或者说内置的方法时，特别是新的对象，我们根本不可能马上知道这个对象的用法，但是我们可以通过 dir() 这个方法来查看对象的属性，这样也就可以慢慢试探出对象的用法了。

### 标签函数调用
上面自定义了标签函数，就可以在模板中调用了，具体代码如下：

```html
{% get_user_link comment.author as user_link_info %}
{% if user_link_info.is_verified and user_link_info.link %}
<strong >
    <a href="{{ user_link_info.link }}"
       title="前往 {{ comment.author }} 的个人网站"
       target="_blank">{{ comment.author }}
    </a>
</strong>
{% else %}
<strong title="该用户未认证或没有个人站点">{{ comment.author }}</strong>
{% endif %}
{% if user_link_info.is_verified %}
    {% if user_link_info.provider == 'GitHub' %}
    <i class="fa fa-github" title="Github 绑定用户"></i>
    {% elif user_link_info.provider == 'Weibo' %}
    <i class="fa fa-weibo" title="Weibo 绑定用户"></i>
    {% else %}
    <i class="fa fa-universal-access" title="邮箱认证用户"></i>
    {% endif %}
{% endif %}
```
由于标签函数得到的是一个字典，而在 django 中获取字典的属性可以可以通过 dict.key 这种方式来，所以在模板中只需要根据需要进行一些条件判断即可使用。

## 用户认证效果
来看一下博客在添加了用户认证之后的一些改动点的展示效果：

### 邮箱状态查看
可以在个人资料中查看到当前邮箱是否验证，第三方账号登录的用户可以忽略这个状态，以为默认已经判定为认证用户

![look-email](https://cdn.jsdelivr.net/gh/Hopetree/blog-img@main/article/190308/Snipaste_2019-03-08_16-26-25.png)

### 邮箱验证页面
可以从个人资料中跳转到邮箱验证页面，这个页面可以进如下几个操作：

- 更改主邮箱，仅当邮箱不唯一的时候可以选
- 发送认证邮件，用来验证邮箱
- 删除邮箱，仅当邮箱不唯一的时候可以用
- 添加邮箱，给账号绑定其他邮箱

![eamil-page](https://cdn.jsdelivr.net/gh/Hopetree/blog-img@main/article/190308/Snipaste_2019-03-08_16-27-52.png)

### 评论页面
评论页面给认证用户的特权显示效果，主要是认证图标和用户个人主页的超链接显示

![user](https://cdn.jsdelivr.net/gh/Hopetree/blog-img@main/article/190308/Snipaste_2019-03-08_16-30-31.png)

## 设置https

如果你的网站使用了https，那么在github和weibo的应用中都需要使用https的地址，同时，你需要在Django的配置中添加如下配置：

```python
ACCOUNT_DEFAULT_HTTP_PROTOCOL = 'https'
```

如果你不这样做，那么你在认证的时候会报错！