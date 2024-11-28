# Python2.7 环境中 Tornado 实现异步接口请求的两种方式

## 背景

我们公司的产品有一些微应用依然使用的 Python 开发，由于历史原因，公司产品提供的 Python 环境是 2.7.18，所以当时选择的框架是支持 Python2 的异步框架 Tornado。

最近我有个需求是需要启动一个微服务提供几个接口，于是我本着不引入新依赖的原则打算基于平台提供的 Tornado 封装的模块去开发一个微服务。于是借此机会研究了一下这个古老的框架，这篇文章主要是记录一下在 Python2 环境下使用 Tornado 进行异步接口开发的方案。

注：本文的代码只是调试 Demo，并非实际开发代码，不要太纠结于代码质量。

## Tornado 中进行异步请求

首先说一下本文探讨的话题的两个关键点：

- 第一点：Python 环境是基于 Python2.7 下面，这个很重要，因为 Python2 实际上是没有异步函数的，所以在框架中实现异步并不是一件简单的事情。
- 第二点：我主要探讨的是在 Tornado 的接口的逻辑处理过程中去调用其他接口的异步行为。

### 使用线程池 ThreadPoolExecutor

这个方案是我咨询 ChatGPT 获得的方案，我的需求是希望能通过 `requests` 库来进行接口调用，然后需要实现异步，得到的方案是将请求放到 `ThreadPoolExecutor` 中，以下是实现的封装：

```python
# -*- coding: utf-8 -*-
import logging
import tornado.web
import tornado.gen
import concurrent.futures
import requests


class BaseSDK(object):
    def __init__(self, host, org, user='defaultUser', max_workers=8):
        self.executor = concurrent.futures.ThreadPoolExecutor(max_workers)
        self.api_host = "http://{host}".format(host=host)
        self.headers = {
            'org': str(org),
            'user': user,
            'Content-Type': 'application/json'
        }
        self.logger = logging.getLogger(__name__)

    @tornado.gen.coroutine
    def fetch_async(self, method, api, **kwargs):
        # 合并默认和自定义头部
        headers = self.headers.copy()
        headers.update(kwargs.get('headers', {}))
        kwargs['headers'] = headers
        kwargs['timeout'] = kwargs.get('timeout', 10)

        # 拼接完整 URL
        url = self.api_host + api

        try:
            # 执行请求
            response = yield self.executor.submit(requests.request, method=method, url=url, **kwargs)
            response.raise_for_status()  # 检查 HTTP 状态码
            data = response.json()
        except requests.exceptions.RequestException as e:
            # 请求错误
            self.logger.error("Request failed: {url}, error: {error}".format(url=url, error=str(e)))
            data = {}
        except ValueError as e:
            # JSON 解析错误
            self.logger.error(
                "Invalid JSON response: {url}, error: {error}".format(url=url, error=str(e)))
            data = {}
        else:
            self.logger.info("Request succeeded: {url}".format(url=url))

        raise tornado.gen.Return(data)

    def close(self):
        """
        关闭线程池，释放资源
        """
        self.executor.shutdown(wait=True)

```

这个方案在我看来是比较灵活的，毕竟从代码使用上看直接对 `requests` 的使用进行了一下处理而已，就是创建一个线程池将请求放进去。

### 使用内置的 AsyncHTTPClient

另一个方案是我查看 `tornado` 的文档看到的方案，也是我们公司的框架中使用的方案，就是直接使用 `tornado` 内置的异步请求类 `AsyncHTTPClient` 实现异步，下面这个是实现的一个封装类，这个类跟上面那种方案实现的功能是一模一样的，可以直接替换：

```python
# -*- coding: utf-8 -*-
import json
import logging
import tornado.gen
from tornado.httpclient import AsyncHTTPClient, HTTPRequest, HTTPError

# 配置日志
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


class BaseSDK(object):
    def __init__(self, host, org, user='defaultUser'):
        self.api_host = "http://{}".format(host)
        self.headers = {
            'org': str(org),
            'user': user,
            'Content-Type': 'application/json'
        }

    @tornado.gen.coroutine
    def fetch_async(self, method, uri, **kwargs):
        """
        兼容 requests 参数风格的异步请求方法
        :param method: 请求方法 ('GET', 'POST', 等)
        :param uri: 接口地址
        :param kwargs: 请求参数，兼容 requests 参数格式
            - params: 查询参数 (dict)，会自动附加到 URL 上
            - data: 表单数据 (dict 或字符串)，用于 POST/PUT 等方法
            - json: JSON 数据 (dict)，自动序列化为字符串
            - headers: 请求头 (dict)
            - timeout: 超时时间 (秒)
        :return: 请求结果（解析后的 JSON 格式字典）；如果状态码不是 200，返回空字典 {}
        """
        # 处理参数
        params = kwargs.get('params', None)  # 查询参数
        data = kwargs.get('data', None)  # 表单数据
        json_payload = kwargs.get('json', None)  # JSON 数据
        headers = kwargs.get('headers', self.headers)  # 请求头
        timeout = kwargs.get('timeout', 10)  # 超时时间

        # 构建完整的 URL
        url = self.api_host + uri
        if params:
            query_string = "&".join(["{}={}".format(k, v) for k, v in params.items()])
            url = "{}?{}".format(url, query_string)

        # 构建请求体
        body = None
        if json_payload is not None:
            body = json.dumps(json_payload)  # JSON 请求体
            headers['Content-Type'] = 'application/json'
        elif data is not None:
            if isinstance(data, dict):
                body = "&".join(["{}={}".format(k, v) for k, v in data.items()])
                headers['Content-Type'] = 'application/x-www-form-urlencoded'
            else:
                body = data  # 如果 data 是字符串，直接使用

        # 构建 HTTPRequest 对象
        request = HTTPRequest(
            url=url,
            method=method.upper(),
            headers=headers,
            body=body,
            request_timeout=timeout
        )

        # 使用 AsyncHTTPClient 发起异步请求
        http_client = AsyncHTTPClient()
        try:
            # 发送请求
            response = yield http_client.fetch(request)
            # 响应成功（状态码为 200）
            try:
                result = json.loads(response.body)
            except ValueError:
                result = response.body
        except HTTPError as http_error:
            # 区分非 200 响应和网络异常
            if http_error.response:
                logger.error(
                    "HTTPError: Non-200 status code: %s, url: %s",
                    http_error.response.code, url
                )
                result = {}
            else:
                logger.error("HTTPError: Network error: %s, url: %s", http_error, url)
                result = {}
        except Exception as e:
            logger.error("Request failed: %s, url: %s", e, url)
            result = {}
        raise tornado.gen.Return(result)

    def close(self):
        pass

```

