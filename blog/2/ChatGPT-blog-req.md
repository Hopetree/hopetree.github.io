# [ChatGPT解决方案]🤖️ChatGPT协助我完成博客代码块添加复制代码和显示代码语言功能

最近对博客做了一些改动，比如重新展示了文章页面的文档表单导航，风格参考了 vitepress 的显示效果，同时也给文章页面的代码块添加了复制代码和显示代码语言的功能，参考的显示效果是 ChatGPT 网页输出。

这两个改动主要都是前端的改动，我就直接让 ChatGPT 协助我完成了我的改动需求，这篇文章就来记录一下关于代码块的两个小功能的实现。

## 需求分析

我的需求其实很明确，我需要给我的文章代码块添加复制功能，还有就是能显示代码块里面的语言类型，这两个功能在很多开源博客里面都有，比如 vitepress 里面，还有 ChatGPT 的输出代码块里面也有，我就直接想要跟 ChatGPT 的输出效果一样就行。

针对这个需求，我分解成了两个小需求来做，复制功能是直接让 ChatGPT 给方案的。把需求细化一下就是如下的描述：

1. 复制功能：需要在代码块的上面添加一个 div 标签，然后在 div 标签里面添加一个按钮，靠右显示，当点击这个按钮的时候，可以把代码块的内容复制到剪切板
2. 代码块语言显示：在代码块上方新增的 div 标签里面再添加一个 span 标签，靠左显示，这里需要显示代码块的语言。

## 代码块复制功能

### ChatGPT 的方案

直接来看看我跟 ChatGPT 的对话吧，我其实主要是想先看看 ChatGPT 会怎么设计这个功能，然后慢慢修改需求描述来细化需求。

> html实现复制代码块的内容

在HTML中，要实现复制代码块的内容，通常需要使用JavaScript来完成。以下是一个简单的实现方法：

1.在HTML中，将要被复制的代码块放在一个`<pre>`标签中，将其内容放在一个`<code>`标签中，如下所示：

```html
<pre>
  <code>
    这里是要被复制的代码块
  </code>
</pre>

```

2.在代码块的上方或下方添加一个按钮或链接，用于触发复制操作，如下所示：

```html
<button onclick="copyCode()">复制代码</button>

```

3.在JavaScript中，定义一个copyCode()函数，用于执行复制操作，如下所示：

```javascript
function copyCode() {
  // 获取代码块元素
  var code = document.querySelector('pre code');

  // 创建一个textarea元素
  var textarea = document.createElement('textarea');
  textarea.value = code.textContent;
  document.body.appendChild(textarea);

  // 选择textarea元素中的文本
  textarea.select();

  // 执行复制操作
  document.execCommand('copy');

  // 移除textarea元素
  document.body.removeChild(textarea);
}

```

这个函数的实现过程如下：

首先，获取代码块元素，即`<pre>`标签中的`<code>`标签。
然后，创建一个`<textarea>`元素，并将代码块的内容赋值给它。
接下来，将`<textarea>`元素添加到文档中。
然后，选中`<textarea>`元素中的文本。
最后，执行复制操作，并将`<textarea>`元素从文档中移除。
这样就可以实现复制代码块的内容了。

### 灵魂拷问

> 为什么要创建textarea，可以不创建吗

在JavaScript中，要实现复制操作，需要将文本内容放入剪贴板中，而HTML中没有提供直接将文本放入剪贴板的API，因此我们需要使用一个中间的元素来完成复制操作。`<textarea>`元素可以作为中间元素，因为它具有可编辑文本区域的特性，可以将文本放入其中，然后通过选中文本并执行复制操作，将其放入剪贴板中。因此，在实现复制代码块的内容时，我们需要创建一个`<textarea>`元素，并将代码块的内容放入其中，才能完成复制操作。如果不创建`<textarea>`元素，就无法将文本放入剪贴板中，因此不能实现复制操作。

PS：能问出这个问题很明显我就不是搞前端的，但是这也就是为什么我觉得作为一个对前端一知半解的人也能做出一个完整项目的原因，那就是多发问，多思考。

> 那这个创建的元素会显示出来吗

在实现复制操作时，创建的`<textarea>`元素并不需要显示在页面上，因此需要通过CSS样式将其隐藏起来。可以设置其display属性为none，这样它就不会在页面中显示出来了。在执行完复制操作后，需要将其从文档中移除，以免对页面造成影响。以下是一个完整的实现示例：

```html
<pre>
  <code>
    这里是要被复制的代码块
  </code>
</pre>
<button onclick="copyCode()">复制代码</button>

<script>
  function copyCode() {
    // 获取代码块元素
    var code = document.querySelector('pre code');

    // 创建一个textarea元素
    var textarea = document.createElement('textarea');
    textarea.style.position = 'absolute';
    textarea.style.left = '-9999px';
    textarea.value = code.textContent;
    document.body.appendChild(textarea);

    // 选择textarea元素中的文本
    textarea.select();

    // 执行复制操作
    document.execCommand('copy');

    // 移除textarea元素
    document.body.removeChild(textarea);
  }
</script>

```

PS：我觉得我的这个问题也非常的好，很明显要把代码块的内容复制到剪切板需要临时创建一个 textarea，此时肯定要考虑这个不能让用户感知到。

### 解决问题

参考 ChatGPT 的方案我已经写出了可以复制代码块的功能，但是我发现每次复制的内容都是最后一个代码块的内容，这也很能理解，因为代码块是用 class 属性定位的，所以每次都是拿到的最后一个，于是我需要进一步解决问题。

> 由于.codehilite是有多个，所以按照这个逻辑，每次复制到的都是最后一个，请解决问题

