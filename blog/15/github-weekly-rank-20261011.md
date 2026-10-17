# GitHub 周榜解读 · 2026.10.06–10.11

2026.10.06–10.11 这一周，GitHub 周榜的 20 个席位换了 14 张新面孔，新上榜项目合计涨了约 9.3 万星；榜首 feder-cr/dots 单周 +29,362⭐，把「给每个 AI 助手配一台自己的电脑」推到了台前。下面先看完整榜单，再逐个介绍本期新上榜的项目。

## 1. 本期速览

- **榜首**：feder-cr/dots 新上榜即登顶，一周 +29,362⭐，定位是 OpenAI Dots、Grok Bot 这类产品的开源自托管替代。
- **换血**：20 席里 14 个是新上榜（合计约 +9.3 万⭐），只有 6 个项目留榜；上期榜首 laya 退到第 20，上期第 5 的 hypit 退到第 19。
- **最猛的新项目**：前两名 dots（+29,362⭐）和 AnyPS5（+22,512⭐）单周都超过 2.2 万星，一个做 Agent 运行平台、一个做 PS5 程序移植，方向完全不同。

| 排名 | 项目 | 周增⭐ | 总星 | 状态 |
| --- | --- | --- | --- | --- |
| 1 | [feder-cr/dots](https://github.com/feder-cr/dots) | 29,362 | 31.9k | 新上榜 |
| 2 | [boykopovar/AnyPS5](https://github.com/boykopovar/AnyPS5) | 22,512 | 26k | 新上榜 |
| 3 | [storytold/artcraft](https://github.com/storytold/artcraft) | 6,359 | 13.9k | 新上榜 |
| 4 | [tester-army/e2e](https://github.com/tester-army/e2e) | 5,695 | 8.7k | 新上榜 |
| 5 | [DuarteSantos8/openGym](https://github.com/DuarteSantos8/openGym) | 5,050 | 9.1k | 新上榜 |
| 6 | [openai/math](https://github.com/openai/math) | 4,324 | 13.6k | 新上榜 |
| 7 | [rehan-remade/universal-modder](https://github.com/rehan-remade/universal-modder) | 3,777 | 6.3k | 新上榜 |
| 8 | [cloudflare/security-audit-skill](https://github.com/cloudflare/security-audit-skill) | 3,637 | 27.5k | 上期 #8 |
| 9 | [liquidslr/system-design-notes](https://github.com/liquidslr/system-design-notes) | 2,714 | 25.7k | 上期 #19 |
| 10 | [anthropics/knowledge-work-plugins](https://github.com/anthropics/knowledge-work-plugins) | 2,680 | 28.7k | 新上榜 |
| 11 | [vorssaint/vorssaint-utils](https://github.com/vorssaint/vorssaint-utils) | 2,631 | 25.8k | 上期 #11 |
| 12 | [tashfeenahmed/freellmapi](https://github.com/tashfeenahmed/freellmapi) | 2,502 | 32.9k | 新上榜 |
| 13 | [earthtojake/text-to-cad](https://github.com/earthtojake/text-to-cad) | 2,348 | 19k | 新上榜 |
| 14 | [CopilotKit/OpenDots](https://github.com/CopilotKit/OpenDots) | 2,346 | 4.8k | 新上榜 |
| 15 | [pingdotgg/t3code](https://github.com/pingdotgg/t3code) | 2,209 | 26.8k | 新上榜 |
| 16 | [Albert-Weasker/niubigeo](https://github.com/Albert-Weasker/niubigeo) | 2,015 | 6.9k | 新上榜 |
| 17 | [TencentCloud/Octop](https://github.com/TencentCloud/Octop) | 1,940 | 8.5k | 上期 #16 |
| 18 | [pablostanley/yoinks](https://github.com/pablostanley/yoinks) | 1,893 | 5.7k | 新上榜 |
| 19 | [hypit-ai/hypit](https://github.com/hypit-ai/hypit) | 1,769 | 20.8k | 上期 #5 |
| 20 | [NandhaKishorM/laya](https://github.com/NandhaKishorM/laya) | 1,704 | 32.1k | 上期 #1 |

## 2. 本周新上榜

### 2.1 dots

[feder-cr/dots](https://github.com/feder-cr/dots) ｜ 本期 #1 ｜ 周增 29,362⭐ ｜ 总星 31.9k ｜ 建于 2026-10

**开源、可自托管的 AI 助手平台，卖点是「每个助手都有一台自己的电脑」。**

它是 OpenAI Dots、Grok Bot 这类产品的开源替代：每个 Dot 跑在一台硬件加速的虚拟机上，有自己的 Linux 桌面、持久磁盘和一个保留登录态的 Firefox，所以不容易被反机器人系统识别。让它按月下载店铺发票并把总额发到 Telegram、每天查一遍机票价格写进 CSV 都行，任务可以从网页、命令行、Telegram 或 WhatsApp 触发；做完一遍它会把步骤写成技能，下次直接复用。安装门槛不低，需要 Node 24+、Go 1.25+、硬件虚拟化支持和一个 OpenRouter 的 Key。

### 2.2 AnyPS5

[boykopovar/AnyPS5](https://github.com/boykopovar/AnyPS5) ｜ 本期 #2 ｜ 周增 22,512⭐ ｜ 总星 26k ｜ 建于 2026-08

**把 PS5 可执行程序移植到 Linux 和 Windows 的工具，走重链接路线而不是模拟器。**

项目用一个 relinker 把可执行文件转换成目标系统的原生格式，再配上适合动态链接的系统 prx 库实现，官方还提供了网页版转换器（文件不出本机）。着色器重编译器能产出 SPIR-V，进度页按游戏跟踪库函数与着色器的覆盖情况，兼容性由社区在讨论区逐个提交。项目声明面向互操作、研究与存档目的，不含任何版权软件或固件，采用 GPL-2.0 协议。

### 2.3 artcraft

[storytold/artcraft](https://github.com/storytold/artcraft) ｜ 本期 #3 ｜ 周增 6,359⭐ ｜ 总星 13.9k ｜ 建于 2022-04

**给艺术家用的 AI 图像与视频创作 IDE，思路是先把场景搭好再生成。**

它提供 2D 画布合成、3D 场景编排，以及图生 3D 网格、角色摆姿、背景移除、Kitbashing 等工具，先确定构图、人物和机位，再交给模型出图或出视频，避免纯抽卡式的提示词流程。模型方面既能用自家目录（图像、视频、音乐、3D 网格和世界模型，共 62 个），也能接 Grok、Midjourney、Sora、World Labs 等外部服务。有 Windows 和 macOS 桌面版，适合插画师、设计师和影视内容创作者。

### 2.4 e2e

[tester-army/e2e](https://github.com/tester-army/e2e) ｜ 本期 #4 ｜ 周增 5,695⭐ ｜ 总星 8.7k ｜ 建于 2026-07

**AI 驱动的端到端测试框架：用自然语言描述目标，让 agent 替你操作应用。**

测试里可以直接写「把这个工作区升级到 Pro 套餐」这类指令，agent 会驱动浏览器或移动端模拟器完成操作，再用定位器和断言校验结果。跑过的 agent 步骤会被记录并重放，应用没变化时不再调用模型，不含 agent 步骤的测试则完全不需要模型。Web 端底层是 Playwright（Chromium、Firefox、WebKit），移动端支持 iOS 与 Android 模拟器，`npx e2e init` 就能起步。

![e2e 项目横幅](https://cdn.jsdelivr.net/gh/Hopetree/blog-img@main/2026/gh-weekly-rank/20261011/4-tester-army-e2e-banner.png)

### 2.5 openGym

[DuarteSantos8/openGym](https://github.com/DuarteSantos8/openGym) ｜ 本期 #5 ｜ 周增 5,050⭐ ｜ 总星 9.1k ｜ 建于 2026-07

**自托管的健身与体重记录应用，数据只存在你自己的服务器上。**

可以按星期规划训练、跟着引导界面逐组记录，内置 5,600 多个带动画演示的动作库，支持超级组、热身组、递减组和计时类动作，还能从 FitNotes、Strong、Hevy（CSV 或 API Key）以及 Apple Health 的体重数据导入历史记录。Passkey 登录、手机与电脑同步，`docker compose` 一条命令起服务，另有一个可选的本地 AI 教练（只读、不进 Docker 构建）。AGPL-3.0 协议，没有账号、订阅和广告。

![openGym 项目横幅](https://cdn.jsdelivr.net/gh/Hopetree/blog-img@main/2026/gh-weekly-rank/20261011/5-openGym-banner.png)

### 2.6 math

[openai/math](https://github.com/openai/math) ｜ 本期 #6 ｜ 周增 4,324⭐ ｜ 总星 13.6k ｜ 建于 2026-10

**OpenAI 公开的数学成果库：内部模型产出的手稿与配套证明工件。**

仓库现有 719 篇手稿、归为 372 个成果族，覆盖数论、分析、概率等方向，另外放出了 10 项成果的推理摘要，包括 π 的无理性指数、自由群因子的同构问题等。约 42% 的顶层结果配了 Lean 形式化证明，其余仍在陆续补充。README 明确提醒未经形式化的结果可能有问题，会尽快修复——适合想跟踪 AI 数学能力上限、或者想复现与形式化验证的研究者。

### 2.7 universal-modder

[rehan-remade/universal-modder](https://github.com/rehan-remade/universal-modder) ｜ 本期 #7 ｜ 周增 3,777⭐ ｜ 总星 6.3k ｜ 建于 2026-10

**一套让任意 AI 编程 agent 给你玩的 PC 游戏做 mod 的技能包。**

agent 会先侦察游戏引擎与版本、判断有没有反作弊、读取真实代码，再动手做 mod，用 fal 生成美术、3D 和音效，在游戏里实际验证，剪出展示视频，并把踩过的坑写进共享知识库供后来的 agent 复用。它内置 Unity、Unreal、Source、Bethesda、Minecraft 等引擎的 playbook 和一套硬性安全规则，官方示例包括 Terraria 武器、帝国时代 2 新文明、Minecraft × GTA V 这类混搭玩法。

![universal-modder 项目横幅](https://cdn.jsdelivr.net/gh/Hopetree/blog-img@main/2026/gh-weekly-rank/20261011/7-universal-modder-banner.png)

### 2.8 knowledge-work-plugins

[anthropics/knowledge-work-plugins](https://github.com/anthropics/knowledge-work-plugins) ｜ 本期 #10 ｜ 周增 2,680⭐ ｜ 总星 28.7k ｜ 建于 2026-01

**Anthropic 开源的知识工作者插件仓库：把 Claude 变成你的岗位专家。**

一共 11 个插件，对应生产力、销售、客服、产品、市场、法务、财务、数据、企业搜索、生物研究等岗位，每个插件把该岗位的 skills、MCP 连接器、斜杠命令和子代理打包在一起。它主要为 Claude Cowork 设计，也兼容 Claude Code；全部是 Markdown 加 JSON 文件，没有代码、没有构建步骤，可以直接 fork 改造成自己公司的版本。

### 2.9 freellmapi

[tashfeenahmed/freellmapi](https://github.com/tashfeenahmed/freellmapi) ｜ 本期 #12 ｜ 周增 2,502⭐ ｜ 总星 32.9k ｜ 建于 2026-04

**把几十家厂商的免费额度聚合成一个 OpenAI 兼容端点，自己托管的路由器。**

它汇总 34 家免费 provider、474 个模型族、635 个免费端点，官方估算约合每月 74 亿 token 的免费推理容量；统一的 `/v1` 接口背后有智能路由、故障转移和额度跟踪，各家 Key 用 AES-256-GCM 加密存在本地 SQLite 里，对外的只有一枚统一 token，还顺带提供一个可被 agent 查询的 MCP 服务。Claude Code、Codex 等工具都有对应的一键接入命令；作者限定个人实验用途，免费版的模型目录有 30 天延迟。

![FreeLLMAPI 控制台界面](https://cdn.jsdelivr.net/gh/Hopetree/blog-img@main/2026/gh-weekly-rank/20261011/12-freellmapi-dashboard.png)

### 2.10 text-to-cad

[earthtojake/text-to-cad](https://github.com/earthtojake/text-to-cad) ｜ 本期 #13 ｜ 周增 2,348⭐ ｜ 总星 19k ｜ 建于 2026-04

**给 AI 编程 agent 装 CAD 能力的插件：一句话或一张图，产出可用的三维模型。**

输出 STEP、GLB、STL、3MF 等格式，还能做可制造性检查、生成带标注的工程图纸，并连到常见的 3D 打印、钣金和 CNC 加工服务。支持 Claude Code、Codex、Cursor、Gemini、Grok 等主流 agent，底层是 Python 包 cadgen 加 build123d 与 Open CASCADE 内核，用 uv 管理运行环境。适合做机械设计、硬件原型或小批量制造的人——安装默认带匿名遥测，可以用一条命令关掉。

### 2.11 OpenDots

[CopilotKit/OpenDots](https://github.com/CopilotKit/OpenDots) ｜ 本期 #14 ｜ 周增 2,346⭐ ｜ 总星 4.8k ｜ 建于 2026-10

**CopilotKit 开源的「常驻 AI 同事」模板：一个 agent 一台电脑，能在文字、通话和 Slack 之间切换。**

项目定位是模板而不是托管产品，克隆下来自己部署、自己定义 Dots。每个 Dot 可以借 OpenBot 的容器获得独立的浏览器和文件空间，浏览器、文件、Shell 权限逐个配置；工作文档放在 Space 里，保存前会弹出人工审批卡片，接 MCP 工具时也有「批准并运行」流程，还能通过 Composio 连邮箱和日历。它基于 CopilotKit 与 AG-UI 构建，目前是 alpha，对话能力需要配 CopilotKit Intelligence（托管、本地 Docker 试用或自托管授权）。

### 2.12 t3code

[pingdotgg/t3code](https://github.com/pingdotgg/t3code) ｜ 本期 #15 ｜ 周增 2,209⭐ ｜ 总星 26.8k ｜ 建于 2026-02

**本机 AI 编程 agent 的控制面板：用手机、网页或桌面端远程接管它们。**

T3 Code 支持 Claude Code、Codex、Cursor、Grok Build、OpenCode 和 Google Antigravity，只要这些 CLI 在你电脑上装好并登录过，它就能统一控制，官方提供 iOS、Android 应用、网页端和 Electron 桌面端，一行脚本或 `npx t3@latest` 就能试用。项目来自 pingdotgg 团队，作者强调非常早期、会有 bug，也暂不接受大功能贡献，但代码开源可 fork。

### 2.13 niubigeo

[Albert-Weasker/niubigeo](https://github.com/Albert-Weasker/niubigeo) ｜ 本期 #16 ｜ 周增 2,015⭐ ｜ 总星 6.9k ｜ 建于 2026-09

**开源的 GEO 研究工具：看 AI 到底怎么描述你的品牌、又提到了哪些竞品。**

输入域名后，多个模型各自独立回答，你可以对比不同模型对产品的描述、关联关键词和提到的竞品，每条结论都能回溯到原始回答与引用来源，历史运行结果可对比。v0.3 新增关键词监控模块和 Diff View，支持按小时/天/周跑监测、导入关键词批次并分类。自托管、用自己的模型 API Key、有 Docker 部署方式，Apache-2.0 协议，适合品牌和增长团队做 AI 可见性研究。

![NiubiGEO 模型回答与证据界面](https://cdn.jsdelivr.net/gh/Hopetree/blog-img@main/2026/gh-weekly-rank/20261011/16-niubigeo-screenshot.png)

### 2.14 yoinks

[pablostanley/yoinks](https://github.com/pablostanley/yoinks) ｜ 本期 #18 ｜ 周增 1,893⭐ ｜ 总星 5.7k ｜ 建于 2026-07

**在终端里下载视频的小工具：粘贴链接、选清晰度、结束，没有弹窗和假按钮。**

支持 YouTube、X/Twitter、Instagram、Threads、TikTok 等 1,800 多个站点，也能只留音频；全屏 TUI 用方向键或鼠标操作，文件默认存到下载目录，结束会打印路径。底层复用 yt-dlp 和 ffmpeg，首次运行自动拉取，不需要预装 Python，用 `npx yoinks` 就能试。MIT 协议，作者也提醒下载要遵守各平台条款。

![yoinks 终端界面](https://cdn.jsdelivr.net/gh/Hopetree/blog-img@main/2026/gh-weekly-rank/20261011/18-yoinks-home.png)

## 3. 本期观察

- **主题集中：AI Agent 生态是绝对主线。** 14 个新上榜项目里，dots、OpenDots、universal-modder、text-to-cad、t3code、e2e、knowledge-work-plugins、freellmapi、openai/math、niubigeo 都围绕「给 agent 装能力」或「让 agent 替你干活」，剩下几个（openGym、yoinks）也走自托管、本地优先的路线。
- **形态在变：技能包、插件、模板取代了单仓库应用。** universal-modder、text-to-cad、knowledge-work-plugins 是技能/插件包，OpenDots 是模板而不是产品，e2e 把模型调用做成可回放的测试步骤——大家抢的位置，从「做一个应用」变成了「做 agent 的基础设施」。
- **流动性极高，但退榜不等于变差。** 上期 Top 20 只留下 6 个（#8 原样、#11 原样、#19→#9、#16→#17、#5→#19、#1→#20），不过下滑的 laya 与 hypit 本周仍是正增长（+1,704⭐、+1,769⭐），更多是新概念的注意力虹吸。
- **大厂集体占位。** OpenAI 放数学成果库、Anthropic 开源岗位插件、Cloudflare 的安全审计技能仍在榜上、腾讯云的 Octop 稳在 17 名——基础设施层的选手一多，中小工具的差异化空间会更窄。

## 4. 数据说明

- **数据来源**：排行榜取自开源榜单 [OpenGithubs/github-weekly-rank](https://github.com/OpenGithubs/github-weekly-rank) 的 2026.10.11 期，统计窗口为 2026.10.06–10.11，该榜每周一更新。
- **口径与读数提醒**：榜单按「一周新增 Star 数」排序，因此天然偏爱新项目——成熟项目增速一放缓就会掉出视野；周增与总星都是榜单发布时点的快照，总星显示为约数（如 31.9k），与 GitHub 上的实时数字可能有出入。文中「新上榜」以上一期（2026.10.05 期）的前 20 名为基准。
- **项目资料**：各项目介绍以官方仓库（README 与仓库描述）为准，未采信二手转述；个别项目仓库暂时不可访问、或公开资料较少，介绍会相应简略。
