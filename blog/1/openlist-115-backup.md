# 用 OpenList 把数据备份到 115 网盘

在容器化的 203 主机上跑过 Gitea 后，我一直想给本地数据找个稳定的网盘落点。选了 OpenList 挂 115 网盘，把备份做成**技能驱动**的独立流程。整个方案最后跑通了，但坑比预期多得多——WebDAV 权限、rclone 对 115 的兼容、115 写入限流、伪目录陷阱、同路径冷却窗口、令牌过期导致的 405、缓存不同步。这篇文章把完整方案和踩坑处理一次写清楚，包括上线第二天才暴露的令牌与缓存问题。

## 1. 总体方案

### 1.1 架构

数据从本地 203 主机出发，经 OpenList 作为中转，落到 115 网盘。备份流程按服务拆成独立入口，共四种模式：gitea 与 qwenpaw 的 working/secret 走 tar 归档，backups 走镜像同步。

```mermaid
flowchart LR
  src[203 本地目录] --> tar[打 tar 包]
  tar --> curl[curl WebDAV PUT]
  curl --> ol[OpenList 容器:5244]
  ol --> webdav[WebDAV /dav/]
  webdav --> api[115 Open API]
  api --> netdisk[115 网盘]
```

为什么选 WebDAV 而不是直接用 115 SDK：OpenList 已经把 WebDAV 暴露成文件系统，备份脚本只需要一套通用的 HTTP 客户端就能覆盖所有网盘，不依赖 115 的逆向接口。

### 1.2 备份策略

| 服务 | 模式 | 保留 |
|---|---|---|
| gitea | tar 归档 | 7 份轮转 |
| qwenpaw/working | tar 归档 | 7 份轮转 |
| qwenpaw/secret | tar 归档 | 7 份轮转 |
| qwenpaw/backups | 镜像同步 | 与源一致 |

前三个是每日打包上传，远端按 `服务_日期.tar.gz` 命名，超过 7 份自动删旧的。第四个 `qwenpaw/backups` 里放的是平台升级导出包，本身不频繁变化，用镜像同步保持远端和源完全一致。备份调度由 cron 每天 03:00 触发全量，也可随时手动按服务执行。

### 1.3 远端目录规范

所有备份严格按 `备份/主机名/服务名/子目录` 组织，路径必须写完整：

```text
115/备份/home-203/
├── gitea/                       # 服务名
│   └── gitea_2026-08-28.tar.gz
└── qwenpaw/
    ├── working/                 # 子目录
    ├── secret/
    └── backups/
        ├── .signing_key
        └── qwenpaw-*.zip
```

顶层 `备份` → 主机名 `home-203` → 服务名（gitea/qwenpaw）→ 子目录（working/secret/backups）。日志、文档、脚本里的远端路径一律写完整绝对路径，便于核对排障。

## 2. 部署 OpenList

### 2.1 环境准备

203 主机已有 docker，镜像源走自建脚本，国内可达。

```yaml
services:
  openlist:
    image: openlistteam/openlist:latest
    container_name: openlist
    restart: always
    user: "0:0"
    environment:
      - UMASK=022
      - TZ=Asia/Shanghai
    ports:
      - "5244:5244"
    volumes:
      - /data/openlist:/opt/openlist/data
```

拉镜像遇到第一个坑：默认镜像源 docker.1ms.run 对这个镜像会卡死挂起，换 dockerproxy.net 一次成功。

### 2.2 115 网盘挂载

登录 http://192.168.0.203:5244，进管理页（/@manage）→ 存储 → 添加存储，选 **115 Open** 驱动。

访问令牌和刷新令牌需要从 https://api.oplist.org 获取：下拉选「115 验证网盘」，勾选使用内置参数，客户端 ID 和应用秘钥留空，点「获取 Token」用 115 App 扫码授权。拿到的两个令牌分别填入访问令牌和刷新令牌字段，根文件夹 ID 填 `0` 表示 115 根目录。

