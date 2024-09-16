# Flask、Tornado、FastAPI、Sanic 以及 Gin 框架性能对比

最近准备学习 Go 的 Web 框架 Gin，然后之前在学习 Python 的框架 FastAPI 的时候经常会听说 FastAPI 的性能可以跟 Go 的框架比一比，因此，为了验证一下这个说法，我把这些框架都拿出来进行了一个简单的压力测试，看看各自性能怎么样。

## 压测条件

**服务器配置**

|环境| CPU 核数  | 内存  | 系统  |
| ------------| ------------ | ------------ | ------------ |
|服务器|  2 | 2G  |  CentOS 7.8 |
|本地|  8 | 16G  |  macOS 14.1.2 |

## 启动服务的方式

所有的服务都需要提供相同的接口，实现一个简单的 GET 请求，并且请求可以读取请求参数中的值并返回。

### Flask 服务

Flask 的代码 flask-server.py：

```python
from flask import Flask, request, jsonify

app = Flask(__name__)


@app.route('/items/<int:item_id>')
def get_item(item_id):
    q = request.args.get('q', '')
    return jsonify({
        "item_id": item_id,
        "q": q
    })


if __name__ == '__main__':
    app.run(debug=False)

```

启动方式（需要启动2个进程，充分利用 CPU）：

```bash
gunicorn flask-server:app -b 0.0.0.0:8012 -w 2
```

### FastAPI 服务

FastAPI 服务代码 fastapi-server.py:

```python
from typing import Union
from fastapi import FastAPI

app = FastAPI()


@app.get("/items/{item_id}")
def read_item(item_id: int, q: Union[str, None] = None):
    return {"item_id": item_id, "q": q}

```

启动方式（需要启动2个进程，充分利用 CPU）：

```bash
gunicorn fastapi-server:app -b 0.0.0.0:8011 -k uvicorn.workers.UvicornWorker -w 2
```

### Tornado 服务

Tornado 服务 tornado-server.py:

```python
import sys
import tornado.ioloop
import tornado.web


class MainHandler(tornado.web.RequestHandler):
    def get(self, item_id):
        q = self.get_argument('q', '')
        self.write({
            "item_id": item_id,
            "q": q
        })


def make_app():
    return tornado.web.Application([
        (r"/items/(\d+)", MainHandler),
    ])


if __name__ == "__main__":
    # python tornado-server.py 8013 2
    port, process_num = sys.argv[1:3]
    app = make_app()
    # 启动多个进程
    server = tornado.httpserver.HTTPServer(app)
    server.bind(int(port))
    server.start(num_processes=int(process_num))
    tornado.ioloop.IOLoop.current().start()

```

启动方式（需要启动2个进程，充分利用 CPU）：

```bash
python tornado-server.py 8013 2
```

### Sanic 服务

Sanic 服务 sanic-server.py:

```python
import sys

from sanic import Sanic
from sanic.response import json

app = Sanic("server")


@app.route('/items/<item_id:int>')
async def get_item(request, item_id):
    q = request.args.get('q', '')
    return json({
        "item_id": item_id,
        "q": q
    })


if __name__ == "__main__":
    # python sanic-server.py 8014 2
    port, process_num = sys.argv[1:3]
    app.run(host="0.0.0.0", port=int(port), workers=int(process_num))

```

启动方式（需要启动2个进程，充分利用 CPU）：

```bash
python sanic-server.py 8014 2
```

### Gin 服务

Gin 服务代码:

```go
package main

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

func main() {
	// 创建一个默认的 Gin 引擎
	router := gin.Default()

	// 定义路由处理程序
	router.GET("/items/:id", func(c *gin.Context) {
		// 从路由参数中获取item_id
		itemID := c.Param("id")

		// 从查询参数中获取q
		q := c.Query("q")

		// 返回JSON响应
		c.JSON(http.StatusOK, gin.H{
			"item_id": itemID,
			"q":       q,
		})
	})

	router.Run(":8022")
}

```

Gin 服务启动方式：编译成二进制文件直接运行即可。

## 测试方案

压测工具为 jmeter，压测设置500线程，Ramp-Up设置为0，循环次数设置为永久，每个接口持续压测两分钟，并且记录每个服务的服务器性能状态。

### jmeter 聚合报告

![jmeter-500](https://cdn.jsdelivr.net/gh/Hopetree/blog-img@main/2024/02/jmeter-500.png "jmeter-500")


### Flask 服务器压力

![flask-500](https://cdn.jsdelivr.net/gh/Hopetree/blog-img@main/2024/02/500-flask.png "flask-500")

### FastAPI 服务器压力

![fastapi-500](https://cdn.jsdelivr.net/gh/Hopetree/blog-img@main/2024/02/fastapi-500.png "fastapi-500")

### Tornado 服务器压力

![tornado-500](https://cdn.jsdelivr.net/gh/Hopetree/blog-img@main/2024/02/tornado-500.png "tornado-500")

### Sanic 服务器压力

![sanic-500](https://cdn.jsdelivr.net/gh/Hopetree/blog-img@main/2024/02/sanic-500.png "sanic-500")

### Gin 服务器压力

![gin-500](https://cdn.jsdelivr.net/gh/Hopetree/blog-img@main/2024/02/gin-500.png "gin-500")

这里可以看到，Gin 对于服务器的压力很低，CPU 都还没有利用完，还有很大的利用空间。

## 结论

1. 从这个聚合报告可以看出，flask 的性能是最差的，吞吐量低就算了，异常率也高，而且响应时间也是最大，跟其他几个框架没法比。
2. 号称可以跟 go 的框架刚一下的 fastapi 也没有达到预期效果，性能还不如 tornado，而 sanic 倒是真的可以跟 gin 媲美。
3. 除了gin 以外，其他框架已经把 CPU 消耗完了，所以数据已经到了瓶颈，而 gin 还有很大的资源空间空闲，这份数据并不是 gin 的真实数据。
4. 从报告数据可以看到 sanic 和 gin 的各项数据非常接近，所以在 Python 里面如果真的要追求性能的话，应该选择 sanic 框架。