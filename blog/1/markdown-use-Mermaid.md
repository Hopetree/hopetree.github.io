# markdown 支持 Mermaid 流程图的方案

前几天使用 Kimi 生成了几个流程文档，文档中有流程图，但是我发现流程图代码可以在语雀上面渲染成流程，而我自己的博客只能显示源码，当时也只觉得不支持这种语法就没管，今天心血来潮查了一下这种流程图如何在 markdown 中渲染成功图片。经过短暂的知识吸收，我就完成了博客改造。

## 认识 Mermaid

现在的 AI 输出的内容都是 markdown 格式的，而 Mermaid 可以将 markdown 中的图标格式的代码块渲染成图标。

比如一个流程图的代码格式如下，只需要把代码块语法设置成 Mermaid 就行：

```markdown
flowchart TD
    A[Christmas] -->|Get money| B(Go shopping)
    B --> C{Let me think}
    C -->|One| D[Laptop]
    C -->|Two| E[iPhone]
    C -->|Three| F[fa:fa-car Car]
```

下面是中文文档：[https://mermaid.nodejs.cn/](https://mermaid.nodejs.cn/ "https://mermaid.nodejs.cn/")

然后是官方提供的在线渲染工具：[https://mermaid-live.nodejs.cn/](https://mermaid-live.nodejs.cn/ "https://mermaid-live.nodejs.cn/")

![](https://cdn.jsdelivr.net/gh/Hopetree/blog-img@main/2025/202503131733830.png)

## html 中使用 Mermaid

在 html 中首选需要将 markdown 的流程块渲染成下面这种格式：

```html
<pre class='mermaid'>
flowchart TD
    A[Christmas] -->|Get money| B(Go shopping)
    B --> C{Let me think}
    C -->|One| D[Laptop]
    C -->|Two| E[iPhone]
    C -->|Three| F[fa:fa-car Car]
</pre>
```

这里经过验证，使用 `pre` 标签或者 `div` 标签都可以，只要设置成 `class="mermaid"` 就行。

然后就是引入 Mermaid 的 js 代码，使用如下：

```html
<body>
  <script type="module">
    import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs';
    mermaid.initialize({ startOnLoad: true });
  </script>
</body>
```

这样，页面只要有流程块，就自动会渲染成流程图。比如像这样：

```mermaid
flowchart TD
    A[Christmas] -->|Get money| B(Go shopping)
    B --> C{Let me think}
    C -->|One| D[Laptop]
    C -->|Two| E[iPhone]
    C -->|Three| F[fa:fa-car Car]
```

## Django 中使用

下面直接分享我这次对博客的改造，让我的博客支持了 markdown 中渲染流程图。

### markdown 渲染优化

首先这里的目的是为了让 markdown 把流程图代码块渲染成 html 块，但是我发现 markdown 会把流程块识别成代码块。

于是我的方案是在进行 markdown 渲染之前先将要渲染的内容中的流程图块处理成 html 格式，这样就不会被识别成代码块了。下面是我的一个处理函数：

```python
def preprocess_mermaid_blocks(md_content):
    """
    处理 Markdown 内容，将 mermaid 代码块转换为 HTML div，并判断是否包含 mermaid 代码块。

    :param md_content: str，原始 Markdown 文本
    :return: (str, bool) -> 处理后的 Markdown 内容 & 是否包含 mermaid 代码块
    """
    # 允许 mermaid 代码块前有 0 个或多个空格 + 可选的换行
    mermaid_pattern = re.compile(r'^\s*```mermaid\s*\n(.*?)\n```', re.DOTALL | re.MULTILINE)

    has_mermaid = False  # 是否包含 mermaid 代码块

    def replace_mermaid_block(match):
        nonlocal has_mermaid
        content = match.group(1).strip()
        if content:  # 仅转换非空 Mermaid 代码块
            has_mermaid = True
            return f"<pre class='mermaid'>\n{content}\n</pre>"
        return match.group(0)  # 保留原始 Markdown

    processed_content = mermaid_pattern.sub(replace_mermaid_block, md_content)

    return processed_content, has_mermaid
```

这个函数会正则匹配内容中的流程块，然后如果有就转换成 html 内容，并返回一个布尔值（这个布尔值后面有用处）。

然后在文章渲染的逻辑中修改了一下代码大概是这样的：

```python
if cache_md and settings.DEBUG is False:
    if len(cache_md) ==  3:
        obj.body, obj.toc, obj.has_mermaid = cache_md
    else:
        obj.body, obj.toc = cache_md
        obj.has_mermaid = False
else:
    md = make_markdown()
    processed_content, has_mermaid = preprocess_mermaid_blocks(obj.body)
    obj.body = md.convert(processed_content)
    obj.has_mermaid = has_mermaid
    obj.toc = md.toc
    cache.set(md_key, (obj.body, obj.toc, obj.has_mermaid), 3600 * 24 * 7)
```

这里的关键在于我给文章传入了一个字段 `has_mermaid`，用来判断文章是否涉及流程图。

### 模板中引入 mermaid.js

模板的改造很简单，目的就是引入 mermaid.js，代码如下：

```html
    {% if article.has_mermaid %}
        <script src="{% static 'blog/js/mermaid/11.4.1/mermaid.min.js' %}"></script>
        <script>mermaid.initialize({ startOnLoad: true });</script>
    {% endif %}
```

看到我设置 has_mermaid 的意图了吧，我是会判断当前文章是否涉及流程图，只有涉及流程图才会去加载 `mermaid.min.js` 并渲染页面，这样可以减少文件的加载和没必要的加载。