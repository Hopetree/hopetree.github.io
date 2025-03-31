# ITSM 流程中自动化对接 JumpServer 的实战经验

## 背景

最近在搞 ITSM 流程，其中有一个流程是关于堡垒机（JumpServer）权限申请的，主要设计账号注册和资产授权两个功能，这个流程需要实现自动化对接，也就是说用户提交申请之后可以自动注册账号或完成资产授权。自动化对接的本质就是接口调用，本文记录一下我使用 Python 封装的一些接口操作。

## JumpServer 接口文档

官方关于文档的描述可以查看这个：[https://docs.jumpserver.org/zh/v4/dev/rest_api/](https://docs.jumpserver.org/zh/v4/dev/rest_api/ "https://docs.jumpserver.org/zh/v4/dev/rest_api/")

具体的接口文档需要在 JumpServer 平台访问，访问地址为 `http://<url>/api/docs/`，JumpServer 使用的 Django 开发的，接口文档是 DRF 提供的，效果如图：

![](https://cdn.jsdelivr.net/gh/Hopetree/blog-img@main/2024/202412221142707.png)

官方提供了几种认证方式及调用示例：

![](https://cdn.jsdelivr.net/gh/Hopetree/blog-img@main/2024/202412221143229.png)

::: tip 吐槽一下

这里官方给的例子是让安装 `drf-httpsig` 库，实际上根本不需要，只需要安装 `httpsig` 就行，不然会多好几个不使用的库，包括 `django`。
:::

## 实战经验

### 接口请求封装

我这边对接的平台提供的认证方式是使用 `AccessKeyID` 和 `AccessKeySecret` 认证，下面是参考官方用例和实际场景进行的接口封装：


```python
# -*- coding:utf-8 -*-
import datetime
import json
import logging
import sys
import time

import requests
from httpsig.requests_auth import HTTPSignatureAuth

if sys.version_info[0] == 2:
    from imp import reload

    reload(sys)
    sys.setdefaultencoding('utf8')

FORMAT = '[%(asctime)s (line:%(lineno)d) %(levelname)s] %(message)s'
logging.basicConfig(level=logging.INFO, datefmt='%Y-%m-%d %H:%M:%S', format=FORMAT)
logger = logging.getLogger(__name__)
logging.getLogger("requests").setLevel(logging.WARNING)
logging.getLogger("urllib3").setLevel(logging.WARNING)


def print_json(_dict, indent=4):
    print(json.dumps(_dict, indent=indent, ensure_ascii=False))
	
	
class JumpServer:
    def __init__(self, jms_url, jms_org, ak, sk):
        self.jms_url = jms_url
        self.jms_org = jms_org
        self.ak = ak
        self.sk = sk
        self.auth = HTTPSignatureAuth(
            key_id=self.ak,
            secret=self.sk,
            algorithm='hmac-sha256',
            headers=['(request-target)', 'accept', 'date']
        )
        self.root_node = self.get_root_node()

    def get_root_node(self):
        """
        返回根节点信息
        :return:
        """
        _, data = self.get_nodes({'key': '1'})
        return data[0]

    def request(self, api, method, org=None, **kwargs):
        url = self.jms_url + api
        org = org or self.jms_org
        default_headers = {
            'Accept': 'application/json',
            'Date': datetime.datetime.utcnow().strftime('%a, %d %b %Y %H:%M:%S GMT')
        }
        if org:
            default_headers['X-JMS-ORG'] = org
        merged_headers = default_headers.copy()
        if kwargs.get('headers'):
            merged_headers.update(kwargs['headers'])
        kwargs['headers'] = merged_headers
        kwargs['timeout'] = kwargs.get('timeout', 10)

        resp = requests.request(method=method, url=url, auth=self.auth, **kwargs)
        if resp.status_code < 400:
            return resp.status_code, resp.json()
        else:
            logger.error('Request failed: {} {}'.format(resp.status_code, resp.text))
            return resp.status_code, {}

    def get_users(self, params=None):
        """
        查询用户列表
        :return:
        """
        api = '/api/v1/users/users/'
        method = 'GET'
        return self.request(api, method, params=params)

    def get_nodes(self, params=None):
        """
        获取节点
        :return:
        """
        api = '/api/v1/assets/nodes/'
        method = 'GET'
        return self.request(api, method, params=params)

    def get_assets(self, params=None):
        """
        获取资产列表
        :return:
        """
        api = '/api/v1/assets/assets/'
        method = 'GET'
        return self.request(api, method, params=params)

    def create_user(self, post_data):
        """
        创建用户
        {
            'name': 'itsm02',
            'username': 'itsm02',
            'email': 'itsm02@abcd.xyz',
            'system_roles': [],
            'source': 'local',
            'mfa_level': 0
        }
        :param post_data:
        :return:
        """
        api = '/api/v1/users/users/'
        method = 'POST'
        return self.request(api, method, json=post_data)

    def create_node(self, node_id, post_data):
        """
        创建子节点
        :param node_id:
        :param post_data:
        :return:
        """
        api = '/api/v1/assets/nodes/{id}/children/'.format(id=node_id)
        method = 'POST'
        return self.request(api, method, json=post_data)

    def create_asset(self, post_data):
        """
        创建资产
        :param post_data:
        :return:
        """
        api = '/api/v1/assets/assets/'
        method = 'POST'
        return self.request(api, method, json=post_data)

    def asset_permissions(self, post_data):
        api = '/api/v1/perms/asset-permissions/'
        method = 'POST'
        return self.request(api, method, json=post_data)

    def get_asset_id(self, node_value, host_data):
        """
        通过主机信息获取一个资产ID，如果资产不存在则创建资产
        :param node_value:
        :param host_data: 主机信息，比如包括三个字段hostname,ip,platform
        :return:
        """
        _, assets = self.get_assets({'ip': host_data['ip']})
        if assets:
            asset_id = assets[0]['id']
        else:
            node_id = self.get_node_id(node_value)
            post_data = {
                'hostname': host_data['hostname'],
                'ip': host_data['ip'],
                'platform': host_data['platform'],
                'nodes': [node_id]
            }
            _, asset_data = self.create_asset(post_data)
            asset_id = asset_data['id']
        return asset_id

    def get_node_id(self, node_value):
        """
        通过节点value返回节点ID，不存在就创建一个
        :param node_value:
        :return:
        """
        _, nodes = self.get_nodes({'value': node_value})
        if nodes:
            node_id = nodes[0]['id']
        else:
            post_data = {
                'value': node_value,
                'full_value': '{}/{}'.format(self.root_node['full_value'], node_value)
            }
            _, node_data = self.create_node(self.root_node['id'], post_data)
            node_id = node_data['id']
        return node_id

```

下面是实例化的一些必要参数配置：

```python
if __name__ == "__main__":
    if local_ip.startswith('192.168.92.'):
        JMS_URL = 'http://192.168.92.166'
        JMS_ORG = ''
        JMS_AK = '54695c02-fe15-45fd-a722-7ae102248f6b'
        JMS_SK = 'c8f827ac-9361-4323-a972-5d7bc6914682'
        SYSTEM_ROLES = []
        MFA_LEVEL = 0
        READ_USER_IDS = ['e8981c93-98dc-4112-ba96-77a4e19ac3a6']
        OPS_USER_IDS = ['416a3b96-f119-4f7b-b0e3-ad4a7b958eab']
    else:
        JMS_URL = ''
        JMS_ORG = ''
        JMS_AK = ''
        JMS_SK = ''
        SYSTEM_ROLES = []
        MFA_LEVEL = 0
        READ_USER_IDS = []
        OPS_USER_IDS = []
	JMS_API = JumpServer(JMS_URL, JMS_ORG, JMS_AK, JMS_SK)
```

### 使用场景

#### 1. 采集堡垒机账号

由于流程中在授权的时候需要用户选择授权账号，为了减少每次选择的时候重新查询堡垒机，于是我提前会定义同步堡垒机账号信息。

```python
def update_users():
    """
    更新用户到CMDB
    :return:
    """
    _, data = JMS_API.get_users()
    datas = []
    for each in data:
        datas.append({
            'id': each['id'],
            'name': each['name'],
            'username': each['username'],
            'email': each['email'],
            'source': each['source'],
            'is_valid': each['is_valid'],
            'date_expired': each['date_expired'],
        })
    logger.info('账号数量:{}'.format(len(datas)))
	# 存储方式略
```

#### 2. 创建账号

```python
def create_users(user_infos):
    """
    创建用户
    :param user_infos:
    :return:
    """
    for user_info in user_infos:
        source = user_info['source']['value']  # ldap|local
        name = user_info['name']
        username = user_info['username']
        email = user_info['email']

        post_data = {
            'name': name,
            'username': username,
            'email': email,
            'system_roles': SYSTEM_ROLES,
            'source': source,
            'mfa_level': MFA_LEVEL
        }
        print_json(post_data)
        logger.info('开始创建账号:{}'.format(name))
        _, data = JMS_API.create_user(post_data)
        print_json(data)
```

#### 3. 资产授权

资产授权的逻辑相对复杂一点，因为需要判断用户选择的主机是否存在资产，主要是有以下几种可能性及需要做的事情：

- 主机有对应的资产：
	- 资产授权
- 主机没有对应的资产：
	- 有系统命名的节点：
		- 创建资产
		- 资产授权
	- 没有系统命名的节点：
		- 创建节点
		- 创建资产
		- 资产授权



```python
def date2date(from_date):
    """
    将表单中的时间区间转换成堡垒机的开始和结束时间格式
    :param from_date: ["2024-12-18T14:11:40+08:00", "2025-01-23T14:11:40+08:00"]
    :return: ["2024/12/18 00:00:00 +0800", "2025/01/23 23:59:59 +0800"]
    """
    start_date = '{} 00:00:00 +0800'.format(from_date[0][:10].replace('-', '/'))
    end_date = '{} 23:59:59 +0800'.format(from_date[1][:10].replace('-', '/'))
    return [start_date, end_date]


def asset_to_user(table_info, order_num):
    """
    将主机授权给堡垒机用户
    可能的情况：
    1. 主机有对应的资产：
        资产授权
    2. 主机没有对应的资产：
        2.1 有系统命名的节点：
            创建资产
            资产授权
        2.2 没有系统命名的节点：
            创建节点
            创建资产
            资产授权
    :param table_info: 表单信息
    :param order_num: 工单编号拿来命名
    :return:
    """
    date_str = datetime.datetime.now().strftime('%Y%m%d')
    for _index, each in enumerate(table_info):
        system_name = each['system'][0]['name']
        host_datas = []
        for host in each['hosts']:
            host_datas.append({
                'ip': host['ip'],
                'hostname': host['hostname'],
                'platform': host['osSystem']
            })
        user_ids = [u['id'] for u in each['users']]
        os_user_type = each['hostUserType']['value']  # a:运维 b:只读
        if os_user_type == 'a':
            os_user_ids = OPS_USER_IDS
            date_start, date_expired = date2date(each['opsDate'])

        else:
            os_user_ids = READ_USER_IDS
            if each.get('readDate'):
                date_start, date_expired = date2date(each['readDate'])
            else:
                date_start, date_expired = ['', '']

        # 先创建或直接返回主机对应的资产ID
        asset_ids = []
        for host_data in host_datas:
            asset_id = JMS_API.get_asset_id(system_name, host_data)
            asset_ids.append(asset_id)

        # 发送资产授权请求
        name = '{}_{}_{}_{}'.format(system_name, order_num, date_str, _index)
        post_data = {
            'name': name,
            'assets': asset_ids,
            'users': user_ids,
            'system_users': os_user_ids,
        }
        if date_start and date_expired:
            post_data['date_start'] = date_start
            post_data['date_expired'] = date_expired
        print_json(post_data)
        logger.info('开始创建资产授权：{}'.format(name))
        _, data = JMS_API.asset_permissions(post_data)
        print_json(data)

```

#### 4. 采集用户的资产

利用采集的用户信息，进而查询到每个用户的资产清单，进而可以反向建立资产和用户的关系。


```python
def get_user_assets(self, user_id, params=None):
	"""
	获取资产列表
	:return:
	"""
	api = '/api/v1/perms/users/{}/assets/'.format(user_id)
	method = 'GET'
	return self.request(api, method, params=params)
```


消费场景：查询每个用户拥有的资产，查询每个资产授权的用户，效果类似如下

![](https://cdn.jsdelivr.net/gh/Hopetree/blog-img@main/2025/202503101129178.png)