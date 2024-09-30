# Django博客网站可以用定时任务做些什么事？

之前分享了一篇博文来介绍自己使用Django添加定时任务的实践，介绍了Django使用celery的基本步骤。本篇文章就来分享一下我的这个博客网站添加了哪些定时任务，都是用来干嘛的，从实际的使用场景来进一步介绍Django结合celery的用法。

## 博客的定时任务

我博客的定时任务的具体逻辑都定义在[action.py](https://github.com/Hopetree/izone/blob/master/apps/easytask/actions.py "action.py")文件中，而任务都定义在[tasks.py](https://github.com/Hopetree/izone/blob/master/apps/easytask/tasks.py "tasks.py")中，其实这个文件这是去调用函数做事，之所以这种划分是为了方便管理定时任务。

### 更新博客缓存

这个任务的背景是因为我的博客是容器化部署，缓存用的是redis，也没有做数据持久化，也就是说缓存是存到redis容器的内存中的，一旦redis容器销毁或重启缓存就都清空了，虽然容器销毁或重启这种场景比较少，但是也不是没有，所以为了在缓存被清空的时候能自动创建缓存，我就设置了这个定时任务可以没小时自动创文章缓存。

任务的逻辑是将文章的最后更新时间作为缓存的key，这种可以保证缓存的内容绝对就是最新的文章内容，最主要的是缓存的是已经经过markdown渲染过的内容，可以减少访问的时候的渲染性能消耗。

看一下具体的逻辑代码：

```python
def action_update_article_cache():
    """
    更新所有文章的缓存，缓存格式跟文章视图保持一致
    @return:
    """
    from markdown import Markdown
    from markdown.extensions.toc import TocExtension  # 锚点的拓展
    from markdown.extensions.codehilite import CodeHiliteExtension
    from django.core.cache import cache
    from django.utils.text import slugify
    from blog.utils import CustomHtmlFormatter
    from blog.models import Article

    total_num, done_num = 0, 0
    # 查询到所有缓存的key
    keys = cache.keys('article:markdown:*')
    for obj in Article.objects.all():
        total_num += 1
        ud = obj.update_date.strftime("%Y%m%d%H%M%S")
        md_key = f'article:markdown:{obj.id}:{ud}'
        # 设置不存在的缓存
        if md_key not in keys:
            md = Markdown(extensions=[
                'markdown.extensions.extra',
                'markdown_checklist.extension',
                CodeHiliteExtension(pygments_formatter=CustomHtmlFormatter),
                TocExtension(slugify=slugify),
            ])
            # 设置过期时间的时候分散时间，不要设置成同一时间
            cache.set(md_key, (md.convert(obj.body), md.toc), 3600 * 24 + 10 * done_num)
            done_num += 1
    data = {'total': total_num, 'done': done_num}
    return data
```

这个任务也可以继续延伸，不仅仅是博客的文章缓存，其他的缓存也是同样可以通过定时任务进行设置和清理，提高网站的访问效率。

### 友链检查

有博客并且有友链的人应该都知道，很多友链会出现无法访问的情况，要么是网站已经没了要么就是域名变化了导致无法访问，这种友链非常影响使用体验，而作为网站的维护者，又不可能每天都去检查，就算做起来也很麻烦，于是就有了这个定时任务去做这个事情。

任务的逻辑：

1. 定时请求友链地址，判断请求是否返回200，如果不是，则友链属于无法正常返回的，此时将友链设置无效状态
2. 定时请求无效状态的友链地址，如果返回200，则说明友链已经恢复可访问状态，此时将友链重新设置成有效状态
3. 网站可以访问只是第一步，当可以访问的时候还要判断友链的页面是否包含本站的外链，如果没有则同样要设置成无效状态
4. 可以设置白名单，白名单的友链不进行检查

看看具体的逻辑代码：

```python
def action_check_friend_links(site_link=None, white_list=None):
    """
    检查友链:
        1、检查当前显示的友链，请求友链，将非200的友链标记为不显示，并记录禁用原因
        2、检查当前不显示的友链，请求友链，将200返回的标记为显示，并删除禁用原因
        3、新增补充校验：可以添加参数site_link，则不仅仅校验网页是否打开200，还会校验网站中是否有site_link外链
    @return:
    """
    import re
    from blog.models import FriendLink

    white_list = white_list or []  # 设置白名单，不校验
    active_num = 0
    to_not_show = 0
    to_show = 0
    active_friend_list = FriendLink.objects.filter(is_active=True)
    for active_friend in active_friend_list:
        active_num += 1
        if active_friend.name in white_list:
            continue
        if active_friend.is_show is True:
            code, text = get_link_status(active_friend.link)
            if code != 200:
                active_friend.is_show = False
                active_friend.not_show_reason = f'网页请求返回{code}'
                active_friend.save(update_fields=['is_show', 'not_show_reason'])
                to_not_show += 1
            else:
                # 设置了网站参数则校验友链中是否包含本站外链
                if site_link:
                    site_check_result = re.findall(site_link, text)
                    if not site_check_result:
                        active_friend.is_show = False
                        active_friend.not_show_reason = f'网站未设置本站外链'
                        active_friend.save(update_fields=['is_show', 'not_show_reason'])
                        to_not_show += 1
        else:
            code, text = get_link_status(active_friend.link)
            if code == 200:
                if not site_link:
                    active_friend.is_show = True
                    active_friend.not_show_reason = ''
                    active_friend.save(update_fields=['is_show', 'not_show_reason'])
                    to_show += 1
                else:
                    site_check_result = re.findall(site_link, text)
                    if site_check_result:
                        active_friend.is_show = True
                        active_friend.not_show_reason = ''
                        active_friend.save(update_fields=['is_show', 'not_show_reason'])
                        to_show += 1
    data = {'active_num': active_num, 'to_not_show': to_not_show, 'to_show': to_show}
    return data

```

### 清理通知消息

这个任务的目的是定时清理博客的系统通知，包括评论的通知和系统通知，可以设置具体要清理多少天前的通知。

```python
def action_clear_notification(day=200, is_read=True):
    """
    清理消息推送
    @param is_read: False表示清理所有，True表示只清理已读，默认清理已读
    @param day: 清理day天前的信息
    @return:
    """
    from datetime import datetime, timedelta
    from django.db.models import Q
    from comment.models import Notification, SystemNotification

    current_date = datetime.now()
    delta = timedelta(days=day)
    past_date = current_date - delta
    if is_read is True:
        query = Q(create_date__lte=past_date, is_read=True)
    else:
        query = Q(create_date__lte=past_date)

    comment_notification_objects = Notification.objects.filter(query)
    system_notification_objects = SystemNotification.objects.filter(query)
    comment_num = comment_notification_objects.count()
    system_num = system_notification_objects.count()
    comment_notification_objects.delete()
    system_notification_objects.delete()
    return {'comment_num': comment_num, 'system_num': system_num}
```

这个定时任务也可以进行延伸，我们可以用定时任务定时清理任何实例数据，当然，也可以定时添加数据。

### 清理定时任务结果

其实django-celery-results自带了定时任务可以清理任务结果，也就是在Django的配置中设置`CELERY_RESULT_EXPIRES `来定的，不过经过我的使用发现这个定时任务非常不灵活，不太满足我的需求，我在介绍定时任务的时候也说过可以把这个设置成0不要使用，而是自己定义任务来做这个清理。

我的清理逻辑就是可以定义需要清理多少天的任务，并且只清理结果是完成状态的（也就是成功或者失败）。

看看具体的逻辑代码：

```python
def action_cleanup_task_result(day=3):
    """
    清理任务结果
    清理day天前成功或结束的，其他状态的一概不清理
    @return:
    """
    from datetime import datetime, timedelta
    from django.db.models import Q
    from django_celery_results.models import TaskResult

    current_date = datetime.now()
    delta = timedelta(days=day)
    past_date = current_date - delta
    query = Q(date_done__lte=past_date)
    task_result_objects = TaskResult.objects.filter(query)
    task_result_count = task_result_objects.count()
    task_result_objects.delete()
    return {'task_result_count': task_result_count}

```

### 百度推送

这个任务主要做的事情就是定时将博客的文章推送到百度，这里可以定时需要推送的文章的范围，比如最近的1个月内的文章，于是可以做到每天自动给百度推送这些文章的地址，这样可以更快被百度收录。

看看具体的代码：

```python
def action_baidu_push(baidu_url, months):
    """
    主动推送文章地址到百度，指定推送最近months月的文章链接
    @param baidu_url: 百度接口调用地址，包含token
    @param months: 几个月内的文章
    @return:
    """
    import requests
    from datetime import datetime
    from dateutil.relativedelta import relativedelta
    from blog.models import Article
    from blog.utils import site_full_url

    def baidu_push(urls):
        headers = {
            'User-Agent': 'curl/7.12.1',
            'Host': 'data.zz.baidu.com',
            'Content-Type': 'text/plain',
            'Content-Length': '83'
        }
        try:
            response = requests.post(baidu_url, headers=headers, data=urls, timeout=5)
            return True, response.json()
        except Exception as e:
            return False, e

    current_date = datetime.now()
    previous_date = current_date - relativedelta(months=months)
    article_list = Article.objects.filter(create_date__gte=previous_date, is_publish=True)
    article_count = article_list.count()
    if not article_count:
        return {'article_count': article_count, 'status': True, 'result': 'ignore'}
    url_list = [f'{site_full_url()}{each.get_absolute_url()}' for each in article_list]
    status, result = baidu_push('\n'.join(url_list))
    return {'article_count': article_count, 'status': status, 'result': result}

```

其实这个百度推送可以扩展开来，比如推送整个网站的地址（对于新站）或者推送sitemap，然后你还可以推送到其他搜索引擎。

### 网站导航拨测

这个任务的逻辑和目的跟友链一样，主要是为了检查网站是否可以正常访问。

```python
def action_check_site_links(white_domain_list=None):
    """
    校验导航网站有效性，只校验状态为True或者False的，为空的不校验，所以特殊地址可以设置成空跳过校验
    @param white_domain_list: 域名白名单
    @return:
    """
    from webstack.models import NavigationSite

    white_domain_list = white_domain_list or []
    active_num = 0
    to_not_show = 0
    to_show = 0
    active_site_list = NavigationSite.objects.filter(is_show__isnull=False)
    for site in active_site_list:
        active_num += 1
        # 当站点包含白名单域名则直接跳过校验
        if white_list_check(white_domain_list, site.link):
            continue
        if site.is_show is True:
            code, text = get_link_status(site.link)
            if code < 200 or code >= 400:
                site.is_show = False
                site.not_show_reason = f'网页请求返回{code}'
                site.save(update_fields=['is_show', 'not_show_reason'])
                to_not_show += 1
        else:
            code, text = get_link_status(site.link)
            if 200 <= code < 400:
                site.is_show = True
                site.not_show_reason = ''
                site.save(update_fields=['is_show', 'not_show_reason'])
                to_show += 1
    data = {'active_num': active_num, 'to_not_show': to_not_show, 'to_show': to_show}
    return data
```

### 定时发布文章

**需求背景**：有的时候创建了博客文章不想马上发布，可以使用定时任务，对指定的文章在指定的时间发布。

```python
def action_publish_article_by_task(article_ids):
    """
    定时将草稿发布出去
    @param article_ids: 需要发布的文章ID
    @return:
    """
    from blog.models import Article
    data = {}
    for each_id in article_ids:
        article = Article.objects.get(id=int(each_id))
        if article:
            if article.is_publish is False:
                article.is_publish = True
                article.save()
                data[each_id] = 'Article published successfully'
            else:
                data[each_id] = 'Article has been published'
        else:
            data[each_id] = 'Article not found'
    return data
```


### 统计文章访问量

**需求背景**：我的网站做了一个访问量统计的页面，可以展示网站的每日和每个小时的文章访问量数据，这些数据就是依赖定时任务定期统计并存到数据库和缓存中的。

这块的统计逻辑比较多，有兴趣可以查看源码，大概逻辑就是每个小时统计一次每个文章的访问量，然后跟上一个小时对比，就是这个小时的访问量，依次类推，可以做到每小时、每天和每周的统计。

### 爬取并更新 Feed Hub

**需求背景**：我的网站有个 Feed Hub 页面，是用来显示一些订阅信息的，而有的订阅源是我们自己采集构造的数据，这些数据就需要依靠定时任务来采集。

```python
def action_get_feed_data():
    """
    采集feed数据并回写到数据库
    """
    import feedparser
    from blog.models import FeedHub

    headers = {
        'user-agent': 'Mozilla/5.0 (Windows NT 6.2; Win64; x64; rv:50.0) Gecko/20100101 Firefox/50.0'
    }

    result = {}
    feed_items = FeedHub.objects.filter(is_active=True)
    for feed in feed_items:
        try:
            data = {}
            feed_parser = feedparser.parse(feed.url, request_headers=headers)
            entries = [{'title': each['title'], 'link': each['link']} for each in
                       feed_parser['entries']]
            data['entries'] = entries
            update_time = updated_time(feed_parser.feed)
            if update_time:
                data['updated'] = update_time
            feed.update_data(json.dumps(data, ensure_ascii=False))
            result[feed.name] = 'ok'
        except:
            result[feed.name] = 'nok'
    return result
```

### 清理 session 表过期数据

**需求背景**：Django 自己不会清理过期的 session 数据，如果项目持续运行，会发现有大量过期数据存在，导致数据库占用大量空间，因此可以定期清理过期 session。

```python
@shared_task
def clear_expired_sessions():
    """
    定时清理过期的session
    @return:
    """
    response = TaskResponse()
    call_command('clearsessions')
    response.data = {'msg': 'clear sessions done'}
    return response.as_dict()
```

### 服务监控告警通知

**需求背景**：我网站做了一个主机监控页面，可以接收主机的信息，同时通过定时任务对主机上报的信息进行监控，对异常主机发告警通知。具体的实现可以查看我博客相关文章。

### 将七牛云图床同步到GitHub图床

定时将七牛云图床的内容同步到GitHub图床，当做一个灾备。

### 将博客文章同步到GitHub

定时将博客的文章同步到GitHub进行备份，并按照 vitepress 项目的格式进行同步，实现同步后自动打包部署并更新到网站。

## 总结

有了定时任务这个功能之后，网站可以设置很多定时任务来做一些需要频繁进行的自动化事情，这样不仅可以解放双手，还可以提升网站的使用体验，可谓是非常方便。我这里主要是分享了一些自己博客网站做的一些定时任务，也欢迎看客们讨论更多可以使用定时任务做的事情。