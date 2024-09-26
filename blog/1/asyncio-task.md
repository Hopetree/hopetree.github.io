# 使用 Python 的异步模块 asyncio 改造 I/O 密集型定时任务

## 前言

我的博客配置了很多定时任务，其中有一部分定时任务属于 I/O 密集型的任务，比如需要进行大量的网络请求，此类任务执行普遍会比较耗时。最近看了几篇关于 Python 异步函数的文章，就想到可以把这些任务改造一下，改造完成后发现效率直接飙升！

## 定时任务的异步改造

### 安装 aiohttp

由于我的异步任务主要是涉及到网络请求的，所以需要替换掉原本的 `requests` 库改用异步请求库 `aiohttp`，直接安装：

```bash
pip install aiohttp
```

使用方式可查看官方指导文档：[Welcome to AIOHTTP](https://docs.aiohttp.org/en/stable/ "Welcome to AIOHTTP")

### 编写异步请求代码

我原本的代码是属于循环请求每个友链然后通过请求结果判断友链的状态并回写到数据库中，这就导致了某个友链由于网站异常或者本身请求返回就慢，进而使得整个任务的执行时间非常长。

先看一下改造前的代码，请求方式是同步请求：

```python
def action_check_friend_links(site_link=None, white_list=None):
    """
    检查友链:
        1、检查当前显示的友链，请求友链，将非200的友链标记为不显示，并记录禁用原因
        2、检查当前不显示的友链，请求友链，将200返回的标记为显示，并删除禁用原因
        3、新增补充校验：可以添加参数site_link，则不仅仅校验网页是否打开200，还会校验网站中是否有site_link外链
    @return:
    """
    import re
    from blog.models import FriendLink

    white_list = white_list or []  # 设置白名单，不校验
    active_num = 0
    to_not_show = 0
    to_show = 0
    active_friend_list = FriendLink.objects.filter(is_active=True)
    for active_friend in active_friend_list:
        active_num += 1
        if active_friend.name in white_list:
            continue
        if active_friend.is_show is True:
            code, text = get_link_status(active_friend.link)
            if code != 200:
                active_friend.is_show = False
                active_friend.not_show_reason = f'网页请求返回{code}'
                active_friend.save(update_fields=['is_show', 'not_show_reason'])
                to_not_show += 1
            else:
                # 设置了网站参数则校验友链中是否包含本站外链
                if site_link:
                    site_check_result = re.findall(site_link, text)
                    if not site_check_result:
                        active_friend.is_show = False
                        active_friend.not_show_reason = f'网站未设置本站外链'
                        active_friend.save(update_fields=['is_show', 'not_show_reason'])
                        to_not_show += 1
        else:
            code, text = get_link_status(active_friend.link)
            if code == 200:
                if not site_link:
                    active_friend.is_show = True
                    active_friend.not_show_reason = ''
                    active_friend.save(update_fields=['is_show', 'not_show_reason'])
                    to_show += 1
                else:
                    site_check_result = re.findall(site_link, text)
                    if site_check_result:
                        active_friend.is_show = True
                        active_friend.not_show_reason = ''
                        active_friend.save(update_fields=['is_show', 'not_show_reason'])
                        to_show += 1
    data = {'active_num': active_num, 'to_not_show': to_not_show, 'to_show': to_show}
    return data


```

异步改造的重点就是将网络请求变成并行执行，从而让整个任务的时长基本等于网络请求耗时最长的那个所用时长。下面是改造成异步请求后的代码：

```python
import re
import asyncio
import aiohttp
from blog.models import FriendLink


async def get_link_status(session, url, timeout=5):
    """
    异步获取链接状态码和网页内容
    :param session: aiohttp 的 session 实例
    :param url: 需要请求的 URL
    :param timeout: 请求超时时间
    :return: 状态码和网页文本内容
    """
    try:
        async with session.get(url, timeout=timeout) as response:
            code = response.status
            text = await response.text()
            return code, text
    except Exception as e:
        return None, str(e)


class LinkChecker:
    def __init__(self, site_link=None, white_list=None):
        """
        :param site_link: 需要在友链页面中检验的外链
        :param white_list: 白名单中的友链将不会被校验
        """
        self.site_link = site_link
        self.white_list = white_list or []
        self.result = {
            'active_num': 0,
            'to_not_show': 0,
            'to_show': 0,
            'version': '20240924.04'
        }
        self.lock = asyncio.Lock()  # 创建一个锁，用于保护共享数据

    async def check_link(self, session, active_friend):
        """
        校验单个友链的状态
        :param session: aiohttp 的 session 实例
        :param active_friend: FriendLink 模型实例
        :return: None
        """
        # 白名单友链直接设置成可访问
        if active_friend.name in self.white_list:
            if not active_friend.is_show:
                async with self.lock:
                    self.result['to_show'] += 1
                active_friend.is_show = True
                active_friend.not_show_reason = ''
                active_friend.save(update_fields=['is_show', 'not_show_reason'])
            return

        # 使用锁保护对共享数据 result 的操作
        async with self.lock:
            self.result['active_num'] += 1

        if active_friend.is_show:
            code, text = await get_link_status(session, active_friend.link)
            if code != 200:
                active_friend.is_show = False
                active_friend.not_show_reason = f'网页请求返回{code}'
                async with self.lock:
                    self.result['to_not_show'] += 1
            elif self.site_link and not re.findall(self.site_link, text):
                active_friend.is_show = False
                active_friend.not_show_reason = f'网站未设置本站外链'
                async with self.lock:
                    self.result['to_not_show'] += 1
            active_friend.save(update_fields=['is_show', 'not_show_reason'])
        else:
            code, text = await get_link_status(session, active_friend.link)
            if code == 200:
                if not self.site_link or re.findall(self.site_link, text):
                    active_friend.is_show = True
                    active_friend.not_show_reason = ''
                    async with self.lock:
                        self.result['to_show'] += 1
                    active_friend.save(update_fields=['is_show', 'not_show_reason'])

    async def check_all_links(self):
        """
        异步检查所有友链
        """
        active_friend_list = FriendLink.objects.filter(is_active=True)
        async with aiohttp.ClientSession() as session:
            tasks = [self.check_link(session, friend) for friend in active_friend_list]
            await asyncio.gather(*tasks)

        # 返回结果
        return self.result

    def run(self):
        """
        启动异步任务，检查友链
        """
        try:
            # 获取当前事件循环，如果没有则创建一个新的
            loop = asyncio.get_event_loop()
        except RuntimeError:
            # 在非主线程中运行时可能没有默认的事件循环，因此需要手动创建一个
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)

        # 使用事件循环执行任务并返回结果
        return loop.run_until_complete(self.check_all_links())


def action_check_friend_links(site_link=None, white_list=None):
    checker = LinkChecker(site_link, white_list)
    result = checker.run()  # 正确返回 result
    return result


# 用法示例
if __name__ == '__main__':
    r = action_check_friend_links(site_link='https://tendcode.com', white_list=['TendCode'])
    print(r)

```

上述代码给出了一个异步请求的通用思路：

1. 定义一个函数用来处理单个实例，比如上面检查单个友链状态的函数 `check_link()`
2. 定义一个函数用来处理所有实例，使用 `asyncio.gather()` 将所有任务添加到事件循环中
3. 定义一个 `run()` 函数用来执行任务并从事件循环中获取执行结果

### 改造前后对比

看一下定时任务的执行耗时，这是改造前的，任务耗时 33.148 秒：

```json
{"code": 0, "data": {"active_num": 24, "to_not_show": 0, "to_show": 0}, "message": "", "error": "", "time": 33.148}
```

再看一下改造后的耗时，耗时只有 5.473 秒，因为我设置的每个网页的超时时间是 5 秒，所以总耗时一定是大于这个时间的，因此可以看到现在的任务基本就等于一个最长耗时的网页的请求时间：

```json
{"code": 0, "data": {"active_num": 20, "to_not_show": 1, "to_show": 0, "version": "20240924.04"}, "message": "", "error": "", "time": 5.473}

```

### 遇到的问题

我第一版的代码执行函数 `run()` 是这样的：

```python
async def check_all_links(self):
    """
    异步检查所有友链
    """
    active_friend_list = FriendLink.objects.filter(is_active=True)
    async with aiohttp.ClientSession() as session:
        tasks = [self.check_link(session, friend) for friend in active_friend_list]
        await asyncio.gather(*tasks)

def run(self):
    """
    启动异步任务，检查友链
    """
    asyncio.run(self.check_all_links())
    return self.result
```

单独调试是一直没问题的，但是一旦放到定时任务中执行就会报错，错误信息如下：

```python
[2024-09-24 09:40:26,350: ERROR/ForkPoolWorker-1] Task easytask.tasks.check_friend[64c2ea40-3e2d-42d4-89c8-4cde4f86154f] raised unexpected: RuntimeError("There is no current event loop in thread 'MainThread'.")
Traceback (most recent call last):
  File "/usr/local/lib/python3.9/site-packages/celery/app/trace.py", line 385, in trace_task
    R = retval = fun(*args, **kwargs)
  File "/usr/local/lib/python3.9/site-packages/celery/app/trace.py", line 650, in __protected_call__
    return self.run(*args, **kwargs)
  File "/opt/cloud/izone/apps/easytask/tasks.py", line 58, in check_friend
    check_result = action_check_friend_links(site_link=site_link, white_list=white_list)
  File "/opt/cloud/izone/apps/easytask/action/friend_links.py", line 100, in action_check_friend_links
    checker = LinkChecker(site_link, white_list)
  File "/opt/cloud/izone/apps/easytask/action/friend_links.py", line 21, in __init__
    self.lock = asyncio.Lock()  # 创建一个锁，用于保护共享数据
  File "/usr/local/lib/python3.9/asyncio/locks.py", line 81, in __init__
    self._loop = events.get_event_loop()
  File "/usr/local/lib/python3.9/asyncio/events.py", line 642, in get_event_loop
    raise RuntimeError('There is no current event loop in thread %r.'
RuntimeError: There is no current event loop in thread 'MainThread'.
```

经过查询发现是因为当前的线程中找不到事件循环，所以导致报错，而之所以会这样是因为定时任务是放到 Celery 中执行，属于多线程环境，在多线程环境中，`asyncio.run()` 会在没有事件循环的情况下抛出错误。

为了避免这个问题，在 Celery 等异步任务中运行时，应该使用更适合多线程的方式，比如显式创建事件循环。这可以通过 `asyncio.new_event_loop()` 和 `asyncio.set_event_loop()` 来实现。


## 事件循环的工作机制

::: tip 提示

本节内容是我解决完事件循环报错问题后向 ChatGPT 提问“可以给我解释一下事件循环吗？”后 ChatGPT 输出的，我觉得解释和分析的很清楚，基本把事件循环的基本概念和作用介绍到了。
:::

让我们从**事件循环**的基本概念开始，并逐步深入到它的工作机制。

### 什么是事件循环？

在异步编程中，**事件循环**是一个核心概念。它是一个管理和调度任务的机制，负责执行异步操作并在操作完成后处理结果。与传统的同步编程中每个任务按顺序执行不同，事件循环允许程序同时等待多个任务完成，而不会阻塞其他任务。

**关键概念：**

1. **同步任务**：一次执行一个任务，必须等当前任务完成后才能继续下一个。
2. **异步任务**：任务在后台执行，可以不等待任务完成就开始下一个任务。
3. **事件循环**：异步任务的调度中心，它负责检查任务是否准备好继续执行，以及如何处理每个任务的完成状态。

### 事件循环的工作机制

1. **启动事件循环**：当你调用 `asyncio.run()` 或 `loop.run_forever()` 时，事件循环开始运行。它会持续运行，直到所有任务都完成，或者被显式停止。

2. **注册任务**：事件循环会将所有异步任务（`async` 函数、`await` 的部分）注册到它的内部任务队列。

3. **执行任务**：事件循环会**轮询**这些任务，每当有任务处于可以执行的状态时，它就会调度任务进行执行。

4. **I/O等待**：如果任务中有 I/O 操作（例如网络请求、文件读写等），事件循环会暂停任务的执行，直到 I/O 操作完成。这是异步编程的强大之处，避免了任务阻塞。

5. **处理回调**：当一个异步任务执行完成后，事件循环会调度注册的回调函数来处理任务的结果（例如返回值或异常）。

### 简单的例子

假设你有三个任务需要执行。任务 A、B、C 都是异步任务。事件循环会像这样运行它们：

1. 事件循环开始运行，先执行任务 A。
2. 当任务 A 遇到 I/O 操作（例如网络请求）时，事件循环暂停它，转而执行任务 B。
3. 同样，任务 B 可能也会遇到 I/O 操作，此时事件循环切换到任务 C。
4. 一旦任务 A 的 I/O 操作完成，事件循环会重新回到任务 A，继续执行剩下的操作。
5. 最终所有任务完成，事件循环退出。

### 事件循环的实际作用

事件循环的作用在于让程序在**单线程**下处理多个任务而不被阻塞。传统的同步编程中，如果有一个 I/O 操作，程序必须等待它完成；但在异步编程中，事件循环可以继续执行其他任务，这样提高了程序的效率和响应能力。

### Python中的事件循环

在 Python 的 `asyncio` 库中，事件循环的使用方式通常如下：

#### 1. 创建并启动事件循环

最常见的启动方法是 `asyncio.run()`：

```python
import asyncio

async def say_hello():
    print("Hello")
    await asyncio.sleep(1)
    print("World")

# 运行事件循环
asyncio.run(say_hello())
```

`asyncio.run()` 启动了一个事件循环，运行 `say_hello()`，当 `await asyncio.sleep(1)` 被执行时，它会暂停任务，等待 1 秒后继续执行。

#### 2. 手动控制事件循环

你可以手动获取并管理事件循环，例如：

```python
import asyncio

async def main():
    print("Running tasks")

# 获取当前事件循环
loop = asyncio.get_event_loop()

# 将任务注册到事件循环并启动
loop.run_until_complete(main())
```

#### 3. 管理多个异步任务

事件循环可以并发处理多个异步任务：

```python
import asyncio

async def task1():
    print("Task 1 started")
    await asyncio.sleep(2)
    print("Task 1 finished")

async def task2():
    print("Task 2 started")
    await asyncio.sleep(1)
    print("Task 2 finished")

async def main():
    await asyncio.gather(task1(), task2())  # 并发执行多个任务

asyncio.run(main())
```

在这个例子中，`asyncio.gather()` 并发执行 `task1()` 和 `task2()`，而不会等待任务1完全结束后再开始任务2。

### 常见错误与问题

- **没有事件循环**：你可能遇到类似 `RuntimeError: There is no current event loop` 的错误，通常发生在非主线程或被手动关闭事件循环的情况下。可以通过 `asyncio.get_event_loop()` 或 `asyncio.new_event_loop()` 来手动获取或创建事件循环。
- **嵌套事件循环**：不能在已经运行的事件循环中再次调用 `asyncio.run()`，因为事件循环必须独占当前线程的控制权。

### 事件循环的优点

- **提高并发性**：事件循环允许同时处理多个异步任务，无需为每个任务创建新线程，节省了资源。
- **避免阻塞**：I/O 操作不会阻塞程序运行，因此即使有大量网络请求或文件操作，程序也能保持响应。
  
### 小结

事件循环是异步编程的核心，它允许你通过一个单独的线程来管理和调度大量的异步任务。这在 I/O 密集型应用场景（如网络服务、数据库操作等）中特别有用，因为它可以避免阻塞操作，提高程序的并发能力和整体性能。