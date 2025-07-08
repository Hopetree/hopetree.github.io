# Django 中 locale 的用法：自定义翻译

最近在使用 Django 开发一个股票数据采集平台，在开发过程中想要把后台管理页面显示的英文改成中文显示，然后就得知了 locale 的存在和用法。Django 作为功能强大的 Python Web 框架，内置了完善的国际化（i18n）和本地化（l10n）机制。本文分享一下 locale 的用法。

## 先看效果

这个是配置之前的后台显示效果，有的第三方应用都是英文显示：

![](https://cdn.jsdelivr.net/gh/Hopetree/blog-img@main/2025/202507071026090.png)

这是因为之前的 django-celery-results 版本没有提供中文翻译，所以在后台显示的都是英文，当然最新版其实提供了中文。

然后是我配置了 locale 之后的效果：

![](https://cdn.jsdelivr.net/gh/Hopetree/blog-img@main/2025/202507071030677.png)

## 什么是 locale？

在 Django 项目中，locale 是一个目录，用于存放翻译文件（.po 和 .mo），每个语言版本对应一个子目录。其主要目的是为模板、视图、模型等定义的文本内容提供多语言支持。

## 基础配置

确认 settings.py 的配置项：

```python
# settings.py

LANGUAGE_CODE = 'zh-hans'     # 默认语言
USE_I18N = True               # 启用国际化
USE_L10N = True               # 启用本地化（数字、日期格式）
USE_TZ = True                 # 启用时区

# 翻译文件存放路径
LOCALE_PATHS = [
    os.path.join(BASE_DIR, 'locale'),
]
```

## 生成 locale 文件

### 1. 标记待翻译文本

一般常用的翻译内容是在模型或模板中使用。

比如典型的模型名称还有字段名称：

```python
from django.utils.translation import gettext_lazy as _

class Meta:
    """Table information."""

    ordering = ['-date_done']

    verbose_name = _('task result')
    verbose_name_plural = _('task results')
```

或者是在模板中：

```html
{% load i18n %}
<p>{% trans "Welcome" %}</p>
```

### 2. 生成 .po 文件

执行如下命令，扫描项目中所有待翻译内容，并生成一个 .po 文件：

```shell
django-admin makemessages -l zh_Hans
```

执行后将会生成如下结构：

```text
locale/
└── zh_Hans/
    └── LC_MESSAGES/
        └── django.po
```

### 3. 编辑翻译文件

在 django.po 中编辑 msgstr ：

```
msgid "task result"
msgstr "任务结果"

msgid "task results"
msgstr "任务结果"

msgid "Hello, world!"
msgstr "你好，世界！"
```

### 4. 编译成 .mo 文件

执行编译命令，将 .po 文件编译为 .mo 文件：

```shell
django-admin compilemessages
```

## 容器化建议

1、git 只提交 .po 文件到项目代码，忽略 .mo 文件


2、镜像中安装编译需要的 `gettext`

由于编译 .mo 文件需要依赖 gettext，而有的基础镜像没有这个软件，所以需要安装一下。参考 dockerfile 中命令:

```bash
RUN apt-get update && apt-get install -y \
    default-libmysqlclient-dev \
    build-essential \
    gettext \
    && rm -rf /var/lib/apt/lists/*
```


3、在镜像构建的时候执行 `django-admin compilemessages` 编译生产 .mo 文件

参考命令：

```bash
COPY . .
RUN django-admin compilemessages
```

## 我的经验

其实最好的获取 django.po 的方式是去找指定的第三方库的源码，拿到其他翻译的文件，然后改一份中文的，比如这个是我博客的版本引用的 [django-celery-results 的翻译](https://github.com/celery/django-celery-results/blob/v2.0.1/locale/es/LC_MESSAGES/django.po "django-celery-results 的翻译")