# Clash Verge 添加直连规则：让 VPN 流量不被代理劫持

Mac 上同时开着 GlobalProtect VPN 和 Clash Verge 代理时，经常遇到一个尴尬问题：VPN 已经连上了，但访问公司内网的 IP 怎么都通不了。关掉 Clash Verge 立刻恢复，一开代理又断。原因很简单——流量在 Clash 这一层就被"截胡"了，根本没机会走到 VPN 隧道。解决办法是在 Clash Verge 里加几条直连规则，让指定网段绕过代理直接出去。这篇文章记录完整操作。

## 1. 问题现象

先确认是不是同一个问题，通常会有这些表现：

- GlobalProtect 显示已连接，客户端状态正常。
- 浏览器或命令行访问 VPN 网段（比如 `10.x.x.x` 的公司内网服务）超时或连接被拒。
- 关闭 Clash Verge 后，同样的地址立刻能访问。
- Clash Verge 的「连接」页面里能看到这些请求走了代理节点，而不是直连。

只要符合上面任意两条，基本就是流量被 Clash 接管了。

## 2. 原因分析

Clash Verge 开启系统代理或 TUN 模式后，会把本机的流量全部收进自己的处理管道。Clash 按照 rules 逐条匹配，把流量交给不同的出口——代理节点或直连。而 GlobalProtect 的路由表排在这条管道之后，只有当流量被 Clash 以 DIRECT 放行、重新回到系统网络栈时，它才有机会命中 VPN 路由、走进隧道。

所以问题的本质是：**VPN 内网站段在 Clash 的规则里没有明确的直连声明，被默认规则交给了代理**。

解决思路也很直接：在 rules 里把这些网段声明为 DIRECT，让流量绕过代理节点，直接交给系统网络栈，VPN 的路由自然就生效了。

## 3. 打开配置文件

第一步是找到 Clash Verge 的配置编辑入口（对应第一张截图）：

1. 打开 Clash Verge 主界面，切到左侧的「订阅」页面。
2. 找到当前正在使用的配置文件。
3. 点击配置项右侧的编辑图标（铅笔），进入 YAML 编辑器。

打开后看到的就是这份配置的完整内容，包含 `proxies`、`proxy-groups`、`rules` 等段落，我们要改的是 `rules`。

![Clash Verge 打开配置入口](https://cdn.jsdelivr.net/gh/Hopetree/blog-img@main/2026/202608211727676.png)

这里有个细节值得注意：如果你直接改订阅文件，下次订阅更新时修改会被覆盖。Clash Verge Rev 提供了「全局扩展配置」（Global Extend Config），用 merge 方式追加规则，订阅更新不会丢。本文例子两种方式都适用，推荐优先用全局扩展配置。

## 4. 添加直连规则

在 `rules` 列表的最前面（也就是兜底规则 `MATCH` 之前）加上目标网段的直连规则，例如：

```yaml
rules:
  # 优先直连：VPN 内网网段
  - IP-CIDR,10.0.0.0/8,DIRECT,no-resolve
  - IP-CIDR,172.16.0.0/12,DIRECT,no-resolve
  - IP-CIDR,192.168.0.0/16,DIRECT,no-resolve
  - IP-CIDR,100.64.0.0/10,DIRECT,no-resolve

  # ... 原有规则 ...

  # 兜底规则保持原来的代理策略
  - MATCH,你的代理组名
```

保存后 Clash Verge 会自动重载配置，规则立即生效。

![Clash Verge 配置直连规则](https://cdn.jsdelivr.net/gh/Hopetree/blog-img@main/2026/202608211728172.png)

几个要点：

- **`no-resolve`**：IP 规则加这个参数可以跳过 DNS 解析，匹配更快更稳，推荐带上。
- **规则顺序**：Clash 从上往下匹配，命中的第一条生效。直连规则必须放在 `MATCH` 之前，否则永远不会被走到。
- **域名访问**：如果内网服务用域名访问，改用 `DOMAIN-SUFFIX,公司域名,DIRECT` 这种形式：

```yaml
rules:
  - DOMAIN-SUFFIX,example.com,DIRECT
```

- **网段怎么确定**：连上 VPN 后查路由表，内网网段一目了然：

```bash
netstat -rn | grep -i utun
```

或直接在 GlobalProtect 客户端里看分配的虚拟网段。不确定就先把公司网段加进去，别把整个公网都直连了。

## 5. 验证效果

配置生效后按顺序验证：

```bash
ping 10.1.2.3
```

能通就成功了。再打开 Clash Verge 的「连接」页面，访问一次内网地址，确认对应连接显示的是 DIRECT 而不是某个代理节点。

## 6. 补充说明

- **系统代理 vs TUN 模式**：TUN 模式拦截能力更强，即使应用不走系统代理也会被接管，这种情况下直连规则几乎是必须的；只开系统代理时，很多命令行工具默认不走代理，问题可能不明显。
- **DNS 干扰**：如果内网域名解析结果不对，很可能是 Clash 的 DNS 把解析抢走了。用 IP 直连最省事，域名场景考虑在 hosts 里固定解析或单独配置 DNS。
- **订阅更新**：再次强调，直接编辑订阅文件会被更新覆盖，用全局扩展配置（Rev 的 Global Extend Config）更稳妥。