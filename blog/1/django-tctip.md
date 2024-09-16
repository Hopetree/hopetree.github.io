# 一个提供公告和打赏功能的 django 应用插件 django-tctip

前段时间我一直想着给博客添加一个公告栏，本来已经想好了建立一个模型然后前端留个公告栏的窗口即可，很简单。但是偶然发现了别人博客使用了一个开源的前端插件 tctip，可以公告栏和打赏还有微信群二维码显示，感觉非常符合我的要求，于是经过一轮考虑之后，我把这个前端插件做成了 django 的应用，可以非常方便地接入任何 django 项目。

这篇博客主要来介绍一下我编写这个应用插件 django-tctip 的过程和应用的用法。

## tctip 项目介绍

前言：django-tctip 的前端依赖是一个名为 tctip 的开源项目，项目地址为 <https://github.com/greedying/tctip> 这个项目还有一个删减版（我觉得删减之后的版本更符合我期望中的样子，所以主要依赖的是删减版）地址为 <https://github.com/HaddyYang/tctip> 删减版的项目其实已经被作者用到了 django 中，这个也是我把 tctip 封装成 django-tctip 的思路来源，先向两位作者致敬。

由于 django-tctip 的原型是在删减版的基础上做出来的，所以我直接来描述一下删减版的项目结构：

1. 首先需要在网页中引入两个静态文件，一个 css 文件和一个 js 文件，这个不用多说，css 是定义插件的样式，js 是显示插件界面的。
2. 然后需要提供一个 js 代码，用来自定义你的显示内容。

删减版就这么简单，你也可以在 django-tctip 的项目代码中找到这两个文件（我做了一点改动，增加和删除了字段），至于自定义的内容，可以查看我网页源代码中的定义。

## django-tctip 项目

### 特性介绍

django-tctip 项目在删减版的 tctip 基础上面做了一点点轻微改动，改动之后的特性如下。

原有特性：

1. 公告栏支持 html 格式代码
2. 侧边栏文字、背景色、高度、在屏幕中位置等参数都可自定义

删减和增强特性：

1. 为了方便后台管理，现在最多只能显示4个栏目（其实完全足够），分别是公共栏、支付宝打赏、微信打赏和交流群
2. 所有栏目的文字都可以自定义，交流群还可以自定义 icon，所以不仅仅局限于显示群。

新增特性：

1. 由于所有配置都是后台控制，所以后台可以添加多套配置，有开关来控制当前使用哪一套配置
2. 每个栏目也有开关，可以控制每个栏目是否显示
3. 新增最小显示尺寸字段，可以通过设置最小显示尺寸来控制不同设备是否显示界面，目的是可以方便有的人不需要在手机端显示界面
4. 每个栏目的字段都是可以自定义的，而且交流群栏目的 icon 也可以自定义，这就决定了这个栏目其实不仅仅局限于交流群

### django-tctip 使用

django-tctip 的所有配置都被封装到了 django 的模型中，可以通过后台进行修改，前端是通过 django 的模板来渲染的，所以我们可以来看一下模板的内容：

```html
{% load static %}
{% if tip %}
<link href="{% static 'tctip/css/tctip.min.css' %}" rel="stylesheet">
<script>
window.tctipConfig = {
//最小显示屏幕尺寸，小于该尺寸的屏幕将不会显示tip
minScreenSize: {{tip.minScreenSize}},
//最上面的文字
headText: "{{tip.headText}}",
//侧边栏文本
siderText: "{{tip.siderText}}",
//侧边栏文本高度调整
siderTextTop: "{{tip.siderTextTop}}",
//侧边栏背景颜色
siderBgcolor: "{{tip.siderBgcolor}}",
//整个侧边栏的高度设置可以px，em，或百分比
siderTop: "{{tip.siderTop}}",
list: {
    {% if tip.notice_flag %}
    notice: {
        icon: "xx.png",
        name: "{{tip.notice_name}}",
        title: "{{tip.notice_title}}",
        className: "myR-on",
        text: "{{tip.notice_text|safe}}"
    },
    {% endif %}
    {% if tip.alipay_flag %}
    alipay: {
        icon: "xx.png",
        name: "{{tip.alipay_name}}",
        title: "{{tip.alipay_title}}",
        desc: "{{tip.alipay_desc}}",
        qrimg: "{{tip.alipay_qrimg}}"
    },
    {% endif %}
    {% if tip.weixin_flag %}
    weixin: {
        icon: "xx.png",
        name: "{{tip.weixin_name}}",
        title: "{{tip.weixin_title}}",
        desc: "{{tip.weixin_desc}}",
        qrimg: "{{tip.weixin_qrimg}}"
    },
    {% endif %}
    {% if tip.wechat_flag %}
    wechat: {
        icon: "{{tip.wechat_icon}}",
        name: "{{tip.wechat_name}}",
        title: "{{tip.wechat_title}}",
        desc: "{{tip.wechat_desc}}",
        qrimg: "{{tip.wechat_qrimg}}"
    }
    {% endif %}
}};


</script>
<script src="{% static 'tctip/js/tctip.min.js'%}"></script>
{% endif %}
```

为了方便查看，我已经删除了源代码中 icon 的地址，因为地址是使用的 base64 格式的图片格式，所以比较长，你用可以直接查看 [模板源码](https://github.com/Hopetree/django-tctip/blob/master/django_tctip/templates/tctip/tips.html)

可以看到，模板里面大部分配置的值都是通过 django 来渲染生成的，这也就是后台的可配置字段。所以，如果不想使用 django-tctip 插件但是想要在自己的博客中添加这个插件的朋友可以引入我提供的两个静态文件，然后按照模板的格式去改成你自己的内容并添加到自己模板中也是可以的。

django-tctip 的使用步骤我其实已经写到了项目的说明文档中，这里再简单说明一下，因为实在是太简单了：

第一步：安装 django-tctip 包

直接使用 pip 命令安装最新版本的包即可，安装命令如下:

```shell
pip install django-tctip
```

第二步：添加应用到项目配置

直接在项目配置的配置中添加应用即可，注意，django-tctip 的应用名称是 django_tctip，这里是下划线不要写成中划线：

```python
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'django_tctip',
]
```

第三步：生成数据表

```shell
python manage.py migrate
```

第四步：添加标签模板

首先需要引入 django_tctip 应用的标签函数 `{% load tctip_tags %}` 然后将展示模板的标签 `{% load_tctip %}` 添加到指定位置（建议放在 head 标签末尾）即可，参考如下：

```html
{% load tctip_tags %}
<!DOCTYPE html>
<html lang="en">
<head>
    <!-- Required meta tags -->
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">
    <meta name="referrer" content="origin">
    <title>Title</title>
    {% load_tctip %}
</head>
<body>
<div>django-tctip demo test !!!</div>
</body>
</html>
```

第五步：前往后台添加配置

后台配置界面如图显示：

![](https://tendcode.com/cdn/article/20200716/django-tctip_admin.png)

这时候就可以去前台查看显示界面了，直接看我博客的效果即可，不贴图了。