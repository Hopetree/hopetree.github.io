# [ChatGPT解决方案]生成 nginx 自签名证书

经常在内部环境需要将网站配置成 https，于是就有了一个需求：创建一个不会过期的 ngxix 自签名证书。于是就向 ChatGPT 提出了这个需求，得到了想要的解决方案。

## 脚本生成自签名证书

> 写一个shell脚本，读取配置文件中的参数，生成自签名证书，证书可以给nginx使用

您好，下面是一个示例 shell 脚本，它可以读取配置文件中的参数并生成自签名证书。配置文件的格式为 key=value，其中 key 为参数名，value 为参数值。证书文件将保存在当前目录的 certs 目录中。

```bash
#!/bin/bash

# 读取配置文件
if [ -f "./config" ]; then
  source ./config
else
  echo "配置文件 config 不存在！"
  exit 1
fi

# 生成证书文件
mkdir -p certs
openssl req -newkey rsa:2048 -nodes -keyout certs/server.key -x509 -days 3650 -out certs/server.crt -subj "/C=$country/ST=$state/L=$locality/O=$organization/OU=$organizational_unit/CN=$common_name"

```

在使用该脚本之前，您需要创建一个名为 config 的配置文件，并在其中设置所需的参数值。例如，您可以创建一个如下所示的配置文件：

```bash
country="US"
state="California"
locality="Mountain View"
organization="Acme Inc."
organizational_unit="IT"
common_name="acme.com"

```

为了使用该脚本，请在终端中运行以下命令：

```bash
./generate_certificate.sh

```

如果一切正常，您应该会看到类似于下面的输出：

```bash
Generating a 2048 bit RSA private key
......+++++
..................................................+++++
writing new private key to 'certs/server.key'
-----
```

如果配置文件不存在，您应该会看到类似于下面的错误消息：

```bash
配置文件 config 不存在！
```

## 生成https配置，直接IP访问

> 生成一个nginx 配置https的配置，但是不要域名，直接使用ip访问

您可以通过下面的配置来实现使用IP地址访问的HTTPS服务：

```bash
server {
    listen 443 ssl;
    listen [::]:443 ssl;
    server_name _;  # 忽略域名
    ssl_certificate /path/to/your/certificate.crt;
    ssl_certificate_key /path/to/your/private.key;
    ssl_protocols TLSv1.2;
    ssl_ciphers HIGH:!aNULL:!MD5;

    root /path/to/your/website/root;
    index index.html index.htm;

    location / {
        try_files $uri $uri/ =404;
    }
}

```

其中，ssl_certificate 和 ssl_certificate_key 分别指定了证书文件和私钥文件的路径。您需要确保这两个文件存在且可读。

另外，请注意，在上面的配置中，服务监听的是IPv4和IPv6地址上的443端口。如果您想要监听其他端口，请修改listen语句。

最后，根目录的路径可以根据您的实际情况来设置。

希望以上信息能够帮助您。