# [ChatGPT解决方案]获取 nginx 日志中请求 IP 统计数，设置 IP 流量限制

今天在查看服务器日志的时候无意间发现我 nginx 的日志文件有一天很大，于是猜测应该是有人在用脚本请求平台，进行想看看到底是个什么情况，所以有了这篇与 ChatGPT 的聊天记录。

## 统计 nginx 日志中IP请求数

发现 nginx 请求异常的时候可以统计一下 IP 请求数，看看是否有频繁发请求的 IP，如果明显不是正常请求，可以进一步看看到底在请求什么内容。

### 统计 IP 访问 top50

> 提问：给我一条linux命令，查询nginx日志里面访问IP的统计，统计IP访问的数量，按照访问数量高到低排序，显示前50个IP

您可以使用以下Linux命令来查询Nginx日志中访问IP的统计，并按照访问数量高到低排序，显示前50个IP：

```shell
awk '{print $1}' /path/to/nginx/access.log | sort | uniq -c | sort -nr | head -n 50
```

请将 `/path/to/nginx/access.log` 替换为实际的Nginx访问日志文件路径。这条命令的解释如下：

1. `awk '{print $1}'`：使用`awk`命令提取每行日志中的第一个字段（IP地址）。
2. `sort`：将提取的IP地址进行排序。
3. `uniq -c`：统计每个唯一的IP地址出现的次数，并在前面显示计数。
4. `sort -nr`：按照计数值进行逆序排序，从高到低排列。
5. `head -n 50`：只显示前50行结果，即前50个IP地址。

运行该命令后，您将得到一个按访问数量排序的IP地址列表，显示了每个IP地址在访问日志中出现的次数。注意，您需要替换日志文件路径以正确指向Nginx访问日志文件。

### 统计压缩日志文件

> 提问：如果是压缩的日志呢，.gz的

如果您的Nginx日志是以`.gz`压缩的格式，您可以使用`zcat`命令来解压缩并读取日志文件，然后再执行之前提供的统计命令。以下是修改后的命令：

```shell
zcat /path/to/nginx/access.log.gz | awk '{print $1}' | sort | uniq -c | sort -nr | head -n 50
```

这个命令会先使用`zcat`命令解压缩`access.log.gz`文件，并将解压后的内容通过管道传递给后续的命令。然后，它会执行与之前相同的步骤，即提取IP地址、排序、统计和显示前50个IP地址。

请确保将`/path/to/nginx/access.log.gz`替换为实际的压缩日志文件路径。

运行该命令后，您将得到按访问数量排序的IP地址列表，显示了每个IP地址在解压缩后的访问日志中出现的次数。

### 循环统计多个压缩文件

> 提问：给我循环查看多个压缩文件的日志并循环输出每个文件的统计数据

要循环查看多个压缩文件的日志并输出每个文件的统计数据，您可以使用一个简单的Shell脚本来实现。以下是一个示例脚本：

```shell
#!/bin/bash

log_files=(
  "/path/to/nginx/access.log.gz"
  "/path/to/nginx/access2.log.gz"
  "/path/to/nginx/access3.log.gz"
)

for log_file in "${log_files[@]}"
do
  echo "Log file: $log_file"
  echo "------------------------"

  zcat "$log_file" | awk '{print $1}' | sort | uniq -c | sort -nr | head -n 50

  echo
done
```

在上面的示例中，您需要将`/path/to/nginx/access.log.gz`、`/path/to/nginx/access2.log.gz`等替换为实际的压缩日志文件路径。您可以按需添加或修改`log_files`数组来包含您想要处理的所有压缩日志文件路径。

脚本会循环遍历每个日志文件，并在每次迭代中打印文件路径。然后，它会使用`zcat`命令解压缩日志文件并将内容通过管道传递给后续的命令，执行与之前提供的统计命令相同的步骤。最后，它会输出当前文件的统计数据并进行换行。

运行该脚本后，您将逐个处理每个压缩日志文件，并输出每个文件的统计数据。

### 补充需求

> 提问：我的文件都是/var/log/nginx/access.log-20230612.gz格式的，其中最后的是从12-21，请修改脚本

如果您的Nginx日志文件命名格式为`/var/log/nginx/access.log-20230612.gz`这种形式，其中日期部分的格式为年月日（如`20230612`），您可以使用以下修改后的脚本来循环处理这些日志文件：

```shell
#!/bin/bash

log_folder="/var/log/nginx"
start_date="20230612"
end_date="20230621"

current_date="$start_date"
while [[ "$current_date" -le "$end_date" ]]
do
  log_file="$log_folder/access.log-$current_date.gz"
  
  if [[ -f "$log_file" ]]
  then
    echo "Log file: $log_file"
    echo "------------------------"

    zcat "$log_file" | awk '{print $1}' | sort | uniq -c | sort -nr | head -n 50

    echo
  fi
  
  current_date=$(date -d "$current_date + 1 day" +%Y%m%d)
done
```

在上述脚本中，我们指定了日志文件所在的文件夹路径`log_folder`，以及要处理的日志的开始日期`start_date`和结束日期`end_date`。

脚本会使用`while`循环从开始日期迭代到结束日期，根据日期构建每个日志文件的路径。然后，它会检查文件是否存在，如果存在，则执行与之前相同的统计命令来处理该日志文件。最后，它会输出当前文件的统计数据并进行换行。

请确保在脚本中设置正确的日志文件夹路径以及开始和结束日期。运行该脚本后，将循环处理指定日期范围内的所有日志文件，并输出每个文件的统计数据。

