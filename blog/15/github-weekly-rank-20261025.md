# GitHub 周榜解读 · 2026.10.20–10.25

2026.10.20–10.25 这一期，GitHub 周榜前 20 换了 12 个新面孔，新上榜的项目一周合计涨了约 5.9 万星。榜首是一个 10 月 20 日才建库的电视去广告工具，单周 +26,160⭐；第 2 名则是 DeepSeek 自己生产线上跑的推理框架。

## 1. 本期速览

- **榜首**：Gathin23/cleanyourtv 建库第二天就上榜，一周 +26,160⭐，占前 20 名总增量（约 8.0 万⭐）的三分之一。
- **换血**：20 席里 12 个新上榜，比上期多 1 个；上期的前三名 artcraft、anatomy、wordcraft 这期分别落到第 4、第 3、第 13。
- **最猛的新项目**：cleanyourtv 靠一条 740 万浏览的帖子起量，四天里 200 多位贡献者补了 170 多个电视型号的清理清单。

| 排名 | 项目 | 周增⭐ | 总星 | 状态 |
| --- | --- | --- | --- | --- |
| 1 | [Gathin23/cleanyourtv](https://github.com/Gathin23/cleanyourtv) | +26,160 | 31.2k | 新上榜 |
| 2 | [deepseek-ai/DeepInfer](https://github.com/deepseek-ai/DeepInfer) | +9,823 | 21.8k | 新上榜 |
| 3 | [wheresryan22/anatomy](https://github.com/wheresryan22/anatomy) | +5,097 | 20.1k | 上期 #2 |
| 4 | [storytold/artcraft](https://github.com/storytold/artcraft) | +4,638 | 36.3k | 上期 #1 |
| 5 | [akitaonrails/ai-memory](https://github.com/akitaonrails/ai-memory) | +3,408 | 13.2k | 新上榜 |
| 6 | [NVIDIA/OpenShell](https://github.com/NVIDIA/OpenShell) | +2,839 | 19.4k | 新上榜 |
| 7 | [anthropics/knowledge-work-plugins](https://github.com/anthropics/knowledge-work-plugins) | +2,587 | 32.6k | 新上榜 |
| 8 | [ly05010419/MacNativeGames](https://github.com/ly05010419/MacNativeGames) | +2,416 | 5.2k | 新上榜 |
| 9 | [DuarteSantos8/openGym](https://github.com/DuarteSantos8/openGym) | +2,358 | 15.5k | 上期 #6 |
| 10 | [hypit-ai/hypit](https://github.com/hypit-ai/hypit) | +2,341 | 25.3k | 上期 #16 |
| 11 | [pengchujin/aerial-tv](https://github.com/pengchujin/aerial-tv) | +2,316 | 4.3k | 新上榜 |
| 12 | [withmarbleapp/os-taxonomy](https://github.com/withmarbleapp/os-taxonomy) | +2,026 | 7.3k | 新上榜 |
| 13 | [storytold/wordcraft](https://github.com/storytold/wordcraft) | +1,882 | 15.9k | 上期 #3 |
| 14 | [pingdotgg/t3code](https://github.com/pingdotgg/t3code) | +1,863 | 29.8k | 新上榜 |
| 15 | [vorssaint/vorssaint-utils](https://github.com/vorssaint/vorssaint-utils) | +1,843 | 29.7k | 上期 #17 |
| 16 | [anywhere-labs/deepseek-harness-desktop](https://github.com/anywhere-labs/deepseek-harness-desktop) | +1,787 | 32.9k | 新上榜 |
| 17 | [HeyPuter/everything](https://github.com/HeyPuter/everything) | +1,781 | 3.8k | 新上榜 |
| 18 | [earthtojake/text-to-cad](https://github.com/earthtojake/text-to-cad) | +1,684 | 22.9k | 上期 #13 |
| 19 | [cursor/plugins](https://github.com/cursor/plugins) | +1,650 | 13.9k | 新上榜 |
| 20 | [mksglu/context-mode](https://github.com/mksglu/context-mode) | +1,635 | 32.1k | 上期 #5 |

## 2. 本周新上榜

### 2.1 cleanyourtv

[Gathin23/cleanyourtv](https://github.com/Gathin23/cleanyourtv) ｜ 本期 #1 ｜ 周增 26,160⭐ ｜ 总星 31.2k ｜ 建于 2026-10

**用一份提示词让编码 Agent 把电视上的广告和预装应用清掉，再换上 Apple TV 风格的桌面。**

它借的是 Android 电视自带的调试桥：电视和电脑连同一个 Wi-Fi，在电视上打开 USB 调试，把仓库交给 Claude Code、Codex 或 Gemini CLI 这类助手，Agent 会先备份已装应用清单，再用 `pm disable-user` 停掉厂商的遥测、广告服务和推荐位——不卸载任何东西，所以一条命令就能还原——最后编译安装一个约 520 KB 的原生桌面并设为默认主页。作者 10 月 17 日在 X 上发了父母家电视的前后对比，四天里两百多位贡献者补了一百七十多个机型的清单，仓库原先叫 tv-vibehack，19 日才改成现在的名字。支持范围就是 Android TV 和 Google TV，Fire TV 只能做去广告那一半，三星和 LG 的电视系统不适用。

![CleanYourTV 横幅：清理前后的一台 Google TV 桌面](https://cdn.jsdelivr.net/gh/Hopetree/blog-img@main/2026/gh-weekly-rank/20261025/01-cleanyourtv-banner.png)

### 2.2 DeepInfer

[deepseek-ai/DeepInfer](https://github.com/deepseek-ai/DeepInfer) ｜ 本期 #2 ｜ 周增 9,823⭐ ｜ 总星 21.8k ｜ 建于 2026-10

**DeepSeek 把自己生产线上的推理框架开源了。**

撑起 DeepSeek 大规模在线服务的推理框架，这次放出了离线推理版本，目前只支持 DeepSeek-V4.1-Flash 一个模型，但特性清单很硬：FlashMLA、DeepGEMM、DeepEP 等自研算子，Attention DP 加 MoE 专家并行与 EPLB 负载均衡，异步调度、batch 不变推理、确定性采样，以及正则 / JSON Schema / EBNF 结构化输出。硬件同时支持 NVIDIA SM100 和华为昇腾 950，Apache 2.0 授权，代码最早是在 vLLM 基础上长出来的。需要留意它不是一个开箱即用的服务：KV cache、PD 分离、数据并行副本之间的负载均衡都要自己补，适合要做大规模推理部署的团队，而不是想在本机跑个小模型的个人。

![DeepInfer 的 Decode 性能曲线：输出吞吐与单用户速度](https://cdn.jsdelivr.net/gh/Hopetree/blog-img@main/2026/gh-weekly-rank/20261025/02-deepinfer-decode.png)

### 2.3 ai-memory

[akitaonrails/ai-memory](https://github.com/akitaonrails/ai-memory) ｜ 本期 #5 ｜ 周增 3,408⭐ ｜ 总星 13.2k ｜ 建于 2026-05

**让 Claude Code、Codex、Cursor 共用同一份长期记忆。**

编码 Agent 各自都有记忆功能，但笔记只存在一台机器、一个工具里，换个助手或换台电脑，架构和踩过的坑就得重新解释一遍。ai-memory 用生命周期钩子在后台把提示词和工具调用记下来，过了隐私边界再写进一个 Git 仓库里的 Markdown wiki，数据库只是可重建的索引；下一个 Agent 会拿到一份写清「做到哪、什么失败了、还差什么」的交接说明，用 `ai-memory run codex` 启动还能带上上一段会话的可见历史。二十多个 Agent 客户端都能接，团队可以共用一个服务器做知识共享，默认路径完全不用调用大模型，MIT 授权、单二进制部署。

### 2.4 OpenShell

[NVIDIA/OpenShell](https://github.com/NVIDIA/OpenShell) ｜ 本期 #6 ｜ 周增 2,839⭐ ｜ 总星 19.4k ｜ 建于 2026-02

**NVIDIA 出的 Agent 沙箱运行时：给权限，但不给全部权限。**

Agent 好用的前提是能读文件、装包、调 API、用凭证，OpenShell 的做法是把这些能力关进策略里：每个 Agent 跑在隔离沙箱中，内核层面约束它能碰哪些文件、能发哪些系统调用，每次网络连接出沙箱前都要过一遍策略检查，真实凭证不会交给 Agent，只在发往已批准端点的请求里临时注入。策略改动在生效之前还会先做形式化验证，把「新开了哪个主机、用上了哪个凭证」这类风险挑出来等人确认。Linux、Apple 芯片的 macOS 和 WSL 2 都能跑，需要 Docker、Podman 或宿主机虚拟化，另外配了 Python、TypeScript、Go、Rust 四套 SDK。要把自建 Agent 放进生产环境的人值得看一眼。

![OpenShell 横幅：面向自主 Agent 的安全运行时](https://cdn.jsdelivr.net/gh/Hopetree/blog-img@main/2026/gh-weekly-rank/20261025/06-openshell-banner.png)

### 2.5 knowledge-work-plugins

[anthropics/knowledge-work-plugins](https://github.com/anthropics/knowledge-work-plugins) ｜ 本期 #7 ｜ 周增 2,587⭐ ｜ 总星 32.6k ｜ 建于 2026-01

**Anthropic 把 11 个按岗位打包的 Claude 插件开源了。**

每个插件对应一种职能：生产力、销售、客服、产品、市场、法务、财务、数据、企业搜索、生物科研，再加一个专门用来造插件的插件。插件里装的是这个岗位的技能、斜杠命令、子 Agent 和 MCP 连接器——销售插件连 HubSpot、ZoomInfo、Fireflies，财务插件连 Snowflake、Databricks、BigQuery，法务插件连 Box、Egnyte。全部是 Markdown 和 JSON，没有代码也没有构建步骤，所以定制就是改文件：换连接器、把公司的术语和流程塞进技能说明。原本为 Claude Cowork 做的，在 Claude Code 里加一个 marketplace 也能装。

### 2.6 MacNativeGames

[ly05010419/MacNativeGames](https://github.com/ly05010419/MacNativeGames) ｜ 本期 #8 ｜ 周增 2,416⭐ ｜ 总星 5.2k ｜ 建于 2026-10

**不是模拟器：《旷野之息》和《王国之泪》的原生 ARM64 代码直接跑在 Apple 芯片上。**

作者的做法是让游戏自己的 ARM64 代码在 Apple 芯片上直接运行，系统服务相关部分重写，NVN 图形接口用 Metal 重新实现，所以同一份游戏文件能构建出 Mac、iPhone、iPad 上的应用；1.4.3 版在 iPhone 14 和 iPad 上实测过，《王国之泪》在手机上默认 60 帧并用 MetalFX 放大。仓库里不含任何游戏内容，你要自备正版游戏文件和从自己主机 dump 的 `prod.keys`，构建出来的应用只能自用。除两款塞尔达，《任天堂明星大乱斗》《超级马力欧 奥德赛》《猎天使魔女 3》也有社区移植；作者还直说别手动装，把仓库丢给编码 Agent 让它照文档装最省事。

![MacNativeGames：《王国之泪》在海量超宽屏模式下运行](https://cdn.jsdelivr.net/gh/Hopetree/blog-img@main/2026/gh-weekly-rank/20261025/08-macnativegames-botw.png)

### 2.7 aerial-tv

[pengchujin/aerial-tv](https://github.com/pengchujin/aerial-tv) ｜ 本期 #11 ｜ 周增 2,316⭐ ｜ 总星 4.3k ｜ 建于 2026-10

**给国产电视换一块没有广告的 tvOS 风格桌面。**

小米、TCL、创维这些电视的开机首页塞满推荐位和会员角标，Aerial 把首页换成 Apple TV 的样子：底部一排常用 App，往下是应用网格，长按可以移动、折叠成文件夹、隐藏或卸载，还搬来了 Apple TV 的 114 段航拍屏保，电视支持时能播 4K 杜比视界。安装同样走网络 ADB，不用 root、不动系统应用，随时能恢复；懒得折腾可以让 Agent 按仓库里给的提示词装，也可以扫码在手机上拖图标排布。MIT 授权，Android TV 5.0 以上。

![Aerial 首页：底部常用应用与玻璃底板](https://cdn.jsdelivr.net/gh/Hopetree/blog-img@main/2026/gh-weekly-rank/20261025/11-aerial-home.jpg)

### 2.8 os-taxonomy

[withmarbleapp/os-taxonomy](https://github.com/withmarbleapp/os-taxonomy) ｜ 本期 #12 ｜ 周增 2,026⭐ ｜ 总星 7.3k ｜ 建于 2026-07

**把「孩子到底要学什么」拆成 1845 个知识点，还连成了一张先修图。**

这是 Marble 公开的课程知识图谱：1,845 个微知识点、3,941 条「A 依赖 B」的先修边，覆盖数学、科学、英语、历史等 9 个学科，每个点都带大白话解释、掌握标准、类型和大致年龄，并对齐到 NGSS、Common Core、英国国家课程、澳洲 v9、安大略等课程标准。数据是 UTF-8 JSON，带 schema 和 SHA-256 校验，可以直接拿去做学习路径规划、教材对齐，或者当教育类 AI 应用的知识底座。要注意它给的是「该学什么」的结构而不是练习题，教学研究那部分覆盖还不全，这次有 796 个知识点没有对应研究。

### 2.9 t3code

[pingdotgg/t3code](https://github.com/pingdotgg/t3code) ｜ 本期 #14 ｜ 周增 1,863⭐ ｜ 总星 29.8k ｜ 建于 2026-02

**在手机上接管电脑里的编码 Agent。**

T3 Code 把自己定位成「Agent 控制台」：在电脑上装好后，它接管你已经登录的 Claude Code、Codex、Cursor、Grok Build、OpenCode 和 Antigravity，然后用 iOS / Android App、网页或 Electron 桌面端发起任务、看进度、接着聊。作者的说法很直接——不是要卖你什么，只是觉得现成的 Codex 桌面端、Conductor、Claude Desktop 都不够快也不够开放，做不好随时可以 fork。项目还很早期，bug 会有，大功能的 PR 暂时也不怎么收。

### 2.10 DSH Desktop

[anywhere-labs/deepseek-harness-desktop](https://github.com/anywhere-labs/deepseek-harness-desktop) ｜ 本期 #16 ｜ 周增 1,787⭐ ｜ 总星 32.9k ｜ 建于 2026-08

**DeepSeek Harness 的第三方桌面客户端，连桌面外壳本身都是插件。**

上游的 DeepSeek Harness 只有本地 Web UI，这个社区项目把 Host 服务、插件系统和界面一起塞进了原生应用：Windows x64 和 macOS 通用包，下载安装就能用，不用装 Node 也不用敲命令。它固定运行某个上游版本、不改源码，窗口、托盘、终端、更新这些桌面能力自己也是以插件形式接进去的，所以「万物皆插件」不是口号；内置了插件市场，2.0.9 起还带了手机远程控制。README 里写明了与深度求索没有隶属、合作或背书关系，MIT 授权。

![DSH Desktop 首页：DeepSeek Harness 的开源桌面客户端](https://cdn.jsdelivr.net/gh/Hopetree/blog-img@main/2026/gh-weekly-rank/20261025/16-dsh-desktop-hero.png)

### 2.11 everything

[HeyPuter/everything](https://github.com/HeyPuter/everything) ｜ 本期 #17 ｜ 周增 1,781⭐ ｜ 总星 3.8k ｜ 建于 2026-10

**一个仓库，重写全世界的软件。**

HeyPuter 的野心写在标题里：从 Office 到 Slack，从 Photoshop 到 AutoCAD，用开源实现把商业软件逐个替一遍，全部放在一个 monorepo 里。已经能跑的有表格、文档、幻灯片、白板、PDF、笔记、数据库、会议、团队聊天、邮件、通讯录、日历、电子签名这些，每个都有在线 demo 和源码目录，Node 22.12 以上 `npm install && npm run dev` 就能起。听起来离谱，但一周 3.8k 星说明很多人想看看它到底能做到哪一步。

### 2.12 cursor/plugins

[cursor/plugins](https://github.com/cursor/plugins) ｜ 本期 #19 ｜ 周增 1,650⭐ ｜ 总星 13.9k ｜ 建于 2026-01

**Cursor 把官方插件规范和五十多个官方插件一起开源了。**

仓库根目录下每个插件一个文件夹，各自带 `.cursor-plugin/plugin.json` 清单，覆盖开发工具、生产力工具和第三方 SaaS 集成三类：Thermos 做分支级安全与正确性审计，Orchestrate 把大任务拆给并行云 Agent，pstack 是一套「先深挖再动手」的工作流，另外还有 Gmail、Google Drive、Salesforce、GitHub、Playwright 等 MCP 集成。对想给 Cursor 写插件的人来说，这既是官方 spec 的参考实现，也是一堆能直接照抄的样板。

## 3. 本期观察

**一个新仓库几天就能吃掉整个榜。** 榜首 cleanyourtv 一周 +26,160⭐，占了前 20 名总增量（约 8.0 万⭐）的三分之一，而它 10 月 20 日才建库，涨星窗口只有 5 天。第 2 名 DeepInfer 也是 10 月 21 日建的库，第 8 名 MacNativeGames、第 11 名 aerial-tv 同样在 10 月 20 日之后。这期的头部不靠长期积累，靠的是一条被转爆的帖子或者一次厂商发布。

**厂商仓库正在变成发布渠道。** 前 20 里有 4 个来自公司官方：DeepInfer（DeepSeek）、OpenShell（NVIDIA）、knowledge-work-plugins（Anthropic）、cursor/plugins（Cursor），再加上社区做的 DSH Desktop，一共 5 个围绕具体 AI 产品的仓库。代码开源在这里不只是协作方式，更像发布会的一个环节。

**Agent 的基础设施在成形。** 12 个新上榜里，ai-memory 解决跨 Agent 的记忆，OpenShell 解决沙箱与权限，t3code 和 DSH Desktop 解决「人离开电脑也能用 Agent」，cursor/plugins 和 knowledge-work-plugins 解决技能与连接器的分发。六项目标一致：让 Agent 更好用，而不是让模型更聪明。

**榜单换血快，留下来的都是成品。** 20 席里 12 个新面孔，只有 8 个项目守住位置；上期前三名这期分别落到第 4、第 3、第 13。留下的这些形态上都更像能直接用的东西——健身记录、视频复刻、菜单栏工具集、CAD 生成、上下文压缩——而不是一个提示词或一篇宣言。

## 4. 数据说明

**数据来源。** 本文榜单来自 OpenGithubs 维护的 GitHub 周榜（github.com/OpenGithubs/github-weekly-rank），对应 2026.10.20–2026.10.25 这一期。榜单每周更新一次，统计每个项目在这一周内新增的 Star 数。

**口径与读法。** 按「周新增星数」排序，这个榜天然偏爱刚发布、正在被传播的项目，长期项目除非重新翻红，很难回到前排。总星是源站按 31.2k 这种精度给出的约数，周增星和建库时间都是发布时点的快照，隔几天回看会有出入；几个项目涨幅接近时，排名的先后没有太多额外含义。

**对比基准与资料出处。** 文中的「新上榜 / 上期 #N」是与上一期（2026.10.13–10.18）逐项对比得出的。每个项目的介绍来自该项目仓库自己的 README；有的 README 写得简略，有的除徽章和 logo 外没有合适的截图，介绍和配图就相应从简，没有拿到的信息一律不补。
