# Django分页功能改造，一比一还原百度搜索的分页效果

我的博客从创建之初就有分页，但是只是很简单的显示“上一页 1/20 下一页”这种效果，周末在家优化博客的时候突然奇想完善了一下网站的分页，直接一比一还原了百度搜索页面的分页效果。

## 前言

其实很多Django网站都分享了关于分页的实现，基本原理是大同小异的，主要是看各自的喜好。其实很多常用的功能只要有参考的模板，基本都是可以自己现实出来的，我的分页效果就是觉得百度这个分页效果还是不错的，所以连bootstrap自带的分页组件都没用，直接就一比一还原百度的效果。

## 分析百度的分页效果

首先看一下百度的分页效果，我截图了几种不同情况的分页效果，这些效果都是需要在设计分页的时候考虑到的。

![分页](https://cdn.jsdelivr.net/gh/Hopetree/blog-img@main/article/2307/page-cut.png "分页")


首先我们需要定义几个概念：

1. 总页码数，比如总共有30页
2. 当前页码数，比如当前是第3页
3. 显示的页码列表，也可以说是列表长度，比如显示1-10或者3-12，都是显示10个长度
   
我们分析一下百度的分页在不同场景对应的处理：

- 当总页码少于显示的页码长度的时候，直接显示所有页码，
- 当总页码数大于要显示的长度的时候，如果当前页码在1-显示长度一半的范围，直接直接从1开始显示
- 当总页码数大于要显示的长度的时候，如果当前页码超过显示长度的一半，则从要把当前页放到中间
- 当前页接近末页的时候，重新调整开始页的策略，保证显示长度依然是固定

经过分页，在忽略页面效果的前提下，我们要实现一个分页效果最关键点就是得到一个要显示的页码列表。

## Django设计分页

在Django里面可以定义一个标签函数来做分页，这个标签函数的主要目的就是输出要显示的页码列表，然后定义一个分页模板来渲染html页面即可。

### 定义标签函数

只要是视图继承`generic.ListView`，我定义的这个分页标签函数都是可以直接使用的，如果是自己定义的分页器，只需要修改标签函数的参数，拿到分页总数和当前页码也可以通用。

```python
# apps/blog/templatetags/blog_tags.py

from django import template

register = template.Library()

@register.inclusion_tag('blog/tags/pagecut.html', takes_context=True)
def load_pages(context, max_length=10):
    """
    自定义分页
    @param context: 上下文对象
    @param max_length: 最多显示的页面按钮数量
    @return:
    """
    paginator = context['paginator']
    page_obj = context['page_obj']
    # 分页总数不大于最大显示数，则直接显示所有页码
    if paginator.num_pages <= max_length:
        page_range = range(1, paginator.num_pages + 1)
    # 总页码大于总显示的时候，保证当前页码在中间
    else:
        left_num = max(page_obj.number - int(max_length / 2), 1)
        right_num = min(left_num + max_length - 1, paginator.num_pages)
        # 当前页面接近末尾的时候，也要保证能显示max_length个数
        if right_num - left_num < max_length - 1:
            left_num = right_num - max_length + 1
        page_range = range(left_num, right_num + 1)
    context['page_range'] = page_range
    return context
```

这里定义了一个名为`load_pages`的标签函数，使用了Django的模板标签库`template.Library()`来注册这个函数作为一个模板标签。

该函数接受两个参数：`context`和`max_length`。`context`参数是一个上下文对象，包含了模板渲染时的环境变量和变量值。`max_length`参数是可选的，用于指定最多显示的页面按钮数量，默认值是10。

函数的逻辑是根据传入的`context`中的分页信息来生成适当的页面按钮范围。如果分页总数不大于最大显示数，则直接显示所有页码。如果总页码大于最大显示数，函数会保证当前页码在中间，同时保证能显示最多指定数量的页码。最后，将生成的页码范围存入`context['page_range']`中，并返回`context`对象。

由于我的所有使用到分页功能的地方都是使用的内置的列表视图类，所以上下文中都是包含分页对象`paginator`还有当前页对象`page_obj`的，所以可以直接从`context`上下文中拿到，然后就是输出一个显示页的可迭代对象`page_range`添加到上下文中，以便在模板里面循环迭代。

我的这个标签函数的思路就很简单，我只需要关注最左边和最右边的页码是多少就行，然后只需要保证几个原则就行：第一，最左边最小值为1，第二最右边最大值为总页码数，第三，除非总页码数少于要显示的页码数，不然必须显示规定的长度。

### 分页模板

经过标签函数我们可以得到要显示的页码列表，同时上下文也是直接继承的，这时候可以定义一个分页模板。

```html
{% load blog_tags %}
<div class="page-inner text-center">
    {% if page_obj.has_previous %}
        {% deal_with_full_path request.get_full_path 'page' page_obj.previous_page_number as new_pre_page_path %}
        <a href="{{ new_pre_page_path }}"><span class="n">上一页</span></a>
    {% endif %}
    {% for page in page_range %}
        {% if page_obj.number == page %}
            <span class="page-active">{{ page }}</span>
        {% else %}
            {% deal_with_full_path request.get_full_path 'page' page as page_path %}
            <a href="{{ page_path }}"><span>{{ page }}</span></a>
        {% endif %}
    {% endfor %}
    {% if page_obj.has_next %}
        {% deal_with_full_path request.get_full_path 'page' page_obj.next_page_number as new_next_page_path %}
        <a href="{{ new_next_page_path }}"><span class="n">下一页</span></a>
    {% endif %}
</div>

```

我这个分页模板很容易理解，就是判断有没有上一页和下一页去显示上下页按钮，然后中间的页码直接去循环页码列表。

我这里使用的到了另一个标签函数来处理得到每个页码的跳转地址，而不是像我看到的所有讲Django分页的做法直接使用`href="?page={{ page }}"`这个死板的写法，因为我的页面本身就是可能带参数的，比如`/?sort=comment&page=5`这种格式，如果还是用`?page={{ page }}`就会导致设置不生效，所以我这里定义了一个标签函数来处理当前的地址，大概用途就是只替换链接中的分页参数，比如这里是`page`，这个参数也是可以根据实际来设置的。

我的标签函数如下：

```python
from urllib.parse import urlparse, parse_qs, urlencode, urlunparse
from django import template

register = template.Library()

@register.simple_tag
def deal_with_full_path(full_path, key, value):
    """
    处理当前路径，包含参数的
    @param value: 参数值
    @param key: 要修改的参数，也可以新增
    @param full_path: /search/?q=python&page=2
    @return: 得到新的路径
    """
    parsed_url = urlparse(full_path)
    query_params = parse_qs(parsed_url.query)
    # 去除参数key
    query_params[key] = value
    # 重新生成URL
    updated_query_string = urlencode(query_params, doseq=True)
    updated_url = urlunparse(parsed_url._replace(query=updated_query_string))
    return updated_url
```

### 使用分页模板

在任何有分页对象的页面（也就是视图继承自`generic.ListView`）直接倒入标签函数即可

```html
{% if is_paginated %}
    <div class="d-none d-md-block">{% load_pages 10 %}</div>
    <div class="d-md-none">{% load_pages 4 %}</div>
{% endif %}
```

这里可以随意定义最大显示的页码个数，比如我上面的设置是区分来PC端和移动端，PC端显示10个页码，移动端只显示4个页面。

### 设置样式

得到分页的基本html之后就是设置css样式就行，设置样式这里就不做描述，毕竟拿着百度的页码抄也能抄成一模一样。

## 总结

这篇博客主要介绍了作者如何在Django网站中实现了一个类似百度搜索页面的分页效果，并提供了相关代码和思路。

具体的效果这里就不用截图了，直接看我博客效果就行，PC端和移动端的显示长度是不通的，而且基本就是一比一还原了百度的

可以查看我关于分页效果的重构代码提交 [重构分页](https://github.com/Hopetree/izone/commit/d8163acf74683099916ad14d3a1bbdf69fe71905)