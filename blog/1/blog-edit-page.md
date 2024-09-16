# 添加文章编辑页面，支持 markdown 编辑器实时预览编辑

经常会有使用我博客源码搭建好网站的人问我为啥后台文章编辑页面没有富文本编辑器也没有支持 markdown 编辑，不方便预览。其实之前我也回答过很多次，在创建文章的时候，其实随便找个 markdown 编辑器创建好然后复制进去就行。

创建文章的时候的确可以这样做，但是后续需要编辑文章的时候，每次都要重新把文章复制到 markdown 编辑器里面重新编辑，体验是不太好，而且很浪费时间。于是，我创建了一个单独的页面，可以直接用来更新文章的内容，而且是直接使用的 markdown 编辑器。

## 功能转需求

### 需求澄清

针对这个功能，我需要考虑的几个需求点如下：

- 在文章的显示页面增加一个跳转地址，可以跳转到文章编辑页面
- 创建一个文章编辑页面，打开之后能显示文章的内容，并且直接放到 markdonw 编辑器里面，可以实时预览渲染效果
- 编辑完成可以保存，这样文章可以自动更新，保存之后跳回文章页面
- 编辑页面不仅仅可以编辑保存，还可以取消编辑跳回文章页面，也可以进入后台编辑页面

### 需求分析

针对以上功能需求，我做了一个大概的分析，需要完成上述的功能，在 Django 里面应该怎么实现。

1. 首先应该创建两个请求接口：一个 GET 请求用来展示编辑页面，可以直接参考文章页面的类视图实现，这里需要进行权限控制，只有文章的作者和超管可以打开页面；另一个是 POST 请求接口，用来更新文章的 body，这里也需要进行权限控制。
2. 编辑页面的 markdown 可以直接使用我网站的工具里面的 markdonw 编辑器，然后在页面中添加 js 定义按钮点击事情调用文章更新接口即可。

## 需求实现

### 创建编辑页面

编辑页面其实很简单，直接复制工具里面 markdonw 工具的 html 内容，然后把默认的内容换成文章的 body 就行了，当然这里只需要编辑器的主体内容和静态文件，其他内容可以换成网站的基本模板格式。

```html
{% extends 'blog/base.html' %}
{% load static tool_tags %}
{% block head_title %}{{ article.title }}_{{ article.category }}{% endblock %}
{% block metas %}
    <meta name="robots" content="noindex">
    <meta name="description" content="{{ article.summary }}">
{% endblock %}
{% block top-file %}
    <link rel="stylesheet" href="{% static 'editor/css/editormd.min.css' %}"/>
{% endblock %}
{% block base_content %}
    <div id="layout">
        <header class="my-2">
            <button type="button" class="btn btn-success btn-sm mr-2" id="save-article">保存修改</button>
            <button type="button" class="btn btn-warning btn-sm mr-2" id="back-article">放弃编辑</button>
            <button type="button" class="btn btn-info btn-sm mr-2" id="more-edit-article">后台编辑</button>
        </header>
        <div id="test-editormd">
            <textarea style="display:none;">{{ article.body }}</textarea>
        </div>
    </div>
{% endblock %}
{% block end_file %}
    <script src="https://cdn.bootcss.com/jquery/3.3.1/jquery.min.js"></script>
    <script src="{% static 'editor/js/editormd.min.js' %}"></script>
    <script type="text/javascript">
        let testEditor;

        $(function () {
            testEditor = editormd("test-editormd", {
                width: "90%",
                height: "1000",
                syncScrolling: "single",
                path: "{% static 'editor/lib/' %}"
            });
        });
    </script>
{% endblock %}

```

```markdown
这里的主要部分其实就跟工具里面的一致，然后就是把默认的内容换成 `{{ article.body }}`，也就是说我们的视图里面肯定是要传入 article 对象的。
```

### 创建编辑页视图及url

首先创建一个编辑的视图，可以直接使用类视图：

```python
class DetailEditView(generic.DetailView):
    """
    文章编辑视图
    """
    model = Article
    template_name = 'blog/articleEdit.html'
    context_object_name = 'article'

    def get_object(self, queryset=None):
        obj = super(DetailEditView, self).get_object()
        # 非作者及超管无权访问
        if not self.request.user.is_superuser and obj.author != self.request.user:
            raise Http404('Invalid request.')
        return obj
```

这里直接使用的内置的视图类，比较方便，然后就是在获取实例的时候需要进行用户判断，也就是非作者及超管无权访问，直接返回404页面就行。

然后只需要添加一个 url 规则就可以访问了，添加一个规则如下：

```python
path('article-edit/<slug:slug>/', DetailEditView.as_view(), name='article_edit'),  # 文章编辑
```

此时已经可以使用 /article-edit/xxxx/ 这种地址访问文章的编辑页面了，效果如下：