⚠️ 同一账号在同一应用最多取 2 次刷新令牌，第 3 次会让最早那个失效。令牌等于 115 账号的钥匙，泄漏了去 115 网页端「设备登录管理」解除授权。令牌不是永久有效——过期时所有 WebDAV 写操作会报 405，见 4.6。

### 2.3 WebDAV 权限坑

115 挂载成功，列目录能看到文件，但用 WebDAV 写操作一律 403。

根因：OpenList 新版默认给 admin 的权限位里没有「WebDAV 管理」，只有「WebDAV 读取」。

修复方法二选一：

- 管理 UI：管理 → 用户 → admin → 权限 → 勾选「WebDAV 管理」
- API 一次性改：把权限位加 512，例如 29183 → 29695

```bash
curl -s -X POST http://127.0.0.1:5244/api/admin/user/update \
  -H "Authorization: $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"id":1,"username":"admin","password":"","base_path":"/","role":2,"disabled":false,"permission":29695}'
```

判定点：原生 API `/api/fs/mkdir` 能成功说明令牌没问题，WebDAV 403 才是权限位的事。

## 3. 备份技能设计

### 3.1 为什么最终用 curl 而不是 rclone

脚本第一版用 rclone copyto 上传 tar 包。本地验证全过，一上 115 就 404。排查了一整圈才发现：

- rclone mkdir 在 115 Open API 下建的是**伪目录**（0 字节文件），WebDAV 不认
- rclone copyto 遇到伪目录就 404
- rclone sync 对 115 伪目录也 404
- 115 空目录本身不可见，curl 删了同名文件后目录消失，rclone 又 404
- 115 不支持覆盖同名文件，第二次 copy 同名文件 404

而 curl WebDAV PUT 能自动创建中间目录、能覆盖同名文件、HTTP 状态码清晰。**curl 直传是唯一稳定方案。** rclone 只用于列目录和删除验证，不再承担任何上传。

### 3.2 技能化结构

备份做成了技能（backup-to-115 skill）而不是单脚本：每个服务一个独立脚本，共享一个公共函数库，全量入口按序调用各独立脚本。

```text
skills/backup-to-115/
├── SKILL.md                     # 技能说明（触发词、执行方法、排障速查）
├── scripts/
│   ├── lib-backup.sh            # 公共库：上传/校验/轮转/重试
│   ├── backup_gitea.sh          # gitea 独立备份（tar）
│   ├── backup_working.sh        # qwenpaw/working 独立备份（tar）
│   ├── backup_secret.sh         # qwenpaw/secret 独立备份（tar）
│   ├── backup_backups.sh        # qwenpaw/backups 独立镜像同步（sync）
│   └── backup_all.sh            # 全量入口（按序调 4 个独立脚本）
└── references/
    └── troubleshooting.md       # 排障知识库
```

部署到 203 的 `/opt/openlist/backup/`，以 root 运行：

```bash
# 全量备份（4 个服务）
ssh ops@192.168.0.203 "sudo /opt/openlist/backup/backup_all.sh"

# 单独备份指定服务（每个服务独立入口）
ssh ops@192.168.0.203 "sudo /opt/openlist/backup/backup_gitea.sh"
ssh ops@192.168.0.203 "sudo /opt/openlist/backup/backup_working.sh"
ssh ops@192.168.0.203 "sudo /opt/openlist/backup/backup_secret.sh"
ssh ops@192.168.0.203 "sudo /opt/openlist/backup/backup_backups.sh"
```

这样一个服务出问题可以单独重跑，不影响其他服务；新主机接入时改 `SRC`/`DEST` 常量即可复用同一套。

### 3.3 tar 模式核心

tar 模式的核心是打包 + curl PUT + 校验：

