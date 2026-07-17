# PVE LXC（CentOS Stream 9）安装 Tailscale（Userspace Networking 模式）实践

## 背景

在 Proxmox VE（PVE）中创建 CentOS Stream 9 LXC 容器后，安装 Tailscale 时，默认会使用 TUN 模式创建 `tailscale0` 网卡。

由于普通 LXC 容器默认没有挂载 `/dev/net/tun`，启动 `tailscaled` 时会出现类似如下错误：

```text
CreateTUN("tailscale0") failed
/dev/net/tun does not exist
```

如果只是希望容器能够加入 Tailnet，用于 SSH、Web 管理等日常使用，无需启用 TUN，可以直接使用 Tailscale 提供的 **Userspace Networking** 模式。

---

## 安装 Tailscale

执行官方安装脚本：

```bash
curl -fsSL https://tailscale.com/install.sh | sh
```

安装完成后，先不要启动 `tailscaled` 服务。

---

## 修改 systemd 配置

不建议直接修改：

```text
/usr/lib/systemd/system/tailscaled.service
```

因为软件升级后，该文件可能会被覆盖。

推荐使用 **systemd Override** 配置：

```bash
systemctl edit tailscaled
```

输入以下内容：

```ini
[Service]
ExecStart=
ExecStart=/usr/sbin/tailscaled \
    --state=/var/lib/tailscale/tailscaled.state \
    --socket=/run/tailscale/tailscaled.sock \
    --port=41641 \
    --tun=userspace-networking
```

其中：

- `ExecStart=`（空值）用于清空原有启动命令；
- 第二个 `ExecStart=` 重新定义启动参数，并增加 `--tun=userspace-networking`。

> **注意：**
>
> Override 文件必须包含 `[Service]` 段，并且必须先使用空的 `ExecStart=` 清除原有配置，否则 systemd 会提示存在多个 `ExecStart` 配置。

保存退出。

---

## 重新加载配置

执行：

```bash
systemctl daemon-reload
systemctl restart tailscaled
systemctl enable tailscaled
```

---

## 登录 Tailscale

执行：

```bash
tailscale up
```

首次运行会输出一个登录地址，例如：

```text
To authenticate, visit:

https://login.tailscale.com/...
```

浏览器打开该链接，登录 Tailscale 账号并完成授权。

---

## 验证状态

查看节点状态：

```bash
tailscale status
```

查看 Tailscale 分配的 IP：

```bash
tailscale ip
```

查看服务状态：

```bash
systemctl status tailscaled
```

查看最终生效的 systemd 配置：

```bash
systemctl cat tailscaled
```

查看最终生效的启动参数：

```bash
systemctl show tailscaled -p ExecStart
```

---

## 注意事项

### 1. `ip a` 看不到 `tailscale0` 网卡

Userspace Networking 模式不会创建虚拟网卡，因此执行：

```bash
ip a
```

只能看到类似：

```text
lo
eth0
```

这是正常现象。

需要通过以下命令查看 Tailscale IP：

```bash
tailscale ip
```

---

### 2. TPM 报错可以忽略

启动时可能看到：

```text
TPM: error opening: stat /dev/tpmrm0: no such file or directory
```

这是因为 LXC 容器没有 TPM 设备，Tailscale 会自动退回到文件存储密钥，不影响正常使用。

---

### 3. 高级功能需要 TUN

Userspace Networking 模式适用于：

- SSH
- Web 服务
- 开发环境
- 日常远程访问

如果需要以下功能：

- Subnet Router（子网路由）
- Exit Node（出口节点）
- 创建 `tailscale0` 网卡
- 内核态 WireGuard

则需要在 PVE 为 LXC 挂载 `/dev/net/tun`，并使用默认的 TUN 模式启动 `tailscaled`。

---
## PVE LXC 非特权容器配置 TUN 模式

本方案通过在 PVE 宿主机上修改容器配置文件，赋予非特权（Unprivileged）LXC 容器访问内核 /dev/net/tun 设备的权限。

---

### 第一步：在 PVE 宿主机上修改配置

1. 使用 SSH 登录 PVE 宿主机（或在 PVE Web 界面点击节点打开 Shell）。
2. 使用文本编辑器（如 vim）打开目标容器的配置文件。将命令中的 100 替换为你的 LXC 容器 ID：

```
vim /etc/pve/lxc/100.conf
```
3. 连按光标移动到文件最末尾，添加以下两行配置：

```
lxc.cgroup2.devices.allow: c 10:200 rwm
lxc.mount.entry: /dev/net/tun dev/net/tun none bind,create=file
```

4. 保存并退出编辑器：
* 如果使用的是 nano，按 Ctrl + O 然后回车确认保存，再按 Ctrl + X 退出。


5. 重启该 LXC 容器以使配置生效。

---

### 第二步：在 LXC 容器内验证

进入该 LXC 容器的 Shell，执行以下操作进行验证：

1. 检查设备文件状态

```
ls -la /dev/net/tun
```

* 正常输出示例：crw-rw-rw- 1 root root 10, 200 ... /dev/net/tun


2. 核心状态测试（终极测试）

```
cat /dev/net/tun
```

* 预期的正确返回：cat: /dev/net/tun: File descriptor in bad state
* 注：收到此报错（文件描述符状态错误）说明内核已成功响应请求，TUN 设备已完全正常工作。

## 总结

对于运行在 PVE 上的 LXC 容器，如果只是希望快速加入 Tailnet，**Userspace Networking** 是最简单且兼容性最好的方案。

整个过程无需修改 LXC 权限，也无需挂载 `/dev/net/tun`，仅需通过 systemd Override 增加 `--tun=userspace-networking` 参数即可正常运行 Tailscale，非常适合日常开发和运维场景。