![](https://cdn.jsdelivr.net/gh/Hopetree/blog-img@main/article/2306/blog-edit-page.png)

这里有3个按钮，后续会讲到。

### 在文章页面添加跳转地址

新增的编辑页面已经做好了，那么现在需要在文章的内容页面添加跳转，我选择的地方是文章内容页面上的面包屑地方，当普通用户看到的还是文章标题，而管理员和作者看到的标题就是可以跳转到编辑页面的。

在编辑页面的面包屑添加代码如下：

```html
<li class="breadcrumb-item active d-none d-md-block" aria-current="page">
	{% if user.is_superuser or user == article.author %}
	<a class="edit-blog" href="{% url 'blog:article_edit' article.slug %}"
	target="_blank" title="编辑文章">
	{{ article.title|slice:":50" }}{% if article.title|length > 50 %}
	...{% endif %}</a>
	{% else %}
	{{ article.title|slice:":50" }}{% if article.title|length > 50 %}...{% endif %}
	{% endif %}

</li>
```

这里可以看到，当超管和作者访问的时候，可以显示编辑页面的地址，普通人就还是看到标题，不感知。


### 创建更新文章视图及url

更新文章要使用 POST 请求，我打算使用前端 ajax 来请求，所以视图是这样的：

```python
@require_http_methods(["POST"])
def update_article(request):
    """更新文章，仅管理员和作者可以更新"""
    if request.method == 'POST' and request.is_ajax():
        article_slug = request.POST.get('article_slug')
        article_body = request.POST.get('article_body')

        try:
            article = Article.objects.get(slug=article_slug)
            # 检查当前用户是否是作者
            if not request.user.is_superuser and article.author != request.user:
                return HttpResponseForbidden("You don't have permission to update this article.")

            # 更新article模型的数据
            article.body = article_body
            article.save()

            callback = reverse('blog:detail', kwargs={'slug': article_slug})
            response_data = {'message': 'Success', 'data': {'callback': callback}, 'code': 0}
            return JsonResponse(response_data)
        except Article.DoesNotExist:
            return HttpResponseBadRequest("Article not found.")
    return HttpResponseBadRequest("Invalid request.")
```

这个逻辑也很简单，就是从请求体里面提取 `article_slug` 和 `article_body` 然后判断是作者或者管理员就更新文章，并且返回文章页面的地址。

创建的 url 规则如下：

```python
path('article-update/', update_article, name='article_update'),  # 文章更新
```

此致，我们后端的内容就更新完成了，就是实现了两个接口。剩下的就是要实现前端的更新文章的逻辑了。

### 创建 ajax 调用函数

我单独定义了一个 js 文章来做文章的更新，就是很简单的 ajax 请求，在我的工具应用里面大量使用过，所以这种函数很普遍。

```js
function article_update_save(csrf, api_url, article_slug) {
    const article_body = testEditor.getMarkdown();
    $.ajaxSetup({
        data: {
            csrfmiddlewaretoken: csrf
        }
    });
    $.ajax({
        type: 'post',
        url: api_url,
        data: {
            'article_slug': article_slug,
            'article_body': article_body,
        },
        dataType: 'json',
        success: function (data) {
            if (data.code === 0) {
                window.location.href = data.data.callback
            }
        },
    })
}
```

这个函数是需要3个参数的，第一个参数是所有 `django` 的请求都应该带上的 `csrf` 验证，这个不清楚的可以去查一下相关作用，第二个参数是更新的接口地址，第三个参数是文章的 `slug` 字段，这个字段是唯一的，所以可以用来确定文章。

可以看到这个函数里面当请求成功之后，会拿到返回接口里面的 `callback ` 字段，这个就是返回文章的内容页面，也就是说更新文章成功自动跳回到文章内容页面。

### 添加按钮和点击事件

现在前后端的接口和请求都做好了，只需要在页面添加按钮并设置按钮的事件就可以了，按钮直接使用 bootstrap 的按钮样式，然后在编辑页面添加事件的逻辑：

```html
<script>
	$('#save-article').click(function () {
	article_update_save("{{ csrf_token }}", "{% url 'blog:article_update' %}", "{{ article.slug }}")
	});
	$('#back-article').click(function () {
	window.location.href = "{% url 'blog:detail' article.slug %}";
	});
	$('#more-edit-article').click(function () {
	window.location.href = "{% url 'admin:blog_article_change' article.pk %}";
	});
</script>
```

这里有三个点击事件，分别是更新文章、跳回文章页面、跳到后台编辑页面。

## 总结

本篇文章主要分享了创建一个文章内容编辑页面的过程，主要使用到了 `Django` 的类视图、权限判断、POST 请求视图、`ajax` 请求、实例更新等 `Django` 相关知识点。

本文更新的相关代码提交可见 github 提交历史：

- [添加文章编辑页面，支持markdown编辑器编辑预览模式](https://github.com/Hopetree/izone/commit/6dc50ce007ed2dc57f07e2b895eade2641f353d6 "添加文章编辑页面，支持markdown编辑器编辑预览模式")