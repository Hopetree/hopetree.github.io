# NAS 常用 Docker 容器推荐

NAS 到手第一件事就是装 Docker，有了 Docker 就等于给 NAS 打开了无限可能。这篇文章整理了 6 大类最常用的 Docker 容器，从影音追剧到文件备份、系统监控，每个都配了可直接用的 docker-compose 配置，方便你按需取用。

## 1. 媒体管理全家桶

NAS 最核心的用途之一就是影音媒体管理。下面这几个容器组合起来，能让你彻底告别手动整理电影和电视剧。

### 1.1 Jellyfin — 开源媒体服务器

Jellyfin 是 Emby 的完全开源分支，功能不输 Plex，且没有任何订阅费用。

```yaml
version: '3'
services:
  jellyfin:
    image: jellyfin/jellyfin
    container_name: jellyfin
    ports:
      - "8096:8096"
    volumes:
      - ./jellyfin/config:/config
      - ./jellyfin/cache:/cache
      - /path/to/media:/media:ro
    devices:
      - /dev/dri:/dev/dri
    restart: unless-stopped
```

支持硬件转码（Intel QuickSync / AMD VAAPI / NVIDIA NVENC），手机端用 Infuse 或 Finamp 配合体验极佳。

### 1.2 Sonarr + Radarr — 自动化追剧追片

**Sonarr** 管剧集，**Radarr** 管电影。它们自动监视索引器，下到匹配的版本后通知下载器去拉，下完再自动整理重命名。

```yaml
  sonarr:
    image: linuxserver/sonarr
    container_name: sonarr
    ports:
      - "8989:8989"
    volumes:
      - ./sonarr/config:/config
      - /path/to/tv:/tv
      - /path/to/downloads:/downloads
    restart: unless-stopped
```

关键配置要点：下载客户端选 qBittorrent / Transmission，索引器用 Jackett 或 Prowlarr 统一管理。

### 1.3 Prowlarr — 索引器管理器

统一管理所有 Indexer，再一键同步给 Sonarr / Radarr / Lidarr。

```yaml
  prowlarr:
    image: linuxserver/prowlarr
    container_name: prowlarr
    ports:
      - "9696:9696"
    volumes:
      - ./prowlarr/config:/config
    restart: unless-stopped
```

## 2. 下载工具三件套

### 2.1 qBittorrent — 全能 BT 客户端

Web UI 清爽，功能完整，支持 RSS 订阅自动下载。

```yaml
  qbittorrent:
    image: linuxserver/qbittorrent
    container_name: qbittorrent
    ports:
      - "8080:8080"
      - "6881:6881"
      - "6881:6881/udp"
    volumes:
      - ./qbittorrent/config:/config
      - /path/to/downloads:/downloads
    restart: unless-stopped
```

记得在设置里开启匿名模式，以及限制全局最大连接数避免打挂路由器。

### 2.2 Transmission — 轻量级选择

如果觉得 qBittorrent 太重，Transmission 是最省资源的 BT 客户端。

```yaml
  transmission:
    image: linuxserver/transmission
    container_name: transmission
    ports:
      - "9091:9091"
      - "51413:51413"
      - "51413:51413/udp"
    volumes:
      - ./transmission/config:/config
      - /path/to/downloads:/downloads
    restart: unless-stopped
```

配合 Transmission Remote GUI 或 Transmissionic App 远程管理很方便。

### 2.3 Aria2 — 万能下载器

支持 HTTP / FTP / BT / Metalink，最擅长处理直链和百度网盘导出。

```yaml
  aria2:
    image: p3terx/aria2-pro
    container_name: aria2
    ports:
      - "6800:6800"
    volumes:
      - ./aria2/config:/config
      - /path/to/downloads:/downloads
    environment:
      - PUID=1000
      - PGID=1000
      - RPC_SECRET=your_secret
    restart: unless-stopped
```

配合 AriaNg Web UI 使用，界面现代又好看。

## 3. 文件同步与备份

### 3.1 Syncthing — 去中心化同步

不依赖任何云服务，端到端加密，设备间直接同步文件夹。

