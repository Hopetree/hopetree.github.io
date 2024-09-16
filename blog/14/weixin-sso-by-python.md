# 企业微信 SSO 单点登录——使用 Python 调用企业微信接口

最近在对接企业微信搞单点登录，其实之前我搞个这个，无非就是调用企微接口使用code获取用户信息。之所以打算写一篇文章记录一下这次的对接经验，是因为我感觉这套代码的一个思路（关于如何简单的存储会过期的token）可以作为一个类似的接口调用的参考。

## 企微单点登录对接流程

只要有单点登录的概念，知道单独单点登录的一般流程就可以直接去看[企微的对接文档](https://developer.work.weixin.qq.com/document/path/91335 "企微的对接文档")，写的非常清晰，我这里是网页对接，可以看官方给的这个接入流程图：

![图1 企业微信OAuth2流程图](https://cdn.jsdelivr.net/gh/Hopetree/blog-img@main/2024/04/202408261109909.png)

这里分享的主要是这个流程里面的“开发者服务后台”请求“企业微信API”消费CODE获取用户信息的过程，也就是使用企微API接口查询用户信息等操作。

## 企微接口调用

### 前置条件

需要申请企业ID和应用的密钥，用来获取access_token，具体可以看[官方文档](https://developer.work.weixin.qq.com/document/path/91039 "官方文档")。

| 参数  | 必须  |  说明 |
| ------------ | ------------ | ------------ |
|  corpid  |是   |  企业ID，获取方式参考：[术语说明-corpid](https://developer.work.weixin.qq.com/document/path/91039#14953/corpid "术语说明-corpid") |
| corpsecret   | 是  | 应用的凭证密钥，注意应用需要是启用状态，获取方式参考：[术语说明-secret ](https://developer.work.weixin.qq.com/document/path/91039#14953/secret "术语说明-secret ") |


### 封装请求类

我主要是想要记录一下我做的接口请求封装，我的调试代码如下：

```python
import json
import logging
import os
import sys
import time

import requests

FORMAT = '[%(asctime)s (line:%(lineno)d) %(levelname)s] %(message)s'
logging.basicConfig(level=logging.INFO, datefmt='%Y-%m-%d %H:%M:%S', format=FORMAT)
logger = logging.getLogger(__name__)

class WXAPI:
    # https://developer.work.weixin.qq.com/document/path/90313
    error_token_code = [40014, 42001]  # token错误或失效的状态码

    def __init__(self, host, corp_id, corp_secret, timeout=10, token_file=''):
        self.host = host
        self.corp_id = corp_id
        self.corp_secret = corp_secret
        self.timeout = timeout
        if token_file:
            self.token_file = token_file
        else:
            # 如果不设置token文件绝对路径，则在当前目录下面创建一个
            token_file_dirname = os.path.dirname(os.path.abspath(__file__))
            self.token_file = os.path.join(token_file_dirname, 'token.json')
        self.token = None
        self.token_expiry = 0
        self.load_token()

    def load_token(self):
        """
        从文件中加载token和过期时间。如果文件不存在，则获取新的token。
        """
        if os.path.exists(self.token_file):
            with open(self.token_file, "r") as f:
                data = json.load(f)
                self.token = data.get("access_token")
                self.token_expiry = data.get("expiry_time", 0)
        else:
            self.get_token_and_save()

    def get_token(self):
        """
        获取企业微信的access_token。如果文件中的token有效则直接使用，否则重新获取。
        """
        # 如果token未过期，直接返回token
        if self.token and self.token_expiry > time.time():
            return self.token

        # 重新获取token并保存
        self.get_token_and_save()
        return self.token

    def get_token_and_save(self):
        """
        获取新的企业微信access_token和计算过期时间(提前10分钟过期)并保存到文件。
		https://developer.work.weixin.qq.com/document/path/91039
        """
        url = self.host + '/cgi-bin/gettoken'
        params = {'corpid': self.corp_id, 'corpsecret': self.corp_secret}
        resp = requests.get(url, params=params, verify=False, timeout=self.timeout)
        if resp.status_code == 200 and resp.json()['errcode'] == 0:
            self.token = resp.json()['access_token']
            self.token_expiry = time.time() + resp.json().get('expires_in', 7200) - 600  # 提前10分钟
            data = {
                "access_token": self.token,
                "expiry_time": self.token_expiry
            }
            with open(self.token_file, "w") as f:
                json.dump(data, f)
        else:
            raise Exception('获取token失败: error {}'.format(resp.text))

    def api_request(self, method, api, **kwargs):
        url = self.host + api
        kwargs['params'] = kwargs.get('params', {})
        kwargs['params']['access_token'] = self.get_token()
        resp = requests.request(method, url, verify=False, timeout=self.timeout, **kwargs)
        if resp.status_code == 200 and resp.json()['errcode'] in self.error_token_code:
            logger.info('token 不合法或过期，重新获取并请求')
            self.get_token_and_save()  # 强制更新token
            kwargs['params']['access_token'] = self.get_token()
            resp = requests.request(method, url, verify=False, timeout=self.timeout, **kwargs)
        if resp.status_code == 200 and resp.json()['errcode'] == 0:
            return resp.json()
        raise Exception('请求{}失败, resp {}'.format(resp.request.url, resp.text))

    def get_user_info(self, code):
        """
        使用code获取企业微信用户信息
        https://developer.work.weixin.qq.com/document/path/91023
        {
           "errcode": 0,
           "errmsg": "ok",
           "userid":"USERID",
           "user_ticket": "USER_TICKET"
        }
        :param code:
        :return:
        """
        api = '/cgi-bin/auth/getuserinfo'
        params = {'code': code}
        user_info = self.api_request('get', api, params=params)
        return user_info

    def get_user_info_detail(self, user_id):
        """
        通过userid获取用户更多信息，当userid不满足登录信息要求时调用
        https://developer.work.weixin.qq.com/document/path/90196
        :param user_id:
        :return:
        """
        api = '/cgi-bin/user/get'
        params = {'userid': user_id}
        user_info = self.api_request('get', api, params=params)
        return user_info

if __name__ == '__main__':
    _api = WXAPI('https://xx.weixin.qq.com', 'xxxxx', 'xxxx', token_file='/tmp/token.json')
    _data = _api.api_request('post', '/cgi-bin/user/list_id', json={'limit': 100})
    print(_data)
```

::: warning 注意事项

1. `token` 是写入临时文件中的，因此需要保证执行用户对文件有写入权限。
2. 每个 `code` 只能使用一次，一旦被使用就会失效，调试或者正式使用的时候需要注意。
:::


这个类封装了一个通用的API请求函数 `api_request`，该函数实现了一个请求token失效后重试的机制，可以应对企微的各种接口，上面的代码也演示了一个获取成员ID列表的接口的用法，本质就是直接使用 `requests.request` 进行请求，只不过封装好了设置token和重试的逻辑。

### 代码思路分享

这个代码里面最有意义的逻辑在于对 `access_token` 的存储和调用的方案，由于 `access_token` 是需要使用接口获取的，并且这个 token 只是临时的，默认是 7200 秒过期，而且官方有说明，会现在这个获取 `access_token` 接口的频率，也就是你不能每次都去请求，而是应该尽量存起来重复用，这是官方的说法：

::: tip 官方提示

开发者需要缓存access_token，用于后续接口的调用（注意：不能频繁调用gettoken接口，否则会受到频率拦截）。当access_token失效或过期时，需要重新获取。

&nbsp;

access_token的有效期通过返回的expires_in来传达，正常情况下为7200秒（2小时）。
由于企业微信每个应用的access_token是彼此独立的，所以进行缓存时需要区分应用来进行存储。

&nbsp;

access_token至少保留512字节的存储空间。
企业微信可能会出于运营需要，提前使access_token失效，开发者应实现access_token失效时重新获取的逻辑。

:::


所以我这里就是按照官方的提示进行的处理，直接将token写入到一个本地文件中（当然也可以写入redis或者数据库中），并且附带的把token的过期时间也写进去，这样可以在读取的时候知道当前token是否过期，最后，在每次请求API的时候，如果发现返回码是token过期或者无效则重新获取一次token再请求。

大致的逻辑流程图是这样的：


![请求流程图](https://cdn.jsdelivr.net/gh/Hopetree/blog-img@main/2024/04/202408261304340.png)


这个逻辑其实不仅仅是企业微信的接口可以使用，而且针对其他系统类似的调用接口需要获取一个有时效的token的逻辑都是可以按照这个思路来请求。

这是我总结的这个方案的优点：

1. 每次加载类的时候一定可以读取到当前文件中的token，并且是优先使用存储的token，可以减少请求token的频率
2. 每次请求前会先通过记录的过期时间来判断token是否有效，并且由于设置了提前过期，所以理论上可以保证实际请求的时候token肯定是有效的
3. 这里设置了一个以防万一的情况，就是记录的token明明还没有到期但是还是失效了，也会重新获取一次token，保证API请求不会因为token问题报错

### 实际使用

**场景一：直接通过code获取到的userid来认证**

单点登录请求服务的时候会携带企微给的用户code，服务需要拿着这个code去查询用户的信息，一个基本的信息是可以返回 `userid` 字段的，如果服务正好可以使用这个来认证用户那就可以直接获取这个字段，调试代码：

```python
if __name__ == '__main__':
    _api = WXAPI('https://xx.weixin.qq.com', 'xxxxx', 'xxxx', token_file='/tmp/token.json')
    user_id = _api.get_user_info(code="xxxx")['userid']
```

**场景二：需要获取用户的其他信息进行认证，比如邮箱**

由于使用code的查询用户信息的接口返回的信息优先，基本只有这个 `userid` 字段，如果服务需要的认证信息无法通过这个字段来认证，那么可以进一步拿着这个 `userid` 字段去查询用户更多信息，调试代码：

```python
if __name__ == '__main__':
    _api = WXAPI('https://xx.weixin.qq.com', 'xxxxx', 'xxxx', token_file='/tmp/token.json')
    user_id = _api.get_user_info(code="xxxx")['userid']
    user_email = _api.get_user_info_detail(user_id=user_id)['email']
```

### 全局错误码

调用API接口的时候遇到错误不要盲目的东问西问的，像企业微信这种有大量对接需求的平台提供的接口文档也是绝对的清晰明了，他们有提供[全局的API接口返回码错误信息对照表](https://developer.work.weixin.qq.com/document/path/90313 "全局的API接口返回码错误信息对照表")，并且对一些错误进行了解析和解决指导。

## 总结

说实话，调用企微的接口不是什么复杂的事，并不值得写一篇文章来记录，但是我写这篇文章的主要目的还是为了记录一下这种对于有时效性token的临时存储方式和读取方式的思路，因为这个思路不仅仅是企微可以使用，其他类似系统（比如之前我对接过的一个OA系统也是这样，对于请求token的接口设置了频控，也是让服务去存储token重复使用）也是可以借鉴的。