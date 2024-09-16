# Python 命令行参数的3种传入方式

一般我们在运行 Python 项目或者脚本的时候都是直接执行启动脚本即可，但是 Python 作为一个脚本语言，在 Linux 中经常会跟 Shell 脚本结合使用，这个时候执行的 Python 脚本多半都需要使用命令行参数传入一些变量，下面就分享一下我在工作中常见和自己会使用的3种命令行参数传入方式。

## 命令行参数模块
我使用过的命令行参数模块主要分为两类，第一种当然就是 Python 内置的命令行模块，主要就是 `sys.argv` 和 `argparse`，第二种是第三方模块，比较有名的是 `click` 模块。

### sys.argv 模块
这个模块是我在工作中最常见的其他人写的 Python 脚本传入命令行参数的方式，也是最简单（粗暴）的方式。

直接来个测试代码来举个栗子：

```python
# -*- coding:utf-8 -*-
# @Date  : 2019/2/27

import sys


def test_for_sys(year, name, body):
    print('the year is', year)
    print('the name is', name)
    print('the body is', body)


if __name__ == '__main__':
    try:
        year, name, body = sys.argv[1:4]
        test_for_sys(year, name, body)
    except Exception as e:
        print(sys.argv)
        print(e)
```

一般我的 Python 脚本的启动函数就像上的例子一样，可能需要传入几个必要参数，这个时候，如果我们在使用命令行传入的时候，就可以使用 `sys.argv` 这个属性，任何一个 Python 脚本在启动的时候都有这个属性，它是一个列表，列表的第一个参数是脚本的命令，列表后面的参数就是命令行传入的参数，所以可以在脚本中提取这些参数传入到函数中运行。

上面的例子运行成功的显示结果如下：

```bash
G:\Allcodes\testscripts>python test_cmd.py 2018 Leijun "are you ok?"
the year is 2018
the name is Leijun
the body is are you ok?
```

上面例子运行失败的显示结果如下：

```bash
G:\Allcodes\testscripts>python test_cmd.py 2018 Leijun
['test_cmd.py', '2018', 'Leijun']
not enough values to unpack (expected 3, got 2)
```

很好理解，由于 `sys.argv` 是一个由参数组成的列表，所以如果脚本中需要的参数比你命令行中输入的多，那肯定会报错，因为你输入的参数不够，反过来，如果你输入的参数比函数需要的多，那么无所谓，多的参数因为不会被提取使用，所以不影响脚本运行。

小结：`sys.argv` 形式传入参数的方式比较简单，但是也很死板，因为传入的参数是一个有序的列表，所以在命令行中必须按照脚本规定的顺序去输入参数，这种方法比较适合脚本中需要的参数个数很少且参数固定的脚本。

### argparse 模块
`argparse` 模块也是 Python 自带的一个命令行参数模块，这个模块才是真的为了命令行参数而生的模块，相较之下 `sys.argv` 只是碰巧可以用在命令行参数上面而已。

继续看一个栗子：
```python
# -*- coding:utf-8 -*-
# @Date  : 2019/2/27

import argparse


def test_for_sys(year, name, body):
    print('the year is', year)
    print('the name is', name)
    print('the body is', body)


parser = argparse.ArgumentParser(description='Test for argparse', formatter_class=argparse.RawTextHelpFormatter)
parser.add_argument('--name', '-n', help='name 属性，非必要参数')
parser.add_argument('--year', '-y', help='year 属性，非必要参数，但是有默认值', default=2017)
parser.add_argument('--body', '-b', help='body 属性，必要参数', required=True)
args = parser.parse_args()

if __name__ == '__main__':
    try:
        test_for_sys(args.year, args.name, args.body)
    except Exception as e:
        print(e)
```

使用 `argparse` 模块的方式也挺简单的，首先需要构建一个参数实例，也就是代码中的
```python
parser = argparse.ArgumentParser(description='Test for argparse', formatter_class=argparse.ArgumentDefaultsHelpFormatter)
```
这行代码就生成了一个命令行参数的对象，之后就可以给对象添加一些参数属性，最后只需要从属性从提取传入的参数进行使用即可。

上面的代码添加了3个参数，添加参数的前两个字段很容易理解，`--name` 和 `-n` 都可以用来在命令行中使用，都表示了参数 `name`，这样后面使用 `parse_args()` 方法获取到所有参数之后，就可以使用 `args.name` 这种形式来提取对应的参数。

