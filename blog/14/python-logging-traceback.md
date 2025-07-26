# Python 日志中 exc_info 和 stacklevel 参数的使用场景

作为一个主开发语言是 Python 的运维程序员，最近才学到了两个关于日志设置的小技巧，解决了我以前经常会遇到但是忽略了的问题：一个是关于错误日志经常没有记录错误的 Traceback 信息导致定位困难，另一个是日志被封装后无法显示真实的调用行号的问题。


## 1. 异常堆栈「失踪」

场景：在 `except` 异常中，经常会记录错误日志，但是默认的日志是只会记录错误信息 `e`，而没有输出代码的具体错误地方，导致定位困难。

### 1.1 问题复现

```python
import logging

logging.basicConfig(
    format='%(asctime)s [%(levelname)s] [%(filename)s:%(lineno)d] - %(message)s',
    level=logging.INFO
)

def divide(a, b):
    try:
        return a / b
    except ZeroDivisionError as e:
        logging.error(f"运行异常：{e}")
```

运行输出：

```text
2025-07-24 14:30:12,345 [ERROR] [demo.py:11] - 运行异常：division by zero
```

- 虽然 `lineno` 指向了 `demo.py:11`，但**没有 Traceback**，很难定位是谁调用了 `divide`。


之前遇到这种情况，我一般都是在调试的时候把 `try` 语句去掉，直接让代码报错，这样我就知道具体的错误是什么，显得好蠢。

### 1.2 一行修复：`exc_info=True`

```python
except ZeroDivisionError as e:
    logging.error("运行异常", exc_info=True)
```

输出：

```text
2025-07-24 14:30:12,345 [ERROR] [demo.py:11] - 运行异常
Traceback (most recent call last):
  File "demo.py", line 9, in divide
    return a / b
ZeroDivisionError: division by zero
```

- 既保留 `%(filename)s:%(lineno)d` 指向 `demo.py:11`（日志语句位置），  
- 又追加完整 Traceback，定位一步到位。

当然，也可以直接使用 `logger.exception()` ，这个方法的定义：

```python
def exception(self, msg, *args, **kwargs):
	"""
	Convenience method for logging an ERROR with exception information.
	"""
	kwargs['exc_info'] = 1
	self.error(msg, *args, **kwargs)
```

## 2. 行号「失真」

场景：当日志被封装后 `%(filename)s:%(lineno)d` 指向封装的地方，而不是真实的日志输出位置，导致这种信息失去意义

### 2.1 问题复现

```python
# utils.py
import logging

logging.basicConfig(
    format='%(asctime)s [%(levelname)s] [%(filename)s:%(lineno)d] - %(message)s',
    level=logging.INFO
)

def log_error(msg: str):
    logging.getLogger("app").error(msg)
```

业务代码：

```python
from utils import log_error

def pay():
    log_error("订单金额非法")
```

输出：

```text
2025-07-24 14:30:12,345 [ERROR] [utils.py:9] - 订单金额非法
```

- `%(filename)s:%(lineno)d` 指向 `utils.py:9`，**业务代码行号丢失**。

### 2.2 一行修复：`stacklevel=2`

```python
# utils.py
def log_error(msg: str):
    logging.getLogger("app").error(msg, stacklevel=2)
```

再次运行：

```text
2025-07-24 14:30:12,345 [ERROR] [main.py:5] - 订单金额非法
```

- 现在 `%(filename)s:%(lineno)d` 指向 `main.py:5`，即 `pay()` 内的真实调用位置。

`stacklevel` 参数可以将日志的追溯层级提高，如果日志封装了一层就设置成2，如果封装了两层就设置成3，大概就是这么个意思。

## 3. 把两者合起来

```python
# utils.py
import logging

logging.basicConfig(
    format='%(asctime)s [%(levelname)s] [%(filename)s:%(lineno)d] - %(message)s',
    level=logging.INFO
)

def log_exception(msg: str, *, exc_info=True, stacklevel=2):
    logging.getLogger("app").error(msg, exc_info=exc_info, stacklevel=stacklevel)
```

使用：

```python
from utils import log_exception

def divide(a, b):
    try:
        return a / b
    except ZeroDivisionError as e:
        log_exception("运行异常")
```

输出：

```text
2025-07-24 14:30:12,345 [ERROR] [main.py:8] - 运行异常
Traceback (most recent call last):
  File "main.py", line 6, in divide
    return a / b
ZeroDivisionError: division by zero
```

- `%(filename)s:%(lineno)d` 指向 `main.py:8`，  
- Traceback 完整保留。

---

## 4. 小结 checklist

| 场景 | 参数 | 作用 |
|---|---|---|
| 异常时想看到完整 Traceback | `exc_info=True` | 自动追加堆栈 |
| 封装日志后想让 `%(filename)s:%(lineno)d` 指向业务代码 | `stacklevel=2`（或更大） | 把栈帧回溯到真正调用者 |

记住：  
- `exc_info=True` 解决 **“为什么挂”**  
- `stacklevel=2` 解决 **“在哪儿挂”**

两句代码，让线上排障不再抓瞎。

真实使用：

```python
import logging
from xx.base import BaseCommand


class BaseCommandWithLog(BaseCommand):
    """
    带统一日志输出的管理命令基类
    """

    def __init__(self):
        super().__init__()
        self.logger = logging.getLogger('command')

    def log(self, msg, level='info'):
        """
        统一日志输出到控制台和日志系统
        @param msg: 日志信息
        @param level: 日志级别 info/warning/error/success
        """
        if level == 'info':
            self.stdout.write(msg)
            self.logger.info(msg, stacklevel=2)
        elif level == 'warning':
            self.stdout.write(self.style.WARNING(msg))
            self.logger.warning(msg, stacklevel=2)
        elif level == 'error':
            self.stdout.write(self.style.ERROR(msg))
            self.logger.error(msg, stacklevel=2, exc_info=True)
        elif level == 'success':
            self.stdout.write(self.style.SUCCESS(msg))
            self.logger.info(msg, stacklevel=2)
        else:
            self.stdout.write(msg)
            self.logger.info(msg, stacklevel=2)

```