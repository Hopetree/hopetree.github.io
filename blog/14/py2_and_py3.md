# python2 和 python3 常见差异及兼容方式梳理

公司很多旧的项目代码都是 python2 的，而新项目代码都是 python3，于是我自己本地也是同时搭建了两个版本的 python 环境，平时写代码都是在 python3 的环境写好，然后在 python2 环境再验证一下兼容性，目的就是为了保证两个环境能通用。由于经常会遇到一些需要进行兼容的问题，因此觉得需要一篇博客来记录一下。

> 说明：本篇文章的 py2 特指 python 2.7+ 版本，py3 特指 python 3.5+ 及以上版本。


## 判断 python 版本的方法

既然是为了让代码兼容 py2 和 py3，那么很多时候必须先知道当前执行脚本的 python 版本是什么，这样才能去执行对应版本的代码，如下方法是一些开源第三方库所使用到的或者和判断版本的方法。

1、通过 sys.version 可以直接获取当前 python 版本号

```python
import sys

try:
    if sys.version >= '2.3':
        import textwrap
    elif sys.version >= '2.2':
        from optparse import textwrap
    else:
        from optik import textwrap
except ImportError:
    sys.stderr.write("Can't import textwrap module!\n")
    raise
```

2、通过 sys.version_info 获取版信息

```python
import sys

PY2 = sys.version_info[0] == 2
PY3 = sys.version_info[0] == 3
PY34 = sys.version_info[0:2] >= (3, 4)

if PY3:
    string_types = str,
    integer_types = int,
    class_types = type,
    text_type = str
    binary_type = bytes

    MAXSIZE = sys.maxsize
else:
    string_types = basestring,
    integer_types = (int, long)
    class_types = (type, types.ClassType)
    text_type = unicode
    binary_type = str
```

3、使用 platform.python_version() 获取版本号

```python
>>> import platform
>>> print(platform.python_version())
3.5.0
```

platform 可以获取到很多系统的信息，使用这个方法获取 python 版本信息其实不如上面两种常见。

## 被改名模块

python3 和 python2 中除了修改了一些模块的用法外，还有少数模块的名称进行了修改，但是用法不一定改动了，如下记录是一些常见的被改名的模块

| Python2 中名称  |  Python3 中名称 |
| :------------: | :------------: |
| ConfigParser  | configparser  |
| Queue  |  queue |
|  SocketServer | socketserver  |
| SimpleHTTPServer|http.server|


## print

Python2 中 print 是一个语句，而 Python3 中则是一个函数。

```python
#py2
>>> print("hello world")
hello world

#py3
>>> print("hello world")
hello world
```

上面例子看来好像二者没有区别，都可以正常打印，但是其实不一样，python2 其实把 ("hello world") 当做了一个整体，让我们来个更直观的例子

```python
#py2
>>> print("hello", "world")
('hello', 'world')

#py3
>>> print("hello", "world")
hello world
```

这样就很明显了，python2 是把括号的内容当做一个元祖输出的。

解决二者兼容的方法是在代码中引入一个模块，这样两个版本都可以使用带有括号的 print，并且输出也是一致的。

```python
#py2
>>> from __future__ import print_function
>>> print("hello", "world")
hello world
```

## base64

由于 python2 和 python3 在编码上面的一些历史原因，所有很多涉及到编码的模块都或多或少有一点使用上的区别，比如 base64 就是其中之一。

```python
#py2
>>> import base64
>>> a = "assssdfghj4562"
>>> b = base64.b64encode(a)
>>> b
'YXNzc3NkZmdoajQ1NjI='
>>> c = base64.b64decode(b)
>>> c
'assssdfghj4562'

#py3
>>> import base64
>>> a = "assssdfghj4562"
>>> b = base64.b64encode(a.encode('utf-8')).decode('utf-8')
>>> b
'YXNzc3NkZmdoajQ1NjI='
>>> c = base64.b64decode(b.encode('utf-8')).decode('utf-8')
>>> c
'assssdfghj4562'
```