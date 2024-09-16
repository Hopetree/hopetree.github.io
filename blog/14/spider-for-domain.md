# .app 域名发布了，我们可以使用 Python 做点什么？

.app 域名是前段时间谷歌花费2500万美元竞拍获得，是全球首个需要 HTTPS 加密的顶级域名。该域名从2018年5月8日开始全面接受注册，由于这个域名对于现今移动 APP 的发展有着非常重要的意义，所以必将带来一波域名疯抢的高潮。那么，在这波域名抢注的机会中，我们可以使用 Python 做点什么呢？

首先，我们知道，域名在注册之前是需要查询一下自己想要的域名有没有被注册的，比如 taobao.app 这种以大公司的公司名称命名的域名，应该还是有一些价值的。但是，大公司那么多，成千上万的域名，我们不可能一个个的去想吧，也不可能一个个的去查，所以 Python 的发挥空间就有了。

我要用 Python 做的事情有2个主要的步骤：

1. 首先，我要知道有哪些大公司的域名是值得去查询的，这里我可以使用站长平台的网站排行榜（中国）里面的网站榜单，大概56700个网站，我可以爬取这些网站的信息，然后提取出域名的前一部分。
2. 当我拿到了大公司的域名之后，我可以把这些大公司的域名的顶级域名部分换成 .app，然后去批量查询这些公司的 .app 域名是否已经注册，并记录下还没有被注册的域名。

上面的思路已经说得很清楚了，就是先拿到在国内还算比较有名的网站的域名，然后替换成 .app 顶级域名去查询，最后把还没有注册的域名标记出来，这样就可以给自己注册域名作一个参考。

本篇文章就来说一下第一个步骤的事情，就是使用 Python 爬虫来爬取国内知名网站的域名信息，需要使用到的主要内容是队列（Queue）、多线程（threading）的使用，以及对生产者/消费者模型的实践。

## 爬虫思路
首先，我们需要爬取的目标网站是站长之家的“网站排行榜”这个地方的总排名（地址是http://top.chinaz.com/all/），信息就是网站上面能够看到所有有用信息。
### 网站分析
首先，我们可以查看一下这个网站的内容页的构成，可以发现网站目前有1891页，而 URL 的构成也很简单，除了首页是 index.html 结尾以外，其他的所有页面都是 index_n.html 结尾的，这个n就是当前的页码数，所以爬取网页的思路已经很明朗了，可以直接使用循环爬取。

再来分析一下网站的信息的构成，使用浏览器的 F12 功能查看网页，可以发现网页的信息就在请求链接的 HTML 中，并没有涉及异步请求，这样的网页解析起来自然就能想到使用 Beautifulsoup 或者 lxml 解析器了，这里我会使用 lxml，因为它的速度更快，而且我更喜欢 Xpath 选择器。

### 爬虫的效率
前面我已经说了，这个网站需要爬取的页面有1891个，如果使用单线程去请求并解析网站，就按照每个网站的请求和解析平均耗时1秒，那么总共要耗时1891秒，也就是半个多小时，这还不包括每个请求之后的延迟时间设置，可以说是相当的慢。

所以，这里我不打算使用单线程操作，而是使用多线程，并且会使用到 Python 的队列 Queue 模块。

### 结果处理
我的思路是，首先使用多线程去批量请求网页和解析网页，并且把解析到的结果都放入队列中，然后再使用多线程去存储信息，存储的方式选择最简单的 csv 表格就行了，当然也可以使用数据库。

## 生产者/消费者模型
几乎在所有的编程语言中，都会涉及到一个关于并行生产和并行消费的模型，也就是我们通常说到的生产者/消费者模型。
### 模型的思路
这个模型的思路看名称就能知道，首先需要一个生产者，它负责生产，然后供消费者去使用，也就是说，他们之前共享了同一个资源，在我们这次的爬虫中，这个资源就是每个网站的信息，生产者负责输出信息，消费者负责写入信息。

就像我们的市场一样，不可能一个市场只有一个生产者和一个消费者，一般都是多个生产者和多个消费者，并且他们是同时在运行的，生产者生产了资源，消费者就会去消耗它，如果生产者生产的资源用完了，那么消费者应该等待，直到有新的资源可用。

