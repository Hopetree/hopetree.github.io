# GitHub 周榜解读 · 2026.10.13–10.18

2026.10.13–10.18 这一期，GitHub 周榜前 20 里换进了 11 个新项目，新上榜的加起来涨了约 4.9 万星。榜首 storytold/artcraft 一周 +17,726⭐，把「用 Rust 重写桌面生产力软件」这条线推到了最前面。下面先看完整榜单，再逐个介绍本期新上榜的项目。

## 1. 本期速览

- **榜首**：storytold/artcraft 从上期第 3 升到第 1，一周 +17,726⭐，它是 ArtCraft 团队那套创作应用里的引擎。
- **换血**：20 席里 11 个新上榜，合计约 +4.9 万⭐；留榜的 9 个项目里只有 artcraft 进了前 3，上期榜首 feder-cr/dots 已经跌出榜单。
- **最猛的新项目**：wheresryan22/anatomy 10 月 12 日才建库，一周 +11,839⭐ 直接冲到第 2，是一个把抽象概念画成机械装置的 Agent 技能。

| 排名 | 项目 | 周增⭐ | 总星 | 状态 |
| --- | --- | --- | --- | --- |
| 1 | [storytold/artcraft](https://github.com/storytold/artcraft) | +17,726 | 31.6k | 上期 #3 |
| 2 | [wheresryan22/anatomy](https://github.com/wheresryan22/anatomy) | +11,839 | 15k | 新上榜 |
| 3 | [storytold/wordcraft](https://github.com/storytold/wordcraft) | +10,884 | 14k | 新上榜 |
| 4 | [vxcontrol/pentagi](https://github.com/vxcontrol/pentagi) | +5,450 | 30.9k | 新上榜 |
| 5 | [mksglu/context-mode](https://github.com/mksglu/context-mode) | +4,273 | 30.5k | 新上榜 |
| 6 | [DuarteSantos8/openGym](https://github.com/DuarteSantos8/openGym) | +3,977 | 13.1k | 上期 #5 |
| 7 | [tashfeenahmed/freellmapi](https://github.com/tashfeenahmed/freellmapi) | +3,681 | 36.5k | 上期 #12 |
| 8 | [lyogavin/airllm](https://github.com/lyogavin/airllm) | +3,384 | 39.1k | 新上榜 |
| 9 | [cloudflare/security-audit-skill](https://github.com/cloudflare/security-audit-skill) | +3,049 | 30.6k | 上期 #8 |
| 10 | [storytold/cadcraft](https://github.com/storytold/cadcraft) | +2,948 | 5.6k | 新上榜 |
| 11 | [storytold/gridcraft](https://github.com/storytold/gridcraft) | +2,719 | 5.6k | 新上榜 |
| 12 | [tester-army/e2e](https://github.com/tester-army/e2e) | +2,398 | 11.1k | 上期 #4 |
| 13 | [earthtojake/text-to-cad](https://github.com/earthtojake/text-to-cad) | +2,270 | 21.2k | 上期 #13 |
| 14 | [rehan-remade/universal-modder](https://github.com/rehan-remade/universal-modder) | +2,229 | 8.2k | 上期 #7 |
| 15 | [ARahim3/DigUp](https://github.com/ARahim3/DigUp) | +2,214 | 4.5k | 新上榜 |
| 16 | [hypit-ai/hypit](https://github.com/hypit-ai/hypit) | +2,213 | 23k | 上期 #19 |
| 17 | [vorssaint/vorssaint-utils](https://github.com/vorssaint/vorssaint-utils) | +2,072 | 27.9k | 上期 #11 |
| 18 | [robbietilton/Compositor](https://github.com/robbietilton/Compositor) | +1,876 | 17.3k | 新上榜 |
| 19 | [LosaLosSantos/aurelio-finance](https://github.com/LosaLosSantos/aurelio-finance) | +1,858 | 4k | 新上榜 |
| 20 | [vercel-labs/skills](https://github.com/vercel-labs/skills) | +1,703 | 35.4k | 新上榜 |

## 2. 本周新上榜

### 2.1 anatomy

[wheresryan22/anatomy](https://github.com/wheresryan22/anatomy) ｜ 本期 #2 ｜ 周增 11,839⭐ ｜ 总星 15k ｜ 建于 2026-10

**一个让 Agent 把抽象概念画成「真能动的机器」的技能。**

它不是画图工具，而是一套给 Claude Code、Codex、OpenCode 这类编码 Agent 用的技能：你让它解释「令牌桶限流器怎么工作」，它会先给这个概念编一台物理装置——比如一把只有所有弹子都对上才会转动的弹子锁——再用几十个有厚度、有阴影的零件把装置搭出来，配上标题、提示和实时读数，鼠标和键盘都能让它动。输出是 SVG 加 WebGL 着色器，装的时候只要 `npx skills add wheresryan22/anatomy -g`，零依赖、不需要 API Key。做技术讲解、教学插图，或者想让 Agent 把系统结构「画明白」的人可以试试。

![Anatomy 生成的等距机械图：火箭发动机测试台](https://cdn.jsdelivr.net/gh/Hopetree/blog-img@main/2026/gh-weekly-rank/20261018/02-anatomy-raptor-engine-firing.webp)

### 2.2 wordcraft

[storytold/wordcraft](https://github.com/storytold/wordcraft) ｜ 本期 #3 ｜ 周增 10,884⭐ ｜ 总星 14k ｜ 建于 2026-10

**用纯 Rust 从零重写的开源 Word。**

WordCraft 走的是「干净重写」的路线，界面按你熟悉的 Word 来：功能区、样式库、表格、修订、引用和邮件合并都在，能读写 .docx，在 macOS、Windows、Linux、BSD 上原生运行，也能通过 WebAssembly 在浏览器里打开。它和 artcraft、cadcraft、gridcraft 同属 ArtCraft 团队，几款应用共用一套 Rust 架构，都能被 Agent 通过 MCP 驱动。适合不想为办公套件付费、又在意文档格式兼容的人。

![WordCraft 界面：功能区、样式库和导航窗格](https://cdn.jsdelivr.net/gh/Hopetree/blog-img@main/2026/gh-weekly-rank/20261018/03-wordcraft-hero.png)

### 2.3 pentagi

[vxcontrol/pentagi](https://github.com/vxcontrol/pentagi) ｜ 本期 #4 ｜ 周增 5,450⭐ ｜ 总星 30.9k ｜ 建于 2025-01

**自托管的多 Agent 自动化渗透测试系统。**

你用自然语言描述目标和任务，一组分工的 AI Agent 会自己规划，在隔离的 Docker 沙箱里调用 nmap、Metasploit、sqlmap 等 20 多种专业工具，把过程记下来，最后交一份报告。模型可以自己选：十几家云厂商、自建 OpenAI 兼容网关，或者用 Ollama、vLLM 跑本地模型；结果存在 PostgreSQL + pgvector 里，还可以接 Neo4j 知识图谱记录主机、服务和发现。面向安全工程师、渗透测试和研究团队，只限授权范围内的测试。

![PentAGI 概览](https://cdn.jsdelivr.net/gh/Hopetree/blog-img@main/2026/gh-weekly-rank/20261018/04-pentagi-overview.png)

### 2.4 context-mode

[mksglu/context-mode](https://github.com/mksglu/context-mode) ｜ 本期 #5 ｜ 周增 4,273⭐ ｜ 总星 30.5k ｜ 建于 2026-02

**把工具输出挡在上下文窗口之外的 MCP 服务。**

编码 Agent 的上下文是被工具输出吃掉的：一次浏览器快照 56 KB，二十条 issue 59 KB，半小时能烧掉四成窗口。context-mode 的做法是把原始数据放进沙箱，只把结果摘要送进上下文，按项目说明 315 KB 能压到 5.4 KB；每次文件改动、git 操作、任务和决定写进 SQLite，会话被压缩后按需检索回来，模型能接着上次的活干。它支持 17 个客户端，采用 ELv2 许可，商用前需要看清条款。

### 2.5 airllm

[lyogavin/airllm](https://github.com/lyogavin/airllm) ｜ 本期 #8 ｜ 周增 3,384⭐ ｜ 总星 39.1k ｜ 建于 2023-06

**让大模型在 4GB 显存里跑起来的分层推理方案。**

AirLLM 不做量化、蒸馏或剪枝，而是把权重按层流式加载来压低显存占用：70B 模型能塞进单张 4GB 显卡，按项目说明 Kimi K3（2.8T）实测 3.72GB、DeepSeek-V3（671B）约 12GB；2026 年 9 月起还支持小显存微调，125B 模型在 6GB 内训练。代价是速度，本质上是拿时间换空间，适合显存有限、想在本机试大模型的人。

![AirLLM 各版本推理速度对比](https://cdn.jsdelivr.net/gh/Hopetree/blog-img@main/2026/gh-weekly-rank/20261018/08-airllm-time-improvement.png)

### 2.6 cadcraft

[storytold/cadcraft](https://github.com/storytold/cadcraft) ｜ 本期 #10 ｜ 周增 2,948⭐ ｜ 总星 5.6k ｜ 建于 2026-10

**纯 Rust 写的开源 2D/3D CAD。**

CADCraft 复刻的是 AutoCAD 那套工作流：命令行、对象捕捉、图层、标注、填充、块和 DXF 图纸，在 macOS、Windows、Linux、FreeBSD 上原生运行，也能通过 WebAssembly 在浏览器里用。和同门的 WordCraft、GridCraft 一样支持 MCP，Agent 可以直接驱动它画图。项目自己标注为早期开发阶段，适合想尝鲜、或者需要轻量 CAD 又不想背商业授权的人。

![CADCraft 界面：公寓平面图](https://cdn.jsdelivr.net/gh/Hopetree/blog-img@main/2026/gh-weekly-rank/20261018/10-cadcraft-ui-apartment.png)

### 2.7 gridcraft

[storytold/gridcraft](https://github.com/storytold/gridcraft) ｜ 本期 #11 ｜ 周增 2,719⭐ ｜ 总星 5.6k ｜ 建于 2026-10

**纯 Rust 重写的开源 Excel。**

表格、公式、条件格式、迷你图、图表这些 Excel 的日常操作它都有，官方示例里的「季度销售看板」就是用它自己的命令搭出来的。同样是跨 macOS、Windows、Linux、BSD 和浏览器运行，同样能被 Agent 通过 MCP 或命令行驱动。想要本地文件、不想被订阅绑住的表格用户可以关注。

![GridCraft 界面：季度销售看板](https://cdn.jsdelivr.net/gh/Hopetree/blog-img@main/2026/gh-weekly-rank/20261018/11-gridcraft-hero-sales.png)

### 2.8 DigUp

[ARahim3/DigUp](https://github.com/ARahim3/DigUp) ｜ 本期 #15 ｜ 周增 2,214⭐ ｜ 总星 4.5k ｜ 建于 2026-10

**在本机按「内容」搜文件，全程不联网。**

DigUp 用 Google DeepMind 2026 年 10 月开源的 EmbeddingGemma 2，把图片、PDF、文档、录音和视频放进同一个向量空间，所以你可以直接搜「视频里出现斑马的那一秒」「播客里聊到睡眠的那一分钟」「租约里关于宠物的那一条」，还能跨语言——英文查询能找到用孟加拉语或阿拉伯语写的笔记。发票号、错误码这类精确字符串也照样匹配。索引全在本机完成，只在首次下载模型和每天检查更新时联网，没有账号也不上报数据。Mac、Windows、Linux 都有安装包。

### 2.9 Compositor

[robbietilton/Compositor](https://github.com/robbietilton/Compositor) ｜ 本期 #18 ｜ 周增 1,876⭐ ｜ 总星 17.3k ｜ 建于 2026-09

**macOS 上的开源 Photoshop 替代品。**

作者是因为 Photoshop 太贵、GIMP 又用不顺手才自己动手的，所以功能照着 Photoshop 的合成与后期流程来：图层组、全套混合模式、图层蒙版与剪贴蒙版、调整图层、图层效果、非破坏性变换、内容识别填充、克隆图章、文字工具都在，效果由 GPU 渲染。项目开源，可以下载 Xcode 工程自己改功能，目前只支持 Mac，可以装发布版或者 `brew install --cask robbietilton-compositor`。

### 2.10 aurelio-finance

[LosaLosSantos/aurelio-finance](https://github.com/LosaLosSantos/aurelio-finance) ｜ 本期 #19 ｜ 周增 1,858⭐ ｜ 总星 4k ｜ 建于 2026-10

**跑在自己电脑上的财富管理应用，带一个可选的 AI 顾问。**

账户、持仓、成本、分红、房产和负债都能记，还能「穿透」看基金底层到底持有哪些国家、行业和公司；AI 顾问是可选项，走你自己的 OpenRouter Key，数据都留在本地数据库里。需要 Node 22 和 uv，一条 `./start.sh --demo` 就能先用虚构数据试一遍。

![Aurelio 界面演示：净资产构成与月度结余](https://cdn.jsdelivr.net/gh/Hopetree/blog-img@main/2026/gh-weekly-rank/20261018/19-aurelio-banner-light.gif)

### 2.11 vercel-labs/skills

[vercel-labs/skills](https://github.com/vercel-labs/skills) ｜ 本期 #20 ｜ 周增 1,703⭐ ｜ 总星 35.4k ｜ 建于 2026-01

**Agent Skills 生态的包管理 CLI。**

`npx skills add owner/repo` 就能把别人仓库里的技能装进你的编码 Agent，支持 OpenCode、Claude Code、Codex、Cursor 等近 80 个客户端；不想安装也可以 `npx skills use` 直接生成提示词喂给某个 Agent，来源可以是 GitHub、GitLab、Azure Repos、任意 git 地址或本地目录。配套还有 `skills list`、`find`、`update`、`init`、`remove` 这一套子命令。

## 3. 本期观察

**桌面软件的开源重写成了一条主线。** 20 席里有 4 个来自同一个 ArtCraft 团队（artcraft、wordcraft、cadcraft、gridcraft），加上 Compositor 这个 Photoshop 替代品，本周最热的方向是用现代语言重做你天天在用的桌面软件，而且都强调跨平台和本地文件。

**Agent 技能已经是独立的开源品类。** 11 个新上榜里，anatomy 是编码 Agent 的技能、context-mode 是 MCP 服务、vercel-labs/skills 是技能包管理 CLI、pentagi 是多 Agent 系统——四个项目直接服务于 Agent 生态。上期榜单里 skills 类项目还是零星出现，这期已经成组。

**榜单流动性还是很高，但比上期收敛。** 新上榜从上期的 14 个降到 11 个；留榜的 9 个项目里，artcraft 从第 3 冲到第 1，而 e2e、universal-modder、text-to-cad 从第 4、第 7、第 13 位回落到第 12、14、13。爆款项目的半衰期大概就是一两周，能连续两期留在前 20 的，基本都是有真实形态的产品。

**起量速度越来越快。** anatomy、wordcraft、cadcraft、gridcraft、aurelio-finance 都是 10 月 11 日到 12 日才建的库，第一周就进榜，anatomy 更是直接拿到第 2。热度正集中在「发布即引爆」的项目上，慢慢积累的项目在这个榜上越来越难露头。

## 4. 数据说明

**数据来源。** 本文榜单来自 OpenGithubs 维护的 GitHub 周榜（github.com/OpenGithubs/github-weekly-rank），对应 2026.10.13–2026.10.18 这一期。榜单每周更新一次，统计的是每个项目在这一周内新增的 Star 数。

**口径与读法。** 因为是按「周新增星数」排序，这个榜天然偏爱刚发布、正在被传播的项目，长期项目除非重新翻红，否则很难回到前排。榜单里的总星是约数（源站按 31.6k 这样的精度给出），周增星是发布时点的快照，隔几天回看会有出入；项目的建立时间也取自源站条目。

**对比基准与资料出处。** 文中的「新上榜 / 上期 #N」，是和上一期（2026.10.06–10.11）的榜单逐项对比得出的。每个项目的介绍来自该项目仓库自己的 README，个别项目的说明写得比较简略，介绍也就相应从简，没有拿到的信息一律不补。