```bash
tar czf "$tarball" -C "$(dirname "$src")" "$(basename "$src")" 2>>"$LOG"
rc=$?
[ "$rc" -gt 1 ] && { log "打包失败 (tar rc=$rc)"; return 1; }
[ "$rc" -eq 1 ] && log "打包期间源目录有写入，归档仍可用"
```

目录创建融入第一个真实文件上传——curl PUT 到 `dav/$BASE/$dest/$fname` 时自动创建所有父目录，不需要单独 mkdir、不需要占位文件：

```bash
http_code=$(curl -s -m 300 -u "$OL_USER:$OL_PASS" \
  -T "$tarball" "http://127.0.0.1:5244/dav/$BASE/$dest/$fname" \
  -w "%{http_code}" -o /dev/null)
```

校验用 WebDAV PROPFIND 读 Content-Length，确认远端文件大小与本地一致：

```bash
curl -s -X PROPFIND "http://127.0.0.1:5244/dav/$BASE/$dest/$fname" \
  -H "Depth: 0" | grep -oP '(?<=<D:getcontentlength>)[0-9]+'
```

镜像同步模式（qwenpaw-backups）用 curl 逐文件 PUT，保持远端和源逐文件一致。日志里的路径全部写绝对路径（如 `115/备份/home-203/qwenpaw/secret/qwenpaw-secret_2026-08-28.tar.gz`），一眼可见文件在 115 的具体位置。

### 3.4 失败重试与服务间隔

115 同路径短时间内写入会 404（甚至 405），脚本做了两层缓解：

- 上传失败且是 404/405 时，等 60 秒重试，最多 2 轮
- 多服务时，非最后一个服务完成后等 30 秒再进下一个，降低同令牌连续写入压力

### 3.5 空 targets 防护

调试阶段发现一个隐蔽 bug：无参执行时任务表里的关联数组在 bash 下没展开，脚本静默空跑、fail=0。加了防护：`targets == 0 直接 fail=1`，避免静默漏备份。

### 3.6 本地验证纪律

脚本和策略变更的验证**一律在本地做**——用 rclone 的 local remote 指向 `/tmp/rclone-localtest` 跑通全部逻辑，包括 tar 上传、镜像同步、轮转、校验、参数化分发。本地全绿后才动 115。115 的写入能力已由首次全量备份证明，不重复消耗它的额度与带宽。

## 4. 踩坑记录

### 4.1 115 写入限流

**症状**：rclone/curl 写入同一路径，隔 60 秒重试仍 404，隔 5 分钟才恢复。

**根因**：115 对同令牌的同一路径写入有冷却窗口，比 120 秒更长。密集测试时新令牌额度被打光，脚本 3 轮 × 120 秒全 404，陷入死循环。

**处理**：重试间隔回到 60 秒、轮数减到 2 轮，避免死等；服务间加 30 秒间隔；手动触发改为只在 cron 窗口跑。

### 4.2 rclone 的 readonly 变量问题

**症状**：`RCLONE=/usr/local/bin/rclone` 定义成 readonly 变量，脚本里 `$RCLONE copyto ...` 返回 rc=1 且报 404；用 `/usr/local/bin/rclone` 字面路径就成功。

**根因**：CentOS 7 的 sudo 环境下，readonly 变量引用的 rclone 行为异常。

**处理**：所有 rclone 调用改用字面路径。这个坑后来因为整体弃用 rclone 上传而不再触及，但值得记录。

### 4.3 115 伪目录陷阱

**症状**：用 rclone mkdir 创建的目录，rclone 能列，但 WebDAV PUT 进去就 404。

**根因**：115 Open API 的目录实现与 WebDAV 不一致，mkdir 建的是 0 字节文件而非真正目录。curl PUT 自动建目录时才会创建真正的 WebDAV 目录。

**处理**：目录创建改由 curl PUT 自动完成，脚本不再主动 mkdir，也不留占位文件。

### 4.4 路径拼接遗漏

**症状**：curl 上传返回 201，但 115 里找不到文件，rclone 列目录也看不到。

