# 使用 setup.py 将 Python 库打包分发到 PyPI 踩坑指南

前段时间写了一个 django 的应用安装包打包上传到了 PyPI，由于是第一次打包分发，所以趁机研究了一下 Python 打包的相关注意事项。网上的确是可以搜到很多相关资料，但是我发现很多人都在无脑复制粘贴或者简单的提供了一份打包配置，一点不实际也不实用，而我最喜欢的就是分享实际经验，所以这次也不例外，来分享踩坑指南。

## 打包规范

### 项目结构介绍

首先，一个项目要打包，必须遵循打包的结构，所以，让自己的项目文件和目录规范起来很重要。现在就以我的 [django-tctip](https://github.com/Hopetree/django-tctip) 项目来作为例子，我项目结构如下：

```shell
-django-tctip
   │  .gitignore
   │  LICENSE
   │  MANIFEST.in
   │  README.md
   │  setup.py
   └─django_tctip
      │  admin.py
      │  apps.py
      │  models.py
      │  __init__.py
      ├─migrations
      │      0001_initial.py
      │      __init__.py
      ├─static
      │  └─tctip
      │      ├─css
      │      │      tctip.min.css
      │      └─js
      │              tctip.min.js
      ├─templates
      │  └─tctip
      │          tips.html
      └─templatetags
              tctip_tags.py
              __init__.py

```

项目的主目录是 django-tctip，目录下面的 django_tctip 就是需要打包的包目录，而打包用到的文件主要是两个，分别是 setup.py 文件，用来执行打包，MANIFEST.in 文件，用来配置额外需要打包的文件（这个后面会单独讲）。

### setup.py 文件简介

其实真正需要打包一个 Python 包只需要在项目根目录中提供一个 setup.py 文件即可，这个文件简单的内容如下：

```python
from setuptools import find_packages, setup

VERSION = '1.4.2'

with open('README.md', 'r', encoding='utf-8') as fp:
    long_description = fp.read()

setup(
    name='django-tctip',
    version=VERSION,
    author='Hopetree',
    author_email='zlwork2014@163.com',
    description='A web tip of Django',
    long_description=long_description,
    long_description_content_type="text/markdown",
    url='https://github.com/Hopetree/django-tctip',
    keywords='django tctip tip',
    packages=find_packages(),
    include_package_data=True,
    install_requires=[
        'Django >= 1.8'
    ],
    python_requires='>=3.5',
    classifiers=[
        'Operating System :: OS Independent',
        'Intended Audience :: Developers',
        'License :: OSI Approved :: MIT License'
    ],
)
```

以上字段其实比较重要的只有两个，一个是 `packages`，另一个是 `include_package_data` 其他的字段要么是非必要字段，要么内容很显而易见，没必要进行太多研究。

### MANIFEST.in 文件的作用

网上搜到的很多关于 Python 打包的文章都没有提到这个关键的文件，我建议，没有提到这个文件的文章可以直接鉴定为垃圾文章，不用看。

这个文件我们可以理解为跟 .gitignore 文件有点像，它的作用也是来定义哪些文件需要打包哪些文件不要打包的。

为什么需要这个文件呢？

因为 setup.py 执行打包的时候默认只会打包 Python 包，这是一个什么概念呢，就是只会打包带有 `__init__.py` 的目录文件，也就是必须是包，于是问题就来了，比如我的项目里面的静态文件目录 static 和模板文件目录 templates 这两个目录和里面的文件都不会被打包，这个时候 MANIFEST.in 文件的作用就来了，它可以定义哪些非 Python 包的文件应该被打包。

## 打包上传

写好 setup.py 文件和 MANIFEST.in 文件之后，就可以执行打包命令，然后确认打包没有问题即可上传到 PyPI。

### 打包命令

打包命令其实有两个，一个是 sdist，另一个是 bdist_wheel，后者需要安装 wheel 才能执行不然会报错。

如果仅仅执行 `python setup.py sdist` 命令，那么你打出来的是一个 xxx.tar.gz 的包，可以理解为源文件包，当你把这个包上传到 PyPI 之后，使用 pip install 进行安装的时候会另外执行一次 `bdist_wheel` 进行打包，最终形成一个 xxx.whl 的安装包进行安装。也就是说，如果你在上传到 PyPI 之前就执行 `python setup.py sdist bdist_wheel` 打包，那么会同时得到一个 tar.gz 和一个 whl 的包，这个时候使用 pip install 安装的就是你打包上传的那个 whl 文件，否则，pip install 执行的时候会自己给你打包成 whl 文件进行安装。

所以，我们可以得出一个结论：真正有效的包是 bdist_wheel 命令打出来的 whl 包，所以必须保证这个包的完全性。

## 我的疑问和解答

我带着几个疑问，查看了很多资料，然后结合自己的验证，总算是解决了一些问题，现在就分享一下。

**1、打包应该用 sdist 还是 bdist_wheel ？**

我的回答是一起用，将两个文件一起上传到 PyPI，同时，在本地执行上传命令前应该先查看一下两个包里面的内容是否缺少。

**2、include_package_data 参数到底需不需要？**

我找了很多关于这个参数的描述，我感觉都没有解释清楚这个参数的作用，而我经过验证算是有个初步的理解。这个参数默认应该是 True，也就是说你不添加就默认是 True。它的作用是对 bdist_wheel 打包命令生效的，前面说到了 MANIFEST.in 文件可以来定义一些非 Python 包的文件被打包，但是定义的只有 sdist 打出来的源文件包才有效，这个时候其实对 whl 安装包是无效的，而 include_package_data=True 就是让这个文件同时也对 bdist_wheel 打出来的包生效，所以，你如果把这个值设置成 False 的时候就会发现 tar.gz 包含了 MANIFEST.in 中定义的文件，而 whl 包里面就不包含。

结论：这个参数加不加都行，建议加上，但是非特殊情况下，不要设置成 False 就行。

**3、package_data 参数有什么用？**

这个参数其实跟 include_package_data=True 有着类似的作用，只不过后者是直接让 MANIFEST.in 文件对 whl 包生效了，而前者可以通过参数来取代 MANIFEST.in 的作用。所以当你想让 sdist 和 bdist_wheel 打出来的包有差异的时候，可以通过这个参数来单独定义 bdist_wheel 打出来的包的内容。

## 其他经验

**1、twine upload 命令参数使用**

使用 `twine upload -h` 命令可以查看一些可选参数。

其中 `--skip-existing` 参数可以使得上传同版本的包时不报错，当然也不会替换 PyPI 已有的包，而是忽略掉当前上传的。

很多参数可以不用显示在命令行中，而是通过设置环境变量来生效，比如你的 PyPI 账号和密码，这个方式很适合用在自动化中，比如 github 的 actions 里面就是这样使用的。

**2、使用 .pypirc 文件**

注册了 PyPI 账号之后可以在本地用户目录创建一个 .pypirc 文件，当你执行 upload 的时候就会读取这个配置文件的内容，配置文件可以同时设置 pypi 的配置和 testpypi 的配置，如下：

```bash
[distutils]
index-servers =
    pypi
    testpypi

[pypi]
repository: https://upload.pypi.org/legacy/
username: pypi_username
password: pypi_password

[testpypi]
repository: https://test.pypi.org/legacy/
username: testpypi_username
password: testpypi_password
```

信息比较清楚，不做解释，但是我发现网上关于这两个 repository 的地址有差异，但是我想到了一个办法，那就是不用记住这两个地址（我猜是因为换过），而是通过 twine 来查，具体方法如下：

```python
from twine.utils import DEFAULT_REPOSITORY,TEST_REPOSITORY

print(DEFAULT_REPOSITORY,TEST_REPOSITORY)
```

配置了这个文件之后，使用上传命令的时候就可以切换 pypi 和 testpypi 了，建议每次上传包先上传到 testpypi 然后本地安装验证之后再传到 pypi，上传命令分别是：

```shell
# 上传到 pypi，-r 的默认参数也是 pypi
twine upload -r pypi dist/*
# 上传到 testpypi，也就是 .pypirc 中配置的别名
twine upload -r testpypi dist/*
```

## 参考资料

- https://blog.konghy.cn/2018/04/29/setup-dot-py/