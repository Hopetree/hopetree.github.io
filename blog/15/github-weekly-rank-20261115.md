# GitHub 周榜解读 · 2026.11.10–11.15

这一周的 GitHub 榜单被三个 10 月底才建仓的项目整个拉高了：前三名的单周增星全部破 2 万，合计吃掉约七万颗星；20 个席位里有 14 个是一个月内新建的仓库。下面是 2026.11.10–11.15 的完整排名与逐项解读。

## 1. 本期速览

- **榜首**：`storytold/craft-anything`，建仓 12 天，总星 32.6k，单周涨 28744⭐，而上期它还只是第 6 名（3836⭐）。
- **换手**：20 个席位里有 6 个新面孔：`astryx`、`Lichii`、`HGhub`、`pixelfx`、`totk-pc-recomp`、`hypit`。
- **最猛的新项目**：`facebook/astryx`，周增 14190⭐，一出场就坐到第 4。

| 排名 | 项目 | 周增⭐ | 总星 | 状态 |
|---|---|---|---|---|
| 1 | [storytold/craft-anything](https://github.com/storytold/craft-anything) | 28744 | 32.6k | 上期 #6 |
| 2 | [deepseek-ai/dsh-superagent-prototype](https://github.com/deepseek-ai/dsh-superagent-prototype) | 21020 | 23.1k | 上期 #1 |
| 3 | [ccch1mneyyy/dsh-Go](https://github.com/ccch1mneyyy/dsh-Go) | 20251 | 22.7k | 上期 #3 |
| 4 | [facebook/astryx](https://github.com/facebook/astryx) | 14190 | 28k | icon:star 新上榜 |
| 5 | [heydamir/unslop](https://github.com/heydamir/unslop) | 12565 | 15.9k | 上期 #5 |
| 6 | [Donchitos/Claude-Code-Game-Studios](https://github.com/Donchitos/Claude-Code-Game-Studios) | 8510 | 39.5k | 上期 #2 |
| 7 | [zortos293/Lichii](https://github.com/zortos293/Lichii) | 6987 | 9.2k | icon:star 新上榜 |
| 8 | [Minireel/HGhub](https://github.com/Minireel/HGhub) | 6593 | 8.8k | icon:star 新上榜 |
| 9 | [wangzan101/Mika](https://github.com/wangzan101/Mika) | 5931 | 8.6k | 上期 #8 |
| 10 | [wheresryan22/anatomy](https://github.com/wheresryan22/anatomy) | 5295 | 27.3k | 上期 #7 |
| 11 | [patch-gg/pixelfx](https://github.com/patch-gg/pixelfx) | 4925 | 7.4k | icon:star 新上榜 |
| 12 | [valentderah/totk-pc-recomp](https://github.com/valentderah/totk-pc-recomp) | 4662 | 7.2k | icon:star 新上榜 |
| 13 | [CopilotKit/OpenBot](https://github.com/CopilotKit/OpenBot) | 4638 | 12.2k | 上期 #12 |
| 14 | [pengchujin/aerial-tv](https://github.com/pengchujin/aerial-tv) | 4491 | 11.8k | 上期 #9 |
| 15 | [DuarteSantos8/openGym](https://github.com/DuarteSantos8/openGym) | 4364 | 21.4k | 上期 #10 |
| 16 | [unclebob/ub-mode](https://github.com/unclebob/ub-mode) | 4311 | 8k | 上期 #4 |
| 17 | [vorssaint/vorssaint-utils](https://github.com/vorssaint/vorssaint-utils) | 4291 | 34.7k | 上期 #14 |
| 18 | [anhao/ai-pose-gallery-zh](https://github.com/anhao/ai-pose-gallery-zh) | 3854 | 7k | 上期 #13 |
| 19 | [rddmwmddr/android-ad-cleaner](https://github.com/rddmwmddr/android-ad-cleaner) | 3776 | 8k | 上期 #11 |
| 20 | [hypit-ai/hypit](https://github.com/hypit-ai/hypit) | 3602 | 29.8k | icon:star 新上榜 |

## 2. 本周新上榜

### 2.1 astryx

[facebook/astryx](https://github.com/facebook/astryx) ｜ 本期 #4 ｜ 周增 14190⭐ ｜ 总星 28k ｜ 建于 2026-01

**在 Meta 内部长大八年的设计系统：150+ React 组件，人和 Agent 走同一套工具链。**

基于 React 19+ 和 StyleX 构建，目前还是 Beta。装法很轻：导几个 CSS、套一个主题，不需要构建插件，也没有 PostCSS 或 Babel 额外配置；组件、主题、CLI 打成一套，自带 neutral、butter、chocolate、matcha、stone、gothic、y2k 七套现成主题，深色模式和品牌级换肤都在里面。

它最明确的态度是"不锁死"：样式虽然用 StyleX 写，消费者仍可以用 className 叠 Tailwind、CSS Modules 或原生 CSS；主题就是一串 CSS 自定义属性覆盖，不用 fork 也不用包一层组件；需要更底层时用 swizzle，把组件源码整个 eject 到自己项目里。API、文档、CLI 是一起设计的，人和 AI 助手查的是同一份参考。

准入门槛写得清楚：需要 React 19 或更高，`react` 与 `react-dom` 是 peer 依赖。README 也提醒，实验组件包不发布到 npm，图表相关的包目前只有 canary 标签。适合已经在 React 19 项目里、想让设计系统和编码 agent 共用一套规则的团队。

![Astryx 的项目横幅](https://cdn.jsdelivr.net/gh/Hopetree/blog-img@main/2026/gh-weekly-rank/20261115/4-astryx-banner.png)

### 2.2 Lichii

[zortos293/Lichii](https://github.com/zortos293/Lichii) ｜ 本期 #7 ｜ 周增 6987⭐ ｜ 总星 9.2k ｜ 建于 2026-11

**实验性的 Switch / Switch 2 模拟器：在 Eglantine、Eden、yuzu、Sudachi 的代码线上继续修兼容性与渲染。**

用 C++ 写成。作者把身份说得很直白：这是独立 fork，不是上游项目的官方版本，也与任天堂没有任何关系。配置目录是独立的（Windows 在 `%APPDATA%\lichii`，Linux 和 macOS 走 XDG），首次以非便携方式启动时会询问是否从 Eden 等模拟器导入配置与存档——想保留原数据就选 Keep Old Data，它只复制、不改动源目录。

兼容性按游戏、硬件和驱动各不相同。作者没有回避：渲染错误、卡顿、崩溃都仍可能发生，自动化测试跑通也不等于游戏画面渲染正确，项目不承诺任何帧率。可用的官方入口只有两个：本仓库的 releases 页，以及只收兼容性报告的 lichii.zortos.me。

::: warning 注意

README 反复强调 Lichii 没有官网，唯一下载入口是 GitHub releases。lichii.org 之类的站点不是这个项目，其中已有被举报安装恶意软件的案例。游戏、密钥与固件都不附带，只能用自己合法获得的文件。

:::

### 2.3 HGhub

[Minireel/HGhub](https://github.com/Minireel/HGhub) ｜ 本期 #8 ｜ 周增 6593⭐ ｜ 总星 8.8k ｜ 建于 2026-11

**不带内容源的通用视频播放器：看什么，全看你导入了哪些插件。**

客户端由 Rust + Tauri 2 + React 写成，把浏览、搜索、播放和个人片库放在一处。支持 HLS 与普通视频，能切线路、清晰度和解析器；片库管本地收藏、观看历史与续播进度，也支持追更和把插件提供的云端列表导进本地。插件用 JavaScript 写，可以从文件、代码、网址或订阅列表导入，更新失败会回滚到上一个可用版本；除了点播，还能接直播、信息流和图文。

边界划得很硬：应用不内置内容源，不分发第三方插件，也不提供官方源列表，第一次用必须自己导入；来源需要登录时，登录入口由对应插件提供。项目当前主要完善 Windows 与 Android，其他平台还在适配。源码公开，但许可是 PolyForm Noncommercial 1.0.0——禁止商业用途，销售、广告变现、卡密、VIP 付费解锁都算在内。

### 2.4 pixelfx

[patch-gg/pixelfx](https://github.com/patch-gg/pixelfx) ｜ 本期 #11 ｜ 周增 4925⭐ ｜ 总星 7.4k ｜ 建于 2026-11

**244 个用代码画出来的像素特效，外加一个教 Claude Code 做特效的 skill。**

每个特效就是一个文件，放在 `src/fx/` 下按分类和名字组织的目录里，没有依赖。在浏览器游戏里直接 import，`createFx` 之后每帧 update 再 draw：颜色走 color 缓冲、发光走 light 缓冲，所以火星是真的会亮。换一个 palette 就能让火变蓝、治疗变粉，不用改代码。给 Godot、Unity、GameMaker 这类引擎用时，用 `tools/render.mjs` 导出透明精灵图和 Aseprite 风格的 JSON（帧矩形、时长、fps、循环、锚点都在里面）。

带角色的 61 个特效额外写了"表演"数据：起手、命中定格、受击位移、收招，十二个动作能串成完整连招；时序就是普通数据，自己的角色也能按同样的 windup / freeze 对齐。附带的 Claude Code skill 可以用这套方法生成新特效，仓库里还有 `tools/new.mjs` 起手模板和 `tools/check.mjs` 检查溢出、接缝与未播种的随机。MIT 许可，商用不限。

### 2.5 totk-pc-recomp

[valentderah/totk-pc-recomp](https://github.com/valentderah/totk-pc-recomp) ｜ 本期 #12 ｜ 周增 4662⭐ ｜ 总星 7.2k ｜ 建于 2026-11

**把《塞尔达传说：王国之泪》静态重编译成 Windows / Linux 原生程序，不是模拟器。**

用 Vulkan 渲染，默认 60 fps，可以开到 144 或跟随显示器刷新率；支持自定义分辨率、超采样和 AMD FSR 1，RTX 显卡上还能开 DLSS / DLAA。另有 HDR10 输出、16:10 / 3:2 / 21:9 / 32:9 这些非常规比例、16 倍各向异性过滤，以及安装期就把着色器编好，省掉进游戏再卡的阶段。安装时它会用你自己的游戏文件在本机构建，之后打模组、开金手指都在 F1 菜单里。

状态写得很诚实：早期开发，Windows 和 Linux 上能玩通，但画面 bug 和崩溃都还会有。README 末尾还提了一句：大部分代码和文档是 AI 编码代理（Claude Code）在维护者指导下写的，每个构建由维护者亲自玩过再决定合入。

::: tip 前置

项目不附带任何游戏文件，需要你从自己的主机导出正版卡带，以及 1.1.0 / 1.2.1 / 1.4.3 里的一个更新版本；作者明确不会提供获取方法。构建出来的程序本身包含游戏内容，只供自用，不能分享。

:::

### 2.6 hypit

[hypit-ai/hypit](https://github.com/hypit-ai/hypit) ｜ 本期 #20 ｜ 周增 3602⭐ ｜ 总星 29.8k ｜ 建于 2026-07

**给编码 Agent 一套"视频语言"：丢进一条爆款视频，它把整条工作流复刻出来。**

装法是 `npx skills add hypit-ai/hypit -g`，之后视频项目可以放在任何目录。给它一条参考视频，它拆出素材、字幕、B-roll 和特效，而且全部按词对齐而不是按秒——这套描述文件叫 SVML，界面上左边是源码，右边是实时渲染的成片。

复刻只是入口：也能从模板起步，或者直接描述想要的视频让 agent 从零写工作流。生成模型是可选项——一条工作流可以只靠字幕、动态图形和代码渲染出的画面拼成视频，不产生模型调用费用。README 举了足球排名、播客片段、街头采访三条样例并给了成本，比如那条 20 秒的足球排名是 1.15 美元。适合按模板批量出短视频的内容团队。

## 3. 本期观察

**主题还是 agent，但从"怎么组织 agent"换到了"agent 干完的活长什么样"。** 6 个新上榜里，`astryx` 的 API、文档、CLI 一起为 agent 设计，`pixelfx` 直接附 Claude Code skill，`hypit` 是给 agent 用的视频工作流语言；再加上延续在榜的 `craft-anything`、`dsh-superagent-prototype`、`dsh-Go`、`unslop`、`OpenBot`、`Mika`，20 个席位大半与 agent 相关。上周的热点是团队、工位、权限这些"组织形态"，这周的热点是产出物：一个界面、一串连招特效、一条成片视频。

**单周爆发越来越极端，榜单快成新品发布栏。** 20 个项目里有 14 个建于 10 月 12 日之后，其中 8 个建于 11 月。`craft-anything` 的周增从 ~~3836~~ 变成 28744⭐，名次从 #6 直接到 #1；`dsh-Go` 从 ~~4915~~ 到 20251⭐；`dsh-superagent-prototype` 从 ~~14286~~ 到 21020⭐。三条曲线都是发布即出圈，之后能不能留住人，得看下几周。

**门槛翻了一倍，中段被整段冲走。** 第 20 名的周增门槛从 ~~1920~~ 抬到 3602 星，接近翻番；上期第 15–20 名的六个项目这周全数掉出榜单，正好由六个新面孔补位。换手数还是 6 个，但这次不是均匀轮换，而是头部先把水位抬高，中段一起被挤出去。

```mermaid
graph LR
    A[前三名单周增星破 2 万] --> B[Top 3 合计约 7 万⭐]
    B --> C[第 20 名门槛升到 3602]
    C --> D[上期第 15–20 名六项全数掉出]
    D --> E[六个新面孔补位]
```

**企业项目与个人项目同场，读的时候要分开看。** `astryx` 是 Meta 开源的设计系统，其余五个都是个人或小团队作品：`Lichii` 接的是 Eden、yuzu 的社区代码，`HGhub` 由个人维护、README 里写明不承诺第三方插件持续可用，`totk-pc-recomp` 是维护者指挥 AI 代理写代码。周榜不区分这些，但大厂开源通常意味着更长的维护期，个人项目可能随时停更——热度和可持续性是两件事。

## 4. 数据说明

**数据来源。** 榜单来自 OpenGithubs 维护的 GitHub 周榜，本期统计窗口是 2026.11.10–11.15，每周一更新一期，逐项给出排名、周增星、总星、建仓时间和一句话简介[^src]。介绍部分都来自各项目自己的 README，我按原文核对后再写。

**怎么读这份榜单。** 排序依据是"一周内新增的 star"，不是总星数。这个口径天然偏爱刚发布、刚有大版本、或者正好赶上话题事件的项目，沉淀多年的老库很难挤到前列——所以它衡量的是这周谁被讨论得多，而不是谁更值得用。总星是发布时点的快照，且多为约数（比如 32.6k），别拿来做精确对比。表里的「上期 #N」是同一个榜单上一期（2026.11.03–11.08）的名次，可以据此判断一个项目是在升温还是在退潮。

**关于项目介绍。** 所有介绍都基于公开 README，没有实测，也不替作者背书。这周有几个项目 README 写得极简、或者除徽章外没有可用的示意图，那种情况下的介绍只能偏简。涉及限制、前置条件和风险的部分，我都尽量按原文标了出来，动手之前建议自己再读一遍。

[^src]: 榜单仓库：[OpenGithubs/github-weekly-rank](https://github.com/OpenGithubs/github-weekly-rank)，本期为 2026.11.15 一期（统计窗口 2026.11.10–2026.11.15），历史各期按「年/月/发布日.md」的路径归档。
