# Nginx配置中server模块的加载顺序和规则

在Nginx的日常运维中，经常会有多个配置，多个server的情况，之前的文章分享了Nginx配置中location模块的匹配规则，这篇文章就来分享一下我对server模块的匹配规则的理解，并进行一些测试验证这些结论。

## 配置文件加载的顺序


### 常用的配置文件

我们对于Nginx配置文件的认知比较常用的其实就是两种文件，第一个文件是 nginx.conf 文件，也就是Nginx在启动的时候默认读取的文件，第二种配置文件是conf.d目录下面定义的一些xxx.conf配置文件。

Nginx之所以会加载 conf.d下面的配置文件，是因为在nginx.conf里面定义了 include 属性，也就是加载额外的文件，这是一个默认的nginx.conf文件的配置，在http里面最后就是定义了加载`/etc/nginx/conf.d/*.conf`。

```nginx
user  nginx;
worker_processes  auto;

error_log  /var/log/nginx/error.log notice;
pid        /var/run/nginx.pid;


events {
    worker_connections  1024;
}


http {
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;

    log_format  main  '$remote_addr - $remote_user [$time_local] "$request" '
                      '$status $body_bytes_sent "$http_referer" '
                      '"$http_user_agent" "$http_x_forwarded_for"';

    access_log  /var/log/nginx/access.log  main;

    sendfile        on;
    #tcp_nopush     on;

    keepalive_timeout  65;

    #gzip  on;

    include /etc/nginx/conf.d/*.conf;
}
```

### 文件加载顺序

首先，Nginx的配置模块在http和server里面都是可以使用include语法来加载额外的配置文件的，所以这里是一个递归加载。

如果conf.d目录下面有多个conf文件，加载的顺序又是怎样的呢？

首先说一下结论：Nginx加载配置文件会按照文件的命名排序进行加载，也就说a.conf会比b.conf先加载，然后将所有配置文件合并成一个文件。

可以用命令来查看和验证这个结论，直接执行`/usr/sbin/nginx -T`命令就可以查看到Nginx加载配置文件的顺序，并且能显示每个文件的内容，此时可以只显示加载的文件的名称来查看具体的加载顺序，执行命令`/usr/sbin/nginx -T|grep "# configuration file"`：

```bash
[root@home-203 ~]# /usr/sbin/nginx -T|grep "# configuration file"
nginx: [warn] conflicting server name "a.com" on 0.0.0.0:12080, ignored
nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
nginx: configuration file /etc/nginx/nginx.conf test is successful
# configuration file /etc/nginx/nginx.conf:
# configuration file /etc/nginx/mime.types:
# configuration file /etc/nginx/conf.d/easyops.conf:
# configuration file /etc/nginx/conf.d/exsi.conf:
# configuration file /etc/nginx/conf.d/nas9527.conf:
# configuration file /etc/nginx/conf.d/test.conf:
```

## server匹配的规则

### server_name 匹配模式

`server_name`是Nginx配置中用于指定虚拟主机（server）所响应的域名或IP地址的指令。`server_name`支持多种格式。

#### 1. 精确匹配

指定一个确切的域名或IP地址，只有请求的域名或IP地址与之完全匹配时，虚拟主机才会生效。

```nginx
server_name example.com;
```

精确域名匹配还可以同时设置多个域名作为匹配项：

```nginx
server_name example.com example2.com exampl3.com;
```

#### 2. 通配符前缀匹配

使用通配符`*`表示匹配任意字符。例如，`*.example.com`匹配所有以`.example.com`结尾的域名。

```nginx
server_name *.example.com;
```

#### 3. 通配符后缀匹配

使用通配符`*`表示匹配任意字符。例如，`subdomain.*`匹配所有以`subdomain.`开头的域名。

```nginx
server_name subdomain.*;
```

#### 4. 正则表达式匹配

使用正则表达式进行更灵活的匹配。以`~`开头表示区分大小写的正则表达式匹配，而以`~*`开头表示不区分大小写的正则表达式匹配。

```nginx
server_name ~^sub\d+\.example\.com$;
```

   这个例子会匹配诸如 `sub123.example.com`、`sub456.example.com` 等域名。

#### 5. 空值匹配

如果`server_name`为空，表示不匹配任何域名。

```nginx
server_name "";
```

这些是`server_name`指令的几种常见格式。

server的匹配没有优先级之分，按照配置的加载顺序，只要匹配就返回。

### 总结

根据Nginx的文档，还有一些网上资料，我画了一个自己理解的匹配规则的流程图：

![Nginx配置server匹配规则](https://cdn.jsdelivr.net/gh/Hopetree/blog-img@main/2023/12/Nginx%E5%8C%B9%E9%85%8Dserver%E8%A7%84%E5%88%99.png "Nginx配置server匹配规则")

**我的结论：**

- Nginx收到一个请求的时候先查找监听了该端口的server，如果没有任何server监听请求端口则直接拒绝请求
- 如果监听该端口的server有多个，则取决于请求头的Host与哪个server的域名（server_name）匹配
- 如果没有匹配的server_name，则将请求交给监听该端口的默认的server处理，而这个“默认”的server可以使用default_server 属性进行指定，否则第一个监听该端口的server就是默认的。
- 如果匹配到多个server的server_name和监听端口相同，则按照server的加载先后顺序生效，先匹配的先生效。

## 参考文章

- [Nginx配置中没有server_name会怎样？](https://blog.csdn.net/qq_35952638/article/details/100163824 "Nginx配置中没有server_name会怎样？")
- [实际操作解决自己对nginx的listen和server_name以及dns的疑惑](https://blog.csdn.net/yin18827152962/article/details/122551492 "【实际操作解决自己对nginx的listen和server_name以及dns的疑惑】")