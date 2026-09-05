# 主流 AI Agent 技能与配置加载机制横评

2025 到 2026 年，AI 编程 Agent 从"聊天工具"进化成了"团队同事"，随之而来的是每个工具都长出了一套自己的资源加载机制：技能（Skills）、指令文件（AGENTS.md / CLAUDE.md）、配置与插件。这些机制决定了你的知识资产放在哪里、怎么被加载、谁能共享。本文横向梳理 Claude Code、Codex、ZCode、WorkBuddy、dsh、OpenClaw、OpenCode 七款主流工具，并补充 Gemini CLI、Copilot、Cursor 等，最后用一张总表收拢全部路径。

## 1. 底层共识：三类资源 + 两个标准

先把各家机制的共同骨架拆出来，后面看具体工具会轻松很多。

### 1.1 三类关键资源

第一类是**指令文件**，常驻上下文，告诉 Agent"这个项目怎么工作"：构建命令、代码风格、提交规范。典型代表是 OpenAI 提出的 `AGENTS.md` 和 Anthropic 的 `CLAUDE.md`。

第二类是**技能（Skill）**，按需加载，是"可复用的工作手册"。一个技能就是这样一个目录：

```
<skill-name>/
├── SKILL.md          # 必选：YAML frontmatter + Markdown 正文
├── scripts/          # 可选：可执行脚本
├── references/       # 可选：参考文档
└── templates/        # 可选：模板文件
```

模型先看到技能的名称和描述，只有任务匹配时才把正文读进上下文——这套"渐进式披露"设计把上下文开销压得很低。

第三类是**配置与插件**，控制 Agent 的运行时行为：权限、MCP 服务器、模型提供商、钩子（hooks）、子代理（subagents）。插件通常是可分发、可版本化的打包单元。

### 1.2 两个开放标准

`AGENTS.md` 由 OpenAI 于 2025 年 8 月发布，定位是"给 Agent 看的 README"。它已被超过 6 万个开源项目采用，2025 年 12 月随 Agentic AI Foundation（AAIF，Linux 基金会旗下）成立，与 MCP 一起纳入开放治理，支持者包括 Codex、Cursor、Copilot、Gemini CLI、Aider、Windsurf、Devin 等。

`SKILL.md` 规范由 agentskills.io 维护，只要求 `name` 和 `description` 两个 frontmatter 字段。目前 32+ 款工具兼容，包括 Claude Code、Copilot、Codex、Gemini CLI、Cursor、Windsurf、Goose、Amp 等，因此"写一次，处处跑"成为可能——但注意，格式兼容不等于安装路径兼容。

## 2. Claude Code：生态的源头

Anthropic 的 Claude Code 是这套机制的"发源地"，`SKILL.md`、插件、子代理的概念都从它扩散开。

技能放在两个位置：

- `~/.claude/skills/<name>/SKILL.md` — 个人级，所有项目可见
- `<项目>/.claude/skills/` — 项目级，需接受工作区信任

指令文件是 `CLAUDE.md`，形成三层记忆模型：

- 项目根 `CLAUDE.md`
- 任意嵌套目录的 `CLAUDE.md`
- `~/.claude/CLAUDE.md` — 全局层

配置集中在项目 `.claude/` 目录下：

- `.claude/settings.json` — 项目配置
- `.claude/settings.local.json` — 本地覆盖，不进 git
- `.claude/.mcp.json` — 声明 MCP 服务器

插件是可分发单元，根目录放 `.claude-plugin/plugin.json` 清单，组件如下：

- `skills/` — 技能目录
- `commands/` — 扁平 Markdown 命令
- `agents/` — 子代理定义
- `workflows/` — 脚本工作流
- `hooks/` — 事件钩子
- `output-styles/` — 输出样式
- `.mcp.json` — MCP 服务器配置

只带一个技能的插件可以直接把 `SKILL.md` 放在插件根目录。企业/团队还支持 `agents/<name>.md` 定义专属子代理，技能命名空间为 `plugin:skill`。

## 3. OpenAI Codex：AGENTS.md 的旗手

Codex CLI 是 AGENTS.md 标准的提出方，实现也最完整。

指令文件按"全局 → 仓库根 → 当前目录"层叠加载：

