# Mac 下 AccessClient（堡垒机）适配踩坑与解决全记录

公司用深信服 AccessClient 当堡垒机客户端，在较新版本的 macOS（26.x / Sequoia）上跑，几乎每个环节都能遇到一个坑。微软把 Remote Desktop 改了名，系统悄悄禁掉了老旧 SSH 算法，用户的配置文件还默默覆盖着代码里的默认值——三个问题，三个根源，逐一记录在这里。

## 1. 背景与环境

- **客户端**：AccessClient（位于 `/Applications/AccessClient.app`）
- **Mac OS 版本**：macOS 26.x 及更新版本（已移除 Python 2，OpenSSH 禁用老旧加密算法）
- **默认 Shell**：Zsh，默认终端为 Terminal.app

## 2. 踩坑记录与解决方案

### 2.1 RDP 报错找不到客户端

点击堡垒机的"打开远程桌面"功能，弹出错误：

> ERROR Microsoft Remote Desktop for Mac not installed, please download and move to Applications directory.

微软已将 Mac 版远程桌面客户端更名为 **Windows App**，但 AccessClient 内部脚本仍在寻找旧名称的可执行文件，检测必然失败。

修改检测脚本之前，先确认本机实际安装的 Windows App 路径存在：

```bash
ll "/Applications/Windows App.app/Contents/MacOS/Windows App"
```

找到 `.app` 所在的真实路径，再进入脚本设置。不同同事可能装的是正式版、Beta 版或旧版，路径各不相同，不要盲目写死。

编辑检测脚本：

```bash
vim /Applications/AccessClient.app/Contents/Resources/Scripts/Loader/loader.py
```

找到 `mrd_exist_in_applications()` 函数，将原路径替换为新的 `Windows App` 路径，同时兼容 Beta 和旧版：

```python
def mrd_exist_in_applications():
    # 新版正式版
    mrd_path = "/Applications/Windows App.app/Contents/MacOS/Windows App"
    # Beta 测试版
    mrd_beta_path = "/Applications/Microsoft Remote Desktop Beta.app/Contents/MacOS/Microsoft Remote Desktop Beta"
    # 兼容旧版未升级同事
    mrd_old_path = "/Applications/Microsoft Remote Desktop.app/Contents/MacOS/Microsoft Remote Desktop"

    return (utils.exist_and_executable(mrd_path) or
            utils.exist_and_executable(mrd_beta_path) or
            utils.exist_and_executable(mrd_old_path))
```

保存退出，重新打开 AccessClient 即可。

### 2.2 SSH 连接瞬间断开

点击"启动 SSH"，终端显示 `connecting ...` 然后瞬间退出，提示：

> add 'HostkeyAlgorithms +ssh-dss' to ~/.ssh/config
> Saving session...completed.

新版 macOS（10.15+）的 OpenSSH 默认禁用了不安全的 DSA（`ssh-dss`）算法，堡垒机或目标服务器仍使用该老旧算法，握手失败自动断开。

编辑 SSH 配置文件：

```bash
vim ~/.ssh/config
```

推荐做法是在 `~/.ssh/config` 末尾追加一个 `Host *` 块，一劳永逸，不需要改动已有配置：

```bash
cat >> ~/.ssh/config << 'EOF'
Host *
    HostkeyAlgorithms +ssh-dss
    PubkeyAcceptedAlgorithms +ssh-dss
EOF
```

> 系统只提示了 `HostkeyAlgorithms`，但在最新版 OpenSSH 中务必同时加上 `PubkeyAcceptedAlgorithms`，否则依然认证失败。

### 2.3 无法自定义终端为 iTerm2

修改 `loader.py` 中的终端路径为 iTerm2，但点击"启动 SSH"时依然唤醒系统自带的 Terminal.app。反复检查脚本确认改对了，还是不生效，说明问题不在脚本里。

继续排查发现 AccessClient 存在**配置优先级**逻辑——用户级配置文件 `~/.local/accessclient.conf` 的优先级高于脚本硬编码。虽然没手动创建过该文件，但 AccessClient 首次运行时会自动生成一份默认配置，里面记着默认的 Terminal 路径。修改 `loader.py` 只改了代码中的默认值，却被用户配置文件覆盖了。

所以正确的做法是修改或创建用户级配置文件：

```bash
vim ~/.local/accessclient.conf
```

如果文件不存在则新建，写入以下 JSON 内容：

```json
{
    "app": {
        "Terminal": "/Applications/iTerm.app/Contents/MacOS/iTerm2"
    }
}
```

保存退出，**完全退出** AccessClient（需在活动监视器中杀掉进程），重新打开后点击 SSH 即会弹出 iTerm2。

修改 `loader.py` 仅影响代码默认值，用户目录下有同名配置文件时会优先读取配置文件，这是本次问题反复不生效的根本原因。

## 3. 经验总结

| 序号 | 问题现象 | 修改文件 | 核心要点 |
| :--- | :--- | :--- | :--- |
| 1 | RDP 报错找不到客户端 | `loader.py` | 适配微软更名（`Windows App`），兼容 Beta 和旧版路径 |
| 2 | SSH 瞬间断开 | `~/.ssh/config` | 需同时添加 `HostkeyAlgorithms` 和 `PubkeyAcceptedAlgorithms` |
| 3 | 无法自定义终端 | `~/.local/accessclient.conf` | 配置文件优先级高于代码 |

三条心得：

- **优先检查用户配置**。遇到 AccessClient 异常时，先看 `~/.local/accessclient.conf`，避免在脚本里白费力气。
- **新旧兼容性**。macOS 迭代频繁，堡垒机客户端迭代较慢，需要手工适配。
- **SSH 配置原则**。在 `~/.ssh/config` 末尾追加 `Host *` 是最简洁的做法，如果担心安全影响，可改为只针对堡垒机 IP 的 `Host` 块。

遇到问题时按这个思路排查：先看日志和报错 → 定位优先级（用户配置 vs 代码）→ 渐进式修改。