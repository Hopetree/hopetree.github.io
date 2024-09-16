# 使用 Django 的 admin 定制后台，丰富自己网站的后台管理系统

Django 自身带有一个功能强大的后台管理系统，这算是 Django 与其他的 Python 的 web 框架相比最大的一个优势吧！通过使用一些 admin 自带的参数，可以定制出一套非常丰富的后台管理系统。这篇文章就来通过我的博客的实例介绍一下我认为比较实用的 admin 参数设置。

## admin 的注册
首先，如果要在 Django 的后台显示应用的模型，必须在应用所在的 admin.py 文件中注册模型。

### 最简单的模型注册
让我们来看一下 Django 的官方文档给的一个最基本的后台管理的注册方式：

```python
from django.contrib import admin
from .models import Author

class AuthorAdmin(admin.ModelAdmin):
    pass
admin.site.register(Author, AuthorAdmin)
```
这个过程分为以下3步：

1. 导入 admin 及需要注册的模型（这里是 Author）
2. 创建一个模型的管理类，继承 `admin.ModelAdmin`，这个类的参数后面详细介绍
3. 注册模型的管理类

### 使用装饰器来注册
其实上面的过程可以把第2、3步结合起来，在创建模型的管理类的同时注册类，这就需要使用 admin 的装饰器，上面的例子改用装饰器之后的代码如下：

```python
from django.contrib import admin
from .models import Author

@admin.register(Author)
class AuthorAdmin(admin.ModelAdmin):
    pass
```
使用装饰器可以让代码变得更加简洁，这很符合 Python 之禅！
## ModelAdmin 的详细参数

### 查看源码

为了更好的了解 Django 的管理类有哪些基本属性，我们可以去 Django 的源码中查找这个类的源代码，看一下它有哪些默认的属性和方法。

通过查看源码，可以发现这个类的部分代码如下：

```python
class ModelAdmin(BaseModelAdmin):
    """Encapsulate all admin options and functionality for a given model."""

    list_display = ('__str__',)
    list_display_links = ()
    list_filter = ()
    list_select_related = False
    list_per_page = 100
    list_max_show_all = 200
    list_editable = ()
    search_fields = ()
    date_hierarchy = None
    save_as = False
    save_as_continue = True
    save_on_top = False
    paginator = Paginator
    preserve_filters = True
    inlines = []
```
从类的定义可以看出来，它继承了 `BaseModelAdmin` 这个类，所以我们再回过头看一下这个类的一些基本属性：

```python
class BaseModelAdmin(metaclass=forms.MediaDefiningClass):
    """Functionality common to both ModelAdmin and InlineAdmin."""

    autocomplete_fields = ()
    raw_id_fields = ()
    fields = None
    exclude = None
    fieldsets = None
    form = forms.ModelForm
    filter_vertical = ()
    filter_horizontal = ()
    radio_fields = {}
    prepopulated_fields = {}
    formfield_overrides = {}
    readonly_fields = ()
    ordering = None
    sortable_by = None
    view_on_site = True
    show_full_result_count = True
    checks_class = BaseModelAdminChecks
```

### 常规属性的使用

为了更好的介绍 admin 的一些常规属性，我以自己的博客使用的属性和展示效果来作例子。

比如我的 Article 这个模型的管理类的代码如下：

```python
@admin.register(Article)
class ArticleAdmin(admin.ModelAdmin):
    # 这个的作用是给出一个筛选机制，一般按照时间比较好
    date_hierarchy = 'create_date'

    exclude = ('views',)

    # 在查看修改的时候显示的属性，第一个字段带有<a>标签，所以最好放标题
    list_display = ('id', 'title', 'author', 'create_date', 'update_date')

    # 设置需要添加<a>标签的字段
    list_display_links = ('title',)

    # 激活过滤器，这个很有用
    list_filter = ('create_date', 'category')

    list_per_page = 50  # 控制每页显示的对象数量，默认是100

    filter_horizontal = ('tags', 'keywords')  # 给多选增加一个左右添加的框

    # 限制用户权限，只能看到自己编辑的文章
    def get_queryset(self, request):
        qs = super(ArticleAdmin, self).get_queryset(request)
        if request.user.is_superuser:
            return qs
        return qs.filter(author=request.user)
```
其实我的代码注释已经能够说明一些使用的方式和作用了。

- `date_hierarchy` 这个属性是用来设置模型的筛选参数的，一般设置时间参数比较好，这样当模型的实例比较多的时候可以通过时间来快速筛选。
- `exclude` 这个属性是用来设置不需要展示的字段的，接受一个元祖或者列表，只要设置了的字段就不会在后台显示，比如这个例子中我不想要后台显示文章的阅读量。
- `fields` 属性是与 `exclude` 属性相对的字段，这个字段包含的是需要在后台显示的模型字段，所以一般他们不同时出现。
- `fieldsets` 这个属性是 `fields` 属性的拓展，它的具体用法类似如下：

```python
fieldsets = (
    ('图标信息', {'fields': (('icon', 'icon_color'),)}),
    ('时间位置', {'fields': (('side', 'update_date', 'star_num'),)}),
    ('主要内容', {'fields': ('title', 'content')}),
    )
```
这个属性其实就是将模型的字段按照给定的方式分类排列，这样相当于把一些相似的字段归类，方便查看，例如上面这个的后台展示效果如图：

