# 分享一个简单的 Python 脚本库：将 requests 代码转换成 curl 命令

工作中经常需要登录 linux 服务器调用接口，一般都是使用 curl 命令，而我本身习惯是本地用 Python 写接口调用的，也就是使用 requests 库写的。于是就经常会有人问我要某个接口的 curl 命令的时候我就需要去重新组装一下，将现有的 requests 脚本改写成 curl 命令行的形式。于是，py2curl 就诞生了，一个简单的 Python 脚本库，可以将 requests 脚本转化成一个简单可用的 curl 命令。

## py2curl 介绍

这是一个 python 第三方库，可以直接使用 pip 命令安装使用，代码仓库：<https://github.com/Hopetree/py2curl>

### 安装
直接执行 pip 安装命令即可

```shell
pip instll py2curl
```

### 使用

一个简单的 GET 请求：

```python
import requests
import py2curl

req = requests.get('https://tendcode.com')
result = py2curl.render(req.request)
print(result)

### curl -k -v -X GET -H "Accept: */*" -H "Accept-Encoding: gzip, deflate" -H "Connection: keep-alive" -H "User-Agent: python-requests/2.19.1" https://tendcode.com/
```

一个常见的 POST 请求：

```python
import requests
import py2curl

url = 'http://fanyi.youdao.com/translate_o?smartresult=dict&smartresult=rule'

headers = {
    'Cookie': 'OUTFOX_SEARCH_USER_ID=-2022895048@10.168.8.76;',
    'Referer': 'http://fanyi.youdao.com/',
    'User-Agent': 'Mozilla/5.0 (Windows NT 6.2; rv:51.0) Gecko/20100101 Firefox/51.0',
}
data = {
    'from': 'AUTO',
    'to': 'AUTO',
    'smartresult': 'dict',
    'client': 'fanyideskweb',
    'typoResult': 'true'
}
req = requests.post(url, data=data, headers=headers)
result = py2curl.render(req.request)
print(result)

###  curl -v -X POST -H "Accept: */*" -H "Accept-Encoding: gzip, deflate" -H "Connection: keep-alive" -H "Content-Length: 70" -H "Content-Type: application/x-www-form-urlencoded" -H "Cookie: OUTFOX_SEARCH_USER_ID=-2022895048@10.168.8.76;" -H "Referer: http://fanyi.youdao.com/" -H "User-Agent: Mozilla/5.0 (Windows NT 6.2; rv:51.0) Gecko/20100101 Firefox/51.0" -d "from=AUTO&to=AUTO&smartresult=dict&typoResult=true&client=fanyideskweb" http://fanyi.youdao.com/translate_o?smartresult=dict&smartresult=rule
```

总结：使用 py2curl 可以非常方便快速的将本地 python 代码转换成 curl 命令，即使你根本不会 curl 命令也可以做到无缝对接。

顺便分享一个 curl 命令转 python 代码（还可以转其他代码）的网站 https://curl.trillworks.com/