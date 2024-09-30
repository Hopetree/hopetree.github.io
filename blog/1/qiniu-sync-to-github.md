# 博客灾备方案（1）：七牛云图床增量同步到GitHub

博客重新备案之后，我一直在思考如何保证博客的灾备方案，想要实现博客的静态部署，脱离服务器和域名。方案已经确认并验证过，这个方案分成两步走，第一步就是保证图床的抽离，不再依赖七牛云这种国内平台。这篇文章来分享一下我实现的七牛云图床同步到GitHub图床。

## 可行性分析

在确定将 GitHub 当做备用图床的时候，我考虑的问题有以下三点：

1. GitHub 在国内的访问不稳定，图床访问慢甚至不能访问怎么解决？
2. GitHub 上传文件比较麻烦，怎么方便的传图？
3. GitHub 一个项目的空间有限（总空间1G，单文件不超过100M），是否够用？

前两个问题我在分享 GitHub 图床配置的时候已经解决过了，所以不存在问题，而第三个关于空间的问题，我们可以来做一个计算，假设创建一个项目专门存放博客的图片，平均每个图片大概100KB，那么1GB就可以存放1000张，一个博客平均两张也就可以支持500篇文章，一周创建一篇文章的话，500篇文章差不多要10年……看到这些数据，应该不用再担心这小小的1GB是否够用了吧！

我的博客运行了6年多了，文章140多篇，在七牛云空间里面的数据容量也才100M而已，大部分的博文是没有图片的，而且图片本身也不大，所以空间的问题不用太焦虑。

## 增量同步方案

图床同步的本质就是将七牛云一个空间里面的全部数据下载后上传到 GitHub 的一个项目中，并且需要保证文件的相对路径一致，这样访问同样一个文件就只需要修改地址的前缀就行。

我的增量同步方案思路如下：

1. 先查询出七牛云空间中所有文件清单，每个文件的相对路径类似 article/2024/20200705192255.png
2. 查询GitHub某个项目中所有文件，输出文件的相对路径类似 article/2024/20200705192255.png
3. 对比两个清单，找出存在七牛云而不存在GitHub中的文件
4. 循环下载七牛云中文件，上传到GitHub中
5. 设置成定时任务，定期执行，实现增量同步

## 代码实现

### 七牛云 SDK 使用