### 验证效果

我将top50改成了top5的执行效果，非常满意！！！

```shell
[root@hopetree conf.d]# sh ~/nginx_ip.sh 
Log file: /var/log/nginx/access.log-20230612.gz
------------------------
   9020 125.69.36.168
   4525 219.77.125.83
    672 54.190.69.239
    402 221.1.238.147
    385 42.3.35.84

Log file: /var/log/nginx/access.log-20230613.gz
------------------------
   2088 125.69.36.248
    294 116.31.233.214
    180 120.41.173.104
    121 223.104.20.221
     90 157.122.14.2

Log file: /var/log/nginx/access.log-20230614.gz
------------------------
   2182 125.69.36.248
    922 221.1.238.147
    392 110.92.64.232
    191 219.77.125.83
    130 116.31.233.214

...
```

## nginx 配置流量限制

> 提问：nginx怎么做ip限制，就是当发现某些IP访问的次数很高的时候自动限制访问

要在Nginx中实现IP限制，可以使用Nginx的`limit_req`模块和`limit_conn`模块。这些模块允许您限制来自特定IP地址的请求速率和连接数。下面是一种基本的配置方法：

1. 限制请求速率：使用`limit_req`模块可以限制来自某个IP地址的请求速率。您可以设置每个IP地址允许的请求速率和请求的限制区间。例如，以下配置将限制每个IP地址在10秒内最多只能发送10个请求：

```nginx
http {
    limit_req_zone $binary_remote_addr zone=limit_per_ip:10m rate=10r/s;
    
    server {
        ...
        
        location / {
            limit_req zone=limit_per_ip burst=5;
            ...
        }
    }
}
```

上述配置中，`limit_req_zone`指令用于定义一个名为`limit_per_ip`的限制区域，该区域用于存储每个IP地址的请求信息。`rate=10r/s`表示每秒允许的请求速率为10个。

在`location`块中，`limit_req`指令将请求限制应用于该特定的位置。`burst=5`表示如果超过请求速率，最多允许5个请求进行“爆发”，即超过速率后的一段时间内仍然处理。

2. 限制连接数：使用`limit_conn`模块可以限制来自某个IP地址的连接数。您可以设置每个IP地址允许的最大连接数。以下是一个示例配置，限制每个IP地址最多允许同时2个连接：

```nginx
http {
    limit_conn_zone $binary_remote_addr zone=limit_conn_per_ip:10m;
    
    server {
        ...
        
        location / {
            limit_conn limit_conn_per_ip 2;
            ...
        }
    }
}
```

上述配置中，`limit_conn_zone`指令用于定义一个名为`limit_conn_per_ip`的连接限制区域，该区域用于存储每个IP地址的连接信息。

在`location`块中，`limit_conn`指令将连接数限制应用于该特定的位置。`2`表示每个IP地址最多允许2个并发连接。

请注意，以上配置仅为示例，您可以根据实际需求调整参数值和限制条件。

将上述配置添加到您的Nginx配置文件中，并重新加载Nginx以使更改生效。这样，Nginx将根据配置限制来自特定IP地址的请求速率和连接数。请注意，这些限制仅适用于Nginx服务器层面，对于较复杂的限制需求，可能需要借助其他工具或组件来实现更高级的防护策略。


### 实际配置

参考 ChatGPT 提供的访问，直接到 nginx 配置文件中进行设置：

```nginx
# 并发限制
limit_conn_zone $binary_remote_addr zone=limit_conn_per_ip:50m;
# 请求量限制
limit_req_zone $binary_remote_addr zone=limit_req_per_ip:50m rate=5r/s;

server {
    location / {
        # 限制连接数为2
        limit_conn limit_conn_per_ip 5;
        #limit_req zone=limit_req_per_ip burst=5;
		...
    }
```

我这里是设置限制连接为5

### 实际效果验证

使用 python 写一个并发请求的测试脚本（该脚本为  ChatGPT 提供，作了一点点改动），验证一下效果如何：

```python
import requests
import concurrent.futures

# 定义要测试的接口
url = "https://example.com/api"  # 替换成你要测试的接口URL


# 发送请求的函数
def send_request(url):
    resp = requests.get(url)
    return resp.status_code


# 设置并发请求数量
concurrent_requests = 20  # 替换成你想要的并发请求数量

# 使用线程池执行并发请求
with concurrent.futures.ThreadPoolExecutor() as executor:
    # 提交并发请求任务
    futures = [executor.submit(send_request, url) for _ in range(concurrent_requests)]

    # 获取响应结果
    for future in concurrent.futures.as_completed(futures):
        response = future.result()
        print(response)  # 在这里处理响应数据，可以根据需求进行断言、统计等操作

```

执行脚本会打印每次请求的响应码，200就是正常，来看看执行的结果吧，还是很符合预期的

```shell
503
503
503
503
503
503
503
503
503
503
503
503
200
503
503
200
200
200
200
200
```

### 总结

nginx 的内置的配置可以做一些基本的流量限制，但是实际上在企业的项目里面，由于场景比较复杂，很多时候都是要做到“既要……又要……”，于是限制的手段也非常复杂。但是简单的个人网站，使用 nginx 自带的配置就可以进行一些基本限流，如果再结合防火墙，岂不是妥妥的。

## 参考文章

- [【知乎】Nginx如何实现并发连接与IP流量限速功能](https://zhuanlan.zhihu.com/p/553313271 "Nginx如何实现并发连接与IP流量限速功能")