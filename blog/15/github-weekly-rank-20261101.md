# GitHub 周榜解读 · 2026.10.27–11.01

2026.10.27–11.01 这一期，前 20 里有 8 个是新面孔，它们一周合计涨了约 2.0 万星，占榜单总增量（约 5.0 万⭐）的四成。榜首是一个把 Claude Code 变成 49 人游戏工作室的模板，第 2 名是给国产电视换桌面的 Aerial，第 3 名是 DeepSeek 的推理框架。

## 1. 本期速览

- **榜首**：Donchitos/Claude-Code-Game-Studios 一周 +4,392⭐，靠「49 个 Agent + 74 个技能」把 2 月建的老库推上第一。
- **换血**：20 席里 8 个新上榜，上期冠军 cleanyourtv 直接掉出榜单，只有 12 个项目守住位置。
- **最猛的新项目**：10 月 28 日才建库的 ub-mode，四天涨 3,164⭐，仓库里只有一份 SKILL.md。

| 排名 | 项目 | 周增⭐ | 总星 | 状态 |
| --- | --- | ---: | ---: | --- |
| 1 | [Donchitos/Claude-Code-Game-Studios](https://github.com/Donchitos/Claude-Code-Game-Studios) | +4,392 | 32.1k | 新上榜 |
| 2 | [pengchujin/aerial-tv](https://github.com/pengchujin/aerial-tv) | +4,247 | 8k | 上期 #11 |
| 3 | [deepseek-ai/DeepInfer](https://github.com/deepseek-ai/DeepInfer) | +3,516 | 24.5k | 上期 #2 |
| 4 | [wheresryan22/anatomy](https://github.com/wheresryan22/anatomy) | +3,345 | 23k | 上期 #3 |
| 5 | [unclebob/ub-mode](https://github.com/unclebob/ub-mode) | +3,164 | 5.3k | 新上榜 |
| 6 | [pingdotgg/t3code](https://github.com/pingdotgg/t3code) | +2,966 | 32.6k | 上期 #14 |
| 7 | [xiaoyang111222/cn-math-taxonomy](https://github.com/xiaoyang111222/cn-math-taxonomy) | +2,703 | 5.5k | 新上榜 |
| 8 | [DuarteSantos8/openGym](https://github.com/DuarteSantos8/openGym) | +2,471 | 17.7k | 上期 #9 |
| 9 | [NVIDIA/SkillSpector](https://github.com/NVIDIA/SkillSpector) | +2,439 | 23.5k | 新上榜 |
| 10 | [HeyPuter/everything](https://github.com/HeyPuter/everything) | +2,199 | 5.9k | 上期 #17 |
| 11 | [NVIDIA/OpenShell](https://github.com/NVIDIA/OpenShell) | +2,126 | 20.8k | 上期 #6 |
| 12 | [JustAResearcher/gpu-unlock-ada](https://github.com/JustAResearcher/gpu-unlock-ada) | +2,027 | 4.6k | 新上榜 |
| 13 | [anthropics/knowledge-work-plugins](https://github.com/anthropics/knowledge-work-plugins) | +1,896 | 34k | 上期 #7 |
| 14 | [rddmwmddr/android-ad-cleaner](https://github.com/rddmwmddr/android-ad-cleaner) | +1,851 | 5k | 新上榜 |
| 15 | [storytold/artcraft](https://github.com/storytold/artcraft) | +1,850 | 37.8k | 上期 #4 |
| 16 | [citrolabs/ego-lite](https://github.com/citrolabs/ego-lite) | +1,843 | 20.9k | 新上榜 |
| 17 | [hypit-ai/hypit](https://github.com/hypit-ai/hypit) | +1,759 | 26.8k | 上期 #10 |
| 18 | [ly05010419/MacNativeGames](https://github.com/ly05010419/MacNativeGames) | +1,731 | 6.6k | 上期 #8 |
| 19 | [baidu/Unlimited-OCR](https://github.com/baidu/Unlimited-OCR) | +1,667 | 29.9k | 新上榜 |
| 20 | [vorssaint/vorssaint-utils](https://github.com/vorssaint/vorssaint-utils) | +1,665 | 31.2k | 上期 #15 |

## 2. 本周新上榜

### 2.1 Claude-Code-Game-Studios

[Donchitos/Claude-Code-Game-Studios](https://github.com/Donchitos/Claude-Code-Game-Studios) ｜ 本期 #1 ｜ 周增 4,392⭐ ｜ 总星 32.1k ｜ 建于 2026-02

**把一次 Claude Code 会话，变成一间有 49 个岗位的游戏工作室。**

仓库是一套模板：克隆下来就是你的项目，里面按真实工作室的层级塞进了创意总监、技术总监、制作人，各科室主管（玩法、引擎、美术、音频、叙事、QA、本地化），以及三十多个专精 Agent，配 74 个斜杠命令，从头脑风暴、GDD、架构决策、故事拆解，到代码审查、性能剖析、上线清单都有对应入口。15 个钩子在提交、推送、改资源、读写设计文档时做校验，14 条按路径生效的规则约束玩法、引擎、网络和 UI 代码。`project.yaml` 里的 `modes.rigor` 一个开关控制流程重量，minimal 不强制写 GDD，standard 要 5 个章节，full 要 8 个；作者自己实测过，同一份需求在 standard 下先写 30 份文档再动第一行代码，成品在盲评里反而排最后。要 Claude Code、Python 3 和 bash，Godot 4、Unity、UE5 各有对应的引擎专家，适合想一个人做游戏、又不想代码和设计一起烂掉的人。

### 2.2 ub-mode

[unclebob/ub-mode](https://github.com/unclebob/ub-mode) ｜ 本期 #5 ｜ 周增 3,164⭐ ｜ 总星 5.3k ｜ 建于 2026-10

**Uncle Bob 写的一份「先让它跑，再让它对」的编码纪律。**

整个仓库只有一份 SKILL.md，拷进 `~/.claude/skills/`、`~/.grok/skills/` 或 `~/.cursor/skills/` 就能用 `/ub-mode` 调用。内容分三段：先让它跑起来（懒惰协议、TDD、从第一性原理重新设计、先减后加），再让它正确（修根因、把工作切成可验证的小步、测行为而不是测实现），最后是习惯（记日志、守上下文窗口、清理 worktree、小步提交）。硬指标交给三个配套工具：crapper 算圈复杂度、覆盖率和 CRAP 分数，要求每个函数 CRAP 低于 10；dryer 查结构重复，相似度到 0.8 就报；mutator 跑变异测试，专挑测试漏掉的代码。

### 2.3 cn-math-taxonomy

[xiaoyang111222/cn-math-taxonomy](https://github.com/xiaoyang111222/cn-math-taxonomy) ｜ 本期 #7 ｜ 周增 2,703⭐ ｜ 总星 5.5k ｜ 建于 2026-10

**把中小学数学、英语、物理拆成知识点和先修边，做成一张能往回追的诊断图。**

数学 870 个知识点、1,459 条先修边、3,627 道题，覆盖小学到高中数学的必修与选择性必修；英语单独成图，小学到高中 791 个点；初中与高中物理另算，用到的数学写在 `mathLinks` 字段里而不连先修边。对齐的是 2022 年版（2025 修订）义务教育课标和 2017 年版 2025 修订高中课标，教材用人教 A 版与人教 PEP。真正的用法是「自适应前置诊断」：答错一道题，系统沿先修边一路回溯，告诉你真正卡住的是哪个小学知识点。作者在 README 里写得很直白：这是 AI 生成的初稿、没有教师审核，先修边该不该存在、高中与英语题的对错，都还要一线教师复核。

![知识图谱：配方法附近的先修关系](https://cdn.jsdelivr.net/gh/Hopetree/blog-img@main/2026/gh-weekly-rank/20261101/7-cn-math-taxonomy-explore.png)

### 2.4 SkillSpector

[NVIDIA/SkillSpector](https://github.com/NVIDIA/SkillSpector) ｜ 本期 #9 ｜ 周增 2,439⭐ ｜ 总星 23.5k ｜ 建于 2026-03

**装技能之前先扫一遍：NVIDIA 的 Agent 技能安全扫描器。**

它要回答的问题很直接——这个 skill 装上去安全吗。输入可以是 Git 仓库、URL、zip、目录或单个文件，分析分两段：先跑静态检查，71 条漏洞模式覆盖提示词注入、数据外泄、提权、供应链、过度代理、记忆投毒、MCP 工具投毒等 17 类，带 AST 与 YARA 规则；需要时再叠加 LLM 语义评估，最后给出 0–100 的风险分和处置建议，输出支持终端、JSON、Markdown 和 SARIF。它引用自己的数据集：3.1 万个技能里 26.1% 存在漏洞、5.2% 有恶意意图的迹象。已适配 Claude Code、Codex、Gemini CLI 等技能格式，也能作为 MCP 服务或编辑器扩展在会话里直接调用，是 NVIDIA Verified Skills 流水线的一环。

### 2.5 gpu-unlock-ada

[JustAResearcher/gpu-unlock-ada](https://github.com/JustAResearcher/gpu-unlock-ada) ｜ 本期 #12 ｜ 周增 2,027⭐ ｜ 总星 4.6k ｜ 建于 2026-10

**在官方驱动加载前打开 4090 的 SM 速度选择开关，FP16/BF16 张量吞吐翻倍。**

做法是一个 Linux 内核模块，抢在 NVIDIA 驱动初始化之前改写 SM 的速度选择寄存器，让带 FP32 累加的张量核心跑到满速。作者给出的 RTX 4090 数据是：FP16→FP32 从 165.6 TF/s 到 331.6 TF/s，BF16→FP32 从 165.5 到 330.6，INT8、dp4a 和标量 FP32 基本不变，并且扛过了 PCIe FLR、官方驱动初始化和 CUDA 基准；另有第三方在同一张卡上复现到 160.4 → 320.4。RTX 4070 Ti SUPER 的实验端口也有 95.0 → 189.9 TF/s 的记录。边界要说清楚：这是指令发射速率，不等于应用层 GEMM 或推理的整体加速——同一张卡上的量化 MoE 服务实测没有收益——风险自担，也不是官方支持的功能。

### 2.6 android-ad-cleaner

[rddmwmddr/android-ad-cleaner](https://github.com/rddmwmddr/android-ad-cleaner) ｜ 本期 #14 ｜ 周增 1,851⭐ ｜ 总星 5k ｜ 建于 2026-10

**不 root、不刷机，把国产安卓手机里的广告和营销推送一个个关掉。**

它只拨系统和 App 自带的开关：系统广告与 OAID 跟踪、下拉搜索热榜、负一屏资讯、商店轮播与开屏，通知按渠道关掉「内容与营销」，广告组件用 `pm suspend` 挂起，快应用单独检测关闭。卸载、停用系统应用、改 system 分区这些一概不做，挂起广告包要机主点头，一条命令能还原，搜索、快递提醒、天气预警这些功能保留。四种用法覆盖不同人群：把仓库丢给 AI Agent 让它照 AGENTS.md 跑、只有手机时让聊天 AI 带你点、照清单手动关，或者下载 11 月 1 日刚发的 0.3.0 桌面客户端，插线点几下就行。目前只支持 adb 连接的安卓设备，原生鸿蒙不在范围内。

![四种用法：AI 智能体、聊天 AI、手动清单、桌面客户端](https://cdn.jsdelivr.net/gh/Hopetree/blog-img@main/2026/gh-weekly-rank/20261101/14-android-ad-cleaner-ways.png)

### 2.7 ego-lite

[citrolabs/ego-lite](https://github.com/citrolabs/ego-lite) ｜ 本期 #16 ｜ 周增 1,843⭐ ｜ 总星 20.9k ｜ 建于 2026-04

**一个你和 Agent 各用一半的浏览器，Agent 干活时不抢你的窗口。**

browser-use、agent-browser 这类工具本质上是「桥」：得另开一个浏览器给它驱动，登录态常常带不过去，人和 Agent 还会抢控制权。ego lite 反过来做——同一个浏览器里给 Agent 划出独立的 Space，它在自己的 Space 里跑任务，你在自己的窗口继续刷网页，互不干扰。首次启动可以一键迁移 Chrome 数据，Agent 通过 ego-browser 技能直接用到你真实的登录态和标签页，装完会自动往本机所有 Agent 的技能目录里加上这个技能，也可以 `npx skills add citrolabs/ego-lite` 只装技能。macOS（Apple 芯片与 Intel）和 Windows 可用，Linux 还在路线图上。

![ego lite：你和 Agent 共用一个浏览器](https://cdn.jsdelivr.net/gh/Hopetree/blog-img@main/2026/gh-weekly-rank/20261101/16-ego-lite-banner.png)

### 2.8 Unlimited-OCR

[baidu/Unlimited-OCR](https://github.com/baidu/Unlimited-OCR) ｜ 本期 #19 ｜ 周增 1,667⭐ ｜ 总星 29.9k ｜ 建于 2026-06

**百度的 OCR 模型，把「长文档解析」推到「无限长」。**

2.0 版本 10 月 27 日发布，核心是 SR-SWA（稀疏引用滑动窗口注意力）：把超长序列里的图文注意力压缩到固定大小的工作引用（约 512 token），每步解码的延迟和显存占用几乎不随文档长度增长，等于在有限上下文里做无界解析。作者在几十页的 MPDocBench 和上百页的新基准 MarathonDocBench 上都报了 SOTA，同时放出了权重、Transformers 与 SGLang 推理支持和 Hugging Face demo。适合要批量啃扫描件、合同、试卷、长报表的人；单卡 A800 就能跑，不是端侧小模型。

![Unlimited OCR 2 概览](https://cdn.jsdelivr.net/gh/Hopetree/blog-img@main/2026/gh-weekly-rank/20261101/19-Unlimited-OCR-overview.png)

## 3. 本期观察

交付物从「程序」变成了「给 Agent 读的文件」。

8 个新上榜里，ub-mode 整个仓库只有一份 SKILL.md，Claude-Code-Game-Studios 是 49 个 Agent 定义加 74 个技能，SkillSpector 扫的对象也是技能，ego-lite 装完往技能目录里塞一个 ego-browser。一周涨星最多的几项，交付的不是可执行程序，而是 Markdown、配置和提示词。

榜单的注意力高度集中在编码 Agent 的工作流上。

8 个新项目里，有 6 个直接服务编码或 Agent 场景：游戏工作室模板、编码纪律、技能安全扫描、Agent 浏览器、让 Agent 执行的去广告工具，再加上 DeepSeek 的推理框架。剩下的两个——知识图谱和 GPU 解锁——也都是在给 AI 应用准备原料。

没有爆款，但摊得更平。

榜首 4,392⭐ 只占前 20 总增量的 8.8%，上一期榜首一个人就吃掉三分之一；这期新上榜 8 个项目合计 2.0 万⭐，占四成。增量从「一条帖子带火一个仓库」变成了几十个项目分着涨。

换血依旧很快，能留下的都是成品。

上期冠军 cleanyourtv 这期直接掉出前 20，上期 20 席里只有 12 个还在榜上。守住的那些——Aerial 电视桌面、OpenGym 健身记录、MacNativeGames、vorssaint-utils 菜单栏工具——共同点都是装上就能用，而不是一个还在发酵的想法。

## 4. 数据说明

数据来源。

本文榜单来自 OpenGithubs 维护的 GitHub 周榜（github.com/OpenGithubs/github-weekly-rank），对应 2026.10.27–11.01 这一期。榜单每周更新一次，统计每个项目在这一周内新增的 Star 数。

口径与读法。

按「周新增星数」排序，这个榜天然偏爱刚发布、正在被传播的项目，长期项目除非重新翻红，很难回到前排。总星是源站按 32.1k 这种精度给出的约数，周增星和建库时间都是发布时点的快照，隔几天回看会有出入；几个项目涨幅接近时，排名的先后没有太多额外含义。

对比基准与资料出处。

文中的「新上榜 / 上期 #N」是与上一期（2026.10.20–10.25）逐项对比得出的。每个项目的介绍来自该项目仓库自己的 README；有的 README 除徽章和 logo 外没有合适的截图，配图就相应从简，介绍里没拿到的信息一律不补。
