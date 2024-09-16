# Python 模板渲染库 yaml 和 jinja2 的实战经验分享

之前公司的项目部署主要使用的是 ansible 编排，说到 ansible 就不得不提到强大的 jinja 语法了。而后来公司又让各个服务把部署方式改成 SDK 安装的方式，这个转变就引发了一些重复利用文件的问题，最后的解决办法就是使用 yaml 和 jinja2 将原本属于 ansible 的模板文件充分利用起来了。这篇文章就来分享一下我在工作中使用到的 jinja 用法。

## yaml 库的简单使用

YAML 是现在比较流行（我觉得用最流行也不为过）的配置文件格式，它相较于 XML 格式更加简洁，同时又比 JSON 直观，所以成了各个语言的微服务必备配置文件。Python 有个 yaml 库可以用来操作 yaml 格式的文件，一般读取文件的操作使用比较多。

下面这个就是最简单地读取 yaml 格式的文件的方式

```python
from yaml import safe_load

with open(filename, 'r') as f:
    vars_string = f.read()
base_vars = safe_load(vars_string)
```

使用 `safe_load()` 函数可以将读取到的 yaml 文件的字符串转换成字典格式，方便后续 jinja 使用。

## yaml 与 jinja2 结合使用

现在有一个场景，就是需要把 ansible 的配置文件（一般都是一个名为 all 的 yaml 格式的文件）读取成字典进行调用。现在这个配置文件部分内容如下：

```yaml
date: 2019-11-06
pkg:
  python:
    version: 3.6.8
    date: "{{ date }}"
  django:
    version: "{% if pkg.python.version|first == '2' %}1.8{% else %}2.2.6{% endif %}"
```

这里可以看到，虽然这个只是一个 yaml 文件，但是里面是含有 jinja 语法的，所以如果单纯的使用上面的 `safe_load()` 函数，会发现得到的字典里面是包含 jinja 语法的，这当然不能被使用。所以，需要在提取到文件的信息之后进行处理，也就是使用 jinja2 对 yaml 文件进行渲染。

具体的代码可以看下面这个函数：

```python
from yaml import safe_load
from jinja2 import Template
def get_vars_from_file(filename):
    with open(filename, 'r') as f:
        vars_string = f.read()
    # 读取初始的配置文件，并转换成字典
    base_vars = safe_load(vars_string)
    # 使用当前配置参数渲染自己本身，把配置中jinja语法渲染成实际值
    vars = Template(vars_string).render(base_vars)
    return vars

if __name__ == '__main__':
    fn = 'vars.yml'
    vars = get_vars_from_file(fn)
    print(vars)
```

这个函数做的事情不仅仅是读取当前的配置文件，而是在读取到配置文件之后，使用自身来渲染自身，从而达到把自身包含的 jinja 语法去掉，这个里面使用到的 jinja2 的用法很基础，就是一个 Template 类用来实例化一个待渲染的对象，然后使用 `render()` 方法使用指定的参数得到渲染结果。最终输出如下：

```yaml
date: 2019-11-06
pkg:
  python:
    version: 3.6.8
    date: "2019-11-06"
  django:
    version: "2.2.6"
```

这里可以看到，经过一轮自己渲染自己的过程之后，配置文件已经不再包含 jinja 语法了，这个时候可以继续使用 `safe_load()` 方法转换成字典以备后续使用。这个文件里面涉及到的 jinja 语法并不复杂，我这里也不对 jinja 语法做太多举例，自己可以根据需要去查官方文档。

## jinja2 高级用法

上面使用 Template 类可以很方便地对模板进行渲染，但是很多时候我们需要做的不是简单的渲染，而是更多复杂的事情，所以这里就需要用到 jinja2 的高级类 Environment。使用过 jinja 语法（其实 django 的模板语法跟 jinja 语法也有很多一样的）都知道语法里面有几个基本的标签，比如 `{{}}` 表示的变量标签，`{%%}` 表示的块标签，`{##}`表示的是注释标签，jinja 默认会把这些标签里面的内容进行渲染，但是有时候我们可能不想要渲染这些语法，这个时候，Environment 类就可以发挥作用了，它可以在初始化的时候自定义上述的几种标签格式，进而做到根据自定义的语法标签去渲染模板。

下面是一个简单的应用场景，需要将某个目录下面的 html 文件渲染：

```python
from yaml import safe_load
from jinja2 import Template, Environment, FileSystemLoader

def get_vars_from_file(filename):
    with open(filename, 'r') as f:
        vars_string = f.read()
    # 读取初始的配置文件，并转换成字典
    base_vars = safe_load(vars_string)
    # 使用当前配置参数渲染自己本身，把配置中jinja语法渲染成实际值
    vars = Template(vars_string).render(base_vars)
    return vars

def test_render(vars, filename):
    load = FileSystemLoader('templates')
    env = Environment(loader=load)
    template = env.get_template(filename)
    result = template.render(vars)
    print(result)

if __name__ == '__main__':
    fn = 'vars.yml'
    vars = get_vars_from_file(fn)
    test_render(safe_load(vars), 'base.html')
```

直接看 `test_render()` 函数的内容就行了，一般 Environment, FileSystemLoader 两个类是一起使用的，后者是用来加载待渲染文件的类，同类型的类还有模块加载器，这里是目录加载器，就是制定需要渲染的目录，参数可以是单个目录，也可以是一个目录列表。`get_template()` 可以把需要渲染的文件实例化，然后就可以进行渲染了。我上面的代码并没有对 jinja2 默认的语法标签做替换，因为只是一个简单的例子。

下面是待渲染的文件 `templates\base.html` 的内容：

```html
<div>
    <p>today is {{ date }}</p>
    <p>the python is python{{ pkg.python.version|first }}</p>
</div>
```

渲染结果如下：

```html
<div>
    <p>today is 2019-11-06</p>
    <p>the python is python3</p>
</div>
```

## 总结

大部分情况下，使用 yaml 库可以直接读取 YAML 格式的配置文件并转换成字典使用；大部分情况下，使用 jinja2.template 就可以完成一个简单的 jinja 模板的渲染。当 yaml 和 jinja2 一起使用的时候，可以触发“强强联手”羁绊，非常强大。