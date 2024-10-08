# 博客添加 markdown 在线编辑器工具

自从博客项目上线以来，经常会有用到我博客项目的人问我后台编辑博文为啥没有编辑器，博主是怎么编辑博文的？我每次的回答基本都是说随便找个本地的 markdown 编辑器把文章写好然后复制到后台即可。而我自己也一直是这样做的，但是今天这篇文章就不同，这篇文章使用的是我刚上线的一个在线 markdown 编辑器写的，同样是写完复制到后台。

## 前言

markdown 格式的博客或者说文档目前已经是主流格式了，这个应该不用做过多的说明，撸它就完事了。而我有时候也会遇到要临时写一个 markdown 格式的文章的时候，但是不是自己的本地环境，所以不一定有 markdown 编辑器，这个时候我一般都会随便找个在线的编辑器使用，说实话，网上这种工具还挺多的，但是我还是更喜欢自己定制自己的在线工具，于是就诞生了这个在线 markdown 编辑器工具。

当然，我从来没有想过自己写一个编辑器工具，毕竟自己能力有限，而且开源的轮子也挺多的，于是在一番斟酌和挑选之后，我选择了一个叫做 editor.md 的开源项目作为编辑器支持，这个项目的 github 地址是 [editor.md](https://github.com/pandao/editor.md "editor.md") 该项目的说明也很明确，这个编辑器就是一个组件，所以非常适合放到线上使用。

## editor.md 使用

使用开源项目当然最好就是看指导文档了，但是我觉得这个项目的使用文档写的一点也不清楚，最主要的就是一些静态文件的调用和存放路径没有说清楚，这就导致使用的人如果不会查看浏览器的调试模式就会出现一系列关于资源文件无法获取到的问题。下面我就来主要分享一下自己在使用这个开源项目时遇到的问题和解决思路。

首先，让我们来看看指导文档说的使用方式，大概只需要下面这种代码就可以：

```html
<link rel="stylesheet" href="editor.md/css/editormd.min.css" />
<div id="editor">
    <!-- Tips: Editor.md can auto append a `<textarea>` tag -->
    <textarea style="display:none;">### Hello Editor.md !</textarea>
</div>
<script src="jquery.min.js"></script>
<script src="editor.md/editormd.min.js"></script>
<script type="text/javascript">
    $(function() {
        var editor = editormd("editor", {
            // width: "100%",
            // height: "100%",
            // markdown: "xxxx",     // dynamic set Markdown text
            path : "editor.md/lib/"  // Autoload modules mode, codemirror, marked... dependents libs path
        });
    });
</script>
```

从代码来看，这个里面主要涉及三个静态文件，分别是 editor.md 的 css 和 js 文件，然后需要一个 jquery 的文件，这个比较好理解，jquery 可以使用 CDN 来引用，而另外两个文件也可以直接从项目代码中找到。

但是在我把上面的三个资源文件都正确调用之后，发现出来的页面是一个空白的，根本没有编辑器出现，于是我打开调试模式查看资源调用，可以看到浏览器报错了，有很多静态资源找不到，于是我详细看了该项目的介绍，里面说依赖了其他的开源项目，然后我继续查看缺少的静态资源以及路径，终于发现了问题：在 `editormd.min.js` 这个文件里面其实会调用其他的静态资源，而上面的代码里面 `path` 路径也就是填写这些静态资源的路径所在。

然而，只是加入了 path 目录下面静态文件依然会缺少文件，后续还需要增加 images 和 plugins 以及 fonts 等目录的文件，这些都是在该项目的说明中没有提到的。

当然，我上面说的比较简单，但是在实际的静态资源放置的时候并非一步到位的，是需要根据调试模式里面查看静态资源缺少的报错来补充完整文件的。由于这个项目的作者并没有说明项目中哪些文件会用到哪些文件不会用到，所以具体需要哪些文件要自己慢慢调，原则当然是宜多不宜少。

注：我目前代码中添加的静态文件有一些其实根本用不到，但是已经属于删减过的了。

如果静态资源都已经完整的添加了，那么上面的代码就可以显示一个 markdown 编辑器了，在线工具妥妥的。

## 后记

自己折腾博客的最初的用意其实也就是为了把自己学到的所有跟编程有关的东西都运用起来，并在博客上面实践。所以这个博客的部署我用了 docker，然后部署在测试环境还用 Jenkins 实现了自动化构建自动化部署一条龙，后来为了学习 vue 所以写了一个纯 vue 的导航页面也添加到了博客中……