- 先读 `~/.codex/AGENTS.md`（全局）
- 再依次合并项目内各级 `AGENTS.md`
- 同级可用 `AGENTS.override.md` 覆盖

两个可调参数：`project_doc_fallback_filenames` 指定备选文件名（如 `TEAM_GUIDE.md`），`project_doc_max_bytes` 控制总量上限（默认 32 KiB）。

技能分两处：

- `~/.codex/skills/` — 用户级
- `.agents/skills/` — 项目级，随仓库提交，团队共享

每个技能仍是 `<name>/SKILL.md` 目录。企业场景下 `agents/openai.yaml` 可进一步控制技能行为，例如关闭隐式触发、声明 MCP 依赖。

配置是 `~/.codex/config.toml`（`CODEX_HOME` 可改目录），管理权限模式、沙箱、模型等；技能注册也写在 config.toml 里。Codex 对"指令常驻、技能按需"的分工讲得最清楚：AGENTS.md 每次都加载，技能只在任务匹配时激活。

## 4. ZCode：GLM 的官方 IDE

ZCode 是 Z.ai 推出的 GLM 编码 IDE，机制与 Claude Code 高度同构，但有自己的目录体系。

技能路径：

- `~/.zcode/skills/<name>/SKILL.md` — 用户级
- `<项目>/.zcode/skills/` — 工作区级

它的特色是**跨工具导入**：设置页可以直接扫描 Claude Code、Codex CLI、OpenClaw、Augment、Windsurf 的技能目录，一键以"软链接"或"复制"方式导入。内置 `zcode-configuration-guide` 技能，把 skills、commands、MCP、hooks、plugins、AGENTS.md 的位置与优先级汇总成一份可对话的说明书。

指令文件同样读 `AGENTS.md`：

- 项目根 `AGENTS.md`
- `~/.zcode/AGENTS.md` — 全局

配置分两个 JSON：

- `~/.zcode/cli/config.json` — MCP、权限、插件/技能开关、hooks 等 Agent 配置
- `~/.zcode/v2/config.json` — 模型提供商：API Key、Base URL、模型列表

其他目录：子代理在 `~/.zcode/agents/`，命令在 `~/.zcode/commands/`。技能分发没有独立市场，官方建议打包成插件（`skills/<name>/SKILL.md` 扁平布局）通过插件市场分发。

## 5. WorkBuddy：办公场景的 Agent 平台

WorkBuddy 是腾讯 CodeBuddy 系的智能办公平台，把"专家（Expert）+ 技能 + 连接器"打包成可分发单元，开放平台文档非常规范。

技能结构如下：

```
skills/{skill-name}/
├── SKILL.md          # ★ 技能定义（必须）
├── references/       # 参考资料（可选）
├── scripts/          # 可执行脚本（可选）
└── templates/        # 模板文件（可选）
```

SKILL.md 用 YAML frontmatter，字段比通用标准更细：

- `name` / `description` / `description_zh` / `description_en` — 标识与描述
- `category` / `version` / `author` — 元信息
- `allowed-tools` — 工具白名单
- `disable-model-invocation` — 禁止自动触发
- `user-invocable` — 隐藏菜单

"专家"是可分发 Agent 单元，基础结构：

- `.codebuddy-plugin/plugin.json` — 核心配置，声明专家标识、版本、Agent 定义文件列表和技能目录列表
- `agents/<name>.md` — Agent 定义文件
- `avatars/` — 头像

平台还有"连接器"（Connector）体系连接外部服务。注意 WorkBuddy 开放平台的技能市场是中心化的，技能通过 zip 包提交解析。

## 6. dsh：万物皆可插件的 DeepSeek Harness

DeepSeek Harness（dsh）2026 年 8 月开源，设计哲学一句话：**一切皆插件**。模型、工具、技能、会话、沙箱、存储、循环、调度甚至 UI 都可以替换和重组。

技能发现按优先级分层：

- `/.dsh/skills` — 项目级（rank 100）
- `/.agents/skills` — 项目共享（rank 200）
- `$DSH_HOME/skills`（即 `~/.dsh/skills`）— 用户级（rank 400）
- `~/.agents/skills` — 跨工具共享（tier 500）

技能名强制 kebab-case。技能注册（SkillRegistration）支持 `resourceBase` 字段声明三种资源形态：`directory` / `url` / `opaque`。多文件技能必须声明，否则正文里的相对路径会失效。

