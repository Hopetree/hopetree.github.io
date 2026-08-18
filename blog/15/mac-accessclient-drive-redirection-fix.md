# 堡垒机 Mac 客户端磁盘映射失效排查与修复

公司的堡垒机在 Windows 上支持磁盘映射，把本地文件夹挂到远程机器上；但 Mac 客户端（AccessClient）无论选哪个映射选项，堡垒机里的目标机器都看不到本地盘。这篇文章记录这次问题的完整排查过程、根因和修复方案。

## 1. 问题现象

在堡垒机 Web 页面发起远程桌面会话时，磁盘映射有四个选项：所有磁盘驱动器、主文件夹、文档文件夹、其他文件夹。无论选哪个，在目标机器的资源管理器里都看不到映射出来的本地盘。

Windows 客户端一切正常，问题只在 Mac 端出现。

## 2. 排查过程

### 2.1 先读懂 loader.py

AccessClient 的会话启动逻辑集中在 `Loader/loader.py`，它根据会话类型把连接分派给不同的桌面客户端：

- `MstscLoader`：旧版 osxrdp 远程桌面
- `MrdLoader`：新版 Microsoft Remote Desktop（MRD）
- `SecurecrtLoader`：SecureCRT
- `GuiPlayerLoader`：Java 图形代理

选择 RDP 用哪个 Loader 的逻辑在 `get_mstsc_loader()`：

```python
def get_mstsc_loader():
    if not mac_ver_before_catalina():   # macOS >= 10.15
        return MrdLoader
    if mrd_exist_in_applications():
        return MrdLoader
    return MstscLoader
```

macOS 10.15 及以上直接走 MrdLoader，与是否安装 MRD 无关。

### 2.2 加日志确认走的分支

光看代码不够，在 `get_loader()` 入口加了调试日志，重启 AccessClient 后连接一次，日志立刻给出了关键信息：

```text
[loader.py: 545 get_loader]   app: mstsc
[loader.py: 550 get_loader]   drive_redirection_mode: 2
[loader.py: 551 get_loader]   redirect_folder: None
[loader.py: 562 get_loader]   -> MrdLoader
[loader.py: 127 load] /usr/bin/open .../user@example.rdp
```

确认两点：走的是 MrdLoader；网关把 `drive_redirection_mode: 2`（主文件夹）传下来了，但 `redirect_folder` 是空的。

### 2.3 抓取生成的 .rdp 文件

生成的 .rdp 文件在临时目录且 10 秒后会被自动清理，连接后立刻查看内容，找到了决定性证据：

```text
drivestoredirect:s:
```

`drivestoredirect` 是 RDP 协议里磁盘重定向的配置项，值却是空的。查代码后发现：`MrdLoader.generate_mstsc_cfg()` 的字段映射字典里根本没有 `drive_redirection_mode`，模板文件里 `drivestoredirect:s:` 也是写死的空值。

只有旧版 `MstscLoader` 处理了这两个字段，但它只用于 macOS 10.14 及以下，早已不会走到。

### 2.4 根因结论

```
网关下发 drive_redirection_mode=2
        │
        ▼
MrdLoader 字段映射字典中没有该字段 → 参数被丢弃
        │
        ▼
模板写死 drivestoredirect:s: → .rdp 里磁盘映射为空
        │
        ▼
MRD 无映射可做 → 目标机看不到本地盘
```

## 3. 修复方案

### 3.1 模板加占位符

`template_file.py` 中把写死的空值改成占位符：

```text
drivestoredirect:s:{drivestoredirect}
```

### 3.2 MrdLoader 处理映射模式

在 `MrdLoader.generate_mstsc_cfg()` 中增加映射逻辑，按 Web 页面的模式值转换为 RDP 协议值：

```python
# 处理磁盘映射: 0=无 1=所有磁盘驱动器 2=主文件夹 3=文档文件夹 4=其它文件夹
drive_redirection_mode = self.shterm_data.get("drive_redirection_mode", 0)
redirect_folder = self.shterm_data.get("redirect_folder")
try:
    redirection_mode = int(str(drive_redirection_mode).replace("i:", ""))
except (ValueError, TypeError):
    redirection_mode = 0

if redirection_mode == 1:
    context["drivestoredirect"] = "*"
elif redirection_mode == 2:
    context["drivestoredirect"] = redirect_folder or os.path.expanduser("~")
elif redirection_mode == 3:
    context["drivestoredirect"] = os.path.expanduser("~/Documents")
elif redirection_mode == 4:
    context["drivestoredirect"] = redirect_folder or ""
else:
    context["drivestoredirect"] = ""
```

### 3.3 验证

重启 AccessClient 再连一次，日志和 .rdp 文件都验证通过：

```bash
$ grep drivestoredirect "$TMPDIR/AccessClient.out"
[loader.py: 295 generate_mstsc_cfg] drivestoredirect: /Users/<username>

$ grep drivestoredirect "$TMPDIR/user@example.rdp"
drivestoredirect:s:/Users/<username>
```

## 4. MRD 的磁盘映射机制

修复后还有个现象值得记录：在 Windows App 首选项里只添加了 `~/share` 一个目录时，只有"所有磁盘驱动器"（模式 1）能共享它，其他模式都不行。

这是因为 MRD 的磁盘映射是两层控制：

- 应用首选项是白名单，预先授权 MRD 可以访问哪些目录
- .rdp 文件里的 `drivestoredirect` 是本次会话的请求值

两者取交集，且请求路径需要与白名单精确匹配。模式 1 写入 `*`，语义是"共享白名单内全部目录"；模式 2 写入 `/Users/<username>`，但白名单里没有这个精确路径，MRD 就拒绝共享。这是 MRD 的安全设计，防止任意 .rdp 文件读取磁盘上未被授权的目录。

想让某个模式生效，就在应用首选项白名单里预先添加对应目录。

## 5. 总结

这次排障的关键收获有三点：

- 代码里"存在"的字段处理逻辑未必覆盖所有 Loader 类，`MstscLoader` 处理了磁盘映射不代表 `MrdLoader` 也处理了，排查时要确认实际走的分支
- 日志是定位问题的第一手段，在入口处打调试日志能快速确认会话分派和参数传递
- 客户端软件的"应用设置"往往是与 .rdp 配置配合生效的权限层，排查时不要忽略