首先来看看使用了命令行参数之后脚本的“帮助”：
```powershell
G:\Allcodes\testscripts>python test_cmd.py --help
usage: kkb.py [-h] [--name NAME] [--year YEAR] --body BODY

Test for argparse

optional arguments:
  -h, --help            show this help message and exit
  --name NAME, -n NAME  name 属性，非必要参数 (default: None)
  --year YEAR, -y YEAR  year 属性，非必要参数，但是有默认值
                        (default: 2017)
  --body BODY, -b BODY  body 属性，必要参数 (default: None)
```
可以看到，脚本生成了一个 help，这样就可以在脚本中对每个参数的使用进行一些描述，方便其他人更加了解每个参数的含义，方便使用。

看一下运行成功的几个命令，首先是不传入 year 参数，而使用默认的参数：
```bash
G:\Allcodes\testscripts>python test_cmd.py -n Leijun --body "are you ok?"
the year is 2017
the name is Leijun
the body is are you ok?
```

然后是不提供 name 参数，但是不会报错，最后可以看到从参数中会得到一个 None 并传入到了脚本中进行使用:

```bash
G:\Allcodes\testscripts>python test_cmd.py --body "are you ok?"
the year is 2017
the name is None
the body is are you ok?
```

最后看一个报错的执行结果：
```bash
G:\Allcodes\testscripts>python test_cmd.py
usage: test_cmd.py [-h] [--name NAME] [--year YEAR] --body BODY
test_cmd.py: error: the following arguments are required: --body/-b
```
可以看到上面的报错提示了 body 参数是一个必要参数，不能少。

在添加命令行参数的属性的时候，还可以有更多的设置，如下：

- name or flags：也就是在使用参数的时候使用的符号，`--foo` 或者 `-f`
- action：根据我的理解，这个属性可以选择参数在只提供符号而不输入实际的值的时候给予一个默认的值
- nargs：这个属性规定了参数可以输入的个数
- const：这属性跟 action 属性一起使用
- default：这属性就是给参数设置一个默认值
- type：这个属性规定了参数的数据类型
- choices：这个属性给参数限定了一个选择的迭代，参数只能在这个范围内选择参数的值，否则报错
- required：参数的值为必填

更多的参数介绍和使用可以查看官方文档：[Python 官方文档：argparse](https://docs.python.org/zh-cn/3/library/argparse.html?highlight=argparse#module-argparse)

小结：其实我非常喜欢这个内置的命令行参数模块，因为它不仅方便使用，更重要的是它就是内置的，不需要单独安装依赖。

### click 库
Click 是 Flask 的团队 pallets 开发的优秀开源项目，它为命令行工具的开发封装了大量方法，使开发者只需要专注于功能实现。这是一个第三方库，专门为了命令行而生的非常有名的 Python 命令行模块。

举个栗子：

```python
# -*- coding:utf-8 -*-
# @Date  : 2019/2/27

import click

@click.command()
@click.option('--name',default='Leijun',help='name 参数，非必须，有默认值')
@click.option('--year',help='year 参数',type=int)
@click.option('--body',help='body 参数')
def test_for_sys(year, name, body):
    print('the year is', year)
    print('the name is', name)
    print('the body is', body)

if __name__ == '__main__':
    test_for_sys()
```

运行一个看看

```bash
G:\Allcodes\testscripts>python test_cmd.py --year 2019
the year is 2019
the name is Leijun
the body is None
```

可以看到 click 是使用装饰器的方式给函数添加命令行属性，比较特殊的是最后调用函数的时候是没有带上参数的，因为参数会自动通过命令行的形式传入。其他设置参数的属性跟前面的 `argparse` 的方式非常相似，具体的参数可以参考文档和其他的教程用法，这里就不做过多的说明。

小结：click 库也是一个非常人性化的命令行参数模块，它其实非常强大，强大到把所有的命令行参数可能涉及的情况都考虑到了，需要自己去探索。


## 总结
以上就是我接触和使用到的三种给 Python 脚本设置命令行参数的方法，其中第一种是我在工作中见到的其他同事写的脚本中的方式，但是我并不喜欢这种方式，因为它真的太死板了；我最喜欢的是 `argparse` 模块，这个模块是内置模块，但是功能完全够用，非常方便。