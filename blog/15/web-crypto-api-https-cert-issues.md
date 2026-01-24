# 解决 Web Crypto API 加密报错及 HTTPS 证书信任问题

在本地开发环境中，我们经常需要使用 HTTPS 来模拟真实生产环境，特别是当项目依赖 Web Crypto API 等必须在安全上下文（Secure Context）下运行的浏览器特性时。本文将记录如何解决 Chrome 浏览器中遇到的 `TypeError: Cannot read properties of undefined (reading 'importKey')` 报错，并通过生成包含 SAN 字段的自签名证书及 Nginx 配置，彻底消除浏览器的“不安全”警告。

## 背景

在通过 Chrome 浏览器访问本地开发环境（如 `https://dev.home.local`）时，我们可能会遇到以下阻碍：

- **技术报错**：尝试调用 `window.crypto.subtle` 相关 API 时，控制台抛出 `TypeError: Cannot read properties of undefined (reading 'importKey')`。
- **浏览器警告**：地址栏显示红色的“不安全”提示，且浏览器拒绝执行保存密码等敏感操作。

这些问题会导致本地开发体验与线上环境严重脱节，甚至无法调试核心加密功能。

## 问题/目标

核心问题主要源于两点：

1.  **安全上下文限制**
	- 现代浏览器的 **Web Crypto API** 必须在**安全上下文**（HTTPS 或 localhost）中运行。
	- 如果 HTTPS 证书不被信任，浏览器会将当前页面标记为不安全，从而禁用 `crypto.subtle` 等敏感接口。

2.  **证书标准缺失**
	- 旧式的自签名证书往往只包含 `Common Name (CN)`。
	- 现代浏览器（如 Chrome 58+）强制要求证书必须包含 **`Subject Alternative Name (SAN)`** 字段，否则会报 `NET::ERR_CERT_COMMON_NAME_INVALID` 错误。

本文的目标是：生成一份符合现代标准的自签名证书，配置 Nginx 服务，并在 macOS 系统层面信任该证书，从而恢复 Web Crypto API 的功能并消除浏览器警告。

## 方案设计

解决路径分为三步：

1.  **生成标准证书**
	- 创建包含 SAN 扩展定义的 OpenSSL 配置文件。
	- 使用 OpenSSL 生成自签名证书文件（`.crt` 和 `.key`）。

2.  **配置 Web 服务**
	- 在 Nginx 中配置 HTTPS 监听，并加载生成的证书文件。

3.  **系统级信任**
	- 将证书导入 macOS 钥匙串（Keychain Access）。
	- 设置该证书为“始终信任”，使浏览器认可该站点的安全性。

## 实现细节 / 实战示例

以下操作均在 macOS 终端环境下执行，假设我们的本地域名为 `dev.home.local`。

### 1. 生成包含 SAN 的证书配置文件

首先创建一个 OpenSSL 配置文件 `single_domain.cnf`，重点在于 `[alt_names]` 模块，它定义了 SAN 字段。

```bash
cat > single_domain.cnf <<EOF
[req]
distinguished_name = req_distinguished_name
req_extensions = v3_req
prompt = no

[req_distinguished_name]
C = CN
ST = State
L = City
O = xdevops
OU = xdevops
CN = dev.home.local

[v3_req]
keyUsage = keyEncipherment, dataEncipherment, digitalSignature
extendedKeyUsage = serverAuth
subjectAltName = @alt_names

[alt_names]
DNS.1 = dev.home.local
EOF
```

### 2. 使用 OpenSSL 生成证书

使用上述配置文件，生成有效期为 10 年（3650 天）的证书。

```bash
openssl req -x509 -nodes -days 3650 -newkey rsa:2048 \
  -keyout server.key \
  -out server.crt \
  -config single_domain.cnf \
  -extensions v3_req
```

执行后，当前目录下会生成两个关键文件：
- `server.key`: 私钥文件
- `server.crt`: 证书文件

### 3. 配置 Nginx

生成证书后，需要让 Nginx 使用它们。编辑你的 Nginx 配置文件（通常位于 `/usr/local/etc/nginx/nginx.conf` 或 `/etc/nginx/conf.d/` 下），添加 HTTPS 监听配置。

```nginx
server {
    listen 443 ssl;
    server_name dev.home.local;

    # SSL 证书路径配置
    ssl_certificate     /path/to/your/server.crt;
    ssl_certificate_key /path/to/your/server.key;

    # 推荐的 SSL 协议和加密套件配置（可选）
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    location / {
        root   /var/www/html;
        index  index.html index.htm;
        # 或者反向代理到你的本地服务端口
        # proxy_pass http://127.0.0.1:8080;
    }
}

# 可选：将 HTTP 流量重定向到 HTTPS
server {
    listen 80;
    server_name dev.home.local;
    return 301 https://$host$request_uri;
}
```

配置完成后，记得测试并重载 Nginx：

```bash
sudo nginx -t
sudo nginx -s reload
```

### 4. 在 macOS 中配置系统级信任

此时访问 `https://dev.home.local`，浏览器依然会提示不安全，因为系统尚未信任这个自签名证书。我们需要手动将其加入信任列表。

1.  **清理旧证书**
	- 打开 **“钥匙串访问” (Keychain Access)**。
	- 搜索并删除之前所有名为 `dev.home.local` 的旧证书，以免混淆。

2.  **导入新证书**
	- 在终端中执行 `open server.crt`，或者直接将文件拖入“钥匙串访问”的 **“登录”** 分类中。

3.  **设置始终信任**
	- 在钥匙串列表中找到刚才导入的证书。
	- 双击证书，展开 **“信任” (Trust)** 选项卡。
	- 将 **“使用此证书时” (When using this certificate)** 修改为 **“始终信任” (Always Trust)**。
	- 关闭窗口，系统会提示输入开机密码进行确认。

### 5. 验证结果

1.  **重启浏览器**：为了确保缓存清除，建议彻底关闭 Chrome (`Command + Q`) 后重新打开。
2.  **检查地址栏**：再次访问 `https://dev.home.local`，地址栏的小锁头图标应变为灰色或黑色（表示安全），且无红色警告。
3.  **检查 API 状态**：打开开发者工具 (`F12`)，在 Console 中输入：
    ```javascript
    window.isSecureContext
    ```
    应返回 `true`。此时再次测试你的业务代码，`window.crypto.subtle.importKey` 等 API 应当可以正常调用。

## 总结 / 反思

本地开发环境的安全配置往往容易被忽视，但随着 Web 平台对安全性的要求越来越高（如 Secure Context 的强制推行），HTTP 环境下的功能受限会越来越多。

解决这个问题的关键在于：

1.  **理解规则**：明确 Web Crypto API 等特性对 HTTPS 的强依赖。
2.  **遵循标准**：使用包含 SAN 字段的现代证书，而不是仅依赖 Common Name。
3.  **完整链路**：从证书生成、Web Server 配置到客户端信任，缺一不可。

通过建立一套标准化的本地证书生成流程，我们可以确保开发环境与生产环境的一致性，避免因环境差异带来的调试黑洞。