配置采用分层补丁：

1. bundle patches
2. profile patch
3. 机器级 patch
4. 命令行 overlay

最终配置可用 `npx @deepseek-ai/dsh web --dump-config` 打印。插件安装是 `dsh plugin add github:<owner>/<repo>`，生态里已有大量桥接插件，例如把 Claude Code 的 memory/skills/config 桥接进来（dsh-plugin-claude-bridge），或移植 Codex、OpenCode 的技能。

## 7. OpenClaw：加载优先级最讲究的通用 Agent

OpenClaw（原 Clawdbot/Moltbot，OpenClaw Foundation 维护）是把 Claude Code 概念产品化的通用 Agent，技能加载优先级是目前梳理的所有工具里最细致的。

优先级从高到低：

- `<workspace>/skills` — 工作区技能
- `<workspace>/.agents/skills` — 项目共享
- `~/.agents/skills` — 个人（默认态）
- `~/.openclaw/skills` — 托管 / 本地
- 内置技能 — 随安装发布
- 守护技能（Custodian）— 仅系统 Agent 可见
- `skills.load.extraDirs` + 插件技能 — 额外目录

同名技能高优先级覆盖低优先级；技能名取 frontmatter 的 `name`，路径层级只用于组织。

工作区文件分工明确：

- `AGENTS.md` — "操作手册"：规则与约束
- `SOUL.md` — 人格与语气
- `MEMORY.md` — 长期记忆
- `USER.md` / `TOOLS.md` — 用户信息与工具说明

配置是 `~/.openclaw/openclaw.json`（JSON5），支持 `agents.defaults.skills` / `agents.entries.<name>.skills` 做按 Agent 的技能白名单。插件通过 `openclaw.plugin.json` 声明，可自带技能，与 extraDirs 同级低优先级加载。技能还能声明 `metadata.openclaw.requires`（依赖二进制、环境变量、配置项）做加载门控，ClawHub 是其公共技能注册表。

## 8. OpenCode：配置分层最清晰的 CLI

OpenCode（opencode.ai）是配置加载链最透明的工具，文档里明确写了完整优先级：

1. 远程组织默认（`.well-known/opencode`）
2. 全局 `~/.config/opencode/opencode.json`
3. 环境变量 `OPENCODE_CONFIG`
4. 项目 `opencode.json`
5. `.opencode/` 目录
6. 内联 `OPENCODE_CONFIG_CONTENT`

指令走 AGENTS.md，也可用 `instructions` 字段显式指定补充文件。子代理可以用 Markdown 定义：

- `~/.config/opencode/agents/<name>.md` — 用户级
- `.opencode/agents/` — 项目级

frontmatter 里声明 `mode: subagent`、`permission`（逐工具权限）、`description`。插件位置：

- `.opencode/plugins/` — 项目级
- `~/.config/opencode/plugins/` — 用户级
- npm 包（`plugin` 配置项）— 提供自定义工具、hooks 与集成

MCP 服务器统一在 `opencode.json` 的 `mcp` 字段配置。

## 9. 补充阵营：Gemini CLI、Copilot、Cursor 与 Windsurf

这几款不在必查清单里，但机制有代表性，快速过一遍。

Gemini CLI 的上下文文件是 `GEMINI.md`，但 `.gemini/settings.json` 里 `contextFileName` 可以配置成 `["AGENTS.md", "GEMINI.md"]`，直接复用 AGENTS.md 层级。技能位置：

- `~/.gemini/skills/` — 用户级（另有 `~/.agents/skills/` 别名）
- `.gemini/skills/` — 工作区级（另有 `.agents/skills/` 别名）

`/skills` 命令管理启停，技能激活走"发现 → 匹配 → 确认 → 注入"四步流程。

GitHub Copilot 技能目录最宽容，项目级认三个位置：

- `.github/skills/`
- `.claude/skills/`
- `.agents/skills/`

个人级认 `~/.copilot/skills/` 与 `~/.agents/skills/`。指令文件是 `.github/copilot-instructions.md`。

