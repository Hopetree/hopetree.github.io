# 博客添加暗色主题切换功能，从主题切换聊聊前后端cookies的使用

经常上 V2EX 的人应该知道，前一段时间该论坛上线了暗色主题切换功能，当天就获得一致好评。也就是在当天，我给自己的博客 github 上面提交了一个 issue，也就是需要给博客添加一套暗色主题并支持主题切换。但是人都是有拖延症的，这一拖，两个月就过去了，我的主题切换功能才终于上线了。

你看，云顶之奕都元素崛起了，各个英雄都穿上了元素皮肤，我还有什么理由不给自己博客来一套暗色主题呢，其实这才是我更新暗色主题的真正动力，哈哈哈哈……

## 主题切换思路

既然要上线主题切换功能，那必然先要搞清楚怎么可以切换主题，归纳以下其实就是下面两个问题：

- Q：**主题切换的本质是什么？**
<br>A：主题其实就是一套静态资源（css、js、img），大部分的主题切换就是换了一套 css 样式而已，所以，想要做到主题切换，需要提供一套有别于现有的主题 css 样式。

- Q: **通过什么方式实现主题切换？**
<br>A：有了新的主题样式，想要做到切换的功能，可以通过 js 实现，具体就是 js 定义方法，界面搞个主题切换的按钮，点击按钮触发切换方法，把新的主题 css 文件加载到当前页面即可。

上面两个问题我虽然给出了自己的想法，但是其实也并不是绝对的答案，因为在具体的实施上面还是可以做到不同。

比如提供 css 样式，你可以在现有的 css 文件的基础上面单独添加一份 css 文件加载到当前页面，也可以直接在原有的 css 文件中写一套样式，然后切换主题的时候可能只需要在页面中给整个个 body 添加一个样式值就够了，这样也是可以实现主题切换的。

而切换的方式，我上面说到的是通过 js 定义，这个是前端实现的，当然，也可以后端实现，我发现 V2EX 好像就是调用了一个接口实现的，这个应该属于后端实现了。

## 提供一份css文件

我的暗色主题色调完全是根据 V2EX 的色调来的，然后在一些地方做了自己的修改而已。具体的 css 样式这里就不一一描述了，想要看具体样式的可以直接看我源码，这里我只说在添加样式的时候需要注意的几个非常关键的地方。

### css文件的加载位置

写过前端的人都应该知道，css 文件一般会放在 head 标签里面，而且文件是之上往下读取的，也就是说后面的文件中的样式可以覆盖上面的文件样式，这也就是主题切换的原因，其实就是样式覆盖。基于这个因素，新添加的样式文件必须保证在最后加载，可以看一下我是在哪里加载的样式文件：

```html
<link href="{% static 'blog/css/base.css' %}?v=20191123.0568" rel="stylesheet">
{% block top-file %}{% endblock %}
<!--根据cookies判断是否启用暗色主题-->
{% if request.COOKIES.toggleTheme == "dark" %}
<link id="theme-css-dark" href="/static/blog/css/night.css?20191123.01" rel="stylesheet">
{% endif %}
```

可以看到，我这里是在 head 的最后添加的新主题文件，添加主题的地方是基础模板里面，由于一些页面也会加载单独的 css 样式，但是都会在 `{% block top-file %}{% endblock %}` 里面添加，所以无论在哪个页面都能保证新的 css 样式文件是最后加载的。

### css样式覆盖

由于我的 css 基础样式是基于 bootstrap4 的，所以很多样式都需要覆盖这里的基础样式。首先自己确定一下新样式的基准色调，这样可以方便色调统一，看我写着样式文件最开始的注释，也是自己确定的色调：

```css
/*
背景色：#22303f
卡片色：#18222d
深色卡片色：#001d25
字体色：#9caec7
字体暗色：#738292
字体亮色：#ccc
*/
```

由于 bootstrap4 中很多样式都有 importand 属性，所以在覆盖样式的时候如果发现自己的样式无法覆盖原有的样式则需要把样式也添加上 importand。例如下面这种颜色覆盖：

```css
.card,
.card-header,
.list-group-item,
.card-footer {
	background-color: #18222d!important;
}
```

其他就没有什么特别要强调的，主题样式都是要看自己的感觉，慢慢调试就行了，我的建议是直接在 F12 模式下面调试好样式，然后再写到 css 文件中，而不是写到 css 文件中然后去调试，这样有助于提高效率和准确性。

## cookies的使用

既然实现了主题切换，那么如何存储用户切换的主题状态，这是最重要的一点，毕竟你总不能让用户每次刷新页面都需要重新切换主题吧。所以这里就需要用到一个可以在用户本地存放主题策略的方式，一般选择cookies记录。

cookies 是存放在客户端本地的，也即是浏览器存储的，也正是基于这个特性，所以在主题状态记录的时候都会选择在cookies中记录用户当前主题状态，这样一来，就可以让当前页的状态传递给所有页面。

