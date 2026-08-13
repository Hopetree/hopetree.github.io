# APISIX 运维部署与配置指南

A 服务需要访问 B 服务，但希望受控访问：只有特定调用方、来自特定 IP、只能调特定接口。直接在 A 与 B 之间直连难以做到精细控制，于是中间加一层 APISIX 网关，统一接管请求入口。

APISIX 是一个高性能的云原生 API 网关，基于 Nginx 和 etcd，提供丰富的路由、负载均衡、认证限流等能力。本文以独立模式（Standalone）部署为例，介绍网关的部署与日常运维。

网关在 A 与 B 之间主要做三种过滤：

- **IP 白名单**：只放行来自指定网段的请求。
- **调用方凭证（key-auth）**：请求必须携带正确的 accesskey 才能通过。
- **接口白名单（routes）**：只放行配置过的 URI 和 HTTP 方法，其余一律 404。

全文包含首次部署和日常运维两部分。大部分操作仅首次部署时需要执行，后续日常运维只需修改 `config/apisix.yaml` 并重启容器。

## 1. 首次部署

以下操作只需在新环境首次部署时执行一次。

### 1.1 创建运行用户

```bash
# 创建 app 组（已存在可跳过）
sudo groupadd -f app

# 创建 ops 用户（已存在可跳过）
sudo useradd -r -m -g app -s /bin/bash ops

# 将 ops 加入 docker 组（如已加入可跳过）
sudo usermod -aG docker ops

# 验证 ops 已加入 docker 组
groups ops
```

### 1.2 部署文件

```bash
# 创建部署目录
sudo mkdir -p /appset/ops/apisix

# 上传项目文件到该目录（docker-compose.yml、config/ 等）

# 赋权给 ops:app
sudo chown -R ops:app /appset/ops/apisix

# 配置文件设权限，确保容器内用户可读取
chmod 755 /appset/ops/apisix/config
chmod 644 /appset/ops/apisix/config/*.yaml
```

### 1.3 启动

切换到 ops 用户执行：

```bash
su - ops
cd /appset/ops/apisix
docker compose up -d
docker compose ps            # 确认 Running
```

- `docker compose up -d`：根据 docker-compose.yml 拉取镜像、创建容器并以后台模式启动。首次执行会自动下载 APISIX 镜像，需要几分钟；后续启动秒级完成。
- `docker compose ps`：查看当前项目的容器运行状态，STATUS 列显示 `Up` 即正常运行。

部署目录结构：

```
/appset/ops/apisix/
├── docker-compose.yml
├── config/
│   ├── config.yaml           # APISIX 基础配置（一般不改）
│   └── apisix.yaml           # 路由和过滤规则（运维改这个）
```

### 1.4 docker-compose.yml 说明

```yaml
version: "3"

services:
  apisix:                                    # 服务名，一个服务对应一个容器
    image: apache/apisix:3.17.0-debian       # 使用的镜像及版本
    container_name: apisix-gateway           # 容器名称（固定，便于操作）
    restart: always                          # 容器异常退出或宿主机重启后自动拉起
    environment:
      - TZ=Asia/Shanghai                     # 时区
    ports:
      - "9080:9080"                          # 宿主机端口:容器端口
    volumes:
      - ./config/config.yaml:/usr/local/apisix/conf/config.yaml:ro
      - ./config/apisix.yaml:/usr/local/apisix/conf/apisix.yaml:ro
```

| 配置项 | 说明 |
|--------|------|
| `image` | 镜像名和版本标签，修改后可升级 |
| `container_name` | 指定容器名称，后续所有 docker 命令都用这个名字操作 |
| `restart: always` | Docker 守护进程启动时自动启动该容器，容器异常退出也会自动重启 |
| `TZ=Asia/Shanghai` | 设置容器内时区为上海时间 |
| `"9080:9080"` | 将宿主机 9080 端口流量转发到容器内 9080 端口（APISIX 代理端口） |
| `volumes` | 将宿主机配置文件挂载到容器内，`:ro` 表示只读 |
| `config.yaml` | 挂载到容器内 `/usr/local/apisix/conf/config.yaml`（基础配置） |
| `apisix.yaml` | 挂载到容器内 `/usr/local/apisix/conf/apisix.yaml`（路由和过滤规则） |

修改宿主机 `/appset/ops/apisix/config/apisix.yaml` 后，执行 `docker compose restart apisix` 即可使容器重新加载配置。

## 2. 日常运维