### 模型的注意事项
虽然生产者/消费者模型是一个很经典的模型，但是在使用的过程中依然有一些需要注意的地方，比如下面几点是我在使用过程中总结的：

1. 当生产者已经不再生产产品之后，需要给消费者线程传递信号，让消费者停止，这个过程涉及两个问题，第一个是什么时候传递信号，第二个是怎么传递才能让消费者在不影响产品消耗的同时可以收到这个信息并停止线程？
2. 生产者和消费者线程涉及到共享资源的时候有必要添加线程锁。
3. 生产者和消费者多线程的启动顺序和结束顺序问题，即使 `start()` 和 `join()` 的时机。

## 爬虫源码解读

```python
import requests
from lxml import etree
from threading import Thread, Lock
from queue import Queue
import re
import csv
import time


class Productor(Thread):
    def __init__(self, q, w):
        Thread.__init__(self)
        self.q = q
        self.w = w
        self.s = requests.Session()
        # 这个地方很重要，不设置这个请求状态的话后续请求会报错
        self.s.keep_alive = False
        self.headers = {
            'user-agent': 'Mozilla/5.0 (Windows NT 5.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/49.0.2634.33 Safari/537.36',
        }

    def run(self):
        while not self.q.empty():
            key = self.q.get()
            url = key[0]
            if key[1] < 3:
                try:
                    req = self.s.get(url, headers=self.headers, timeout=2)
                    time.sleep(0.1)
                except Exception as e:
                    self.q.put((url, key[1] + 1))
                    print(url, e)
                else:
                    # 设置网站的编码格式为utf-8
                    req.encoding = 'utf-8'
                    self.get_info(req.text)
            else:
                # 每个链接最多请求3次，如果3次还失败就放弃请求，打印链接
                # 不这样设置的话，如果遇到有的链接请求一直超时就造成了死循环
                print(key)
        print('{} 线程结束'.format(self.getName()))

    def get_info(self, html):
        tree = etree.HTML(html)
        sites = tree.xpath('//ul[@class="listCentent"]/li')
        for site in sites:
            info = dict()
            name = site.xpath('.//h3[@class="rightTxtHead"]/a/text()')
            # 有一个网站没有名字，所以要判断查找是否为空
            name = name[0] if name else ''
            url = site.xpath('.//h3[@class="rightTxtHead"]/span/text()')[0]
            alexa = site.xpath('.//p[@class="RtCData"][1]/a/text()')[0]
            baidu_s = site.xpath('.//p[@class="RtCData"][2]/a/img/@src')[0]
            baidu_pr = site.xpath('.//p[@class="RtCData"][3]/a/img/@src')[0]
            baidu_fl = site.xpath('.//p[@class="RtCData"][4]/a/text()')[0]
            rank = site.xpath('.//div[@class="RtCRateCent"]/strong/text()')[0]
            score = site.xpath('.//div[@class="RtCRateCent"]/span/text()')[0]
            # 名称里面有的有特殊字符，所以可以过滤掉特殊的字符
            info['name'] = name.encode('gbk', 'ignore').decode('gbk')
            info['url'] = url
            info['alexa'] = alexa
            info['baidu_s'] = self.get_s(baidu_s)
            info['baidu_pr'] = self.get_s(baidu_pr)
            info['baidu_fl'] = baidu_fl
            info['rank'] = rank
            info['score'] = score.replace('得分:', '')
            self.w.put(info)

    def get_s(self, url):
        '''从百度权重或PR的图片中提取权重值'''
        s = re.findall(r'(\d+)\.gif', url)[0]
        return s


class Worker(Thread):
    def __init__(self, w, file, l):
        Thread.__init__(self)
        self.w = w
        self.file = file
        self.l = l

    def run(self):
        while True:
            info = self.w.get()
            if info is None:
                break
            try:
                # 因为共享资源，所以要加锁
                self.l.acquire()
                self.writeinfo(info)
                self.l.release()
            except Exception as e:
                print(info, e)
            self.w.task_done()
        print('{} worker is done!'.format(self.getName()))

    def writeinfo(self, data):
        headers = ['name', 'url', 'alexa', 'baidu_s', 'baidu_pr', 'baidu_fl', 'rank', 'score']
        with open(self.file, 'a', newline='', encoding='gbk') as f:
            writer = csv.DictWriter(f, fieldnames=headers)
            writer.writerow(data)


def get_csv(filename):
    '''创建一个新的csv表格，并且设置标题'''
    headers = ['name', 'url', 'alexa', 'baidu_s', 'baidu_pr', 'baidu_fl', 'rank', 'score']
    with open(filename, 'w', newline='', encoding='gbk') as f:
        writer = csv.DictWriter(f, fieldnames=headers)
        writer.writeheader()


def main(file):
    get_csv(file)
    l = Lock()
    q = Queue()
    work = Queue()
    # 插入的信息是链接和一个基础的请求次数0构成的元组，为了后续判断链接请求了几次
    q.put(('http://top.chinaz.com/all/index.html', 0))
    baseurl = 'http://top.chinaz.com/all/index_{}.html'
    for i in range(2, 1892):
        q.put((baseurl.format(i), 0))
    pl = [Productor(q, work) for i in range(10)]
    for each in pl:
        each.start()
    wl = [Worker(work, file, l) for i in range(5)]
    for each in wl:
        each.start()
    for each in pl:
        each.join()
    work.join()
    for each in wl:
        work.put(None)
    for each in wl:
        each.join()
    print('game over!')


if __name__ == '__main__':
    main('info.csv')
```
### 源码结构
这个爬虫有2个主要的类和2个函数，它们的作用如下：