```yaml
  syncthing:
    image: syncthing/syncthing
    container_name: syncthing
    ports:
      - "8384:8384"
      - "22000:22000/tcp"
      - "22000:22000/udp"
      - "21027:21027/udp"
    volumes:
      - ./syncthing/config:/var/syncthing/config
      - /path/to/data:/var/syncthing/data
    restart: unless-stopped
```

手机端装 Syncthing-Fork，照片文档实时同步到 NAS，比 iCloud / 百度网盘自由得多。

### 3.2 Duplicati — 加密备份

支持备份到 S3、WebDAV、SFTP，增量备份且加密。

```yaml
  duplicati:
    image: linuxserver/duplicati
    container_name: duplicati
    ports:
      - "8200:8200"
    volumes:
      - ./duplicati/config:/config
      - ./duplicati/backups:/backups
      - /path/to/source:/source:ro
    restart: unless-stopped
```

适合把重要数据定期打包加密发到冷存储。

## 4. 系统监控与仪表盘

### 4.1 Heimdall — 导航页

把 NAS 上所有容器的 Web UI 集中到一个页面上，不用记端口号。

```yaml
  heimdall:
    image: linuxserver/heimdall
    container_name: heimdall
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./heimdall/config:/config
    restart: unless-stopped
```

也可以试试 Flame、Homer 或 Dashy，风格更现代。

### 4.2 Uptime Kuma — 服务监控

监控你的容器服务是否在线，掉线会推送通知到 Telegram / 钉钉 / Slack。

```yaml
  uptime-kuma:
    image: louislam/uptime-kuma
    container_name: uptime-kuma
    ports:
      - "3001:3001"
    volumes:
      - ./uptime-kuma/data:/app/data
    restart: unless-stopped
```

### 4.3 Netdata — 实时性能监控

CPU、内存、磁盘 IO、网络流量，秒级刷新，图表非常漂亮。

```yaml
  netdata:
    image: netdata/netdata
    container_name: netdata
    ports:
      - "19999:19999"
    volumes:
      - /proc:/host/proc:ro
      - /sys:/host/sys:ro
      - /var/run/docker.sock:/var/run/docker.sock:ro
    restart: unless-stopped
```

## 5. 实用小工具

### 5.1 Portainer — Docker 管理面板

图形化管理容器、镜像、网络、卷，不用敲命令。

```yaml
  portainer:
    image: portainer/portainer-ce
    container_name: portainer
    ports:
      - "9000:9000"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
      - ./portainer/data:/data
    restart: unless-stopped
```

### 5.2 Watchtower — 自动更新容器

定期检查镜像更新，自动拉取并重启容器。

```yaml
  watchtower:
    image: containrrr/watchtower
    container_name: watchtower
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
    environment:
      - WATCHTOWER_CLEANUP=true
      - WATCHTOWER_SCHEDULE=0 0 4 * *
    restart: unless-stopped
```

如果不希望所有容器都被自动更新，可以给容器加上 `--label com.centurylinklabs.watchtower.enable=false` 标签。

### 5.3 Nginx Proxy Manager — 反向代理

通过域名加端口转发访问容器，配上 SSL 证书，不用再记 IP 端口。

```yaml
  nginx-proxy-manager:
    image: jc21/nginx-proxy-manager
    container_name: nginx-proxy-manager
    ports:
      - "80:80"
      - "443:443"
      - "81:81"
    volumes:
      - ./npm/data:/data
      - ./npm/letsencrypt:/etc/letsencrypt
    restart: unless-stopped
```

## 6. 组合推荐

新手起步套餐：

| 场景 | 容器组合 |
|------|---------|
| 影音娱乐 | Jellyfin + Sonarr + Radarr + Prowlarr + qBittorrent |
| 文件同步 | Syncthing + Duplicati |
| 日常管理 | Portainer + Heimdall + Nginx Proxy Manager |
| 纯下载机 | Transmission + Aria2 + FileBrowser |

以上所有容器在群晖 DSM、威联通 QTS 以及 Unraid 上均能正常部署。大部分 linuxserver 的镜像同时支持 arm64，树莓派或者用旧手机改的 NAS 也能跑。