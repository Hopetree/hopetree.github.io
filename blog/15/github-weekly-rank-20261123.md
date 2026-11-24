# GitHub 周榜解读 · 2026.11.18–11.23

这一期（2026.11.18–11.23）的榜单像一次换血：20 个席位里 11 个是新面孔，前四名合计吃掉全榜近六成的周增星标。上期还在的熟面孔，这期只剩 9 个。

## 1. 本期速览

- **榜首换人**：[ccch1mneyyy/dsh-Go](https://github.com/ccch1mneyyy/dsh-Go) 从上周第 3 升到第 1，周增 23790⭐，总星 29.6k。
- **换手 11 席**：新上榜项目占整张榜的一半以上，其中 6 个是 11 月才建仓的新项目。
- **新项目最猛**：[ItsNotRexed/Leonida](https://github.com/ItsNotRexed/Leonida) 建于 11 月 22 日，一周涨 23717⭐，跟榜首只差 73 星。

| 排名 | 项目 | 周增⭐ | 总星 | 状态 |
|:---:|:---|---:|:---:|:---|
| 1 | [ccch1mneyyy/dsh-Go](https://github.com/ccch1mneyyy/dsh-Go) | 23790 | 29.6k | 上期 #3 |
| 2 | [ItsNotRexed/Leonida](https://github.com/ItsNotRexed/Leonida) | 23717 | 28.2k | icon:star 新上榜 |
| 3 | [facebook/astryx](https://github.com/facebook/astryx) | 17885 | 31.7k | 上期 #4 |
| 4 | [heydamir/unslop](https://github.com/heydamir/unslop) | 13713 | 19.7k | 上期 #5 |
| 5 | [dream-num/univer](https://github.com/dream-num/univer) | 8254 | 31.4k | icon:star 新上榜 |
| 6 | [deepseek-ai/dsh-superagent-prototype](https://github.com/deepseek-ai/dsh-superagent-prototype) | 7950 | 24.4k | 上期 #2 |
| 7 | [huamidev/GestaltX](https://github.com/huamidev/GestaltX) | 4210 | 8.9k | icon:star 新上榜 |
| 8 | [erkamyaman/rust-anything](https://github.com/erkamyaman/rust-anything) | 4011 | 7.3k | icon:star 新上榜 |
| 9 | [zhouxiaoka/autoclip](https://github.com/zhouxiaoka/autoclip) | 3982 | 14.3k | icon:star 新上榜 |
| 10 | [Minireel/HGhub](https://github.com/Minireel/HGhub) | 3350 | 11.6k | 上期 #8 |
| 11 | [CopilotKit/OpenBot](https://github.com/CopilotKit/OpenBot) | 3286 | 13.3k | 上期 #13 |
| 12 | [cursor/plugins](https://github.com/cursor/plugins) | 2720 | 18.7k | icon:star 新上榜 |
| 13 | [DuarteSantos8/openGym](https://github.com/DuarteSantos8/openGym) | 2691 | 23.6k | 上期 #15 |
| 14 | [google-labs-code/stitch-skills](https://github.com/google-labs-code/stitch-skills) | 2683 | 11.3k | icon:star 新上榜 |
| 15 | [deepseek-ai/chat-demo](https://github.com/deepseek-ai/chat-demo) | 2443 | 5.3k | icon:star 新上榜 |
| 16 | [JenkinWoo/sheeridVerify](https://github.com/JenkinWoo/sheeridVerify) | 2218 | 4.2k | icon:star 新上榜 |
| 17 | [wheresryan22/anatomy](https://github.com/wheresryan22/anatomy) | 2167 | 28.9k | 上期 #10 |
| 18 | [patch-gg/pixelfx](https://github.com/patch-gg/pixelfx) | 1920 | 8.9k | 上期 #11 |
| 19 | [kunkundi/crossdesk](https://github.com/kunkundi/crossdesk) | 1896 | 6.6k | icon:star 新上榜 |
| 20 | [KKKKhazix/agent-autoloop](https://github.com/KKKKhazix/agent-autoloop) | 1864 | 6.4k | icon:star 新上榜 |

## 2. 本周新上榜

### 2.1 Leonida

[ItsNotRexed/Leonida](https://github.com/ItsNotRexed/Leonida) ｜ 本期 #2 ｜ 周增 23717⭐ ｜ 总星 28.2k ｜ 建于 2026-11

**把《GTA 6》Xbox 版做成 PC 原生重编译的项目。**

::: tip 说明

整理这篇时该仓库页面已经 404，README、截图和发行说明都取不到。下面只能沿用榜单自己的一行描述，其余信息无法核实。

:::

按榜单的说法，它做的事是把 Xbox 版《GTA 6》的可执行文件重新编译成 PC 能直接运行的原生程序，而不是靠模拟器中间转一层。这类项目通常要把主机的机器码逐段翻译到 x86，再补上图形与输入层，工作量极大；《GTA 6》至今没有 PC 版，也让它的关注度天然带着「先玩为敬」的情绪。仓库建于 11 月 22 日，两天涨了近 2.4 万星，随后页面消失——热度与风险在这类项目上从来不分开。

### 2.2 univer

[dream-num/univer](https://github.com/dream-num/univer) ｜ 本期 #5 ｜ 周增 8254⭐ ｜ 总星 31.4k ｜ 建于 2022-09

**一个能把电子表格、文档、幻灯片塞进你自己产品里的 Office SDK。**

univer 是国产团队做了几年的老项目，思路是「先给你一个能跑的开源表格和文档内核」，再把编辑、计算、协同和文件处理接到你的应用里，数据与权限都留在自己这边。它把能力摊开成 Facade API 和事件，不只给人用，也给产品里的 Agent 用——让 Agent 直接读写单元格，而不是隔着截图猜。

![Univer Office SDK](https://cdn.jsdelivr.net/gh/Hopetree/blog-img@main/2026/gh-weekly-rank/20261123/5-univer-hero.png)

### 2.3 GestaltX

[huamidev/GestaltX](https://github.com/huamidev/GestaltX) ｜ 本期 #7 ｜ 周增 4210⭐ ｜ 总星 8.9k ｜ 建于 2026-11

**iPhone / iPad 上的 MobileGestalt 编辑器，改的是系统里那层「设备能力」开关。**

能改的东西很具体：机型名称、开关机音、充电上限、灵动岛布局、常亮显示、Apple Intelligence 能力标志、Siri 模式，以及单独的区号选择——不少人拿它试的就是国行机型能不能点亮 Apple Intelligence。除了预设，它还有个字段编辑器，可以按类型增删 `CacheExtra` 键值、导入导出 plist，每次写入前自动备份，改坏了能按预设逐项还原。

::: warning 注意

两个硬前提：系统得是 iOS / iPadOS 27.x，26.x 拿不到 MobileGestalt；自己签名要带 App Group，重签时分享扩展不能丢。项目自己也写了「预设只改能力标志，实际效果取决于机型和系统，不保证生效」，动手前先备份。

:::

### 2.4 rust-anything

[erkamyaman/rust-anything](https://github.com/erkamyaman/rust-anything) ｜ 本期 #8 ｜ 周增 4011⭐ ｜ 总星 7.3k ｜ 建于 2026-11

**把应用一块块改写成 Rust，并且每一步都证明「行为没变」。**

它不是代码翻译器，思路反过来：先 `record`，用生成的边界用例、语义陷阱和你自己的输入把原程序的行为录下来；再 `bridge` 生成 Rust crate 和一层保持原 API 的包装；然后你或你的编码 Agent 一块块写 Rust，每写完一块就拿录制结果对一遍，过了才继续。CLI、HTTP 服务和库都支持，源语言覆盖 TypeScript、Python、C、Go、Ruby、Java。

2.0 版拿 Prettier 做了示范：17224 条录制里 15861 条完全由 Rust 跑通，输出逐字节一致，速度快了 19 倍。

![Prettier 与它的 Rust 移植版本对比](https://cdn.jsdelivr.net/gh/Hopetree/blog-img@main/2026/gh-weekly-rank/20261123/8-rust-anything-prettier.gif)

### 2.5 autoclip

[zhouxiaoka/autoclip](https://github.com/zhouxiaoka/autoclip) ｜ 本期 #9 ｜ 周增 3982⭐ ｜ 总星 14.3k ｜ 建于 2025-07

**丢一条链接进去，长视频自动剪成能直接发出去的短视频。**

面向播客、访谈和游戏直播：自动找高光片段、跟住说话的人做重构图、烧字幕、生成封面和标题，一键导出适配 TikTok、Shorts、Reels、YouTube、抖音、小红书和 B 站的规格。剪辑和渲染都在本机跑，不排队也不收月费；不想接云 API 的话，配 Ollama / LM Studio 加 Whisper / SenseVoice 就能全离线跑。

![AutoClip 主界面](https://cdn.jsdelivr.net/gh/Hopetree/blog-img@main/2026/gh-weekly-rank/20261123/9-autoclip-home.jpg)

### 2.6 cursor/plugins

[cursor/plugins](https://github.com/cursor/plugins) ｜ 本期 #12 ｜ 周增 2720⭐ ｜ 总星 18.7k ｜ 建于 2026-01

**Cursor 官方插件仓：一堆按统一清单约定的独立插件目录。**

仓库根目录下一个插件一个文件夹，各带自己的 `.cursor-plugin/plugin.json`。数量最多的是一类第三方服务集成：Gmail、Google Drive / Calendar / Docs / Sheets、GitHub、Playwright、Salesforce、HubSpot、X、Zoom 这些，装完在编辑器里就能直接查邮件、读文档、提 PR。另一类是工作流插件，比如 thermos 做分支深度审查、orchestrate 把大任务拆给多个并行 Agent、ralph-loop 跑自指迭代；想自己写插件，还有 create-plugin 负责脚手架与校验。

### 2.7 stitch-skills

[google-labs-code/stitch-skills](https://github.com/google-labs-code/stitch-skills) ｜ 本期 #14 ｜ 周增 2683⭐ ｜ 总星 11.3k ｜ 建于 2026-01

**Google Stitch 的 Agent Skills 合集，按 Agent Skills 开放标准写。**

仓库把能力拆成三个插件包：stitch-design 管设计、stitch-build 管组件与实现、stitch-utilities 放辅助工具。装法不止一种——Codex 走插件市场（可以用 sparse 只拉需要的目录），Claude Code 和 Cursor 用 `npx plugins add` 装进项目。对同时用好几家编码 Agent 的人来说，它的价值在于一套技能能跨客户端复用，而不是绑死在某个 IDE 上。

### 2.8 chat-demo

[deepseek-ai/chat-demo](https://github.com/deepseek-ai/chat-demo) ｜ 本期 #15 ｜ 周增 2443⭐ ｜ 总星 5.3k ｜ 建于 2026-11

**DeepSeek 官方放出来的静态聊天前端，没有后端，浏览器直连 API。**

功能该有的都有：多会话与自动标题、消息分支切换、重新生成、深度思考、联网搜索与来源引用、附件与语音输入、Markdown 与 KaTeX、Mermaid 图，中英双语加深浅色主题，聊天记录还能导入导出。API key 存在浏览器 localStorage，对话和附件在 IndexedDB，所以它更像一个「自带钥匙的客户端」——不用部署服务端，下载 Release 里的压缩包解压双击 `index.html` 就能用。

### 2.9 sheeridVerify

[JenkinWoo/sheeridVerify](https://github.com/JenkinWoo/sheeridVerify) ｜ 本期 #16 ｜ 周增 2218⭐ ｜ 总星 4.2k ｜ 建于 2026-11

**一个跑在本地的验证流程工作台，给教学和授权测试用。**

Node.js 写的本地 Web 应用：建任务、排队、停止、恢复、删除都点点鼠标，失败的任务删掉可以重提；并发数按配置限流，提交后默认每 5 秒查一次状态。它只上传你自己准备好的 PNG / JPEG / PDF，不生成也不修改证明材料，碰到真人验证由你手动完成。接口那头有访问密码、会话 Cookie、来源检查和写请求令牌挡着，不至于变成一台裸奔的自动化机器。

README 开头把用途写得很死：仅限教学与研究，用真实平台前要拿到授权，不得伪造身份或绕过资格审核。跑起来需要 Node 22.15 以上。

### 2.10 crossdesk

[kunkundi/crossdesk](https://github.com/kunkundi/crossdesk) ｜ 本期 #19 ｜ 周增 1896⭐ ｜ 总星 6.6k ｜ 建于 2026-08

**轻量级跨平台远程桌面，亮点是能直接用浏览器连。**

PC 端填上对端 ID 就能发起连接，支持连接密码、视频编码格式等设置；Web 客户端打开网页就能控远程设备，不用在对面装客户端。底层是作者自己写的 MiniRTC——一个轻量实时音视频库，RFC5245 网络透传、H264 / AV1 软硬编解码、Opus 音频、SRTP 传输加密和拥塞控制都在里面。Windows 10、macOS 14 / 15、Ubuntu 22.04 起步，LGPLv3 协议，服务端有现成的 Docker 镜像。

![CrossDesk Web 客户端](https://cdn.jsdelivr.net/gh/Hopetree/blog-img@main/2026/gh-weekly-rank/20261123/19-crossdesk-web.png)

### 2.11 agent-autoloop

[KKKKhazix/agent-autoloop](https://github.com/KKKKhazix/agent-autoloop) ｜ 本期 #20 ｜ 周增 1864⭐ ｜ 总星 6.4k ｜ 建于 2026-11

**让命令行 Agent 在你离开终端之后继续干活，卡住了才来找你。**

平时用 Claude Code、Codex 这类工具，基本是人守着终端：一关窗口，事情就断。agent-autoloop 把这条链拆成插件——事件来源、Agent、通知通道、上线流水线都能换，内核零外部依赖。装在一台 Windows / macOS / Linux 机器上，一条命令起服务，不用买云服务器也不用开放公网端口；需要你拍板时把卡片推到飞书、钉钉、企微、Slack、Discord 或桌面通知，想看全局进展敲一行命令。接新 Agent 只要一行配置，能接收提示词并打印最后一条回复的命令行工具都行。

![Agent Autoloop 架构](https://cdn.jsdelivr.net/gh/Hopetree/blog-img@main/2026/gh-weekly-rank/20261123/20-agent-autoloop-arch.svg)

## 3. 本期观察

**Agent 工具链占了小半张榜。** dsh-Go、unslop、dsh-superagent-prototype、OpenBot、cursor/plugins、stitch-skills、agent-autoloop 这 7 个都在服务编码 Agent：有的给它装个更顺手的终端，有的提供技能包，有的管它跑完之后收尾。这类项目之前多是零星出现，这期已经能凑出一条完整的链路。

**另一条线是「改机器」。** Leonida 把主机游戏搬回 PC，GestaltX 改 iOS 的设备能力标志，rust-anything 拿 Rust 重写旧代码，crossdesk 重做远程桌面。它们都不做新应用，而是把已有的东西换一种跑法——星标来得快，争议也跟得快。

**增量在收缩，头部却更集中。** 这一期 20 名合计周增 13.5 万⭐，上期是 17.3 万；但前四名的占比从 48.7% 升到 58.7%，前十占到 82.3%。入场门槛也腰斩了：~~3602~~ 1864 星就能排进前 20。

```mermaid
graph LR
    A[全榜周增从 17.3 万降到 13.5 万] --> B[头部四席占近六成增量]
    B --> C[中段项目名次被整体下压]
    C --> D[入榜门槛从 3602 掉到 1864]
    D --> E[新项目更容易挤进 20 强]
    E --> F[本期换手 11 席]
```

**熟面孔掉得也快。** 上期第一名 storytold/craft-anything 周增 28744 星，这期 ~~#1~~ 未上榜；dsh-superagent-prototype 从 ~~21020~~ 7950 星、第 2 滑到第 6。榜单上能连着待几期的，往往是那些每周都有稳定增量的项目，而不是某次爆发。

## 4. 数据说明

榜单来自 OpenGithubs 维护的 GitHub 周榜，这一期统计窗口是 2026.11.18–2026.11.23，每周一更新一次。排名按这一周的星标增量排序，不是总星，也不是活跃度。

这种口径天然偏爱刚发布、刚踩中热点的项目：老项目再稳，一周也难涨几千星；新项目碰上话题，两三天就能进前十。表里的总星是发布时点的快照，按 k 取整过，所以 29.6k 和 28.2k 看着挨得近，实际差着一千多颗。

状态列对比的是上一期（2026.11.10–11.15）的榜单。项目介绍来自各仓库自己的 README；Leonida 的仓库在整理时已经无法访问，只能保留榜单那行描述。

[^src]: 榜单出处：<https://github.com/OpenGithubs/github-weekly-rank>，历史各期按「年/月/日期.md」归档，上一期为 `2026/11/20261116.md`。
