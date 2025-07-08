# 来自网信办的安全巡检报告：SSL弱密码整改

今天收到了社区的工作人员的电话，并且给我发个一个网信办的通报文件以及一个关于我的个人网站存在 SSL 弱密码漏洞风险的安全检查报告，大意就是网信办通过安全漏洞扫描扫出我的个人网站存在 SSL 弱密码漏洞风险，需要处理。

## 报告内容

### 1. 安全隐患列表

| 隐患等级 | 隐患名称     | 隐患类型 | 隐患数量 |
|----------|--------------|----------|----------|
| 中危     | SSL 弱密码   | 漏洞     | 1        |


### 2. SSL 弱密码

| 隐患风险等级 | 中危                    |
|---------------|-------------------------|
| 隐患 URL       | https://tendcode.com     |
| 隐患是否验证   | 是                      |
| 隐患危害       | http 协议是使用明文进行传输的，为了提高其安全性，经常需要通过 SSL 或者 TLS 隧道传输这些明文。这里所说的弱密码，指的是加密强度不够，容易破解的加密系统。不同的加密算法具有不同的密码强度，但是在算法一定的情况下，密钥的长度越长，加密强度越高。加密强度不够，容易破解，进而获取明文数据。 |
| 修补建议       | 更改 SSL 的配置。        |

### 3. 隐患截图

![](https://cdn.jsdelivr.net/gh/Hopetree/blog-img@main/2025/202507081744160.png)


## 检查结果分析（ChatGPT）

1、已启用协议版本

- ✅ TLS 1.2：现代强加密协议，建议保留。
- ⚠️ TLS 1.1、TLS 1.0：已被 IETF 标准废弃，必须禁用。

2、加密套件分析

| 加密套件                                  | 危险等级 | 原因说明                                      |
|-------------------------------------------|----------|-----------------------------------------------|
| TLS_ECDHE_ECDSA_WITH_3DES_EDE_CBC_SHA     | ❌ 弱 (C) | 使用了 64-bit 块加密的 **3DES**，容易受到 SWEET32 攻击 |
| 其他 AES, CHACHA20, ARIA, GCM, CCM 等     | ✅ 强 (A) | 安全，现代加密算法，建议保留                          |


3、安全整改建议

- ❌ 禁用 TLS 1.0 和 TLS 1.1
- ❌ 禁用 3DES 加密套件
- ✅ 保留 TLS 1.2 及 TLS 1.3（如已启用）
- ✅ 保留 GCM、CHACHA20、AES 等现代强套件

## 整改措施

直接修改 Nginx 配置，下面是修改前的三个配置：

```nginx
ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE:ECDH:AES:HIGH:!NULL:!aNULL:!MD5:!ADH:!RC4;
ssl_protocols TLSv1 TLSv1.1 TLSv1.2;
ssl_prefer_server_ciphers on;
```

然后修改后：

```nginx
ssl_protocols TLSv1.2 TLSv1.3;
ssl_ciphers 'ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256';
ssl_prefer_server_ciphers on;
```

整改后自验证结果:

```bash
# nmap --script ssl-enum-ciphers -p 443 tendcode.com
Starting Nmap 7.95 ( https://nmap.org ) at 2025-07-08 17:52 CST
Nmap scan report for tendcode.com (114.132.91.91)
Host is up (0.0099s latency).

PORT    STATE SERVICE
443/tcp open  https
| ssl-enum-ciphers: 
|   TLSv1.2: 
|     ciphers: 
|       TLS_ECDHE_ECDSA_WITH_AES_256_GCM_SHA384 (ecdh_x25519) - A
|       TLS_ECDHE_ECDSA_WITH_CHACHA20_POLY1305_SHA256 (ecdh_x25519) - A
|       TLS_ECDHE_ECDSA_WITH_AES_128_GCM_SHA256 (ecdh_x25519) - A
|     compressors: 
|       NULL
|     cipher preference: server
|_  least strength: A

Nmap done: 1 IP address (1 host up) scanned in 3.21 seconds
```

## 后续

整改之后，填写了一份事件说明的文件给了社区工作人员。

同时，为了个人网站能活着，我关闭了网站的注册入口，因为按照网信办的要求，个人网站是不允许有用户注册功能的。