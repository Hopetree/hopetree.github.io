# 使用 Docker 搭建个人私有化 Git 服务：Gitea + SSH 配置实践

本文介绍了如何使用 Docker 搭建轻量级的私有 Git 服务 Gitea，适合个人或小团队使用。内容涵盖 Gitea 的资源优势、容器化部署步骤、端口映射与数据挂载方法，并重点讲解了 SSH 配置中的常见问题及解决方案，确保 clone 和 push 操作顺畅。适合对代码托管安全性和资源控制有较高要求的开发者参考。

## 一、为什么选择私有化 Git？

在日常开发中，使用 GitHub、Gitee 等平台虽然便捷，但也有以下局限：

- 代码隐私无法保障，尤其在内网环境或私密项目中
- 对第三方平台的依赖强，稳定性和政策风险不可控
- 多数平台对私有仓库数量、协作人数存在限制

因此，选择一个轻量级的私有 Git 服务，搭建在本地或私有云上，是一种更灵活、安全的方式。

## 二、选择 Gitea 的原因

Gitea 是一个开源的、自托管的 Git 服务平台，拥有以下优点：

### 1. 极轻量资源占用

| 项目  | 占用情况           |
| --- | -------------- |
| 内存  | \~60MB 空闲启动    |
| CPU | 几乎为零，除非大规模并发   |
| 存储  | 主要占用仓库与日志，按需扩展 |

相比 GitLab（动辄几百 MB 内存起步），Gitea 更适合个人或小团队部署。

### 2. 功能覆盖完整

- 支持代码仓库管理、Pull Request、Issue、Wiki、CI/CD（集成 Drone）
- 支持 SSH 和 HTTPS 两种 clone/push 模式
- 提供 API 和 Webhooks，便于与其他系统集成

## 三、Docker Compose 部署 Gitea

容器化部署直接使用官方给的文件就行，按需自行修改：[https://docs.gitea.com/zh-cn/installation/install-with-docker](https://docs.gitea.com/zh-cn/installation/install-with-docker "https://docs.gitea.com/zh-cn/installation/install-with-docker")

部署非常简单，通过如下 `docker-compose.yml` 文件即可完成：

```yaml

version: "3"

networks:
  gitea:
    external: false

services:
  server:
    image: docker.gitea.com/gitea:1.23.7
    container_name: gitea
    environment:
      - USER_UID=1000
      - USER_GID=1000
    restart: always
    networks:
      - gitea
    volumes:
      - /data/gitea:/data
      - /etc/timezone:/etc/timezone:ro
      - /etc/localtime:/etc/localtime:ro
    ports:
      - "13000:3000"
      - "222:22"
```

**文件说明**：

- `/data/gitea:/data`：Gitea 所有数据，包括仓库、配置文件、用户信息等
- `13000:3000`：本地访问 Gitea 的 Web 管理界面 [http://localhost:13000](http://localhost:13000)
- `222:22`：将容器内 SSH 服务映射到宿主机 222 端口

启动方式：

```bash
docker-compose up -d
```

## 四、配置 SSH 支持（重要）

Gitea 默认认为 SSH 使用的是 **22 端口**，但我们容器中实际映射的是 **222**，因此需要额外配置。

如果不进行配置，那么在页面中提供的 ssh 地址是不带端口的，这样默认就是使用 22 端口，会导致连接不了，改了配置的效果是这样的：

![](https://cdn.jsdelivr.net/gh/Hopetree/blog-img@main/2025/202504151540738.png)

### 1. 修改 Gitea 的 app.ini 配置

宿主机中 `/data/gitea/gitea/conf/app.ini`（容器内为 `/data/gitea/conf/app.ini`），加入或修改以下内容：

```ini
[server]
DOMAIN           = 100.88.88.203
SSH_DOMAIN       = 100.88.88.203
SSH_PORT         = 222
START_SSH_SERVER = false
SSH_LISTEN_PORT  = 22
```

**字段说明**：

- `SSH_DOMAIN`：Web 页面展示的 clone 地址使用的主机名
- `SSH_PORT`：Web 页面展示的 SSH 端口（就是你映射的 222）
- `SSH_LISTEN_PORT=22`：容器内部仍监听 22 端口
- `START_SSH_SERVER=false`：关闭 Gitea 内置 SSH Server（使用容器内 sshd）

配置完成后，重启容器：

```bash
docker restart gitea
```

### 2. 验证 SSH 地址

刷新 Gitea Web 页面，点击仓库的“Clone”按钮，应该显示：

```bash
git clone ssh://git@100.88.88.203:222/your_user/your_repo.git
```

### 3. 客户端配置 SSH（可选）

为避免每次 push 时指定端口，可以在开发机的 `~/.ssh/config` 中添加：

```ssh
Host gitea
    HostName 100.88.88.203
    Port 222
    User git
```

这样就可以使用别名：

```bash
git clone gitea:your_user/your_repo.git
```

## 五、配置域名访问

### 1. 场景说明

| 服务  |   主机IP|  描述 |
| ------------ | ------------ | ------------ |
|gitea   | 192.168.0.203  | 宿主机A，容器映射 13000/222|
| Nginx  |  192.168.0.202 |  宿主机B，监听端口80用来反向代理到gitea |
|  域名解析 |  git.home.local -> 192.168.0.202（Nginx） |   |

### 2. 添加 Nginx 配置

在 Nginx 中添加配置如下：

```nginx
server {
    listen 80;
    server_name git.home.local;

    location / {
        proxy_pass http://192.168.0.203:13000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

这样 Web 就没问题了，访问 http://git.home.local 会看到 Gitea 页面。

### 3. 本地配置 ssh 

不能通过 Nginx 配置 ssh 转发，所以可以在本地配置将 ssh 直接走到 gitea 上面，在客户端本地 ~/.ssh/config 添加：

```ini
Host git.home.local
    HostName 192.168.0.203
    Port 222
    User git
```

然后就可以使用域名克隆项目：

```bash
git clone git@git.home.local:your_user/your_repo.git
```

### 4. 更新 gitea 配置

更新配置只需要修改请求地址并将 SSH_PORT 改回 22 端口即可：

```ini
[server]
DOMAIN = git.home.local
SSH_DOMAIN = git.home.local
SSH_PORT = 22
```

改完之后重启容器即可，参考之前的配置修改方式。

## 六、总结

通过 Gitea + Docker + SSH 的组合，可以非常高效地搭建起个人私有 Git 服务，具有如下优势：

- ✅ 资源占用低，可运行在轻量主机或虚拟机中
- ✅ 支持完整 Git 流程和常用 DevOps 功能
- ✅ 容器化部署，快速、可维护
- ✅ SSH 方式安全高效，适配各种开发场景

非常适合追求极简与效率的开发者进行自托管实践。