这个方案其实很简单，直接使用 `AsyncHTTPClient` 和 `HTTPRequest` 就可以进行异步请求，上面很多代码是在对请求参数进行处理，目的是为了兼容 `requests` 的请求参数。

### 开发异步接口

上面的两个类实现了同样的封装，可以作为基类，下面是一个实现具体请求的子类：

```python
# -*- coding: utf-8 -*-
import tornado.gen
from base_sdk import BaseSDK


class CMDBSDK(BaseSDK):
    def __init__(self, host, org, user='defaultUser'):
        super(CMDBSDK, self).__init__(host, org, user)


    @tornado.gen.coroutine
    def instance_api_import_instance(self, object_id, payload):
        api = '/object/{object_id}/instance/_import'.format(object_id=object_id)
        data = yield self.fetch_async('POST', api, json=payload)
        raise tornado.gen.Return(data)
```

这个类里面可以封装具体的请求，用来异步请求其他平台的接口。

然后下面是一个开发的接口类：

```python
# -*- coding: utf-8 -*-
import json

import tornado.web
import tornado.gen
from sdk.cmdb import CMDBSDK


class CMDBImportHandler(tornado.web.RequestHandler):
    @tornado.gen.coroutine
    def post(self, pk):
        cmdb_sdk = CMDBSDK('100.88.88.201:8079', '777777')

        try:
            object_id = pk
            payload = json.loads(self.request.body)

            # 确保请求数据有效
            if not object_id or not payload:
                self.set_status(400)  # 错误请求
                self.write({"message": "Invalid input data"})
                return

            # 调用 CMDB SDK 的导入接口
            data = yield cmdb_sdk.instance_api_import_instance(object_id, payload)

            # 返回成功响应
            self.set_status(200)
            self.write({
                "message": "POST request successful",
                "data": data
            })
        except Exception as e:
            # 错误处理，返回错误响应
            self.set_status(500)  # 错误请求
            self.write({
                "message": "POST request failed",
                "error": str(e)
            })
        finally:
            cmdb_sdk.close()

```

### 启动服务

下面是一个启动服务的文件，简单启动微服务：

```python
# -*- coding: utf-8 -*-
import tornado.ioloop
import tornado.web
import tornado.httpserver
from handlers.handlers import CMDBSearchHandler,CMDBImportHandler


def make_app():
    """
    创建 Tornado 应用程序实例并注册路由
    """
    return tornado.web.Application([
        (r"/cmdb/search/(?P<pk>\w+)", CMDBSearchHandler),
        (r"/cmdb/import/(?P<pk>\w+)", CMDBImportHandler),
    ])


def start_server(port, num_processes):
    """
    启动 Tornado 服务并分配多线程
    :param port: 监听的端口
    :param num_processes: 启动的线程数（一般设置为 CPU 核心数）
    """
    app = make_app()
    server = tornado.httpserver.HTTPServer(app)

    # 设置监听端口
    server.bind(port)

    # 启动多线程服务
    server.start(num_processes)  # num_processes 为线程数，0 表示使用 CPU 核心数
    print("Server started on port {} with {} processes.".format(port, num_processes))

    # 启动 Tornado I/O 循环
    tornado.ioloop.IOLoop.current().start()


if __name__ == "__main__":
    try:
        # 启动服务，指定线程数
        start_server(8888, 4)
    except KeyboardInterrupt:
        print("\nServer stopped by user.")
    except Exception as e:
        print("Error starting server: {}".format(e))

```

## 总结

Tornado 在 Python2 中实现异步操作，需要将异步的操作放到一个函数中，并且使用装饰器 `@tornado.gen.coroutine` 进行封装，然后在使用的时候使用 `yield` 获取调用结果。而在接口返回中，不能使用 `return` 返回结果，应该使用 `raise tornado.gen.Return(data)` 这种方式。

参考文档：

- [Tornado 协程模式-调用阻塞函数](https://tornado-zh.readthedocs.io/zh/latest/guide/coroutines.html#id6 "Tornado 协程模式-调用阻塞函数")