- `Productor` 类是生产者，作用是读取 URL 并请求和解析网页，最后将提取到的信息存放到一个队列里面供消费者使用
- `Worker` 类是消费者，作用是从队列拿信息，然后写入到文件中
- `get_csv` 函数是一个生成表格文件的函数，它可以在爬虫每次运行的时候新生成一个表格，并且给表格添加指定的列标题
- `main` 函数就不用多说了，它就是负责整个爬虫启动的函数，只需要传入一个文件的名称就行了

### 生产者类的解读
`Productor` 是一个继承了线程类的类，它需要传递2个参数，这2个参数都是队列，前一个是 URL 构成的队列，也就是“原材料”，后一个是用来存放网站信息的队列，供消费者使用。

每个生产者线程都有一个请求 `Session()`，而且我有注释给这个请求设置了一个属性，具体代码是：
```
self.s = requests.Session()
# 这个地方很重要，不设置这个请求状态的话后续请求会报错
self.s.keep_alive = False
```
这地方之所有要设置一下是因为我在使用多线程请求的过程中会有用到多次尝试请求，如果不设置这里就会造成大面积的请求失败，大概的报错就是请求达到上限。

线程类只需要重写 `run()` 方法即可，这个的 `run()` 实现的就是使用 `while` 循环从队列中拿链接，直到队列为空就跳出循环。这里因为我存放到队列中的是一个元组，元组有2个参数，第一个是链接，第二个默认是0，也就是表示链接请求的次数，从代码中可以看出，我使用了 `try` 语句来请求网页，每当有连接请求失败就把它重新丢进队列中，并且最多请求三次，三次还失败就会停止请求这个链接并打印到控制台。具体代码实现：
```python
url = key[0]
if key[1] < 3:
    try:
        req = self.s.get(url, headers=self.headers, timeout=2)
        time.sleep(0.1)
    except Exception as e:
        self.q.put((url, key[1] + 1))
        print(url, e)
    else:
        # 设置网站的编码格式为utf-8
        req.encoding = 'utf-8'
        self.get_info(req.text)
else:
    # 每个链接最多请求3次，如果3次还失败就放弃请求，打印链接
    # 不这样设置的话，如果遇到有的链接请求一直超时就造成了死循环
    print(key)
```
这个请求三次的限制也是我在使用过程中想到的，因为我之前没有设置请求限制，然后发现有的链接根本就打不开（服务器的问题），然后就造成了死循环，所以这里必须规定最大的请求次数，防止死循环的出现。

`get_info` 这个函数就不用多说了，这个函数的作用就是解析网页并提取需要的信息，最后将信息存放到队列中。具体解析的方式是使用 `lxml` 这个库，这个解析库是用C语言写的，所有速度很快，而且它可以使用 Xpath 选择器语法来提取信息，我很喜欢这种方式，当然，使用 bs4 也是可以的。