后续变更只需以 ops 用户修改 `config/apisix.yaml`，然后重启容器：

```bash
vim /appset/ops/apisix/config/apisix.yaml   # 1. 编辑配置
docker compose restart apisix               # 2. 重启，使配置生效
docker compose logs apisix                  # 3. 确认无 error
```

- `docker compose restart apisix`：重启指定容器，容器会重新加载配置文件。独立模式下这是唯一让配置生效的方式，没有热加载。
- `docker compose logs apisix`：查看容器输出日志，加上 `-f` 可以持续跟踪（按 Ctrl+C 退出）。

### 启停命令速查

| 命令 | 说明 |
|------|------|
| `cd /appset/ops/apisix` | 所有命令需要在此目录下执行 |
| `docker compose up -d` | 启动容器，-d 表示后台运行 |
| `docker compose restart apisix` | 重启容器（修改配置后执行） |
| `docker compose stop` | 停止容器，不删除 |
| `docker compose down` | 停止并删除容器 |
| `docker compose ps` | 查看容器状态 |
| `docker compose logs -f apisix` | 持续查看日志（排错用） |

## 3. 配置说明

`config/apisix.yaml` 是日常运维唯一需要修改的文件，按功能分为四部分。`config.yaml` 为基础配置，一般不需要修改。

### 3.1 upstreams（上游服务地址）

定义后端服务的实际地址和负载均衡方式。

```yaml
upstreams:
  - id: ops-upstream
    type: roundrobin
    scheme: http
    nodes:
      "10.10.1.10:80": 1    # 地址:端口，数字为权重
    timeout:
      connect: 10
      send: 15
      read: 30
```

运维只需修改 `nodes`：指向实际的上游服务地址和端口。其余字段（type、scheme、timeout）初始化后一般不动。

如需多节点高可用，添加多条即可，权重相等则轮询分发，某节点故障时自动跳过：

```yaml
nodes:
  "10.10.1.10:80": 1
  "10.10.2.100:80": 1   # 新增备用节点
```

### 3.2 consumers（调用方凭证）

声明合法的 accesskey 值。这里配置的 key 就是调用方在请求中携带的 `?accesskey=xxx` 的值。

```yaml
consumers:
  - username: client_qwenpaw
    desc: "业务调用方 QwenPaw"
    plugins:
      key-auth:
        key: "abc123"        # 这就是 ?accesskey=abc123 的值
```

运维只需修改 `key`（密钥值）和增删 consumer 条目。新增调用方时复制一个 consumer 块，改 username 和 key 即可。

### 3.3 services（安全过滤规则）

绑定上游与安全规则（IP 白名单、凭证校验方式）。

```yaml
services:
  - id: qwenpaw-ops
    desc: "QwenPaw 访问 OPS 系统的专属服务安全组"
    upstream_id: ops-upstream          # 关联哪个 upstream
    plugins:
      ip-restriction:
        whitelist:                     # 允许的 IP/网段
          - "10.10.2.0/24"
          - "10.20.0.0/12"
      key-auth:
        header: "accesskey"            # 凭证传递方式
        query: "accesskey"
```

运维只需修改 `whitelist`（IP 白名单）。其余字段初始化后一般不动。

IP 白名单格式：

| 写法 | 含义 | 覆盖 IP 数 |
|------|------|-----------|
| `"10.10.2.100"` | 单个 IP | 1 |
| `"10.10.2.0/24"` | 最后一段可变 | 256 |
| `"10.20.0.0/12"` | 后两段可变 | 约 104 万 |

### 3.4 routes（接口白名单）

定义允许访问的接口路径和 HTTP 方法，不在列表中的 URI 和方法一律返回 404。

```yaml
routes:
  - id: route-notify-log
    desc: "查询定时任务列表"
    uri: /notify_service/operation/log
    methods:
      - GET
    service_id: qwenpaw-ops            # 归属哪个 service
```

运维只需修改 `uri`（接口路径）和 `methods`（允许的 HTTP 方法），以及增删 route 条目。

URI 匹配模式：

| 写法 | 匹配效果 |
|------|----------|
| `/api/users` | 精确匹配 `/api/users` |
| `/api/users/*` | 匹配一级子路径，如 `/api/users/123` |
| `/api/users/**` | 匹配任意深度子路径，如 `/api/users/123/items` |

## 4. 多服务配置

场景：同时代理 OPS 和 CRM，各有独立的 accesskey 和 IP 白名单。按三组实体完整配置即可：

