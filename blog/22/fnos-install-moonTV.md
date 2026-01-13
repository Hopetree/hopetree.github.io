# 飞牛 NAS 安装 MoonTV

MoonTV 是一个开箱即用的、跨平台的影视聚合播放器。它基于 Next.js 14 + Tailwind CSS + TypeScript 构建，支持多资源搜索、在线播放、收藏同步、播放记录、云端存储，让你可以随时随地畅享海量免费影视内容。

本文分享在飞牛 NAS 上安装配置和使用 MoonTV 的经验。

## 安装部署

### 1. 项目地址

github 项目地址：[https://github.com/MoonTechLab/LunaTV](https://github.com/MoonTechLab/LunaTV "https://github.com/MoonTechLab/LunaTV")

项目中介绍了如何使用 docker 部署，这里直接采用 Redis 做持久化就行，Redis 本身就可以把内存中是数据持久化到文件，所以这里也不用担心项目中说到的丢数据。

::: tip

**加强版项目**

另一个项目地址：[https://github.com/SzeMeng76/LunaTV](https://github.com/SzeMeng76/LunaTV "https://github.com/SzeMeng76/LunaTV")

这个项目基于 MoonTV 做了一些额外的功能，具体增强能力可看项目介绍。
:::

### 2. 下载镜像

按照项目中 docker-compose.yaml 文件的内容，需要提前下载两个镜像:

```bash
ghcr.io/moontechlab/lunatv:latest
redis:alpine
```

所以可以去飞牛的 Docker 管理里面的本地镜像下载目标镜像（redis 镜像比较常用，也可以直接去镜像仓库中查找下载）

![镜像](https://cdn.jsdelivr.net/gh/Hopetree/blog-img@main/2026/202601121240004.png)

### 3. 启动项目

镜像下载完成，可以创建项目并启动。

这里可以提前在飞牛的文件管理根目录创建一个用来存放容器化项目的文件夹，然后给项目创建一个目录。此时把 github 中项目的 docker-compose.yml 文件内容复制粘贴到输入框中，这里如果本地的 3000 端口被其他项目占用则需要改一下，比如可以改成 `13000:3000`。

参考配置：

```yaml
services:
  moontv-core:
    image: ghcr.io/moontechlab/lunatv
    container_name: moontv-core
    restart: on-failure
    ports:
      - '13000:3000'
    environment:
      - USERNAME=admin
      - PASSWORD=admin_password
      - NEXT_PUBLIC_STORAGE_TYPE=redis
      - REDIS_URL=redis://moontv-redis:6379
    networks:
      - moontv-network
    depends_on:
      - moontv-redis
  moontv-redis:
    image: redis:alpine
    container_name: moontv-redis
    restart: unless-stopped
    networks:
      - moontv-network
    # 请开启持久化，否则升级/重启后数据丢失
    volumes:
      - ./data:/data
networks:
  moontv-network:
    driver: bridge
```

管理账号和密码按需修改，也可以登录后自行修改，其他配置不需要动。

![配置](https://cdn.jsdelivr.net/gh/Hopetree/blog-img@main/2025/202601121214609.png)


启动之后，访问飞牛的 IP + 3000 （改过端口就是改之后的端口）就可以访问项目，登录使用配置中的账号密码即可。

![登录](https://cdn.jsdelivr.net/gh/Hopetree/blog-img@main/2026/202601121250533.png)

![主页](https://cdn.jsdelivr.net/gh/Hopetree/blog-img@main/2025/202601121210190.png)


不过此时点击任何一个影片都是不能播放的，这里显示的内容只是从豆瓣拿到的影视资源的介绍信息，没有影视源无法播放内容。

## 配置管理

### 1. 播放源配置

使用管理员账号可以进行配置管理，添加配置文件内容即可配置播放源。

播放源可以添加线上订阅，注意这里的格式是将 JSON 进行 Base58 编码，所以你如果找到了线上的配置地址，也要满足格式才可用。

还有一种就是下面的离线配置，可以直接将播放源复制过来，这里就直接是 JSON 格式了。

![播放源配置](https://cdn.jsdelivr.net/gh/Hopetree/blog-img@main/2026/202601121249386.png)

具体的播放源我这里就不分享了，这个自行查找，反正 MoonTV 支持标准的苹果 CMS V10 API 格式，所以查找这种播放源即可。

### 2. 站点配置

站点配置就不表了，可以自定义站点的名称、公告、代理等信息。

### 3. 权限控制

MoonTV 的权限控制很简单，就是用用户组来分配可访问的播放源，然后把用户加入组里面就行。比如我这里创建了一个 SVIP 和 VIP 两个组，我可以让 SVIP 的用户组拥有所有播放源的权限，而 VIP 的用户组只能访问部分播放源。

![权限控制](https://cdn.jsdelivr.net/gh/Hopetree/blog-img@main/2026/202601121258120.png)


## 使用效果

### 1. 影片搜索能力

可以使用关键词搜索影片，具体能搜到多少，取决于配置的播放源的片库。

![影片搜索能力](https://cdn.jsdelivr.net/gh/Hopetree/blog-img@main/2026/202601121302346.png)

### 2. 播放能力

播放能力也是播放源决定的，重点在于可以随时换播放源。

![播放能力](https://cdn.jsdelivr.net/gh/Hopetree/blog-img@main/2026/202601121334036.png)


## 总结

MoonTV 是一个不需要消耗本地存储空间的媒体播放平台，所有资源都来源于其他平台提供的开源 API 接口。具备海量资源播放能力，不过一般都是 720p 画质，最多也就是 1080p 的资源，我反正没看到过 4K 资源，而且一般网速也不够播放 4K 影片，所以对于 NAS 党来说，算是最为一个补充资源平台用吧。

我觉得 MoonTV 挺适合去播放一些自己临时想看，并且没有收藏意义的影片，比如古老的电视剧、网络短剧等。