### 前端使用cookies

首先来说说前端如何使用 cookies，这里我使用了一个 js-cookies.js 的插件，关于这个插件的使用可以自行查看 [官方文档](https://www.npmjs.com/package/js-cookie)，比较简单，一看就会。

前端使用 cookies 无非也就是读写判断，直接看我 js 代码：

```js
//添加暗色主题css
function addDarkTheme() {
   var link = document.createElement('link');
   link.type = 'text/css';
   link.id = "theme-css-dark";  // 加上id方便后面好查找到进行删除
   link.rel = 'stylesheet';
   link.href = '/static/blog/css/night.css?20191123.01';
   $("head").append(link);
}
// 删除暗色主题
function removeDarkTheme() {
   $('#theme-css-dark').remove();
}

//切换主题按钮，根据cookies切换主题
$("#theme-img").click(function(){
    var theme_key = "toggleTheme";
    var theme_value = Cookies.get(theme_key);
    if (theme_value == "dark"){
        $("#theme-img").attr("src", "/static/blog/img/toggle-light.png");
        Cookies.set(theme_key, "light", { expires: 180, path: '/' });
        removeDarkTheme();
    } else {
        $("#theme-img").attr("src", "/static/blog/img/toggle-dark.png");
        Cookies.set(theme_key, "dark", { expires: 180, path: '/' });
        addDarkTheme();
    }
})
```

上面代码首先实现了两个方法，分别是添加和删除新 css 文件的方法，直接看主题切换的按钮操作里面，这个里面就会进行 cookies 的读取和写入操作，具体的操作就不解释了，比较简单。

上面这段代码里面只是实现了通过按钮切换主题的方法，这个只能实现当前页主题切换，但是如果跳转到其他页面，主题还是不会切换，所以我后来写了一个其他页面主题状态保持的方法，如下：

```js
//判断主题策略
$(function(){
    var theme_key = "toggleTheme";
    var theme_value = Cookies.get(theme_key);
    if (theme_value == "dark"){
        addDarkTheme();
        $("#theme-img").attr("src", "/static/blog/img/toggle-dark.png");
    } else {
        removeDarkTheme();
        $("#theme-img").attr("src", "/static/blog/img/toggle-light.png");
    }
});
```

这个方法就是直接在 js 文件中运行，也就是每个页面打开的时候会直接运行一次，所以可以确保每个页面都能保持当前主题状态。

按理来说，做到这一步，整个主题切换的工作已经完成了，根本不需要涉及后端的操作，那为啥我要提到后端 cookies 呢？继续看……

### 后端cookies操作

如果完成上面的 css 和 js 的添加，其实整个博客的主题切换工作已经可以算完成了，因为博客已经实现了主题切换，但是，但是，但是，你会发现，每当跳转到一个新页面的时候，虽然可以实现主题状态的保持，但是由于主题是从亮色切换到暗色的，虽然切换的速度太快我们看不到主题由亮色转换成暗色的过程，但是可以感觉到页面有一个非常短暂的“闪光”，其实这也就是 css 做替换的过程，虽然短到可以忽略，但是那个“闪光”的体验对于我这种追求完美的人来说是不能忍的，所以，还没完……

上面提到的主题切换时的短时间“闪光”的原因是可知的，就是页面在加载的时候是先加载了亮色主题，然后由 js 文件里面方法加载的暗色主题，由于 js 文件是肯定会在 css 文件之后运行的，所以出现“闪光”情况是必然的。想要解决这个问题，那就只能让 css 文件不要通过 js 方法去加载，这样才能保证主题的覆盖没有过程。

分析完因果关系，就可以着手动起来了，当时我从认识到问题到想到解决办法其实也就花了不到5分钟，当时的脑子转的还挺快的。

我的解决办法的是把 js 中判断主题策略的方法删除掉，然后把判断主题状态的事情交给后端来做。具体怎么做，其实就是 django 在模板中调用 cookies 属性，然后根据当前用户的 cookies 中的值来判断是否加载新的 css 文件。具体看看这几行代码就够了：

```html
<!--根据cookies判断是否启用暗色主题-->
{% if request.COOKIES.toggleTheme == "dark" %}
<link id="theme-css-dark" href="/static/blog/css/night.css?20191123.01" rel="stylesheet">
{% endif %}
```

也就是这么一行代码，就可以解决上述的问题，既实现了根据当前 cookies 状态是否加载新 css 样式，也可以避免 css 样式在生效的时候出现“闪光”效果，可以说是非常完美了。可以看我当时提交的修改 <https://github.com/Hopetree/izone/pull/100/files>

## 总结

1. 主题切换的本质就是样式覆盖
2. 可以通过 cookies 设置值来记录当前用户选择的主题状态，实现所有页面同步主题
3. cookies 的读写前后端都可以实现，所以可以根据需要进行方式的选择