# Chrome 浏览器插件离线下载与安装指南

Chrome 应用商店在国内访问不稳定，换电脑或者需要备份特定版本时，离线安装是刚需。本文整理了三种下载方法和完整的手动安装步骤。

## 1. 离线下载的三种方法

### 1.1 官方 URL 直链（最安全）

直接利用 Chrome 官方的下载接口，拼接插件 ID 获取原版 `.crx` 安装包。

每个 Chrome 插件的商店链接尾部都有一串字母，这就是唯一 ID：

```text
https://chromewebstore.google.com/detail/xxx/medapdbncneneejhbgcjceippjlfkmkg
```

复制末尾的 ID，替换到下面的公式中：

```text
https://clients2.google.com/service/update2/crx?response=redirect&prodversion=91.0&acceptformat=crx2,crx3&x=id%3DYOUR_EXTENSION_ID%26uc
```

替换后的完整链接直接贴到浏览器地址栏即可触发下载。

### 1.2 第三方镜像站（最便捷）

不想拼链接的话，把 Chrome 商店的插件页面 URL 粘贴到以下网站即可一键下载：

- **极简插件**（chrome.extfans.com）：国内稳定，速度快
- **CRX4Chrome**（crx4chrome.com）：老牌国外站，历史版本齐全
- **ChromeExtensionDownloads**（chromedownloader.net）：无广告，粘贴即解析

### 1.3 GitHub 等开源平台

部分插件（Tampermonkey、uBlock Origin 等）在 GitHub 开源。进入项目主页后点击 Releases，在最新版本的 Assets 里找 `.crx` 文件或源码压缩包。

## 2. 手动安装步骤

### 2.1 打开扩展管理页面

浏览器地址栏输入 `chrome://extensions/` 回车，或者菜单 → 扩展程序 → 管理扩展程序。

### 2.2 开启开发者模式

页面右上角打开**开发者模式**开关。不开这个开关，浏览器拒绝安装任何本地文件。

### 2.3 安装

根据文件类型选择方式：

**`.crx` 文件**：直接拖拽到扩展管理页面，弹出确认框后点击添加。

**`.zip` 压缩包**（或拖拽 crx 报错时）：
1. 解压到普通文件夹
2. 确保文件夹内有 `manifest.json`
3. 点击页面左上角**加载已解压的扩展程序**
4. 选择解压后的文件夹

从官方接口或可信开源渠道下载，不要安装来源不明的插件。