Cursor 的规则体系是 `.cursor/rules/*.mdc`（YAML frontmatter + `globs` 路径作用域，替代旧 `.cursorrules`），同时官方宣布兼容 Agent Skills 开放标准，动态规则和斜杠命令可自动转换为标准技能。Windsurf 是 `.windsurf/rules/`（每规则一个 md 文件，YAML frontmatter），同时原生读 AGENTS.md，按文件所在目录自动作用。

## 10. 横向对比总表

下表把所有路径收拢到一起，方便对照迁移。

| 工具 | 指令文件 | 技能目录（用户级 / 项目级） | 主配置 | 插件/扩展机制 |
| --- | --- | --- | --- | --- |
| Claude Code | `CLAUDE.md`（全局+项目+嵌套） | `~/.claude/skills/` · `./.claude/skills/` | `.claude/settings.json`、`.mcp.json` | `.claude-plugin/plugin.json`，含 skills/agents/hooks/workflows |
| OpenAI Codex | `AGENTS.md`（全局+层叠） | `~/.codex/skills/` · `.agents/skills/` | `~/.codex/config.toml`、`agents/openai.yaml` | 技能注册在 config.toml |
| ZCode | `AGENTS.md`（全局+项目） | `~/.zcode/skills/` · `./.zcode/skills/` | `~/.zcode/cli/config.json`、`~/.zcode/v2/config.json` | 插件打包技能分发，支持跨工具导入 |
| WorkBuddy | —（对话内） | 市场分发 `skills/{name}/SKILL.md` | `.codebuddy-plugin/plugin.json` | 专家包：plugin.json + agents/ + avatars/ |
| dsh | `AGENTS.md` 生态兼容 | `~/.dsh/skills/` · `/.dsh/skills/`、`.agents/skills/` | 分层 patch + `--dump-config` | 一切皆插件，`dsh plugin add` |
| OpenClaw | `AGENTS.md` + `SOUL.md` + `MEMORY.md` | `<ws>/skills` · `<ws>/.agents/skills/` · `~/.agents/skills/` · `~/.openclaw/skills/` | `~/.openclaw/openclaw.json` | `openclaw.plugin.json`、ClawHub 注册表 |
| OpenCode | `AGENTS.md` + `instructions` | `.opencode/skills/`（生态） | `opencode.json`（多级覆盖链） | `.opencode/plugins/` + npm 插件 |
| Gemini CLI | `GEMINI.md`（可切换 AGENTS.md） | `~/.gemini/skills/`、`.gemini/skills/`（均有 `.agents/skills/` 别名） | `.gemini/settings.json` | 扩展（extension）内嵌技能 |
| Copilot | `.github/copilot-instructions.md` | `~/.copilot/skills/` · `.github/skills/`（兼容 `.claude/skills/`、`.agents/skills/`） | VS Code / GitHub 设置 | Agent 插件可带技能 |
| Cursor | `AGENTS.md`（支持） | 兼容 Agent Skills 标准 | `.cursor/` 工作区配置 | Rules 可转技能 |
| Windsurf | `AGENTS.md`（按目录作用） | 兼容 Agent Skills 标准 | `.windsurf/rules/` | Rules 引擎 + MCP |

## 11. 三个值得注意的趋势

第一，**`~/.agents/skills` 正在成为跨工具共享目录**。Codex、Gemini CLI、Copilot、OpenClaw、dsh 都把它当项目级或用户级技能位置，一次安装多工具可见，这是生态走向互操作最实在的信号。

第二，**AGENTS.md 从"Codex 的规范"变成了"行业标准"**。在 AAIF 治理下，Gemini CLI 通过配置直接复用 AGENTS.md，Cursor、Windsurf、Aider、Devin 原生读取，社区甚至用软链接把 AGENTS.md 同时映射成 CLAUDE.md 来桥接 Claude Code。多文件重复维护的"漂移工厂"问题正在被单一规范源取代。

第三，**格式统一了，安装路径还没统一**。SKILL.md 内容可以跨工具复用，但 Claude Code 读 `.claude/skills/`、Codex 读 `.agents/skills/`、ZCode 读 `.zcode/skills/`、Antigravity 读 `~/.gemini/antigravity/skills/`。迁移时最该查的就是目标工具的路径表——也就是本文第 10 节那张表。dsh 干脆把"桥接插件"做成了一门生意，专门把其他工具的技能目录搬进来，这本身就是路径分裂的最好注脚。
