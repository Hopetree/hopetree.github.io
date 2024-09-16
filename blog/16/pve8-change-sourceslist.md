# Proxmox VE 8 换源【转】

给 PVE8 换一下源，整理了下具体的操作步骤以及每步的意图，也为给自己留个档

> 本文作者： Fallen_Breath<br>本文链接： [https://blog.fallenbreath.me/zh-CN/2023/pve8-change-sourceslist/](https://blog.fallenbreath.me/zh-CN/2023/pve8-change-sourceslist/)

更新之后的效果：

![](https://tendcode.com/cdn/2024/04/202404071656843.png)

## 基本信息

- PVE 版本：8.0.3
- debian 版本：12 (bookworm)
- 目标源：中科大 USTC 源

    清华源的 https://mirrors.tuna.tsinghua.edu.cn/ceph/debian-quincy/dists/ 里还没有 bookworm 的数据，因此不太能用

## APT 换源

需修改文件

1. /etc/apt/sources.list
2. /etc/apt/sources.list.d/ceph.list
3. /etc/apt/sources.list.d/pve-enterprise.list

修改前先备份，以防万一：

```shell
mkdir /etc/apt/sources_backup
cp /etc/apt/sources.list /etc/apt/sources_backup/sources.list.bak
cp /etc/apt/sources.list.d/ceph.list /etc/apt/sources_backup/ceph.list.bak
cp /etc/apt/sources.list.d/pve-enterprise.list /etc/apt/sources_backup/pve-enterprise.list.bak

```

可以参考 [中科大 proxmox 镜像的文档](https://mirrors.ustc.edu.cn/help/proxmox.html)，不过这个文档里的操作应该是适配旧版 proxmox 的，有些地方需要改改适配下

### TL;DR

太长不看，指令如下：

```shell
# sources.list
sed -i 's|^deb http://ftp.debian.org|deb https://mirrors.ustc.edu.cn|g' /etc/apt/sources.list
sed -i 's|^deb http://security.debian.org|deb https://mirrors.ustc.edu.cn/debian-security|g' /etc/apt/sources.list
# ceph.list
echo "deb https://mirrors.ustc.edu.cn/proxmox/debian/ceph-quincy bookworm no-subscription" > /etc/apt/sources.list.d/ceph.list
# pve-enterprise.list
echo "" > /etc/apt/sources.list.d/pve-enterprise.list

```

### sources.list

期望执行如下链接的替换:

| 原链接  |  新链接 |
| ------------ | ------------ |
| http://ftp.debian.org  |  https://mirrors.ustc.edu.cn |
| http://security.debian.org  |  https://mirrors.ustc.edu.cn/debian-security |

指令：

```shell
sed -i 's|^deb http://ftp.debian.org|deb https://mirrors.ustc.edu.cn|g' /etc/apt/sources.list
sed -i 's|^deb http://security.debian.org|deb https://mirrors.ustc.edu.cn/debian-security|g' /etc/apt/sources.list

```

文件变换：

```shell
--- a/etc/apt/sources_backup/sources.list.bak
+++ b/etc/apt/sources.list
@@ -1,6 +1,6 @@
-deb http://ftp.debian.org/debian bookworm main contrib
+deb https://mirrors.ustc.edu.cn/debian bookworm main contrib
 
-deb http://ftp.debian.org/debian bookworm-updates main contrib
+deb https://mirrors.ustc.edu.cn/debian bookworm-updates main contrib
 
 # security updates
-deb http://security.debian.org bookworm-security main contrib
+deb https://mirrors.ustc.edu.cn/debian-security bookworm-security main contrib

```

### ceph.list

这个原文件就一行，直接覆盖了完事，指令：

```shell
echo "deb https://mirrors.ustc.edu.cn/proxmox/debian/ceph-quincy bookworm no-subscription" > /etc/apt/sources.list.d/ceph.list

```

这里，我这里用了 `no-subscription`，但中科大文档里用的是 `pve-no-subscription`，原因是 [中科院源里](https://mirrors.ustc.edu.cn/proxmox/debian/ceph-quincy/dists/bookworm/) 里只有叫个 `no-subscription` 子目录，并没有 `pve-no-subscription`，因此得根据情况改一下

文件变化：

```shell
--- a/etc/apt/sources_backup/ceph.list.bak
+++ b/etc/apt/sources.list.d/ceph.list
@@ -1 +1 @@
-deb https://enterprise.proxmox.com/debian/ceph-quincy bookworm enterprise
+deb https://mirrors.ustc.edu.cn/proxmox/debian/ceph-quincy bookworm no-subscription

```

### pve-enterprise.list

最后，把 `pve-enterprise.list` 的企业源扬了。毕竟这个企业源得订阅了才能用，没订阅意味着没用

```shell
echo "" > /etc/apt/sources.list.d/pve-enterprise.list

```

文件变换：

```shell
--- a/etc/apt/sources_backup/pve-enterprise.list.bak
+++ b/etc/apt/sources.list.d/pve-enterprise.list
@@ -1 +1 @@
-deb https://enterprise.proxmox.com/debian/pve bookworm pve-enterprise
+

```

(可选）如果没有订阅，却依然想要一个可以更新 PVE 的源，可以用 PVE 的 pve-no-subscription 源。可以用如下指令添加

```shell
echo "deb https://mirrors.ustc.edu.cn/proxmox/debian/pve bookworm pve-no-subscription" > /etc/apt/sources.list.d/pve-no-subscription.list

```

如文档所述，这个源的 PVE 软件包是作为企业源的上游源，可能相对不那么的稳定

### 更新源配置

done。可以 `apt update` 更新下，也作为一个换源操作正确性的验证

```shell
root@localhost:~# apt update
Hit:1 https://mirrors.ustc.edu.cn/debian bookworm InRelease
Hit:2 https://mirrors.ustc.edu.cn/debian bookworm-updates InRelease
Hit:3 https://mirrors.ustc.edu.cn/debian-security bookworm-security InRelease
Hit:4 https://mirrors.ustc.edu.cn/proxmox/debian/ceph-quincy bookworm InRelease
Reading package lists... Done
Building dependency tree... Done
Reading state information... Done
38 packages can be upgraded. Run 'apt list --upgradable' to see them.
root@localhost:~# 

```

如需回滚，可以用如下指令：

```shell
cp /etc/apt/sources_backup/sources.list.bak /etc/apt/sources.list
cp /etc/apt/sources_backup/ceph.list.bak /etc/apt/sources.list.d/ceph.list
cp /etc/apt/sources_backup/pve-enterprise.list.bak /etc/apt/sources.list.d/pve-enterprise.list

```

## CT 模板换源

需修改文件：

- /usr/share/perl5/PVE/APLInfo.pm

先备份以防万一:

```shell
cp /usr/share/perl5/PVE/APLInfo.pm /usr/share/perl5/PVE/APLInfo.pm.bak

```

### APLInfo.pm

用如下指令修改，把 APLInfo.pm 里所有 http://download.proxmox.com 替换成中科大的镜像

```shell
sed -i 's|http://download.proxmox.com|https://mirrors.ustc.edu.cn/proxmox|g' /usr/share/perl5/PVE/APLInfo.pm

```

具体变更的内容如下所示

```shell
--- a/usr/share/perl5/PVE/APLInfo.pm.bak
+++ b/usr/share/perl5/PVE/APLInfo.pm
@@ -197,7 +197,7 @@ sub get_apl_sources {
     my $sources = [
        {
            host => "download.proxmox.com",
-           url => "http://download.proxmox.com/images",
+           url => "https://mirrors.ustc.edu.cn/proxmox/images",
            file => 'aplinfo-pve-8.dat',
        },
        {

```

注意这里的 host 属性是不能修改的，只改 url 就好

### 重启服务

重启下 pvedaemon.service，刷新下 web 页面，完事

```shell
systemctl restart pvedaemon.service

```

如需回滚，可以用如下指令：

```shell
cp /usr/share/perl5/PVE/APLInfo.pm.bak /usr/share/perl5/PVE/APLInfo.pm

```

## 我的补充

我发现文章里面没有替换 turnkeylinux 源的操作，导致在下载 CT 的turnkeylinux 模板的时候使用的默认源，基本没法用，于是在网上找到了替换的源，还是中科大的，方法如下：

```shell
sed -i 's|https://releases.turnkeylinux.org/pve|https://mirrors.ustc.edu.cn/turnkeylinux/metadata/pve|g' /usr/share/perl5/PVE/APLInfo.pm
```

变化（包含了之前更换的CT源）：

```bash
root@pve:~# diff /usr/share/perl5/PVE/APLInfo.pm /usr/share/perl5/PVE/APLInfo.pm.bak
200c200
<           url => "https://mirrors.ustc.edu.cn/proxmox/images",
---
>           url => "http://download.proxmox.com/images",
205c205
<           url => "https://mirrors.ustc.edu.cn/turnkeylinux/metadata/pve",
---
>           url => "https://releases.turnkeylinux.org/pve",
```

然后要执行 `pveam update` 更新 turnkeylinux 源