```yaml
# ==============================
# upstreams — 每个后端一个
# ==============================
upstreams:
  - id: ops-upstream
    nodes: { "10.10.1.10:80": 1 }
  - id: crm-upstream
    nodes: { "10.20.1.100:8080": 1 }

# ==============================
# consumers — 每个调用方一个
# ==============================
consumers:
  - username: client_qwenpaw
    plugins: { key-auth: { key: "abc123" } }
  - username: client_crm
    plugins: { key-auth: { key: "crm-key-456" } }

# ==============================
# services — 每套安全规则一个
# ==============================
services:
  - id: qwenpaw-ops
    upstream_id: ops-upstream
    plugins:
      ip-restriction: { whitelist: ["10.10.2.0/24"] }
      key-auth: { header: "accesskey", query: "accesskey" }
  - id: crm-service
    upstream_id: crm-upstream
    plugins:
      ip-restriction: { whitelist: ["10.20.0.0/12"] }
      key-auth: { header: "accesskey", query: "accesskey" }

# ==============================
# routes — 每个接口一条
# ==============================
routes:
  - id: route-notify-log
    uri: /notify_service/operation/log
    methods: [GET]
    service_id: qwenpaw-ops
  - id: route-crm-customers
    uri: /api/customers/**
    methods: [GET, POST]
    service_id: crm-service
```

隔离效果：请求 `/notify_service/operation/log?accesskey=crm-key-456` 会失败——该路由绑定的 `qwenpaw-ops` 只会匹配 `client_qwenpaw` 的凭证。IP 白名单同样各自独立。

## 5. 部署后验证

部署或修改配置后，用 curl 验证网关是否正常工作。以下 `<opsgw_ip>` 替换为网关所在机器的实际 IP。

### 5.1 正常请求

```bash
# 正常请求（accesskey 正确，IP 在白名单内）
curl -s "http://<opsgw_ip>:9080/notify_service/operation/log?accesskey=abc123"
# 期望：返回上游 OPS 系统的正常响应
```

### 5.2 校验安全规则

四种场景逐一验证过滤规则是否生效：

```bash
# 1. 缺少 accesskey -> 期望 401
curl -s -w "status_code: %{http_code}\n" "http://<opsgw_ip>:9080/notify_service/operation/log"

# 2. accesskey 错误 -> 期望 403
curl -s -w "status_code: %{http_code}\n" "http://<opsgw_ip>:9080/notify_service/operation/log?accesskey=wrong"

# 3. 未配置的接口 -> 期望 404
curl -s -w "status_code: %{http_code}\n" "http://<opsgw_ip>:9080/some/unknown/path?accesskey=abc123"

# 4. IP 不在白名单（从非白名单机器执行）-> 期望 403
curl -s -w "status_code: %{http_code}\n" "http://<opsgw_ip>:9080/notify_service/operation/log?accesskey=abc123"
```

| 验证项 | 命令特征 | 预期状态码 |
|--------|---------|-----------|
| 正常请求 | 正确 accesskey + 已配置的 URI | 上游返回的状态码 |
| 缺 accesskey | 不带 accesskey 参数 | 401 |
| 错 accesskey | accesskey 值不对 | 403 |
| 未配置接口 | URI 不在 routes 中 | 404 |

### 5.3 查看后端真实响应

当需要确认上游服务是否正常时，直接绕开网关在容器内测试：

```bash
# 从容器内直连上游，排除网关因素
docker exec apisix-gateway curl -s http://10.10.1.10:80/
```

## 6. 故障排查

### 容器启动失败

```bash
docker compose logs apisix
```

常见原因：

| 原因 | 处理 |
|------|------|
| apisix.yaml YAML 缩进错误 | 检查缩进是否用空格、是否对齐 |
| apisix.yaml 缺少 `#END` 结尾 | 文件最后一行必须是 `#END` |
| 端口冲突 | 修改 docker-compose.yml 端口映射 |
| 配置文件权限不足 | `chmod 644 /appset/ops/apisix/config/*.yaml` |

### 配置未生效

独立模式改 apisix.yaml 后必须 restart，无热加载：

```bash
docker compose restart apisix    # 正确
```

### 状态码含义

| 状态码 | 含义 | 排查方向 |
|--------|------|---------|
| 401 | 缺少 accesskey | 请求是否携带 `?accesskey=xxx` |
| 403 | accesskey 错误或 IP 不在白名单 | 检查 key 值和调用方 IP |
| 404 | 接口不在白名单 | 检查 routes 中是否配置了该 URI 和方法 |