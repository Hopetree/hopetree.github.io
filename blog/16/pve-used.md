# PVE 系统最佳实践

本文收集一些 PVE 系统的安装、使用等操作中遇到的一些坑或者使用心得，只保留经过验证的实践记录。目的当然是为了让需要的人少走弯路，同时也是为了留着后面作为知识库查询。本文会持续更新，把自己操作 PVE 系统过程中遇到的一些问题和经验都记录下来。

## 接口文档

官方接口：[https://pve.proxmox.com/pve-docs-7/api-viewer/index.html](https://pve.proxmox.com/pve-docs-7/api-viewer/index.html "https://pve.proxmox.com/pve-docs-7/api-viewer/index.html")

## 安装 PVE

参考文档：[Proxmox V虚拟机安装教程](https://flowus.cn/lizong/share/7597aef4-4ae5-4de5-9d36-ac1fe0ae7856#28f4d502-97b6-47f5-a4fe-cc570aedfc5a)

::: warning 注意事项

1、如果U盘已经被当做启动盘使用过，要重新使用U盘装系统，则需要重新制作一次启动盘，制作的时候会自动清空数据，所以倒不用特意格式化U盘。

2、建议安装PVE系统的时候断网安装，等安装完成后再插上网线，因为联网安装的时候可能会导致安装过程卡在自动识别区域的地方，就是命令行停在 `trying to detect country`
:::

DNS 设置：

- 阿里：`233.5.5.5`
- 阿里：`233.6.6.6`
- DNSPOD：`119.29.29.29`

## 删除 local-lvm 分区

PVE 系统在安装的时候默认会把储存划分为 local 和 local-lvm 两个块，实际上不需要，一般会把 local-lvm 删掉，把空间都合并到 local 里面。

参考文档：[PVE虚拟机删除local-lvm分区](https://blog.csdn.net/u012514495/article/details/127318440)

## 更换 PVE 源

参考文档：[Proxmox VE 8 换源](https://blog.fallenbreath.me/zh-CN/2023/pve8-change-sourceslist/)

::: info 注意事项

不管更新什么源，首先必须备份原始源文件，非常重要！！！
:::

## 安装后的问题

### vim 编辑的上下左右变成了ab

**问题描述**：PVE 安装之后，使用 vi 操作编辑文件的时候，上下左右移动光标的时候无法移动，而是输入了ab字母。

方案一：修改设置

参考文档：[关于Linux下shell界面按上下左右方向键出现ABD的问题](https://blog.csdn.net/qq_38871408/article/details/80546278)

方案二：重装 vim

参考文档 [Linux vi编辑器上下箭头变成ABCD的问题](https://blog.csdn.net/zz460833359/article/details/117332223)

::: warning 注意

如果你配置好了国内源，那么建议使用重装的方式，因为这样新的 vim 还带有代码高亮，会舒服很多，如果没有更新源，那么就用修改配置的方式，也能解决问题。
:::

### vim 编辑的时候不能复制文本

**问题描述**：vim内容鼠标选中后进入可视模式，无法复制（不过这个问题如果重装过 vim 就不会出现的）

参考文档：[解决vim可视模式无法复制问题](https://blog.csdn.net/kenzo2017/article/details/124362715)

## Nginx 反向代理

如果需要在其他机器上使用 Nginx 反向代理来访问 PVE，可以参考下面的配置：

```nginx
server {
    listen 18006 ssl;
    listen [::]:18006 ssl;
    server_name _;

    ssl_certificate /etc/nginx/conf.d/cert/server.crt;
    ssl_certificate_key /etc/nginx/conf.d/cert/server.key;
    ssl_protocols TLSv1.2;
    ssl_ciphers HIGH:!aNULL:!MD5;

    access_log  /var/log/nginx/pve.access.log;
    error_log   /var/log/nginx/pve.error.log;

    location / {
        proxy_pass https://192.168.0.220:8006;
        proxy_redirect off;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header Host $http_host;
        proxy_set_header X-NginX-Proxy true;

        #下面三项为websocket代理配置，必须，否则pve noVNC无法连接
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_read_timeout 86400;
    }
}
```

::: warning 有坑！！！

如果你代理后可以访问 PVE 的管理页面，但是无法打开服务器的控制台，那就是因为你没有配置websocket代理的原因，上面配置中提到的三条一定要加上。
:::

## PVE8 创建 CT 及配置

参考文档：[Proxmox VE(PVE)8.0使用CT模板创建LXC版docker服务](https://www.iminling.com/2024/03/27/565.html)

## all in one

没事的时候是 all in one，有事的时候就是 all in boom，鸡蛋放在一个篮子里面是一件有风险的事情。

### 安装群晖 DS920+

系统下载和安装参考这个，硬盘直通部分参考下面那个文章，最好是做硬盘直通，把 SATA 盘直通给群晖：[PVE服务器安装黑群晖DS920+](https://www.cnblogs.com/txqdm/p/17944751)

硬盘直通的部分参考这个文章，安装也可以参考，但是不要用这个里面提供的镜像包：[从零开始的all in one之pve安装黑群晖](https://zhuanlan.zhihu.com/p/639066104)

镜像下载：<https://github.com/syno-community/arpl-i18n/releases>

要注意下面这个页面的版本信息和下载的 .pat 文件的版本信息一致才行，不然就会出问题，比如下面选择的对应的包是 `DSM_DS920+_69057.pat`

![](https://tendcode.com/cdn/2024/04/202404081302583.png)

### 群晖批量改名脚本

在群晖的控制面板-任务计划中新增计划的任务，然后设置成一次性任务，事件设置成已经过去的时间即可，每次需要重命名的时候就修改一下脚本执行。

```bash
#!/bin/bash

# 自定义正则表达式规则，需要提取数字
regex="乘风踏浪-([0-9]+)"
# 自定义重命名后的文件名，实际名称会加上剧集和文件后缀
new_name="乘风踏浪S01E"
# 进入剧集目录
cd /volume1/media/电视剧/乘风踏浪/S01

# 遍历所有的文件
for file in *; do
    # 检查是否是文件
    if [ -f "$file" ]; then
        # 获取文件名和后缀
        filename=$(basename -- "$file")
        extension="${filename##*.}"
        filename_noext="${filename%.*}"
        
        # 使用正则表达式提取数字部分
        if [[ "$filename_noext" =~ $regex ]]; then
            number="${BASH_REMATCH[1]}"
        else
            echo "No match found in filename $file"
            continue
        fi

        # 重命名文件
        new_filename="${new_name}${number}.${extension}"
        # 第一次运行先注意这里，确认OK再打开执行一次
        #mv "$file" "$new_filename"
        echo "Renamed $file to $new_filename"
    fi
done
```

执行日志：

![](https://tendcode.com/cdn/2024/04/202404262251701.png)


### emby 刮削配置

需要手动配置一下 hosts 文件，否则 emby 刮削失败，配置如下（可以ping一下这些IP是否有用）：

```text
13.226.34.26 api.themoviedb.org
13.226.34.62 api.themoviedb.org
13.226.34.78 api.themoviedb.org
13.226.34.79 api.themoviedb.org
```
