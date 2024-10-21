# Python 脚本中日志级别控制示例

## 临时修改日志级别

**使用场景**：在脚本的调试阶段，尽可能的输入更多的信息，以便于定位问题，而在正式使用中只打印关键信息即可。

**解决方案**：在 `if __name__ == '__main__':` 中使用 `setLevel` 重新设置当前文件的的日志级别，调试的时候只需要这行代码即可。

参考代码：

```python
# -*- coding:utf-8 -*-

import sys
import logging

if sys.version_info[0] == 2:
    from imp import reload

    reload(sys)
    sys.setdefaultencoding('utf8')

FORMAT = '[%(asctime)s (line:%(lineno)d) %(levelname)s] %(message)s'
logging.basicConfig(level=logging.INFO, datefmt='%Y-%m-%d %H:%M:%S', format=FORMAT)
logger = logging.getLogger(__name__)


def main():
    logger.debug('start ...')


if __name__ == '__main__':
    logger.setLevel(logging.DEBUG)
    main()
```

## 控制指定模块的日志

**使用场景**：在某些时候，一些内置或者第三方的模块定义了自己的日志输出级别，如果想要重新调整某个模块的日志级别，可以按照下面的做法。

**解决方案**：使用 `logging.getLogger()` 来设置指定模块的日志级别。

比如在python2中使用requests请求的时候，会输出info级别的日志，这导致日志中有很多请求日志，可以这样进行屏蔽：

```python
# -*- coding:utf-8 -*-

import sys
import logging

import requests

if sys.version_info[0] == 2:
    from imp import reload

    reload(sys)
    sys.setdefaultencoding('utf8')

FORMAT = '[%(asctime)s (line:%(lineno)d) %(levelname)s] %(message)s'
logging.basicConfig(level=logging.INFO, datefmt='%Y-%m-%d %H:%M:%S', format=FORMAT)
logger = logging.getLogger(__name__)
logging.getLogger("requests").setLevel(logging.WARNING)
logging.getLogger("urllib3").setLevel(logging.WARNING)


def main():
    requests.get('http://baidu.com')


if __name__ == '__main__':
    main()

```

`logging.getLogger` 的这个写法适用于任意的模块。

## 屏蔽requests中SSL 证书告警

**场景场景**：在使用requests请求https地址的时候，经常需要设置verify=False来跳过证书验证，此时在日志中会打印类似如下的告警日志：

```bash
[2024-10-21 10:47:47 (line:788) INFO] Starting new HTTPS connection (1): baidu.com
/Library/Frameworks/Python.framework/Versions/2.7/lib/python2.7/site-packages/requests/packages/urllib3/connectionpool.py:821: InsecureRequestWarning: Unverified HTTPS request is being made. Adding certificate verification is strongly advised. See: https://urllib3.readthedocs.org/en/latest/security.html
  InsecureRequestWarning)
```

**解决方案**：屏蔽方案如下，python2和python3有点不同：

```python
# 屏蔽InsecureRequestWarning 警告 (适用于 Python 2 和 Python 3)
from requests.packages.urllib3.exceptions import InsecureRequestWarning

requests.packages.urllib3.disable_warnings(InsecureRequestWarning)
# 或者直接
requests.packages.urllib3.disable_warnings()
```

```python
# 屏蔽InsecureRequestWarning 警告 ()
# 下面几种都适用于 Python 3
# 第一种
import urllib3

urllib3.disable_warnings()
# 或者
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
# 或者
requests.packages.urllib3.disable_warnings()

```