![fieldsets](https://cdn.jsdelivr.net/gh/Hopetree/blog-img@main/article/180426/fieldset.png)

- `list_display` 属性是在后台显示模型实例的列表的时候需要显示的模型的字段，字段的顺序根据给的顺序来列出，如图：

![list_display](https://cdn.jsdelivr.net/gh/Hopetree/blog-img@main/article/180426/list_display.png)

- `list_display_links` 这个属性是给 `list_display` 中展示的字段添加 `<a>` 标签属性的，也就是说添加了这个属性的字段都可以点击进入模型实例的内容页，如上图中所示，我给 title 这个字段就添加了这个属性。不设置这个字段的时候默认是第一个字段添加 `<a>` 标签。
- `list_filter` 属性是过滤器，可以用来筛选，设置了这个之后可以在后台的侧边栏看到可以用来筛选的字段的列表，效果如图所示：

![list_filter](https://cdn.jsdelivr.net/gh/Hopetree/blog-img@main/article/180426/list_filter.png)

- `filter_horizontal` 这个属性非常有用，它可以给模型中的多选字段添加左右选框，方便进行字段的添加，效果如图所示：

![filter_horizontal](https://cdn.jsdelivr.net/gh/Hopetree/blog-img@main/article/180426/filter_horizontal.png)

其他的属性可以看注释，一般常用的就是上面介绍的属性了。

### 自定义字段
除了可以在后台展示模型的自带的字段，还可以自己定义字段用来后台展示，例如：

```python
list_display = ('id', 'author', 'belong', 'create_date', 'show_content')
# 设置需要添加a标签的字段
list_display_links = ('id', 'show_content')

# 使用方法来自定义一个字段，并且给这个字段设置一个名称
def show_content(self, obj):
    return obj.content[:30]

show_content.short_description = '评论内容'
```
上面的代码定义了一个函数，这个函数返回模型的一个字段的一部分内容。定义了这个函数之后，可以使用 `.short_description` 来给这个自定义的字段添加一个字段名称，然后就可以把这个函数当做一个字段添加到 `list_display` 中展示到后台了，展示的效果如图：

![comment](https://cdn.jsdelivr.net/gh/Hopetree/blog-img@main/article/180426/comment.png)

### 重写函数
除了可以重新定义默认的属性，还可以重写管理类的函数，这个很好理解，如下代码我重新定义了一下用户的查看权限：

```python
# 限制用户权限，只能看到自己编辑的文章
def get_queryset(self, request):
    qs = super(ArticleAdmin, self).get_queryset(request)
    if request.user.is_superuser:
        return qs
    return qs.filter(author=request.user)
```
这个函数的意思是获取的模型实例需要判断登录的用户，如果用户是超级管理员就返回所有文章，如果用户只是文章的作者就只显示用户发表的文章。

```python
def formfield_for_foreignkey(self, db_field, request, **kwargs):
    User = apps.get_model(settings.AUTH_USER_MODEL)
    if db_field.name == 'author':
        if request.user.is_superuser:
            kwargs['queryset'] = User.objects.filter(is_staff=True, is_active=True)
        else:
            kwargs['queryset'] = User.objects.filter(id=request.user.id)
    return super(ArticleAdmin, self).formfield_for_foreignkey(db_field, request, **kwargs)
```

上面这个函数重写了多对一模型中下拉框里面的显示项目，可以自定义进行过滤，具体过滤方式可以看代码。

### 后台全局属性
可以通过以下设置后台的名称：

```python
# 自定义管理站点的名称和URL标题
admin.site.site_header = '网站管理'
admin.site.site_title = '博客后台管理'
```

## admin 的拓展
admin 除了使用 Django 自带的后台管理系统以外，如果你能力足够的话，也可以自己写自己的后台，当然，何必重复造轮子呢？在自己写后台之前可以找一下别人已经写好的管理插件。

### 使用 bootstrap_admin
Django 默认的后台管理界面并不好看，为了让后台显示更加美观，可以引用一个后台的插件，这个插件就是 bootstrap-admin，它可以把后台的显示变成 bootstrap 的样式，正好跟我的前端很搭。

使用方式很简单：

第一步： 安装 bootstrap-admin

```shell
$ pip install bootstrap-admin
```
第二步：添加到应用的配置中

```python
# 添加了新的app需要重启服务器
INSTALLED_APPS = [
    'bootstrap_admin',  # 注册bootstrap后台管理界面,这个必须放在最前面

    'django.contrib.admin',
    ...
    ]
```
要注意把这个应用放在其他的应用的前面，这样设置了之后，再重启一下服务，就可以看到一个 bootstrap 风格的后台了。

### 使用 xadmin
上面说的的 bootstrap_admin 其实本身不算一个管理系统插件，只能算一个 css 插件，毕竟它只是把 Django 后台的界面改了而已。

如果要实现真正意义上的定制有别于 Django 自带的后台管理系统，xadmin 应该是最值得推荐的，它单独实现了一个后台管理，具体的介绍和使用方法可以自行查看 Github 的项目介绍，地址：<https://github.com/sshwsfc/xadmin>

### 不推荐 SimpleUI

SimpleUI也是一个第三方的Django后台管理美化应用，但是我使用过之后发现这个库只能用“金玉其外，败絮其中”来形容，说起来就是这个插件的表面工作做的很好，就是从外层来看管理界面做的还不错，但是到了实例的编辑页面就会发现乱七八糟，跟原生的没啥区别，真实对比不如bootstrap_admin，感兴趣的可以去使用看看，我反正不喜欢，所以不建议。

后记：Django 的后台管理系统真的非常强大，而且很人性化，给开发节省了一大笔时间和精力，通过合理的配置参数，就可以定制一个自己想要的后台管理系统。