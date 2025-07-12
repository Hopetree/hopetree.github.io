# Nginx Proxy Manager：Docker环境下反向代理的绝佳选择

在使用Docker构建多服务架构时，管理众多服务端口常常让人头疼。每个容器都有自己的端口，而直接暴露这些端口不仅可能导致端口冲突，还会增加配置复杂性和安全风险。幸运的是，Nginx Proxy Manager（NPM）为我们提供了一个优雅的解决方案。今天，我将分享Nginx Proxy Manager的主要功能，尤其是它在Docker环境中的强大优势。

我自己的服务器上面经常会跑很多 docker 服务，所以经常需要添加一些反向代理使用域名访问服务，虽然 Nginx 配置就能搞定，但是服务多了就有点乱，而且每次都要去添加配置属实有点麻烦，而 Nginx Proxy Manager 就是解决这个问题的。

![](https://cdn.jsdelivr.net/gh/Hopetree/blog-img@main/2025/202507101038473.png)

## Nginx Proxy Manager简介

Nginx Proxy Manager 是一个基于Nginx的可视化管理工具，旨在简化反向代理的配置和管理。它允许用户通过一个直观的Web界面轻松设置反向代理规则，而无需手动编辑Nginx配置文件。这对于Docker用户来说尤其有用，因为我们可以将所有容器的服务通过一个统一的入口进行管理，而无需担心端口冲突或复杂的网络配置。


## 主要功能介绍

### 1. 反向代理管理（Proxy Hosts）

Nginx Proxy Manager的核心功能是反向代理管理，通过`Proxy Hosts`模块，我们可以轻松配置和管理代理主机。以下是`Proxy Hosts`中一些重要的配置项：

#### 1.1 **代理主机域名（Domain Names）**
   - 这是用户访问服务时使用的域名或路径。你可以指定一个或多个域名，例如`example.com`或`api.example.com`。
   - 如果你没有域名，也可以使用IP地址或路径（如`http://<your-server-ip>/example`）。

#### 1.2. **目标地址（Forward Hostname / IP）**
   - 这是目标服务的地址，通常是Docker容器的IP地址或主机名。
   - 例如，如果你的服务运行在Docker容器中，监听在`localhost:8080`，则目标地址为`http://localhost:8080`。

#### 1.3. **目标端口（Forward Port）**
   - 这是目标服务的端口号。例如，如果你的服务运行在`localhost:8080`，则目标端口为`8080`。

#### 1.4. **SSL证书管理（SSL/TLS）**
   - Nginx Proxy Manager支持自动申请和续期Let's Encrypt证书。
   - 你也可以上传自定义的SSL证书和私钥。
   - 通过启用SSL，可以为代理主机启用HTTPS，确保流量的安全。

#### 1.5. **访问控制（Access List）**
   - 你可以为每个代理主机设置访问控制，限制特定IP地址或IP范围的访问。
   - 这有助于提高服务的安全性，防止未经授权的访问。

#### 1.6. **WebSockets支持**
   - 如果你的服务需要支持WebSockets（例如实时聊天应用），可以在配置中启用WebSockets支持。

#### 1.7. **高级配置（Advanced Configuration）**
   - Nginx Proxy Manager允许你在代理主机配置中添加自定义的Nginx配置指令。
   - 这为需要特殊配置的用户提供了灵活性。

### 2. SSL证书管理（SSL Certificates）

Nginx Proxy Manager内置了SSL证书管理功能，支持以下操作：

#### 2.1. **自动申请Let's Encrypt证书**
   - Nginx Proxy Manager可以自动申请和续期Let's Encrypt证书。
   - 只需在代理主机配置中启用SSL并选择自动申请证书，NPM会自动完成证书申请和续期。

#### 2.2. **上传自定义证书**
   - 如果你有自己的SSL证书和私钥，可以将它们上传到Nginx Proxy Manager中。
   - 这些证书可以用于代理主机，确保流量的安全。

#### 2.3. **证书管理界面**
   - Nginx Proxy Manager提供了一个清晰的证书管理界面，你可以查看、更新或删除证书。

### 3. 上游服务管理（Upstream Services）

Nginx Proxy Manager允许你管理上游服务，即目标服务的配置。你可以在这里：

#### 3.1. **添加或编辑上游服务**
   - 你可以为每个代理主机配置多个上游服务，实现负载均衡。
   - 例如，如果你有多个相同的容器运行在不同的端口上，可以通过配置多个上游服务来分发流量。

#### 3.2. **健康检查**
   - Nginx Proxy Manager支持对上游服务进行健康检查，确保流量只发送到健康的实例。

### 4. 其他功能

#### 4.1. **全局设置（Global Settings）**
   - Nginx Proxy Manager允许你配置全局设置，例如默认的SSL证书、日志级别等。

#### 4.2. **用户管理（User Management）**
   - 如果你希望限制对Nginx Proxy Manager管理界面的访问，可以启用用户认证，设置管理员和普通用户。

## 总结

Nginx Proxy Manager 的使用场景是管理反向代理，特别是服务比较多的情况下，那就不得不提到 NAS 环境了，使用过 NAS 的应该都知道，NAS 的可玩性主要就是 docker 功能，大部分工具和服务都是基于 docker 运行的，所有都是使用 IP 和端口访问，此时 Nginx Proxy Manager 管理端口的能力就可以充分体现。