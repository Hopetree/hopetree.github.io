# Python 有道翻译爬虫，破解 sign 参数加密反爬机制，解决{"errorCode":50}错误

很多人学习 Python 爬虫的第一个爬虫就是爬的有道翻译，但是现在由于有道翻译进行了参数加密，增加了反爬机制，所以很多新手在使用以前的代码的时候经常会遇到 {"errorCode":50} 错误。这篇文章就来分析一下有道翻译的反爬机制，依然通过 Python 爬虫来爬有道翻译。

## 有道翻译的请求分析
首先，我们根据使用浏览器的 F12 开发者工具来查看一下有道翻译网页在我们进行翻译的时候都进行了什么请求操作。

### 请求链接
首先让我们来看一下在有道翻译输入要翻译的内容然后提交进行翻译之后发生了什么。

首先通过一张截图来看翻译加载的请求链接：

![有道翻译请求链接](https://cdn.jsdelivr.net/gh/Hopetree/blog-img@main/article/180415/youdao01.png)

通过多次输入新的翻译内容，通过 F12 查看 XHR 中的异步加载的内容，可以看到每次都有一个新的请求产生，所以可以初步预测这个链接就是请求的链接。

继续查看请求的结果信息：

![有道翻译请求结果](https://cdn.jsdelivr.net/gh/Hopetree/blog-img@main/article/180415/youdao02.png)

查看每个请求的结果内容，果然能看到翻译的结果，所以现在可以肯定这个链接就是有道翻译的请求地址了。

### 请求参数
已经确定了请求的链接，现在可以继续查看这个页面的请求参数，其中一般包括以下内容：

- 请求地址
- 请求方式（GET 或者 POST）
- 请求头 headers 参数
- 传递的参数 data（如果是 POST 请求的话）

可以根据截图来看一下这个链接的这些参数，首先是请求参数：

![有道翻译参数1](https://cdn.jsdelivr.net/gh/Hopetree/blog-img@main/article/180415/youdao011.png)

然后是传递的参数 data:

![有道翻译参数2](https://cdn.jsdelivr.net/gh/Hopetree/blog-img@main/article/180415/youdao03.png)

### 对比参数
可以通过多次重复提交要翻译的信息来查看每次参数的变化情况，最后能得到一个大概的结论，就是传递的 data 参数中除了需要的翻译的信息外，还有2个参数是会每次都变动的，它们就是 salt 和 sign。

如果直接复制一次网页中的 salt 和 sign，去使用 Python 请求链接，则会发现根本请求不到要翻译的结果，而是会得到如下的结果：

```
{"errorCode":50}
```
所以，我们大概能判断，这两个参数应该是有加密的，当然，salt 其实一眼就能看出来跟时间戳有关，所以现在的重点是需要找到 sign 参数的获取方式。

### 分析 sign 参数获取方式
查看 sign 参数首先可以去网页的源代码中查看，然后会发现找不到这个参数，于是可以考虑它的生成方式应该在 js 中，所以可以去网页加载时候的 js 文件中查看这个参数，最后可以在 `fanyi.min.js` 这个文件中找到3个结果。

找到了参数生成的位置，现在就要分析 js 了，因为这个文件是处理过的 js,直接看是难以看出逻辑的，所以可以把 js 代码放到一些可以重新排版的工具中再查看，最后可以看到 sign 的生成方式如下片段：
```js
var n = b.val(),
			r = "" + ((new Date).getTime() + parseInt(10 * Math.random(), 10)),
			o = u.md5(S + n + r + D),
			a = n.length;
		if (L(), w.text(a), a > 5e3) {
			var l = n;
			n = l.substr(0, 5e3), o = u.md5(S + n + r + D);
			var c = l.substr(5e3);
			c = (c = c.trim()).substr(0, 3), u("#inputTargetError").text("有道翻译字数限制为5000字，“" + c + "”及其后面没有被翻译!").show(), w.addClass("fonts__overed")
		} else w.removeClass("fonts__overed"), u("#inputTargetError").hide();
		f.isWeb(n) ? i() : s({
			i: n,
			from: _,
			to: C,
			smartresult: "dict",
			client: S,
			salt: r,
			sign: o,
			doctype: "json",
			version: "2.1",
			keyfrom: "fanyi.web",
			action: e || "FY_BY_DEFAULT",
			typoResult: !1
```

从上面的 js 代码中可以看到`salt`果然是时间戳，获取的方式是：

```
r = "" + ((new Date).getTime() + parseInt(10 * Math.random()
```

然后 sign 的获取方式是：

```
o = u.md5(S + n + r + D)
```
这个里面其实是有4个参数的，通过下面的 data 参数可以发现，S 就是`client`参数，通过之前网页请求的时候发现这个是一个字符串`fanyideskweb`，n 就是需要翻译的内容了，r 是时间戳，D 参数需要到 js 代码中继续找，最后会找到这样的一段：

```
D = "ebSeFb%=XZ%T[KZ)c(sy!"
```
也就是说，这个 D 也是一个固定的字符串。

现在上面4个参数都找到了，sign 是这个4个参数的字符串拼接之后进行 MD5 加密的结果。到这里，有道翻译的爬虫需要的两个重要的参数的获取方式就分析结束了，现在可以着手将逻辑写成代码了。

## Python 爬虫代码
### 源码展示

```
# -*- coding: utf-8 -*-
import requests
import hashlib
import time
import json
import random


class Youdao(object):
    def __init__(self, msg):
        self.msg = msg
        self.url = 'http://fanyi.youdao.com/translate_o?smartresult=dict&smartresult=rule'
        self.D = "ebSeFb%=XZ%T[KZ)c(sy!"
        self.salt = self.get_salt()
        self.sign = self.get_sign()

    def get_md(self, value):
        '''md5加密'''
        m = hashlib.md5()
        # m.update(value)
        m.update(value.encode('utf-8'))
        return m.hexdigest()

    def get_salt(self):
        '''根据当前时间戳获取salt参数'''
        s = int(time.time() * 1000) + random.randint(0, 10)
        return str(s)

    def get_sign(self):
        '''使用md5函数和其他参数，得到sign参数'''
        s = "fanyideskweb" + self.msg + self.salt + self.D
        return self.get_md(s)

    def get_result(self):
        '''headers里面有一些参数是必须的，注释掉的可以不用带上'''
        headers = {
            # 'Accept': 'application/json, text/javascript, */*; q=0.01',
            # 'Accept-Encoding': 'gzip, deflate',
            # 'Accept-Language': 'zh-CN,zh;q=0.9,mt;q=0.8',
            # 'Connection': 'keep-alive',
            # 'Content-Length': '240',
            # 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
            'Cookie': 'OUTFOX_SEARCH_USER_ID=-2022895048@10.168.8.76;',
            # 'Host': 'fanyi.youdao.com',
            # 'Origin': 'http://fanyi.youdao.com',
            'Referer': 'http://fanyi.youdao.com/',
            'User-Agent': 'Mozilla/5.0 (Windows NT 6.2; rv:51.0) Gecko/20100101 Firefox/51.0',
            # 'X-Requested-With': 'XMLHttpRequest'
        }
        data = {
            'i': self.msg,
            'from': 'AUTO',
            'to': 'AUTO',
            'smartresult': 'dict',
            'client': 'fanyideskweb',
            'salt': self.salt,
            'sign': self.sign,
            'doctype': 'json',
            'version': '2.1',
            'keyfrom': 'fanyi.web',
            'action': 'FY_BY_CL1CKBUTTON',
            'typoResult': 'true'
        }
        html = requests.post(self.url, data=data, headers=headers).text
        print(html)
        infos = json.loads(html)
        if 'translateResult' in infos:
            try:
                result = infos['translateResult'][0][0]['tgt']
                print(result)
            except:
                pass


if __name__ == '__main__':
    y = Youdao('你是我的小苹果，我是你的优乐美')
    y.get_result()

```

### 源码解读

1. 首先构造一个爬虫类 `Youdao`，这个类只有一个需要传递的参数，就是需要翻译的内容 `msg`。

2. `self.url` 是翻译的请求地址，`self.D` 就是之前提到的用来生成`sign`的固定字符串D，`self.salt`会调用爬虫类的一个函数然后生成`salt`参数，`self.sign` 也会调用爬虫了的函数，生成最关键的参数`sign`。

3. 爬虫类总共有4个函数，第一个函数`get_md`是 Python 进行 MD5 加密的实现方式。
4. 第2个函数`get_salt`是用来生成`salt`的函数，这个函数就是调用了 Python 内置的 time 模块，生成时间戳。
5. 第3个函数`get_sign`是用来生成`sign`参数的，这个参数的生成方式之前分析JS代码的时候也分析过，就是根据4个其他的参数去进行MD5加密即可。
6. 第4个函数就是 Python 的爬虫请求函数了，这个函数有2个关键的参数，第一个 data，也就是需要发送的信息，第二个是 headers，也即是请求头，这个如果不添加的话，统一会请求失败的。

### headers 参数解读
通过一个参数一个参数的注释掉然后再去请求，可以发现我这个源代码里面注释掉的部分都是可以不用带上的，并且，在`Cookie`这个参数中，也只有`OUTFOX_SEARCH_USER_ID`这个参数是必要的，只要格式满足就可以使用随机的方式去生成这个参数，而其他的参数就可以不用了。

总结：有道翻译的这个 Python 其实算是一个非常常规的应对有反爬虫机制的网站的分析方法了，这个分析的关键地方其实在于对 JS 代码的理解，所以，要想爬虫技术提高，JS 代码必须要看的懂才行，这个其实也是我正在学习的地方，共勉吧！

### 爬虫运行结果
运行上面的源码，可以看到类似如下的结果，可以使用 json 来提取翻译结果：

```
{"translateResult":[[{"tgt":"You are my little apple, and I am your beauty.","src":"你是我的小苹果，我是你的优乐美"}]],"errorCode":0,"type":"zh-CHS2en"}
You are my little apple, and I am your beauty.

```
爬虫运行的截图效果：
![youdao-spider](https://cdn.jsdelivr.net/gh/Hopetree/blog-img@main/article/180512/youdaospider.png)