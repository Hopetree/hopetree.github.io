# 分享一种使用 Python 调用接口“失败”后重试的通用方案

最近在写很多自动化的脚本，涉及很多平台的接口调用，比如虚拟化平台 VMware、SmartX、Nutanix，其中涉及很多异步任务的接口调用，比如创建快照、删除快照、扩容等接口，基本都是异步任务。此时就需要不停的去查询任务状态，只有任务状态为成功或失败才结束。

因此，我写了一个通用的装饰器来处理这种需要重复执行某个函数，直到得到预期返回的操作。

## 方案思路解析

首先说一下这个方案能解决的通用的问题的特征：

1. 针对接口请求，接口的返回内容应该是有状态的，比如一些异步任务的接口，任务一般有执行中、失败、成功三个基本状态。非接口也是一样的，一定是有不同状态的。
2. 接口或操作的状态中有个状态是属于“运行中”，此状态表示需要等一段时间后继续来请求查询。
3. 状态中一定有结束的状态，比如成功或失败都是需要结束查询的状态。
4. 重试应该有个限度，可以按照次数或者最大时间来定。

## 方案实现

我写了一个装饰器函数，这个函数接受两个参数，第一个参数是请求的最多次数，第二个参数是每次请求后等待的时间，通过这两个参数就可以设置最大的请求超时时间，保证不会无限重试下去。

具体代码如下：

```python
import time
from functools import wraps

class MyTool(object):

    @staticmethod
    def loop_retry(times=10, sleep_time=1):
        """
        循环重试装饰器，接受的函数返回必须是一个元组或者列表，比如(True, {})这种格式，第一个元素用来判断是否继续重试
        :param times: 最大重试次数
        :param sleep_time: 每次重试后间隔时间(秒)
        :return: 直接返回原函数返回的数据，比如(True, {})中的{}
        """

        def decorator(func):
            @wraps(func)
            def wrapped_function(*args, **kwargs):
                i = 1
                flag, result = func(*args, **kwargs)
                while i <= times:
                    if flag:
                        print('****** 第{}/{}次请求，返回数据符合期望，停止重试！'.format(i, times))
                        break
                    else:
                        print(
                            '****** 第{}/{}次请求，返回数据不符合期望，继续重试...'.format(i, times))
                        flag, result = func(*args, **kwargs)
                        i += 1
                        time.sleep(sleep_time)
                return result

            return wrapped_function

        return decorator


```

这个函数对于被装饰的函数有一个要求，那就是函数比如返回一个元组，而元组的第一个值就是用来判断是否继续重试的标识，比如当接口的状态是运行中，则可以返回 False，此时就表示需要继续重试，而如果状态是成功或失败，则返回 True，表示可以结束请求直接返回值。

### 一个简单的测试用例

直接来看一个例子，这里有一个函数，函数随机生成一个10以内的整数，我希望当整数不是1的时候就继续执行函数，直到得到1，这个过程就模拟接口的返回。

```python
@MyTool.loop_retry(10, 1)
def get_num():
    num = random.randint(1, 10)
    if num != 1:
        return False, num
    else:
        return True, num
		
if __name__ == '__main__':
    n = get_num()
    print(n)
```

这里直接给函数配置上装饰器，并且设置最多尝试10次，每次等待1秒钟，看一下执行效果：

```shell
****** 第1/10次请求，返回数据不符合期望，继续重试...
****** 第2/10次请求，返回数据不符合期望，继续重试...
****** 第3/10次请求，返回数据符合期望，停止重试！
1
```

这里可以看到，随机请求了3次后得到了整数1，也就停止了请求。

### 实际应用

下面这个是在实际应用中，我这里有个查询任务状态的接口，由于是异步任务，所以需要不停的查询，直到得到任务的结果：

```python
@MyTool.loop_retry(10, 5)
def task_status(self, task_id):
    api = '/tools/execution/{}'.format(task_id)
    url = self.easy_api_host + api
    params = {'useTargetIdAsKey': True}
    resp = requests.get(url, headers=self.headers, params=params)
    msg = '查询工具结果'
    if resp.status_code == 200 and resp.json()['code'] == 0:
        logger.info('{}成功'.format(msg))
        total_status = resp.json()['data']['totalStatus']
        # print_json(resp.json()['data'])
        if total_status == 'run':
            logger.info("工具正在执行中...，前往任务历史{}查看".format(task_id))
            return False, resp.json()['data']
        elif total_status == "failed":
            logger.error("工具执行失败，前往任务历史{}查看".format(task_id))
            return True, resp.json()['data']
        elif total_status == "success":
            logger.info("工具执行成功，前往任务历史{}查看".format(task_id))
            return True, resp.json()['data']
        else:
            logger.error("工具执行异常，状态{}未知，前往任务历史{}查看".format(total_status,
                                                                                task_id))
            return True, resp.json()['data']
    else:
        logger.error('{}失败，返回码：{}，返回体：{}'.format(msg, resp.status_code, resp.text))
        raise Exception('工具查询失败！！！')

```

我这里通过判断接口的返回值中 `totalStatus` 状态值决定是否继续查询任务，当状态是 `run` 说明任务还在执行中，因此需要等一段时间继续查询，而状态为其他则表示已经有执行结果了，在不需要继续查询的时候返回接口的内容。