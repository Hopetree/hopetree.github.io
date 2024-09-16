# 使用curl命令获取请求接口每个阶段的耗时

最近客户这边的项目有个非常奇怪的网络问题，就是同样是请求一个内网的IP服务，从内网访问的话就很快，请求的耗时跟服务器的处理时间几乎是一样的，但是从“外网”访问，就发现请求耗时非常的长，比如内网是0.3秒，“外网”则需要3秒都不止。因此，我们需要协助客户定位出内外网之间的差异到底差在哪里。

## 方案

这里提供了一个方案，就是利用curl命令的内置返回宏定义，可以显示出一个请求在每个阶段的耗时，这样就可以大致知道外网访问内网服务的时候到底是哪个环节慢。

### 创建格式化文件

`curl`命令的 `-w` 参数可以显示一些请求的结果，为了方便调整显示的内容，也避免请求命令过于长，可以创建一个显示格式的文件fmt.txt，内容如下：

```text
\n
Response Time for: %{url_effective}\n\n
DNS Lookup Time:\t\t%{time_namelookup}s\n
Redirection Time:\t\t%{time_redirect}s\n
Connection Time:\t\t%{time_connect}s\n
App Connection Time:\t\t%{time_appconnect}s\n
Pre-transfer Time:\t\t%{time_pretransfer}s\n
Start-transfer Time:\t\t%{time_starttransfer}s\n\n
Total Time:\t\t\t%{time_total}s\n\n
Download Speed:\t\t\t%{speed_download} B/s\n
Download Size:\t\t\t%{size_download} bytes\n
```
这个只需要在`curl`命令中加入`-w @fmt.txt`就可以打印上面定义好的内容。

### 参数的含义

这个格式输出文件中的输出含义如下：

- `url_effective`： 执行完地址重定向之后的最终 URL；
- `time_namelookup`：DNS 服务器解析域名的时间，单位秒;
- `time_redirect`：重定向时间，包括到最后一次传输前的几次重定向的DNS解析，连接，预传输，传输时间，单位秒;
- `time_connect`：连接时间，从开始到建立TCP连接完成所用时间，包括前边DNS解析时间，如果需要单纯的得到连接时间，用这个time_connect时间减去前边time_namelookup时间。下面同理。
- `time_appconnect `：连接建立完成时间，如SSL/SSH等建立连接或者完成三次握手时间。
- `time_pretransfer`：从开始到准备传输的时间.
- `time_starttransfer`：开始传输时间。在client发出请求之后，Web 服务器返回数据的第一个字节所用的时间
- `time_total`：总时间，按秒计。精确到小数点后三位。
- `speed_download`：下载速度，单位字节/每秒。
- `size_download `：下载大小，单位字节。

### 请求命令

适用于Linux和Mac系统的命令：

```bash
curl -s -w @fmt.txt -o /dev/null \
-H "host: cmdb_resource.easyops-only.com" \
-H "Content-Type: application/json" \
-H "user: user" \
-H "org: org" \
-d "{}" \
http://10.200.88.201/object/_ITSC_FORM_VERSION/instance/_search
```

在Windows下面的命令：

```powershell
curl -s -w @fmt.txt -o NUL ^
-H "host: cmdb_resource.easyops-only.com" ^
-H "Content-Type: application/json" ^
-H "user: user" ^
-H "org: org" ^
-d "{}" ^
http://10.200.88.201/object/_ITSC_FORM_VERSION/instance/_search
```

命令参数的作用：

- `-s`：静默模式，不输出连接速度等信息。
- `-o`：将请求输出重定向到文件，Linux系统重定向到 /dev/null 或者 Windows 系统重定向到 NUL 都是表示不丢弃掉

### 请求和输出

下面这个是在Linux下面的请求输出，其他系统的输出也是一样的。

```bash
[root@home-203 tmp]# curl -s -w @fmt.txt -o /dev/null \
> -H "host: cmdb_resource.easyops-only.com" \
> -H "Content-Type: application/json" \
> -H "user: user" \
> -H "org: org" \
> -d "{}" \
> http://10.200.88.201/object/_ITSC_FORM_VERSION/instance/_search

Response Time for: http://10.200.88.201/object/_ITSC_FORM_VERSION/instance/_search

DNS Lookup Time:                0.000s
Redirection Time:               0.000s
Connection Time:                0.387s
App Connection Time:            0.000s
Pre-transfer Time:              0.388s
Start-transfer Time:            0.397s

Total Time:                     0.401s

Download Speed:                 855920.000 B/s
Download Size:                  343599 bytes
```

## 参考文章

- [使用curl命令测试延时](https://www.jianshu.com/p/759a15683b0b "使用curl命令测试延时")
- [curl语法整理](https://blog.csdn.net/lydms/article/details/127655845 "curl语法整理")