**根因**：curl URL 少拼了 `备份/home-203/` 这一段，文件写到了 115 根目录，还留下脏目录。

**处理**：统一用 `$BASE` 常量拼装路径，`dav/$BASE/$dest/$fname`；日志全部输出绝对路径；115 根下的脏目录用 rclone purge 清理。

### 4.5 后台启动被 ssh 会话关闭连带杀死

**症状**：setsid nohup 启动的备份脚本，等会儿看发现根本没跑。

**根因**：把部署命令和后台启动写在同一条 ssh 链里，`&` 把整条链丢进后台，会话一断全没了。

**处理**：部署和启动分离到两个 ssh 调用；或者用 `setsid ... < /dev/null` 确保 stdin 已断开。

### 4.6 令牌过期：读通、写挂、全 405

**症状**：上线第二天，定时备份 4 个服务全部失败，错误都是 HTTP 405；WebDAV 的 OPTIONS 响应中 Allow 列表变成 `OPTIONS, LOCK, DELETE, PROPPATCH, COPY, MOVE, UNLOCK, PROPFIND`，**没有 PUT**。

**根因**：115 Open 驱动的令牌过期。驱动判定 115 不可写后，OpenList 整体不再对外暴露 PUT，所有上传因此 405。

**判别要点**：**读通（列目录/PROPFIND 正常）、写挂（上传全 405）→ 就是令牌问题**，不是权限位（权限位是 403）、也不是限流（限流是 404）。

**处理**（需用户操作）：
1. https://api.oplist.org → 选「115 验证网盘」→ 使用内置参数 → 获取 Token → 115 App 扫码
2. OpenList 管理页 → 存储 → 编辑 `115 Open` → 更新 Access/Refresh Token → 保存
3. 验证 PUT 恢复（返回 201），补跑失败服务

⚠️ 令牌是长效但**不是永久**，过期是正常生命周期。备份失败先看日志状态码，全 405 直接走这条。

### 4.7 缓存不同步：115 网页端删文件后备份 405

**症状**：用户在 115 网页端删除了备份目录，但 OpenList 里还看得到旧内容；随后执行备份全部 405。

**根因**：**OpenList 对 115 目录有内存缓存（默认 30 分钟过期）**。在 115 网页端直接删除后，OpenList 缓存还保留旧目录视图，它以为目标目录存在，实际实物已删 → 写入 405。更隐蔽的是 rclone 走 WebDAV 也会读到同一个缓存，看到的是旧视图，容易误判"文件还在"。

**处理**：
1. **重启 openlist 容器**（`docker restart openlist`）清掉内存缓存
2. 重启后 curl PUT 测试返回 201，确认恢复
3. 再跑备份（目录会被自动重建）

**预防**：**不要在 115 网页端直接操作 OpenList 管理的目录**。要清理也该在 OpenList 的 Web 界面/管理页里做；实在在 115 端动了，删除后立即重启 openlist 再备份。

## 5. 最终交付

- 备份技能 `skills/backup-to-115/`，部署到 203 的 `/opt/openlist/backup/`（lib + 4 个服务脚本 + 全量入口），root 运行
- cron 任务 `/etc/cron.d/backup-to-115`：每天 03:00 全量执行 `backup_all.sh`
- 日志 `/var/log/backup-to-115.log`，超 10MB 自动截断保留末尾 2000 行，所有路径绝对化
- 远端目录 `115:/备份/home-203/{gitea/, qwenpaw/working|secret|backups/}`，严格 `备份/主机名/服务名/子目录`

⚠️ 备份脚本内嵌 OpenList admin 凭据（`lib-backup.sh` 的 `OL_PASS`）。**改 admin 密码必须同步更新 203 上 `/opt/openlist/backup/lib-backup.sh`**，否则备份静默失败。建议给备份单独建一个受限账号，只开备份目录的 WebDAV 权限，更稳。