七牛云的 SDK 的使用可以查看官方文档：[七牛云 Python SDK](https://developer.qiniu.com/kodo/1242/python#rs-batch-stat "七牛云 Python SDK")

利用七牛云提供的 SDK 实现文件的查询和下载，所以这里实现了两个函数，函数 `list_files` 用来查询出目标空间下所有的文件，函数 `download_file` 实现单个文件的下载，封装后的代码如下：

```python
import requests
import qiniu

class QiniuManager:
    def __init__(self, access_key, secret_key, bucket_name, private_domain, limit=500):
        """
        初始化 QiniuManager 类
        :param access_key: 七牛云 Access Key
        :param secret_key: 七牛云 Secret Key
        :param bucket_name: 存储空间名称（bucket name）
        :param private_domain: 空间私有域名
        :param limit: 每次列举的文件数量，最大为1000
        """
        self.q = qiniu.Auth(access_key, secret_key)
        self.bucket = qiniu.BucketManager(self.q)
        self.bucket_name = bucket_name
        self.private_domain = private_domain
        self.limit = limit

    def list_files(self, prefix=''):
        """
        列举指定存储空间中的所有文件，支持分页列举超过1000个文件
        :param prefix: 文件名前缀，用于筛选特定目录下的文件
        :return: 返回文件信息列表
        """
        marker = None
        file_list = []

        while True:
            # 列举文件，返回文件信息、是否列举完（eof）和返回的marker
            ret, eof, info = self.bucket.list(self.bucket_name, prefix, marker, self.limit)

            if ret is None:
                # 错误处理
                print("Error:", info)
                break

            # 将当前批次的文件信息加入列表
            items = ret.get('items', [])
            file_list.extend(items)

            # 如果eof为True，表示已经列举完所有文件
            if eof:
                break

            # 更新marker，继续获取下一页文件
            marker = ret.get('marker')

        return file_list

    def download_file(self, file_key):
        """
        下载存储空间中的单个文件，并返回文件内容
        :param file_key: 文件的唯一标识（文件名或路径）
        :return: 文件的字节内容
        """
        # 生成下载链接，默认链接有效期为3600秒
        base_url = f'http://{self.private_domain}/{file_key}'
        private_url = self.q.private_download_url(base_url, expires=3600)

        response = requests.get(private_url, timeout=20)
        if response.status_code == 200:
            # 成功下载，返回文件的字节内容
            return response.content
        else:
            # 处理下载错误
            print(f"Error downloading file {file_key}: {response.status_code}")
            return None

```

### GitHub API 使用

GitHub API 官方文档看这里：

- [GitHub API Documentation - Contents](https://docs.github.com/en/rest/repos/contents "GitHub API Documentation - Contents")：查询项目中文件
- [GitHub API Documentation - Create or update file contents](https://docs.github.com/en/rest/repos/contents#create-or-update-file-contents "GitHub API Documentation - Create or update file contents")：创建或更新文件

我封装的代码实现了两个主要的函数，函数 `list_all_files` 获取一个项目下所有文件路径，函数 `upload_file` 实现文件的上传/更新，代码如下：

```python
import base64

import requests

class GitHubManager:
    def __init__(self, token, owner, repo, upload_msg=None):
        """
        初始化 GitHubManager 类
        :param token: GitHub 的个人访问令牌 (Personal Access Token)
        :param owner: 仓库的所有者（GitHub 用户名）
        :param repo: 仓库名称
        :param upload_msg: 文件上传的commit
        """
        self.token = token
        self.owner = owner
        self.repo = repo
        self.upload_msg = upload_msg or 'Upload file via API'
        self.api_base_url = f"https://api.github.com/repos/{owner}/{repo}"

    def _get_headers(self):
        """
        获取 HTTP 请求头，包含认证信息
        :return: 带有授权信息的 headers
        """
        return {
            'Authorization': f'token {self.token}',
            'Content-Type': 'application/json'
        }

    def _list_files_in_directory(self, path=''):
        """
        列举 GitHub 仓库中指定目录下的所有文件和子目录
        :param path: 要查询的文件路径，默认为仓库根目录
        :return: 文件和子目录列表
        """
        url = f"{self.api_base_url}/contents/{path}"
        headers = self._get_headers()

        response = requests.get(url, headers=headers, timeout=20)

        if response.status_code == 200:
            # 返回文件和目录的列表
            return response.json()
        else:
            print(f"Error: {response.status_code}, {response.text}")
            return None

    def list_all_files(self, path=''):
        """
        递归列举 GitHub 仓库中的所有文件
        :param path: 要查询的文件路径，默认为仓库根目录
        :return: 所有文件路径列表
        """
        files_list = []

        # 获取当前目录下的文件和目录
        items = self._list_files_in_directory(path)

        if items is None:
            return []

        for item in items:
            if item['type'] == 'file':
                # 如果是文件，保存文件的路径
                files_list.append(item['path'])
            elif item['type'] == 'dir':
                # 如果是目录，递归列举该目录下的文件
                files_list.extend(self.list_all_files(item['path']))

        return files_list

    def get_file_sha(self, file_path):
        """
        获取 GitHub 上已有文件的 SHA 值
        :param file_path: 文件路径，相对于仓库根目录
        :return: 文件的 SHA 值，如果文件不存在，返回 None
        """
        url = f"{self.api_base_url}/contents/{file_path}"
        headers = self._get_headers()

        response = requests.get(url, headers=headers, timeout=20)

        if response.status_code == 200:
            file_info = response.json()
            return file_info['sha']
        elif response.status_code == 404:
            print(f"File {file_path} does not exist.")
            return None
        else:
            print(f"Error: {response.status_code}, {response.text}")
            return None

    def upload_file(self, file_path, content, sha=None):
        """
        上传文件到 GitHub 仓库
        :param file_path: 上传文件的路径（包括文件名），相对于仓库根目录
        :param content: 文件的内容（字节或字符串）
        :param sha: 文件sha，已存在的时候可以更新
        """
        # 将内容编码为 base64 格式
        if isinstance(content, str):
            content_bytes = content.encode('utf-8')
        else:
            content_bytes = content

        encoded_content = base64.b64encode(content_bytes).decode('utf-8')

        url = f"{self.api_base_url}/contents/{file_path}"
        headers = self._get_headers()

        # 数据 payload，包含文件的 base64 编码内容和提交信息
        data = {
            "message": self.upload_msg,
            "content": encoded_content,
            "sha": sha
        }

        response = requests.put(url, json=data, headers=headers, timeout=20)

        if response.status_code == 201:
            print(f"File {file_path} uploaded successfully.")
            return response.json()
        elif response.status_code == 200:
            print(f"File {file_path} updated successfully.")
            return response.json()
        else:
            print(f"Error: {response.status_code}, {response.text}")
            return None

```

后续我优化了 GitHub 中获取目录文件的逻辑，弃用了递归，直接一个接口搞定：

```python
def list_all_files_v2(self, path=''):
    """
    获取一个目录下所有文件，使用tree接口，而不是递归
    @param path:
    @return:
    """
    files = []
    url = f"https://api.github.com/repos/{self.owner}/{self.repo}/git/trees/{self.branch}?recursive=1"
    headers = {
        "Authorization": f"Bearer {self.token}",
        "Accept": "application/vnd.github.v3+json"
    }
    response = requests.get(url, headers=headers, timeout=20)
    if response.status_code == 200:
        # 解析响应
        result = response.json()
        for item in result["tree"]:
            if item["path"].startswith(path) and item["type"] == "blob":
                files.append(item["path"])
        return files
    else:
        raise Exception(
            f"Query failed with status code {response.status_code}: {response.text}")
```

### 创建同步函数

创建一个同步函数，将两个封装好的类结合起来，具体逻辑就是我的思路中提到的：

```python
def qiniu_sync_github(access_key, secret_key, bucket_name, private_domain,
                      token, owner, repo, max_num=10, msg=None):
    """
    @param access_key: 七牛密钥
    @param secret_key: 七牛密钥
    @param bucket_name: 七牛空间名，如blog-img
    @param private_domain: 七牛空间私有域名，如pic.tendcode.com
    @param token: GitHub token
    @param owner: GitHub 用户名，如Hopetree
    @param repo: GitHub 项目名，如img
    @param max_num: 每次同步的数量，如果要一次同步所以则设置大一点就行
    @param msg: GitHub 上传文件时候的 commit 信息，不填则按照默认信息
    @return:
    """
    # 返回一个字典反馈同步情况
    result = {
        'qiniu': {
            'all_total': 0,  # 七牛空间数据量，包含目录
            'total': 0,  # 七牛空间数据量，不包含目录，只算文件，真实文件数
            'need_download': 0,  # 需要下载的数量
            'download_success': 0,  # 下载成功数
            'download_failed': 0  # 下载失败数
        },
        'github': {
            'total': 0,
            'upload_success': 0,
            'upload_failed': 0
        }
    }
    # 创建 QiniuManager 对象
    qiniu_manager = QiniuManager(access_key, secret_key, bucket_name, private_domain)

    # 创建 GitHubManager 对象
    github_manager = GitHubManager(token, owner, repo, msg)

    # 1. 查询七牛空间所有文件
    qiniu_all_files = qiniu_manager.list_files()  # 这个是包含目录的数量，用来核对空间数据
    result['qiniu']['all_total'] = len(qiniu_all_files)
    qiniu_files = [file['key'] for file in qiniu_all_files if file['fsize'] > 0]  # 真实的文件数量
    result['qiniu']['total'] = len(qiniu_files)
    # print(qiniu_files)

    # 2. 查询GitHub项目中所有文件
    github_files = github_manager.list_all_files()
    result['github']['total'] = len(github_files)
    # print(github_files)

    # 3. 找出需要下载并上传的文件
    need_download_files = [file_key for file_key in qiniu_files if file_key not in github_files]
    result['qiniu']['need_download'] = len(need_download_files)
    # print(need_download_files[:10])

    # 4. 循环下载并上传
    if need_download_files:
        for file_key in need_download_files[:max_num]:
            file_content = qiniu_manager.download_file(file_key)
            if file_content:
                result['qiniu']['download_success'] += 1
                response = github_manager.upload_file(file_key, file_content)
                if response:
                    result['github']['upload_success'] += 1
                else:
                    result['github']['upload_failed'] += 1
            else:
                result['qiniu']['download_failed'] += 1
    return result

```

我在函数里面添加了一个用来统计执行结果的 `result`，方便在后续创建成定时任务的时候记录每次的执行结果。

## 本地调试

本地调试只需要传入函数中定义的信息即可，下面是调试代码和执行结果：

![调试代码和执行结果](https://cdn.jsdelivr.net/gh/Hopetree/blog-img@main/2024/202409160130132.png)

## 设置成定时任务

本地调试OK之后，就可以把这个同步代码放到定时任务中来执行，我博客自带定时任务功能，所以我直接放到了自己的博客的定时任务中，之前也分享过 Django 项目定时任务的创建，这里就简单带过不做详细介绍。

### 创建定时任务函数

将上述的同步函数导入定时任务的代码中，创建定时任务函数，暴露需要设置的参数：

```python
# name: 指定任务的名称。
# max_retries: 设置任务的最大重试次数
# default_retry_delay: 设置任务重试的默认延迟时间（单位为秒）
# retry_kwargs: 允许为重试指定额外的关键字参数
@shared_task(max_retries=2, default_retry_delay=10)
def qiniu_sync_github(access_key, secret_key, bucket_name, private_domain,
                      token, owner, repo, max_num=10, msg=None):
    """
    七牛云空间同步到GitHub，空间到项目
    @param access_key: 七牛密钥
    @param secret_key: 七牛密钥
    @param bucket_name: 七牛空间名，如blog-img
    @param private_domain: 七牛空间私有域名，如pic.tendcode.com
    @param token: GitHub token
    @param owner: GitHub 用户名，如Hopetree
    @param repo: GitHub 项目名，如img
    @param max_num: 每次同步的数量，如果要一次同步所以则设置大一点就行
    @param msg: GitHub 上传文件时候的 commit 信息，不填则按照默认信息
    @return:
    """
    response = TaskResponse()
    result = action_qiniu_sync_github(
        access_key, secret_key, bucket_name, private_domain,
        token, owner, repo, int(max_num), msg
    )
    response.data = result
    return response.as_dict()
```

### 添加定时任务

然后更新项目代码后去后台添加定时任务，开始可以设置成1分钟执行一次看一下效果，没问题之后设置成1小时执行一次就够了：

![定时任务](https://cdn.jsdelivr.net/gh/Hopetree/blog-img@main/2024/202409160050447.png)

添加定时任务参数，参数的解释可以看定时任务函数中的注释：

![定时任务参数](https://cdn.jsdelivr.net/gh/Hopetree/blog-img@main/2024/202409160051588.png)


## 同步效果

我空间里面大部分数据是本地调试的时候同步的，也就是存量数据，后续的增量数据才是定时任务来执行，GitHub 上面可以看到提交的效果：

![提交的效果](https://cdn.jsdelivr.net/gh/Hopetree/blog-img@main/2024/202409160141904.png)