# Python 调用接口进行文件上传的踩坑记录

## postman 接口调用

一般文件上传的接口大概如下，某个字段需要上传文件，比如这里的是file字段

![](https://tendcode.com/cdn/article/121002Snipaste_2021-12-10_16-22-59.png)

## 正常请求

一般情况下，使用下面的代码就可以正常调通接口，这种方式也是 postman 里面自动生成的代码的方式。

```python
import requests

headers = {
    'xxx': 'xxx',
    'xxx': 'xxx',
}

host = 'http://xx.xx.xx.xx:xxxx'

def upload_file(data, filename, content):
    api = '/api/v1/objectStore/bucket/{}/object'.format('bug')
    url = host + api
    files = [('file', (filename, content, 'text/plain'))]
    resp = requests.put(url, headers=headers, data=data, files=files)
    print(resp.status_code, resp.text)


if __name__ == '__main__':
    name = '中文.docs'
    d = {'objectName': name}
    with open('Info.txt', 'rb') as f:
        ctx = f.read()
    upload_file(d, '中文.txt', ctx)
```

返回也OK：
```shell
(200, u'{"code":0,"codeExplain":"","error":"","data":{"objectName":"\u4e2d\u6587.docs"}}')
```

## 报错处理方式

但是也有时候上面的方式会报错，比如 python2 的情况下（我遇到过的更离谱，同样py2在Windows不报错，在Linux报错），一般报错是因为文件名称包含中文导致的报错，处理方式有两种，具体如下。

### urllib3 的方式

此方式只需要使用内置的 `urllib3` 模块


```python
from urllib3 import encode_multipart_formdata

import requests

headers = {}

def upload_file(data, filename, content):
    api = '/api/v1/objectStore/bucket/{}/object'.format('bug')
    url = host + api
	
	# 特殊处理
    data['file'] = (filename, content)
    data, headers['Content-Type'] = encode_multipart_formdata(data)
	
    resp = requests.put(url, headers=headers, data=data)
    print(resp.status_code, resp.text)
```

### MultipartEncoder 方式

此方式需要安装第三方库 `requests_toolbelt`

```python
import urllib
import requests
from requests_toolbelt import MultipartEncoder

headers = {}

def upload_file(data, filename, content):
    api = '/api/v1/objectStore/bucket/{}/object'.format('bug')
    url = host + api

    # 特殊处理
    encoded_name = urllib.quote(filename)
    data['file'] = (encoded_name, content)
    m = MultipartEncoder(data)
    decoded_m = m.to_string()
    data = decoded_m.replace(encoded_name, filename)
    headers['Content-Type'] = m.content_type

    resp = requests.put(url, headers=headers, data=data)
    print(resp.status_code, resp.text)
	
```

### 偷懒方式--随便取个名

还有一种方式更简单，因为报错是因为文件名包含中文，而一般file里面的文件名并不是接口真的要用的（接口一般会让你单独使用一个字段传文件名，比如上面接口的objectName字段），所以，其实可以直接随便写个非中文的名称就行，比如：

```python
# 只需要改这一行
files = [('file', (filename, content, 'text/plain'))]
# 改成下面
files = [('file', ('a', content, 'text/plain'))]
```

::: warning 警告

但是这种方式并不是总有效，也要分接口的，所以可以先试用这个方式，不行再换上面的方式
:::

