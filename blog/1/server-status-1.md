# 服务器监控应用（1）：服务端开发

最近发现家里的 mini 主机上的虚拟机频繁重启，有时候宿主机也会重启，但是由于虚拟机都是设置的开机自动启动，所以重启后自己不去查看 Uptime 的话还不一定知道虚拟机重启过。基于这个事情，我打算开发一套简单的服务器监控应用到自己的网站，目前已经上线一段时间了，现在说一下这个服务的开发过程。

Demo 演示页面：[https://tendcode.com/monitor/demo](https://tendcode.com/monitor/demo)

## 架构介绍

先看一下架构图：

![](https://cdn.jsdelivr.net/gh/Hopetree/blog-img@main/2024/04/202404090945930.png)

- **客户端**：使用 HTTP 请求定期向服务端上报服务器的信息
- **服务端**：提供接口供客户端调用，将客户端上报的信息进行校验和处理，存入数据库；并且提供接口展示服务器信息
- **前端UI**：定期自动请求服务端数据，刷新页面，展示数据

关于这种服务器监听，有的也叫服务器探针，很多探针为了数据的实时性，采用了 WebSocket 的方式，让客户端和服务端进行连接，实时上报数据。但是我感觉这种监控不需要太高频率的上报，3秒左右的频率已经跟实时没差了。

参考项目（主要参考了该项目的 UI 界面和数据更新方式）：[ServerStatus](https://tz.cloudcpp.com/)

## 前端页面开发

### UI 主题设计

说实话，很多时候开发一个新功能，后端的实现其实很快就写完了，大部分的时候都是花在了前端的 UI 设计上面。我又是对 UI 有偏执的人，经常对一些边边角角都要调试的舒服才行，但是奈何自己也不是前端工程师，所以很多时候就要花费大量精力去调整。

但是还好，在我做这个项目的时候，我已经找到了参考的 UI 页面，而且非常好的信息是，这个页面是基于 bootstrap3 的组件设计的，而我的博客是 bootstrap4 所以基本是可以直接拿了稍加修改就可以了。

先看[原版页面](https://tz.cloudcpp.com/ "原版页面")：

![](https://cdn.jsdelivr.net/gh/Hopetree/blog-img@main/2024/04/202404091006145.png)

再来看看我自己改后的页面效果，主打一个简洁扁平：

![](https://cdn.jsdelivr.net/gh/Hopetree/blog-img@main/2024/04/202404091006144.png)

展开显示服务器详情：

![](https://cdn.jsdelivr.net/gh/Hopetree/blog-img@main/2024/04/202404091008716.png)

暗色模式：

![](https://cdn.jsdelivr.net/gh/Hopetree/blog-img@main/2024/04/202404091006143.png)

移动端适配

![](https://cdn.jsdelivr.net/gh/Hopetree/blog-img@main/2024/04/202404091011429.png)

::: tip

🎉 **移动端适配**

我在移动端适配问题上也考虑了很多东西，比如如何平衡显示的数据量和页面展示效果，最后的方案是移动端把非重要的信息隐藏起来，然后放入详情中显示，这样既可以保证数据量跟 PC 端一致，也可以保证页面简洁美观。
:::

### 数据刷新机制

前端的数据刷新机制很简单，就是使用 js 设置了一个定时器，每隔N秒（我设置的3秒）请求一次服务端的数据，然后渲染成 html 内容更新到页面。

具体代码见 html 中：

```html
<script>
	// 页面打开执行一次
	get_servers("{{ csrf_token }}", "{% url 'monitor:get_server_list' %}");
	// 每隔3秒执行一次
	setInterval(() => get_servers("{{ csrf_token }}", "{% url 'monitor:get_server_list' %}"), 3000);
</script>
```

这里有几个小细节需要注意：

**细节1：将服务端状态转换成 css 样式，以便显示不同的状态**

比如服务器传递的状态的字段是 `online` 或者 `offline`，这个时候就可以利用 css 样式，把 `online` 设置成绿色， `offline` 设置成红色。

在 js 代码里面类似这样：

```js
let status_bg = 'bg-success';
// 根据状态使用不同的颜色的点
if (status !== "online") {
	status_bg = 'bg-danger'
}

```

进度条的颜色也是同样的原理，根据服务端返回的不同的数值，给进度条设置不同的颜色即可。

**细节2：保持详情页展开状态**

由于每条数据的详情的展开还是关闭状态是由 html 的属性决定的，所以每次刷新数据的时候，必须保留原本的状态才行，不然会出现用户明明点开了一条数据的详情，结果数据自动刷新给关闭了。

具体实现 js 如下：

```js
let is_show = '';
// 保留原来的展开状态
if ($('#more-info-' + i).hasClass('show')) {
	is_show = 'show'
}
```

先拿到每条数据的展开状态，然后在刷新的时候回写回去，这样就可以保证页面只是数据在变动，状态不变。


## 后端服务开发

后端需要创建一个模型用来管理和存放主机的信息。

### 模型设计

直接看源码：

```python
class MonitorServer(models.Model):
    name = models.CharField('名称', max_length=30, unique=True, help_text='用于看板中显示')
    interval = models.IntegerField('上报间隔', default=5,
                                   help_text='上报间隔时间，超过这个时间的两倍还没有更新数据就标记为离线状态，单位：秒')
    sort_order = models.IntegerField('排序', default=99, help_text='自定义排序依据')
    push_url = models.CharField('推送地址', max_length=60,
                                help_text='客户端推送的地址，为了支持代理推送或者本地推送')
    username = models.CharField('用户名', max_length=10, unique=True,
                                help_text='推送用户名，唯一')
    password = models.CharField('密码', max_length=10, unique=True,
                                help_text='第一次添加后自动生成密钥，更改后会重新生成密钥')
    secret_key = models.CharField("加密Key", max_length=64, blank=True, null=True,
                                  help_text='保存后自动生成')
    secret_value = models.CharField("密钥", max_length=256, blank=True, null=True,
                                    help_text='保存后自动生成')
    data = models.TextField('上报数据', blank=True, null=True, help_text='json格式')
    active = models.BooleanField('是否有效', help_text='用来过滤，无效的不显示', default=True)

    create_date = models.DateTimeField(verbose_name='创建时间', auto_now_add=True)
    update_date = models.DateTimeField(verbose_name='更新时间', auto_now=True)

    class Meta:
        verbose_name = '监控服务'
        verbose_name_plural = verbose_name
        ordering = ['sort_order']

    def __str__(self):
        return self.name

```

一些关键字段的解释：

- name ：用来显示主机的名称，唯一
- interval ：上报频率，这个数据是客户端上报上来的数据，就是让客户端告知服务端上报频率是多久，然后服务端根据这个频率去判断客户端是否掉线，规则就很简单，超过这个时间的两倍还没有更新数据就标记为离线状态
- sort_order ：用来调整显示的顺序
- push_url ：推送地址，给客户端定义固定的推送地址，这个主要是用来生成密钥，让客户端自己解析出地址，可以让其他人看不到推送地址
- username ：用户名，用来生成密钥的
- password ：密码，用来生成密钥的
- secret_key ：密钥Key，保存的时候自动随机生成一个，不需要输入
- secret_value ：保存的时候自动生成的
- data ：上报数据，json格式
- active ：激活状态，用来管理哪些主机需要显示

### 自动生成密钥

虽然上面填写了一堆字段，但是有的字段是可以随意填写的，比如用户名和密码，随便填写不用重复就行。密钥数据是会自动生成的。

密钥的生产逻辑：创建数据保存后，自动随机生成一个 `secret_key`，然后把 `push_url`、 `username`、`password`、`secret_key` 四个信息加密得到 `secret_value`，并且，每次只要前面三个数据变动了，`secret_key` 和 `secret_value` 都会重新生成。

具体看这个自动生成密钥的代码：

```python
def save(self, *args, **kwargs):
    if not self.pk or self._fields_have_changed(['username', 'password', 'push_url']):
        # 如果是首次添加数据或者密码字段发生变化，则生成随机32位密码
        secret_key = str(uuid.uuid4()).replace('-', '')[:32]
        plain_text = f'{self.username}::{self.password}::{self.push_url}'
        cipher = AESCipher(secret_key)
        secret_value = cipher.encrypt(plain_text)
        self.secret_value = secret_value
        self.secret_key = secret_key
    super().save(*args, **kwargs)

def _fields_have_changed(self, fields):
    if self.pk:
        # 如果是更新数据，则检查指定字段是否发生变化
        original_instance = MonitorServer.objects.get(pk=self.pk)
        for field in fields:
            if getattr(self, field) != getattr(original_instance, field):
                return True
        return False
    return True  # 如果是首次添加数据，返回 True，表示字段已更改
```

加解密类的实现：

```python
import base64
from Crypto.Cipher import AES
from Crypto.Util.Padding import pad, unpad

class AESCipher:
    def __init__(self, _key):
        self.key = _key

    def encrypt(self, _plaintext):
        _cipher = AES.new(self.key.encode(), AES.MODE_CBC)
        _plaintext = pad(_plaintext.encode(), AES.block_size)
        _encrypted_text = _cipher.iv + _cipher.encrypt(_plaintext)
        return base64.b64encode(_encrypted_text).decode()[:128]

    def decrypt(self, ciphertext):
        ciphertext = base64.b64decode(ciphertext)
        iv = ciphertext[:AES.block_size]
        _cipher = AES.new(self.key.encode(), AES.MODE_CBC, iv)
        _decrypted_text = unpad(_cipher.decrypt(ciphertext[AES.block_size:]), AES.block_size)
        return _decrypted_text.decode()
```

注意：为了保证密钥的长度不会太长，因此对用户名和密码长度做了严格限制。

只需要给客户端提供 `secret_key` 和 `secret_value` 信息即可，客户端可以实现跟服务端一样的加解密方法，把其他信息解析出来。

![](https://cdn.jsdelivr.net/gh/Hopetree/blog-img@main/2024/04/202404091110417.png)

### 上报数据接口设计

- 请求地址：/monitor/server/push，解析密钥后得到
- 请求方法：POST
- 请求头：
	- Content-Type：application/json
	- Push-Username：用户名，解析密钥后得到
	- Push-Password：密码，解析密钥后得到
	- Push-Key：密钥Key
	- Push-Value：密钥值
- 请求体：JSON格式，需要提供数据采集的所有字段，并且格式满足规范，否则上报失败

请求体参考：

```json
{
    "interval": 6,
    "uptime": 699196,
    "system": "darwin-23.1.0-arm64-darwin-14.1.2",
    "cpu_cores": 8,
    "cpu_model": "",
    "cpu": 25.59598494338249,
    "load_1": "3.52",
    "load_5": "3.78",
    "load_15": "4.04",
    "memory_total": 17179869184,
    "memory_used": 14047379456,
    "swap_total": 11811160064,
    "swap_used": 10225909760,
    "hdd_total": 494384795648,
    "hdd_used": 261241573376,
    "network_in": "7.70K",
    "network_out": "7.90K",
    "process": 557,
    "thread": 4038,
    "tcp": 0,
    "udp": 0,
    "version": "",
    "client_version": "0.1.3"
}
```

::: info 注意

上报数据的接口最重要的一个环节是进行数据校验和数据转换，需要防止客户端上报不合规的数据进而导致数据显示异常。
:::

### 展示数据接口设计

- 请求地址：/monitor/server 需要认证，管理员才能访问
- 请求方法：GET
- 返回体：json

返回格式：

```json
{
    "code": 0,
    "error": "",
    "message": "",
    "data": {
        "list": [
            {
                "interval": 6,
                "uptime": "2 \u5929",
                "system": "darwin-23.1.0-arm64-darwin-14.1.2",
                "cpu_cores": 8,
                "cpu_model": "",
                "cpu": 21.9,
                "load_1": "3.22",
                "load_5": "3.14",
                "load_15": "3.37",
                "memory_total": "16.0G",
                "memory_used": "12.92G",
                "swap_total": "8.0G",
                "swap_used": "6.98G",
                "hdd_total": "460.43G",
                "hdd_used": "198.66G",
                "network_in": "81.20K",
                "network_out": "51.97K",
                "process": 570,
                "thread": 3959,
                "tcp": 0,
                "udp": 0,
                "version": "",
                "client_version": "0.1.1",
                "memory": 80.8,
                "hdd": 43.1,
                "status": "offline",
                "name": "Macbook",
                "date": "2024-04-02T22:33:40.884"
            }
        ]
    }
}
```

通过获取 `code` 是否为0判断接口是否成功。


## 客户端开发

客户端可以使用 Python 开发，也可以使用其他语言，比如 Golang 开发。客户端的本质就是采集主机数据，然后进行上报。只要按照服务端给定的接口上报主机信息就可以。

我自己期初用 Python 开发了一个版本，但是考虑到 Python 的运行需要运行环境，这就给客户端的部署增加了很大的负担。因此最后使用 Golang 开发了客户端，具体开发查看 [服务器监控应用（2）：使用 Golang 开发客户端](https://tendcode.com/subject/article/server-status-2)

## 下一步

后续打算做一下通知服务，就是当服务器掉线后通知给指定的管理员，很多探针都会有这个功能，事件通知对于监控的确是一个必须的功能。

目前想到的几个需求：

1. 可以选择要通知的服务器
2. 使用定时任务定时检查
3. 掉线的机器一天只会通知几次，可以设置一下通知规则，避免无脑发通知
4. 可以记录当天发送过的通知次数，超过次数就停止通知
5. 通知方式可以多样，当然邮件通知是最基本的，直接使用Django配置的邮箱服务器就行，其他通知方式暂时没想好有没有必要，可以先预留一下第三方通知

后记：监控告警通知功能已经实现了，具体查看文章[《服务器监控应用（3）：监控告警通知开发》](https://tendcode.com/subject/article/server-status-3/ "《服务器监控应用（3）：监控告警通知开发》")