这里有2个地方要注意，第一个是因为有的网站没有名称信息（发现了1个网站没有），所以需要对信息判断处理一下：
```
name = site.xpath('.//h3[@class="rightTxtHead"]/a/text()')
# 有一个网站没有名字，所以要判断查找是否为空
name = name[0] if name else ''
```
然后还有名字里面有的有特殊符号，我这里就不打算保留这种符号，所以对编码格式要处理一下，忽略特殊的编码：
```
# 名称里面有的有特殊字符，所以可以过滤掉特殊的字符
info['name'] = name.encode('gbk', 'ignore').decode('gbk')
```

### 消费者解读
`Worker` 也是一个继承线程类的类，它的作用就是从网站信息中拿信息，然后写入文件中。这个类需要3个参数，第一个是信息存放的队列，第二个是文件的保存的名称，第三个是一个线程锁，因为涉及到多线程文件操作，所有为了避免线程之间写文件出现文件错乱的情况，必须给线程加锁。

消费者线程的 `run()` 方法也是 `while` 循环，但是它跟生产者不同，它没有循环停止的条件，所有要线程跳出循环就必须在函数中设置条件，这个是后话。具体看代码：
```python
while True:
    info = self.w.get()
    if info is None:
        break
    try:
        # 因为共享资源，所以要加锁
        self.l.acquire()
        self.writeinfo(info)
        self.l.release()
    except Exception as e:
        print(info, e)
    self.w.task_done()
```
上面的代码可以看出来，当消费者从线程中读取到的信息是 None 的时候，它就要跳出循环，所以，我们可以在要消费者线程结束的时候向队列中穿入 None。看代码中，当拿到信息准备往文件中写入信息的时候，需要拿一个锁，然后文件写入完毕才释放锁，这是为了保证文件的写入安全。

`writeinfo` 这个函数就不用多说了，它负责向表格中写入网站信息，由于我们在爬虫启动的时候就创建了一个表格并设置了表头，所以这里的表格跟那个表格的格式应该是一样的。

### main 函数解读
`main` 函数是爬虫的启动函数，它做的事情主要分为下面几个步骤：

1. 运行 `get_csv` 函数，产生一个表格
2. 设置一个全局线程锁和2个全局队列
3. 向原材料队列中加入指定的 URL 供生产者使用（其实这里的生产者既是生产者也是消费者）
4. 分别创建和启动多个生产者线程和消费者线程
5. 当生产者线程都结束了，就往队列中添加一个关键信息 None，用来给消费者发送跳出循环的信号（在 Java 里面称之为“毒丸”）
6. 最后结束消费者线程，主线程随后也会结束

## 运行爬虫
### 运行结果展示
这里我使用了10个生产者线程和5个消费者线程，爬虫的速度相比单线程快得多，大概不到一分钟就爬取完毕了。

启动爬虫之后，可以如果中途没有 URL 请求失败（有请求失败的信息也没关系，失败的 URL 会自动重复请求，除非请求3次依然失败），可以看到类似下面的输入：
```
Thread-9 线程结束
Thread-7 线程结束
Thread-1 线程结束
Thread-2 线程结束
Thread-10 线程结束
Thread-6 线程结束
Thread-5 线程结束
Thread-8 线程结束
Thread-3 线程结束
Thread-4 线程结束
Thread-15 worker is done!
Thread-11 worker is done!
Thread-12 worker is done!
Thread-14 worker is done!
Thread-13 worker is done!
game over!
```
表格的信息如图所示：

![sites](https://cdn.jsdelivr.net/gh/Hopetree/blog-img@main/article/180511/sites.png)

### 爬虫结果下载
这个爬虫的目标是1891个页面的信息，总共的网站信息是56707个，现已把所有网站的信息上传到百度云，如果有需要的可以下载：

- 链接：<https://pan.baidu.com/s/1fMwcxXEb7KnC2q-FhwvBXA>
- 密码：1mt6

总结：这篇文章主要的目的是爬取国内知名网站的域名信息，并且提取到足够多的网站的信息，毕竟我们如果真的要去按照这个榜单去注册 .app 域名也用不了这么多域名，所以有其他的信息可以方便我们进行筛选。有了网站的域名，后面需要做的事情可以用正则表达式提取网站的域名前一部分，然后变成 .app 域名，然后再写一个爬虫去批量查询 .app 域名是否已经被注册了，后续的操作有时间再来另外写一个爬虫。