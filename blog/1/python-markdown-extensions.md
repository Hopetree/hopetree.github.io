# Python-Markdown 自定义拓展

现在大部分跟代码有关的编辑器和网站基本都是支持 markdown 语法的，我比较喜欢的 markdown 内容显示的网站是 vitepress 的网站，vitepress 支持的语法比较全，而且有很多个性化的渲染语法，是原生的 markdown 不具备的。

本文分享一下利用 markdown 自带的拓展类进行自定义渲染语法。


## 自定义行渲染规则

行渲染规则就是指单行内容的渲染，一般是比较短的渲染，比如最常见的加粗语法： `**加粗**` 就是行渲染规则。

而我发现 Python的 markdown 库居然不支持“删除文本”的规则，当然也可能有什么参数我没有开启所以才没支持。不过没关系，我可以自定义这个规则。

可以看一下官方给的自定义的代码：[https://python-markdown.github.io/extensions/api/#example_3](https://python-markdown.github.io/extensions/api/#example_3 "https://python-markdown.github.io/extensions/api/#example_3")

官方文档这里的例子就是在实现一个“删除文本”的规则，可以直接拿来用：

```python
from markdown.inlinepatterns import InlineProcessor
from markdown.extensions import Extension
import xml.etree.ElementTree as etree


class DelInlineProcessor(InlineProcessor):
    def handleMatch(self, m, data):
        el = etree.Element('del')
        el.text = m.group(1)
        return el, m.start(0), m.end(0)

class DelExtension(Extension):
    def extendMarkdown(self, md):
        DEL_PATTERN = r'--(.*?)--'  # like --del--
        md.inlinePatterns.register(DelInlineProcessor(DEL_PATTERN, md), 'del', 175)

```

文档里面说了，这个 `InlineProcessor` 类的第一个调用函数 `handleMatch` 的参数有两个，第一个参数 `m` 就是利用正则匹配到的内容，如正则 `r'--(.*?)--'` 匹配的内容。

将匹配的内容放到自定义的标签里面的方式是使用 `etree.Element('del')`，这个就可以给匹配内容添加标签，实现一个简单的行内容渲染规则。

然后使用自定义的规则：

```python
from utils.markdown_ext import (
    DelExtension,
    IconExtension
)

def make_markdown():
    md = markdown.Markdown(extensions=[
        'markdown.extensions.extra',
        'markdown_checklist.extension',
        CodeHiliteExtension(pygments_formatter=CustomHtmlFormatter),
        TocExtension(slugify=slugify),
        DelExtension(),  # 自定义规则
    ])
    return md
```

### 删除文本规则

这是我自定义的删除文本规则（在例子里面稍微改了一下）：

```python
# utils/markdown_ext.py
class DelInlineProcessor(InlineProcessor):
    def handleMatch(self, m, data):
        el = etree.Element('del')
        el.text = m.group(1)
        return el, m.start(0), m.end(0)


class DelExtension(Extension):
    """
    删除文本
    匹配：~~删除~~
    输出：<del>删除</del>
    """

    def extendMarkdown(self, md):
        DEL_PATTERN = r'~~(.*?)~~'  # like ~~del~~
        md.inlinePatterns.register(DelInlineProcessor(DEL_PATTERN, md), 'del', 175)
```

### 图标规则

为了方便在文本里面使用图标，我按照删除文本的规则定义了一个渲染图标的规则：

```python
class IconInlineProcessor(InlineProcessor):
    def handleMatch(self, m, data):
        text = m.group(1)
        el = etree.Element('i')
        el.set('class', 'fa fa-{}'.format(text.replace('icon:', '')))
        return el, m.start(0), m.end(0)


class IconExtension(Extension):
    """
    渲染图标
    匹配：icon:exclamation-triangle
    输出：<i class="fa fa-exclamation-triangle"></i>
    """

    def extendMarkdown(self, md):
        DEL_PATTERN = r'(icon:[a-z-]+)'
        md.inlinePatterns.register(IconInlineProcessor(DEL_PATTERN, md), 'icon', 180)
```

这个规则很简单，比如输入`icon:home`就可以被渲染成 `<i class="fa fa-home"></i>` 这种图标的标签。

## 自定义块渲染规则

块渲染规则是指将一个段落渲染成 html 的段落，比如代码块就是块渲染。

我这里想要实现一个块渲染效果，最后可以生成 bootstrap 里面的 alert 效果，这里可以看一下目标的效果 html 的代码：

```html
<div class="alert alert-primary" role="alert">
  A simple primary alert—check it out!
</div>
<div class="alert alert-secondary" role="alert">
  A simple secondary alert—check it out!
</div>
<div class="alert alert-success" role="alert">
  A simple success alert—check it out!
</div>
<div class="alert alert-danger" role="alert">
  A simple danger alert—check it out!
</div>
<div class="alert alert-warning" role="alert">
  A simple warning alert—check it out!
</div>
<div class="alert alert-info" role="alert">
  A simple info alert—check it out!
</div>
<div class="alert alert-light" role="alert">
  A simple light alert—check it out!
</div>
<div class="alert alert-dark" role="alert">
  A simple dark alert—check it out!
</div>
```

这些都是 bootstrap 里面的效果，其实就是在 div 标签里加了一个 class 然后添加了一个固定的 `role="alert"`。

我希望输入的规则是这样的：

```text

:::info
文本内容
:::
```

也就是这个块需要使用 `:::`开头和结尾，并且开头里面必须填写一个级别。

### 官方示例

先看一下[官方的实例](https://python-markdown.github.io/extensions/api/#example_1 "官方的实例")：

```python
def test_block_processor():
    class BoxBlockProcessor(BlockProcessor):
        RE_FENCE_START = r'^ *!{3,} *\n' # start line, e.g., `   !!!! `
        RE_FENCE_END = r'\n *!{3,}\s*$'  # last non-blank line, e.g, '!!!\n  \n\n'

        def test(self, parent, block):
            return re.match(self.RE_FENCE_START, block)

        def run(self, parent, blocks):
            original_block = blocks[0]
            blocks[0] = re.sub(self.RE_FENCE_START, '', blocks[0])

            # Find block with ending fence
            for block_num, block in enumerate(blocks):
                if re.search(self.RE_FENCE_END, block):
                    # remove fence
                    blocks[block_num] = re.sub(self.RE_FENCE_END, '', block)
                    # render fenced area inside a new div
                    e = etree.SubElement(parent, 'div')
                    e.set('style', 'display: inline-block; border: 1px solid red;')
                    self.parser.parseBlocks(e, blocks[0:block_num + 1])
                    # remove used blocks
                    for i in range(0, block_num + 1):
                        blocks.pop(0)
                    return True  # or could have had no return statement
            # No closing marker!  Restore and do nothing
            blocks[0] = original_block
            return False  # equivalent to our test() routine returning False

    class BoxExtension(Extension):
        def extendMarkdown(self, md):
            md.parser.blockprocessors.register(BoxBlockProcessor(md.parser), 'box', 175)
```

这里的关键就是怎么匹配块的开头和结尾，利用的是两个正则，然后匹配之后就可以给这个块添加 html 标签和其他属性。


### 类似 vitepress 的规则

看下我的代码：

```python
class AlertBlockProcessor(BlockProcessor):
    RE_FENCE_START = r'^:{3}\s*primary\s*.*\n*|^:{3}\s*secondary\s*.*\n*|^:{3}\s*success\s*.*\n*|^:{3}\s*danger\s*.*\n*|^:{3}\s*warning\s*.*\n*|^:{3}\s*info\s*.*\n*'
    RE_FENCE_END = r'\n*:{3}$'

    icon_dict = {
        'primary': 'info-circle',
        'secondary': 'info-circle',
        'success': 'info-circle',
        'danger': 'warning',
        'warning': 'warning',
        'info': 'info-circle'
    }

    def test(self, parent, block):
        return re.match(self.RE_FENCE_START, block)

    def run(self, parent, blocks):
        # print(blocks)
        original_block = blocks[0]
        first_blocks = original_block.split()
        if len(first_blocks) == 3:
            title = first_blocks[2]
        elif len(first_blocks) == 2:
            title = 'Tip'
        else:
            return False
        blocks[0] = re.sub(self.RE_FENCE_START, '', blocks[0])
        # print(blocks[0])

        # Find block with ending fence
        for block_num, block in enumerate(blocks):
            # print(re.search(self.RE_FENCE_END, block), block)
            if re.search(self.RE_FENCE_END, block):
                # remove fence
                blocks[block_num] = re.sub(self.RE_FENCE_END, '', block)
                # render fenced area inside a new div
                e = etree.SubElement(parent, 'div')
                icon_elm = etree.Element('i')
                strong_tag = etree.Element('strong')
                title_elm = etree.Element('p')
                class_value = 'alert alert-{}'
                flag = False
                for key in ['primary', 'secondary', 'success', 'danger', 'warning', 'info']:
                    if key in original_block:
                        e.set('class', class_value.format(key))
                        e.set('role', 'alert')
                        icon_elm.set('class', 'fa fa-{}'.format(self.icon_dict[key]))
                        strong_tag.append(icon_elm)
                        span_elm = etree.Element('span')
                        span_elm.text = title
                        strong_tag.append(span_elm)
                        title_elm.append(strong_tag)
                        e.insert(0, title_elm)
                        flag = True
                        break
                if not flag:
                    return False
                self.parser.parseBlocks(e, blocks[0:block_num + 1])
                # remove used blocks
                for i in range(0, block_num + 1):
                    blocks.pop(0)
                return True  # or could have had no return statement
        # No closing marker!  Restore and do nothing
        blocks[0] = original_block
        return False  # equivalent to our test() routine returning False


class AlertExtension(Extension):
    """
    生产Alert块
    """

    def extendMarkdown(self, md):
        md.parser.blockprocessors.register(AlertBlockProcessor(md.parser), 'alert', 178)
```

这里是实现了一个跟 vitepress 的规则类似的效果。

我这里就是需要匹配 `:::info 标题` 这种格式，然后结尾必须是 `:::`，然后根据填写的级别去追加 class 属性和 role 属性。


## 测试和效果

### 测试自定义规则

我定义了三个规则，这里直接写一个用例同时验证三个规则，代码如下：

```python
if __name__ == '__main__':
    import markdown

    m = markdown.Markdown(extensions=[
        'markdown.extensions.extra',
        DelExtension(),
        IconExtension(),
        AlertExtension()
    ])

    t = '''
::: warning 提示

注意，这是一个演示效果，~~我是被删除的内容~~
:::
    '''

    html = m.convert(t)
    print(html)
```

看一下输出的 html 效果：

```html
<div class="alert alert-warning" role="alert">
<p><strong><i class="fa fa-warning"></i><span>提示</span></strong></p>
<p>注意，这是一个演示效果，<del>我是被删除的内容</del></p>
</div>
```

可以看到，代码块的规则符合预期，然后标签规则也符合预期，“删除文本”也是符合预期的。

### 演示效果

markdown 文本如下：

```text
::: tip

这是一个没有标题的 alert
:::

::: tip

🎉 **自定义标题**

这是一个没有标题的 alert
:::

::: tip

这是一个没有标题的 alert
:::

::: tip 注意

这是一个演示效果，~~我是被删除的内容~~
:::

::: danger 注意

这是一个演示效果，~~我是被删除的内容~~
:::

::: warning 注意

这是一个演示效果，~~我是被删除的内容~~
:::

::: tip 注意

这是一个演示效果，~~我是被删除的内容~~
:::
```

渲染效果：

::: tip

这是一个没有标题的 alert
:::

::: tip

🎉 **自定义标题**

这是一个没有标题的 alert
:::

::: tip

这是一个没有标题的 alert
:::

::: tip 注意

这是一个演示效果，~~我是被删除的内容~~
:::

::: danger 注意

这是一个演示效果，~~我是被删除的内容~~
:::

::: warning 注意

这是一个演示效果，~~我是被删除的内容~~
:::

::: tip 注意

这是一个演示效果，~~我是被删除的内容~~
:::


### 代码组的效果

我还按照 vitepress 的渲染格式实现了代码组的效果，这个效果主要依靠 bootstrap 的效果，而且实现这个效果不仅仅是依靠 markdown 拓展，还需要写 js 代码来实现。


:::: code-group

::: code-item npm

```sh
$ npx vitepress init
```
:::

::: code-item pnpm

```sh
$ pnpm vitepress init
```
:::

::: code-item bum

```sh
$ bunx vitepress init
```
:::

::::

## 官方文档

- [Writing Extensions for Python-Markdown](https://python-markdown.github.io/extensions/api/#stages)