如果你的页面中有多个 .codehilite 元素，并且你希望每个代码块都有自己的复制按钮，那么可以对每个 .codehilite 元素都执行一遍创建复制按钮的操作。

以下是对示例代码进行修改后的 jQuery 代码：

```javascript
// 对每个代码块进行操作
$('.codehilite').each(function() {
  // 获取当前代码块中的文本
  var code = $(this).find('pre').text();

  // 创建新的 div 元素和复制按钮
  var wrapper = $('<div>').addClass('code-wrapper');
  var copyButton = $('<button>').text('复制');

  // 点击按钮时复制代码块中的文本
  copyButton.click(function() {
    copyToClipboard(code);
  });

  // 创建新的 pre 元素并将代码块中的文本添加到其中
  var pre = $('<pre>').text(code);

  // 将新的 pre 元素和复制按钮添加到新的 div 元素中
  wrapper.append(pre, copyButton);

  // 将新的 div 元素添加到代码块中
  $(this).prepend(wrapper);
});

// 复制函数
function copyToClipboard(text) {
  var textarea = $('<textarea>').val(text);
  $('body').append(textarea);
  textarea.select();
  document.execCommand('copy');
  textarea.remove();
}

```

PS: 当然，这些代码都只是作为参考的代码，并不是我真正使用的，但是我跟 ChatGPT 的对话就是类似这种一步一步解决问题，细化需求，直到基本功能实现。

### 完善需求

由于我想实现跟 ChatGPT 完成一样的复制代码块的效果，所以包括图标效果，于是我复制到到了 ChatGPT 的复制前的 svg 效果，但是拿不到复制后的 svg，不过这样没什么难度，直接让 ChatGPT 来提供代码。

> 请用html的svg输出一个打勾符号，类似于chatgpt代码复制后的图标

以下是一个用HTML的SVG输出的打勾符号示例：

```html
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
  <path d="M9 16.2l-3.6-3.6c-.4-.4-1-.4-1.4 0-.4.4-.4 1 0 1.4l4 4c.2.2.5.3.7.3.3 0 .5-.1.7-.3l8-8c.4-.4.4-1 0-1.4s-1-.4-1.4 0l-7.3 7.3z"/>
</svg>

```

剩下的需求就是设置 css 了，这个直接参考 ChatGPT 的页面效果就行，不知道的直接问 ChatGPT 就解决了，最后的效果也是挺让我满意的，基本跟 ChatGPT 的页面一致。

## 代码块语言显示

### 功能难点

这个功能的主要难点是在使用 markdown 渲染出来的 html 里面本身就没有语言类型，这就导致了我不可能把语言类型显示出来，所以问题的关键是怎么能在渲染的时候输出语言类型。

这个问题就要提到 python 用来渲染 markdown 的库的问题了，我文章里面渲染的原代码如下：

```python
md = markdown.Markdown(extensions=[
                'markdown.extensions.extra',
                'markdown.extensions.codehilite',
                TocExtension(slugify=slugify),
            ])
```

这个里面的 `markdown.extensions.codehilite` 扩展就是用来渲染和高亮代码块的，但是这里有个问题，一旦使用这个，就不会显示代码块的语言。于是我找了一下网上的方法可以使用 `markdown.extensions.fenced_code` 来显示语言，我试了一下的确可以，但是用这个又会丢掉代码块的高亮效果，而且两个扩展都加上也没用，会让这个扩展直接失效。

基于这个问题，我还在 V 站提了一个[问题](https://www.v2ex.com/t/935080#reply1 "问题")，但是并没有得到人回复，可能是我描述不清楚，也可能是没人用到这个吧。

### 来自官方文档的解决方案

后来我去仔细看官方文档才发现了在文档里面特意说到了这个问题，还提供了一个[方案](https://python-markdown.github.io/extensions/code_hilite/#usage "方案")，我直接拿来用就实现了我要的功能。

具体代码如下：

```python
from pygments.formatters import HtmlFormatter
from markdown.extensions.codehilite import CodeHiliteExtension


class CustomHtmlFormatter(HtmlFormatter):
    def __init__(self, lang_str='', **options):
        super().__init__(**options)
        # lang_str has the value {lang_prefix}{lang}
        # specified by the CodeHilite's options
        self.lang_str = lang_str

    def _wrap_code(self, source):
        yield 0, f'<code class="{self.lang_str}">'
        yield from source
        yield 0, '</code>'


some_text = '''\
    :::python
    print('hellow world')
'''

markdown.markdown(
    some_text,
    extensions=[CodeHiliteExtension(pygments_formatter=CustomHtmlFormatter)],
)
```

输出效果：

```html
<div class="codehilite">
    <pre>
        <code class="language-python">
        ...
        </code>
    </pre>
</div>
```

### 将语言类型提取后显示

后端渲染后的 html 里面终于有的了语言类型的信息，这个时候要实现在前端展示就很容易了，只需要使用 js 从原来的 code 标签的 class 属性里面提取出来就行了，此处就不做过多描述了。

## 总结

自从 ChatGPT 火爆全网之后，就有各行各业的人想从 ChatGPT 中分一杯羹，但是很多人可能都在凑热闹，自己都没明白自己想要的是什么，就拿着 ChatGPT 各种玩，然后就说 ChatGPT 多强多强，实际上对自己一点帮助没有。

在我看来，ChatGPT 对编程人员来说还是非常好用的，完全可以当作一个工作上面的助手，我现在豪不夸张的说就是面向 ChatGPT 编程了，很多工作和个人的编程都会参考 ChatGPT 给的方案，小到一个 shell 命令，大到一个复杂场景的需求，都可以让 ChatGPT 提供解决方案，虽然不是每次都有效，但是的确可以帮助我提供很多思路。