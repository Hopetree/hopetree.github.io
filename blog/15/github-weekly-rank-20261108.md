# GitHub 周榜解读 · 2026.11.03–11.08

这一周的 GitHub 榜单被两个 10 月底才建仓的项目搅动：一周之内，榜首换了人，入榜门槛又被抬高了一截。下面是 2026.11.03–11.08 的完整排名与逐项解读。

## 1. 本期速览

- **榜首**：`deepseek-ai/dsh-superagent-prototype`，建仓 8 天，总星 16.4k，单周涨 14286⭐。
- **换手**：20 个席位里有 8 个新面孔，与上期持平，但头部的位置几乎全被重置。
- **最猛的新项目**：除榜首外是 `ccch1mneyyy/dsh-Go`（周增 4915⭐）和 `heydamir/unslop`（3945⭐）。

| 排名 | 项目 | 周增⭐ | 总星 | 状态 |
|---|---|---|---|---|
| 1 | [deepseek-ai/dsh-superagent-prototype](https://github.com/deepseek-ai/dsh-superagent-prototype) | 14286 | 16.4k | icon:star 新上榜 |
| 2 | [Donchitos/Claude-Code-Game-Studios](https://github.com/Donchitos/Claude-Code-Game-Studios) | 6071 | 34.5k | 上期 #1 |
| 3 | [ccch1mneyyy/dsh-Go](https://github.com/ccch1mneyyy/dsh-Go) | 4915 | 7.3k | icon:star 新上榜 |
| 4 | [unclebob/ub-mode](https://github.com/unclebob/ub-mode) | 4603 | 6.8k | 上期 #5 |
| 5 | [heydamir/unslop](https://github.com/heydamir/unslop) | 3945 | 7.3k | icon:star 新上榜 |
| 6 | [storytold/craft-anything](https://github.com/storytold/craft-anything) | 3836 | 7.7k | icon:star 新上榜 |
| 7 | [wheresryan22/anatomy](https://github.com/wheresryan22/anatomy) | 3391 | 24.4k | 上期 #4 |
| 8 | [wangzan101/Mika](https://github.com/wangzan101/Mika) | 3339 | 6k | icon:star 新上榜 |
| 9 | [pengchujin/aerial-tv](https://github.com/pengchujin/aerial-tv) | 3316 | 9.3k | 上期 #2 |
| 10 | [DuarteSantos8/openGym](https://github.com/DuarteSantos8/openGym) | 2898 | 19.1k | 上期 #8 |
| 11 | [rddmwmddr/android-ad-cleaner](https://github.com/rddmwmddr/android-ad-cleaner) | 2874 | 6.1k | 上期 #14 |
| 12 | [CopilotKit/OpenBot](https://github.com/CopilotKit/OpenBot) | 2813 | 10k | icon:star 新上榜 |
| 13 | [anhao/ai-pose-gallery-zh](https://github.com/anhao/ai-pose-gallery-zh) | 2667 | 5.8k | icon:star 新上榜 |
| 14 | [vorssaint/vorssaint-utils](https://github.com/vorssaint/vorssaint-utils) | 2655 | 32.7k | 上期 #20 |
| 15 | [HeyPuter/everything](https://github.com/HeyPuter/everything) | 2652 | 6.8k | 上期 #10 |
| 16 | [xiaoyang111222/cn-math-taxonomy](https://github.com/xiaoyang111222/cn-math-taxonomy) | 2353 | 6.4k | 上期 #7 |
| 17 | [deepseek-ai/DeepInfer](https://github.com/deepseek-ai/DeepInfer) | 2205 | 25.2k | 上期 #3 |
| 18 | [NVIDIA/SkillSpector](https://github.com/NVIDIA/SkillSpector) | 2185 | 24.2k | 上期 #9 |
| 19 | [baidu/Unlimited-OCR](https://github.com/baidu/Unlimited-OCR) | 1922 | 30.5k | 上期 #19 |
| 20 | [jakubkrehel/skills](https://github.com/jakubkrehel/skills) | 1920 | 10.6k | icon:star 新上榜 |

## 2. 本周新上榜

### 2.1 dsh-superagent-prototype

[deepseek-ai/dsh-superagent-prototype](https://github.com/deepseek-ai/dsh-superagent-prototype) ｜ 本期 #1 ｜ 周增 14286⭐ ｜ 总星 16.4k ｜ 建于 2026-11

**一个会自己接活的主动式编程 Agent：听 GitHub 的活，开独立会话干完，再回到对话里交 PR。**

它是给单个仓库配的常驻 agent，打包成 DeepSeek Harness 的一个 bundle：监听 GitHub（可选加上飞书），当被允许的人在里面派活时，它开一个 work item，在自己的会话和目录里做，做完回到原对话里回复——通常是一个 pull request。配套的 Web 面板只列出需要人拍板的事。

它同时也在讲一种工作方式：尽量少占用人的注意力。能替整个团队动手的 agent，同样能浪费整个团队的注意力，所以它只在被请求、或团队写下的规则允许时才动。

**这是一份研究原型，不是官方产品。** README 写得很直白：大量工程由 coding agent 完成，可能带 bug、风格不一定统一，也不等同于论文里描述的实现；用之前要先 review、按自己的环境改。想找一个开箱可用的生产级方案，它不合适；想看"自主 agent 长什么样"，它是最新的参考样本。

### 2.2 dsh-Go

[ccch1mneyyy/dsh-Go](https://github.com/ccch1mneyyy/dsh-Go) ｜ 本期 #3 ｜ 周增 4915⭐ ｜ 总星 7.3k ｜ 建于 2026-10

**把 DeepSeek Harness 装进口袋：手机本机能跑，也能遥控你电脑上的 DSH。**

这是一个 Flutter + Kotlin 写的 Android 客户端，AGPL-3.0 开源。它内置了一套 Linux 运行环境，不用 Root、也不用另装 Termux，就能在手机里装好 Ubuntu、Node.js 和 DSH 引擎；不想占手机空间，也可以用 SSH 或 DSHarness Remote 直接连电脑、服务器上的 DSH，两种主机在同一个界面里切换。

用起来比较像"给 agent 配了台手机"：回复中途能插话、排队的消息可以立即发送，做完的过程自动折叠成一行；回复能一键做成分享卡，整段对话也能生成端到端加密的回放链接。横屏和平板有单独的排版，六套主题色，还有 Deepy 和鲸娘两个桌宠会在你确认、跑完、睡觉时换动作。开启权限后，它还能读取屏幕、点按、输入，帮你操作手机上的其他 App。

要求 Android 8 及以上；本机跑引擎建议预留约 1GB 空间。它是社区项目，与 DeepSeek 没有关联，手机操控涉及敏感操作，默认的保护建议保留。

![DSH Go：把 DeepSeek Harness 装进口袋](https://cdn.jsdelivr.net/gh/Hopetree/blog-img@main/2026/gh-weekly-rank/20261108/3-dsh-Go-hero.webp)

### 2.3 unslop

[heydamir/unslop](https://github.com/heydamir/unslop) ｜ 本期 #5 ｜ 周增 3945⭐ ｜ 总星 7.3k ｜ 建于 2026-11

**专治"AI 味"界面的 Agent Skill：先找出 slop，再像设计师做红标一样一轮轮改。**

装进 Claude Code、Codex 或 Google Antigravity 就能用。它把"AI 生成感"拆成了可检查的具体项：紫渐变、发光、emoji 标签、喊话式文案、不均匀的间距。找到之后不是直接动手，而是先从你的产品里定一个方向——性格、世界观、一两个承载颜色的时刻、一个签名细节——再把方案摆给你看，你可以在这个阶段纠偏。

改的顺序是固定的：间距、颜色、图标、文案、字体、布局、细节、视觉、动效。技术栈不限，Next.js、React、Vue、Svelte、Tailwind 或纯 HTML/CSS 都行，甚至只给一个线上链接也能对着改。如果界面本来就不错，它会直接说"别改了"，只提几条小建议——这一点比"无论如何都要重做一遍"的 agent 讨人喜欢。

需要配图素材时，它可以接 fal、Replicate、OpenAI images 这类图像服务，每次付费生成前都会先给你看 prompt 并征求同意。还能生成一段 10 秒以内的方形视频，记录界面"变好看"的过程（需要 Playwright 和 ffmpeg）。

![unslop 逐帧把自己的界面改回有设计感的样子](https://cdn.jsdelivr.net/gh/Hopetree/blog-img@main/2026/gh-weekly-rank/20261108/5-unslop-frames.webp)

### 2.4 craft-anything

[storytold/craft-anything](https://github.com/storytold/craft-anything) ｜ 本期 #6 ｜ 周增 3836⭐ ｜ 总星 7.7k ｜ 建于 2026-11

**看清任何网站、应用或游戏是怎么做的，然后让 AI 照着给你造一个自己的版本。**

引擎是纯 Rust 写的，四步走完：研究原目标（各宽度下的页面、代码、文件、运行方式）、让编码 agent 用你指定的语言和框架新建项目、把成品和原版逐项对比、再按差异继续打磨。第一步和第三步都有证据留痕，不是"看起来差不多"就收工。

Clean room 默认模式很有意思：它不读原目标的代码和文件，只使用访客能看到的东西——截图、可见文字、量出来的布局、颜色、字体、间距。要读代码、反编译，得手动切到 Deep 模式。320 个工具每一个都同时是 CLI 子命令和 MCP 工具，agent 不打开图形界面也能驱动整套流程。

::: tip 限制

它还是 early alpha，支持 macOS、Windows、Linux、FreeBSD 与 Web，构建阶段依赖本机的 Claude Code（Codex、Copilot CLI、Grok Build 等另有适配）。另外，clean room 只是"它自己不看、不给看"，不是操作系统级沙箱，不会隔离你的电脑。

:::

适合想复刻某个产品的交互、或想知道"这东西到底怎么实现的"的人。用它做私有研究没问题，照抄别人的产品去发布是另一回事。

![Craft Anything 的网站项目页：检查结果、构建进度与待批准的步骤](https://cdn.jsdelivr.net/gh/Hopetree/blog-img@main/2026/gh-weekly-rank/20261108/6-craft-anything-project.png)

### 2.5 Mika

[wangzan101/Mika](https://github.com/wangzan101/Mika) ｜ 本期 #8 ｜ 周增 3339⭐ ｜ 总星 6k ｜ 建于 2026-11

**安卓上的本机 AI 助手：说一句话，它在后台屏幕把你的 App 和网页点完。**

最舒服的设计是那块"隐藏的后台屏幕"——它开 App、点按、输入、滚动都在另一块屏幕上进行，你照常用自己的手机，想看的时候点一下小窗。它不依赖任何 App 的 API，像一个真人一样看屏幕找按钮，所以微信、小红书、招聘软件、购物网站一视同仁。README 里给了一串演示：让它读微信群今天聊了什么、找 30 美元以内 4.5 星以上的充电器加进购物车、把某个博主的近期笔记总结一下。

它记得你说过的偏好，也会把做完的任务沉淀成技能，下次更快更稳。每个会话有一个 arm64 的 Linux 沙箱，能跑 Python、Node 和 shell 处理你发过去的文件；电脑上的 AI 工具也能通过 CLI、Skill 或 MCP 给它派活。

没有 Mika 服务器：用自己的模型 key，或者直接登录 ChatGPT、xAI、OpenRouter 账号，对话和运行记录都留在手机上。默认的 Ask 模式只在花钱（下单、支付）前才来问你，其余自己干。要求 Android 11 起，操作 App 需要 12 以上，推荐 14 以上。

![一句话让它打开微信找到联系人并发出消息](https://cdn.jsdelivr.net/gh/Hopetree/blog-img@main/2026/gh-weekly-rank/20261108/8-Mika-demo.gif)

### 2.6 OpenBot

[CopilotKit/OpenBot](https://github.com/CopilotKit/OpenBot) ｜ 本期 #12 ｜ 周增 2813⭐ ｜ 总星 10k ｜ 建于 2026-08

**给"AI 同事"用的可自托管工作台，带企业级治理。**

每个 bot 有自己的一台电脑：浏览器、文件、工具，每个动作先决策、后记录，你可以随时接管。模型自己挑——OpenAI、Claude、Gemini，或者任何 OpenAI 兼容端点，托管在云上还是自己的机房都行；已有的 agent 通过 AG-UI 接进来，工具走 MCP，不同技术栈的 agent 可以待在同一个工作台里。模板是 MIT 的，想白标、想深改都不拦着。

部署分两档：笔记本上装一个自带 Docker 后端的桌面应用就能试；团队用则提供 Helm chart，把前后端和 Intelligence 部署进自己的 Kubernetes。企业版加了公司登录、角色、工具权限、审批和审计，让 agent 在同样的策略下用工具和电脑。

它背后是 CopilotKit——AG-UI 协议的作者，所以接入面比一般的工作台宽：Claude Agent SDK、Microsoft Agent Framework、Google ADK、LangChain、CrewAI 这些都能通过 AG-UI 对接。适合"想让 agent 进团队流程，但数据和模型必须留在自己基础设施上"的场景。

![OpenBot 的分层结构：企业工作台、内置或 AG-UI agent、模型、MCP 工具与部署方式](https://cdn.jsdelivr.net/gh/Hopetree/blog-img@main/2026/gh-weekly-rank/20261108/12-OpenBot-stack.svg)

### 2.7 ai-pose-gallery-zh

[anhao/ai-pose-gallery-zh](https://github.com/anhao/ai-pose-gallery-zh) ｜ 本期 #13 ｜ 周增 2667⭐ ｜ 总星 5.8k ｜ 建于 2026-10

**全中文的 AI 绘画参考图库，外加一个三合一的角色合成台和 ComfyUI 插件。**

原站是日本作者 ギア 做的三个独立参考站（姿势、服装、人像），元数据全是日文。这个仓库把它们合成一个：1439 张素体白模加 1439 张深度图、3224 套服装、1499 位人像，一共 6162 条中文数据、12022 张本地高清图，全部中文化之后，自动拼出来的生图提示词不会混进日文。

实用的是那个合成台：人像、服装、姿势三个槽位各挑一张（姿势槽可以在白模和深度图之间一键切换，深度图直接喂 ControlNet），再挂任意张自定义参考图，拼成一张 1800×1200 的参考图；内置 12 种画风预设和结构化中文提示词，直连 Gemini、GPT Image、通义千问、火山方舟豆包和本地 ComfyUI 出图，记录存在浏览器本地。

仓库本身也是一个即插即用的 ComfyUI 节点包，`git clone` 到 `custom_nodes/` 就能在画布内用选图器挑素材。

::: warning 注意

图库里含 18+ 的素体姿势与内衣、性感穿搭参考，默认由「安全模式」隐藏，未成年人不要解锁。项目声明仅限个人学习、人体动态研究与合法艺术创作，禁止用于换脸、淫秽内容或打包倒卖。

:::

![画廊总览：姿势、服装、人像三个库的统一入口](https://cdn.jsdelivr.net/gh/Hopetree/blog-img@main/2026/gh-weekly-rank/20261108/13-ai-pose-gallery-zh-preview.jpg)

### 2.8 skills

[jakubkrehel/skills](https://github.com/jakubkrehel/skills) ｜ 本期 #20 ｜ 周增 1920⭐ ｜ 总星 10.6k ｜ 建于 2026-07

**一套只盯界面质量的 Agent Skills：可访问性、排版、配色、布局、产品文案。**

它把"把界面做好"这件事拆成十几个各管一段的 skill。`better-interface` 是总入口，从可访问性、布局、文案、排版、颜色和 UI 细节六个维度审一个屏幕、一条流程或整个界面，最后给一份带优先级的报告；`better-ui` 管圆角、光学对齐、阴影、图标状态和动效这些要精确数值的地方；`better-typography` 管字阶、间距、字体特性、换行截断和标点；`better-colors` 能生成调色板、命名语义 token、换算格式、量对比度；`better-accessibility` 对着 WCAG 2.2 查键盘焦点、ARIA、表单与读屏播报；`better-layout` 负责分组、对齐、阅读顺序和译文变长后的伸缩；`better-writing` 管标签、报错、空状态和确认框的措辞。

另有一批是按需手动触发的动作型 skill：`interface-review` 审一个分支或 PR 引入了哪些界面问题，`explain-interface` 从一个线上链接或截图讲清某个效果怎么做的，`break` 把组件在能到达它的各种场景下渲染出来做压力测试，还有 `build-design`、`state-machine`、`variant`、`teardown`、`afk`。

装法很简单：`npx skills add jakubkrehel/skills`，或者作为 Claude Code 插件市场安装。作者常年写界面工程，这些 skill 基本是他文章的方法沉淀。

## 3. 本期观察

**主题高度集中。** 8 个新上榜里，6 个直接围绕 agent：`dsh-superagent-prototype`（agent 接 GitHub 活）、`dsh-Go`（agent 的 Android 客户端）、`Mika`（手机上的操作型 agent）、`OpenBot`（agent 的团队工作台）、`unslop` 和 `skills`（喂给 agent 的 skill 包），`craft-anything` 的构建环节同样靠 coding agent 驱动。前三名全部与"agent 真的动手做事"相关，而不是模型本身。

**形态从"模型"转向"说明书和工作台"。** 上周的爆款还是 `Claude-Code-Game-Studios` 这类把 Claude Code 编排成一支团队，这周直接出现了两个纯 skill 集合（`unslop`、`skills`）。它们的共同点是：不含模型，只提供判断标准和执行流程，价值在于"把某类工作做到及格线之上"的领域知识。再往上，`OpenBot` 这种可自托管、带权限与审计的工作台，说明大家已经开始给 agent 安排"工位"和"上级"了。

**头部被重置，中段被挤出。** 换手数还是 8 个，但性质变了：上期前 20 里掉出去的 8 个项目（`t3code`、`OpenShell`、`knowledge-work-plugins`、`artcraft`、`ego-lite`、`hypit`、`MacNativeGames`、`gpu-unlock-ada`）多数是被两个 10 月底才建仓的新库顶掉的。入榜门槛从 ~~1665~~ 抬到 1920 星，第 20 名比上周贵了 15%。

```mermaid
graph LR
    A[新库首周暴涨] --> B[头部名次重排]
    B --> C[入榜门槛抬升]
    C --> D[中段老项目被挤出]
    D --> E[上期 8 个项目掉出]
```

**爆发速度越来越极端。** 榜首建仓 8 天拿 16.4k 星，一周内的增量就占总星的 87%；第 3 名同样建仓不到 10 天。这类项目的曲线不是"慢慢积累"，而是发布即出圈，随后迅速回落或转为长尾。看这个榜单时，**周增星更像是话题热度计，而不是项目质量的证据**——真正值得看的，是这个项目三周后还在不在榜上。

## 4. 数据说明

**数据来源。** 榜单来自 OpenGithubs 维护的 GitHub 周榜，本期统计窗口是 2026.11.03–11.08，每周一更新一期，逐项给出排名、周增星、总星、建仓时间和一句话简介[^src]。我只取榜单的公开数据，再逐个读项目自己的 README 补介绍。

**怎么读这份榜单。** 排序依据是"一周内新增的 star"，不是总星数。这个口径天然偏爱刚发布、刚有大版本或正好赶上话题事件的项目，沉淀多年的老库很难挤进前列——所以它衡量的是这周谁被讨论得多，而不是谁更值得用。总星数是发布时点的快照，且多为约数（如 16.4k），别拿来做精确对比；表里的「上期 #N」是同一个榜单上一期（2026.10.27–11.01）的名次，可以据此判断一个项目是在升温还是在退潮。

**关于项目介绍。** 所有介绍都基于各仓库 README 的公开说明，没有实测，也不替作者背书。少数项目 README 写得极简、或只有一句 slogan，那样的介绍只能偏简；涉及"限制、前置条件、风险"的部分，我都尽量按原文标了出来，动手之前建议自己再读一遍。

[^src]: 榜单仓库：<https://github.com/OpenGithubs/github-weekly-rank>，本期为 2026.11.08 一期（统计窗口 2026.11.03–2026.11.08），历史各期按 `年/月/<发布日期>.md` 归档。
