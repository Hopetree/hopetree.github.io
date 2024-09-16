# Django管理后台技巧分享之实例关系的搜索，autocomplete_fields字段使用

最近博客在做新功能，就是增加了两个模型，分别是专题和主题，主要就是用来对文章进行系列划分，在这个设计过程中，文章和主题会进行一个关联，当主题的数量很多的时候，文章在选择要关联的主题的时候会非常难选。

我希望在文章选择主题的时候可以输入关键字来搜过滤，这样可以减少可选项。基于这个需求，我又重新去看了一下Django关于admin的教程，终于找到了方法，现在分享一下。

## 问题现象

首先来看一下这个问题的现象，其实这个在Django的模型设计里面非常常见，就是当模型之间有关联的时候，给一个模型实例选择关联模型实例的时候，如果对方数量很多，会导致查找非常麻烦。

具体可以看下面这种图，这里我要给一个文章绑定专题，由于专题数量非常多，导致我要找到想绑定的专题非常困难，试想一下，如果我的专题数量有500个会是什么情况……

![](https://cdn.jsdelivr.net/gh/Hopetree/blog-img@main/article/2307/Snipaste_2023-07-18_10-25-49.png)

## 使用autocomplete_fields

一般遇到这种筛选，在前端里面都是可以进行输入来进行过滤的，所以我就查看了 [Django的文档](https://docs.djangoproject.com/en/2.2/ref/contrib/admin/#django.contrib.admin.ModelAdmin.autocomplete_fields "Django的文档") 找到了可以添加这个功能的方法，就是autocomplete_fields字段。

具体的使用方法可以看一下官方这个例子：

```python
class QuestionAdmin(admin.ModelAdmin):
    ordering = ['date_created']
    search_fields = ['question_text']

class ChoiceAdmin(admin.ModelAdmin):
    autocomplete_fields = ['question']
```

这里有两个模型，Choice模型里面有个关系字段`question`是关联的Question模型，这里设置`autocomplete_fields`字段的值为` ['question']`,表示的意思是当模型Choice的实例在选择Question实例的是可以进行搜索，而搜索的规则就是Question的管理里面定义的`search_fields`字段，也就是说Question里面必须去定义这个字段，官方也给了提示。

> You must define search_fields on the related object’s ModelAdmin because the autocomplete search uses it.

然后看看我这边的配置：

```python
@admin.register(Topic)
class TopicAdmin(admin.ModelAdmin):
    # 设置搜索字段
    search_fields = ['name', 'subject__name']
	
@admin.register(Article)
class ArticleAdmin(admin.ModelAdmin):
    # 可以给外键的选择增加搜索，前提是外键的管理模型必须设置search_fields作为搜索条件
    autocomplete_fields = ['topic']
```

看一下效果：

![](https://cdn.jsdelivr.net/gh/Hopetree/blog-img@main/article/2307/Snipaste_2023-07-18_10-26-54.png)

这里已经出现了搜索框，可以通过搜索条件来过滤选项，而且可以搜索的规则也是自己可以定义的字读，需求完美完成。

## 总结

本篇介绍了Django的`admin.ModelAdmin`中使用autocomplete_fields字段来给关联模型添加过滤搜索。这样在一个实例选择关联实例的时候可以使用条件搜索减少可选项，方便选择。

Django自带的admin管理后台给我们提供了非常多的功能，而且可扩展性也非常强，在使用后台的时候如果有一些很常见的需求，不妨去看看官方文档或者网上搜一下是否有内置的方案可以解决问题。