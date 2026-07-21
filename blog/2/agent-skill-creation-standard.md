# 智能体 Skill 创建标准完全指南 — 基于 Agent Skills 规范

AI Agent 的能力边界很大程度上取决于它能调用的「技能（Skill）」。但技能怎么写、怎么组织、怎么让 Agent 精准地在需要时激活它，长期以来缺乏统一标准。Agent Skills 规范（https://agentskills.io）正在填补这个空白——它定义了一套开放的技能格式，让技能可以跨 VS Code Copilot、Claude Code、OpenAI Codex 等不同 Agent 客户端复用。本文基于该规范的最新版本，从目录结构、SKILL.md 格式、最佳实践到 description 优化，完整梳理智能体技能的创建标准。

## 1. 技能目录结构

一个技能就是一个文件夹，核心只有一样东西：`SKILL.md` 文件。

```
skill-name/
├── SKILL.md          # 必需：元数据 + 指令
├── scripts/          # 可选：可执行代码
├── references/       # 可选：参考文档
├── assets/           # 可选：模板、资源
└── ...               # 其他文件或目录
```

文件夹名就是技能名。`SKILL.md` 是 Agent 读取技能的唯一入口，其他目录都是按需补充。

## 2. SKILL.md 格式规范

`SKILL.md` 由 YAML 前置元数据（frontmatter）和 Markdown 正文两部分组成。

### 2.1 前置元数据字段

| 字段 | 必需 | 约束 |
|------|------|------|
| `name` | 是 | 最长 64 字符。仅限小写字母、数字、连字符。不能以连字符开头或结尾，不能出现连续连字符。**必须与父目录名一致。** |
| `description` | 是 | 最长 1024 字符。非空。描述技能做什么以及何时使用。 |
| `license` | 否 | 许可证名称（如 Apache-2.0）或引用本地的许可文件。 |
| `compatibility` | 否 | 最长 500 字符。指明环境需求，如目标产品、系统包、网络访问等。 |
| `metadata` | 否 | 任意键值对。可用于存作者、版本等额外属性。 |
| `allowed-tools` | 否 | 空格分隔的预授权工具列表。实验性功能。 |

**最小示例：**

```yaml
---
name: roll-dice
description: Roll dice using a random number generator. Use when asked to roll a die (d6, d20, etc.), roll dice, or generate a random dice roll.
---
```

**完整示例：**

```yaml
---
name: pdf-processing
description: Extract PDF text, fill forms, merge files. Use when handling PDFs.
license: Apache-2.0
compatibility: Requires Python 3.14+ and pdfplumber
metadata:
  author: example-org
  version: "1.0"
---
```

### 2.2 正文内容

正文没有格式限制，唯一的原则是：**写能帮助 Agent 高效完成任务的内容。**

推荐包含的内容：

- **分步指令** —— Agent 按步骤执行的流程
- **输入/输出示例** —— 展示具体的输入格式和期望的输出
- **常见边界情况** —— Agent 容易踩坑的地方

一个核心建议：正文控制在 **500 行 / 5000 token 以内**。如果内容太多，把详细参考挪到 `references/` 目录下的独立文件。

### 2.3 name 字段的要求

这个字段看似简单，但很容易出错。有效示例：

```yaml
name: pdf-processing      # 正确
name: data-analysis       # 正确
name: code-review         # 正确
```

无效示例：

```yaml
name: PDF-Processing      # 错误：不允许大写字母
name: -pdf                # 错误：不能以连字符开头
name: pdf--processing     # 错误：不能有连续连字符
```

### 2.4 description 字段的艺术

描述是整个技能最关键的字段——Agent 在启动时只读 `name` 和 `description` 来决定是否激活技能。写得好不好，直接决定了技能会不会在关键时刻被调用。

好的描述：

```yaml
description: >
  Analyze CSV and tabular data files — compute summary statistics,
  add derived columns, generate charts, and clean messy data. Use this
  skill when the user has a CSV, TSV, or Excel file and wants to
  explore, transform, or visualize the data, even if they don't
  explicitly mention "CSV" or "analysis."
```

差的描述：

```yaml
description: Helps with CSV files.
```

几个原则：用祈使句（"Use this when…"而不是"This skill does…"）；聚焦用户意图而非实现细节；宁可激进也不要保守——明确列出适用场景；保持简洁，但覆盖全面。

## 3. 可选目录

### 3.1 scripts/ — 可执行脚本

存放 Agent 可以运行的代码。规范建议：

- 脚本应当自包含，或清晰注明依赖
- 包含有用的错误信息
- 优雅处理边界情况

支持的语言取决于 Agent 实现，常见的有 Python、Bash 和 JavaScript。

### 3.2 references/ — 参考文档

存放 Agent 按需读取的补充文档。几个常见用途：

- `REFERENCE.md` —— 详细技术参考
- `FORMS.md` —— 表单模板或结构化数据格式
- 领域专用文件（`finance.md`、`legal.md`）

关键是：**保持单个文件聚焦**。Agent 只有在需要时才会加载这些文件，所以文件越小，上下文浪费越少。

### 3.3 assets/ — 静态资源

存放模板、图片、数据文件等静态资源：

- 文档模板、配置文件模板
- 示意图、示例图
- 查找表、Schema 定义

## 4. 渐进式加载（Progressive Disclosure）

这是 Agent Skills 规范最巧妙的设计之一。Agent **不是**一次性把技能的所有内容都读入上下文，而是分阶段加载：

1. **元数据（~100 tokens）**：启动时加载所有技能的 `name` 和 `description`，仅用于匹配判断
2. **指令（建议 < 5000 tokens）**：技能被激活后才加载完整的 `SKILL.md` 正文
3. **资源（按需加载）**：`scripts/`、`references/`、`assets/` 中的文件仅在 Agent 执行到相关内容时才读取

这意味着一个仓库可以有几十个技能，但 Agent 的上下文窗口不会被撑爆。每个技能只贡献约 100 tokens 的元数据开销。

## 5. 创建技能的最佳实践

### 5.1 从真实经验出发

最常见的失败模式是：让 LLM 凭空生成一个技能。结果往往是泛泛而谈的"处理错误""遵循最佳实践"，而不是真正有价值的领域知识。

正确的方法有两种：

**从实操任务提取**：跟 Agent 一起完成一个真实任务，把过程中有效的步骤、你纠正过的地方、输入输出格式、你提供的上下文，提炼成技能。

**从现有资产合成**：把你们团队的内部文档、故障报告、API 规范、代码评审记录喂给 LLM，让它合成为技能。基于**你们自己的** schema、故障模式、恢复流程生成的技能，比基于通用"数据工程最佳实践"文章生成的技能有价值得多。

### 5.2 用真实执行来迭代

技能的第一版通常需要改进。用真实任务跑一遍，然后把结果——不只是失败的，成功的也一样——反馈到修改过程中。问自己：哪些步骤是多余的？什么被漏掉了？什么可以删掉？

特别注意 Agent 的执行轨迹（execution traces），而不仅是最终输出。如果 Agent 浪费了很多时间在无效步骤上，原因通常是指令太模糊、指令不适用于当前任务、或者给了太多选项却没有明确的默认值。

### 5.3 合理分配上下文

每 token 都珍贵。问自己一个问题：**"没有这条指令，Agent 会把这事做错吗？"**

如果答案是否定的，删掉它。你不需要告诉 Agent "PDF 是一种文件格式"或者"HTTP 是如何工作的"——它本来就知道。

### 5.4 设计与组织粒度

决定一个技能该覆盖什么，就像决定一个函数该做什么：你要它封装一个内聚的工作单元，能与其他技能良好组合。

- **范围太小**：一个任务要加载多个技能，增加上下文开销，指令间还可能冲突
- **范围太大**：描述无法精确定位触发场景，Agent 难以判断何时激活

一个查询数据库并格式化结果的技能是一个内聚的单元，一个同时涵盖数据库管理的技能则太多了。

### 5.5 控制精度：按任务的脆弱性匹配指令的具体程度

不是技能的所有部分都需要同样的指令密度：

- **给 Agent 自由**：当多个方法都可行时，解释 **为什么** 比规定 **怎么做** 更有效。理解了目的的 Agent 能做出更好的上下文决策。
- **严格规定**：当操作不可逆、一致性重要、或必须按特定顺序执行时，把指令写死，不要留选择余地。

大多数技能是混合的——每个部分独立校准。

### 5.6 给出默认值，不要给菜单

当有多个工具或方法可选时，挑一个默认的，然后简单提一下替代方案。不要把一堆选项平等地摆出来。

```yaml
# ❌ 太多选项
You can use pypdf, pdfplumber, PyMuPDF, or pdf2image...

# ✅ 明确默认 + 退出通道
Use pdfplumber for text extraction:
# ...代码示例...
For scanned PDFs requiring OCR, use pdf2image with pytesseract instead.
```

### 5.7 教方法，不要给答案

技能应该教 Agent **如何解决一类问题**，而不是**为某个具体场景提供一个现成答案**。

```yaml
# ❌ 具体答案——只对这一个查询有用
Join the `orders` table to `customers` on `customer_id`, filter where
`region = 'EMEA'`, and sum the `amount` column.

# ✅ 可复用的方法——适用于任何分析查询
1. Read the schema from `references/schema.yaml` to find relevant tables
2. Join tables using the `_id` foreign key convention
3. Apply any filters from the user's request as WHERE clauses
4. Aggregate numeric columns as needed and format as a markdown table
```

## 6. 有效指令的常用模式

### 6.1 Gotchas 章节

这是很多技能中价值最高的内容——那些违背合理假设的环境特定事实。这些不是泛泛的"正确处理错误"，而是 Agent 没有被告知就会犯错的具体纠正。

```yaml
## Gotchas

- The `users` table uses soft deletes. Queries must include
  `WHERE deleted_at IS NULL` or results will include deactivated accounts.
- The user ID is `user_id` in the database, `uid` in the auth service,
  and `accountId` in the billing API. All three refer to the same value.
```

每次你纠正了 Agent 的错误，把这条纠正加进 Gotchas 章节——这是迭代改进技能最直接的方式。

### 6.2 输出格式模板

当需要 Agent 输出特定格式时，提供模板比用文字描述可靠得多。Agent 对具体结构的模式匹配远强于对描述的理解。

### 6.3 多步工作流清单

明确清单帮助 Agent 跟踪进度，避免跳过步骤，尤其适合有依赖关系或验证关卡的工作流。

### 6.4 验证循环

让 Agent 在执行后自我验证：执行 → 运行验证器 → 修复问题 → 重新验证 → 通过才继续。

### 6.5 计划-验证-执行

对批量或破坏性操作，先让 Agent 生成中间计划（结构化格式），验证通过后再执行。关键是有验证脚本来检查计划与事实源的一致性。

## 7. 描述优化：让技能在正确的时候被激活

技能如果从不被激活，写得再好也没用。Agent Skills 提供了系统的 description 优化方法。

### 7.1 设计触发评估查询

创建一组评估查询，标记它们**应该触发**还是**不应该触发**技能：

```json
[
  { "query": "I've got a spreadsheet with revenue data, can you add a profit margin column?", "should_trigger": true },
  { "query": "whats the quickest way to convert this json file to yaml", "should_trigger": false }
]
```

大约 20 条：8-10 条应该触发的，8-10 条不应该触发的。应该触发的那组要在措辞、明确度、细节量、复杂度上做变化。不应该触发的那组最有价值的是**近义词干扰**——共享关键词但需要不同技能的查询。

### 7.2 训练/验证集拆分

把评估集分成训练集（~60%）和验证集（~40%），防止对特定措通过拟合。所有的优化决策只基于训练集的结果，验证集只在最后用来检查是否泛化。

### 7.3 优化循环

1. 在当前 description 上评估训练集和验证集
2. 识别训练集中的失败项
3. 修改 description：过窄则拓宽，过宽则收窄；避免添加失败查询中的特定关键词（那是过拟合），而是找到它们代表的通用类别
4. 重复直到训练集通过或不再进步
5. 用验证集选出最优版本

五个迭代通常就够了。如果还没进步，问题可能在查询本身（太难、太简单、或标签错了），而不是 description。

## 8. 验证

写完技能后，用 `skills-ref` 验证一下：

```bash
skills-ref validate ./my-skill
```

它会检查 `SKILL.md` 的 frontmatter 是否合法、命名是否符合规范。

## 9. 写在最后

Agent Skills 规范的可贵之处在于它不复杂。一个技能就是一个文件夹加一个 Markdown 文件——门槛极低。但它的设计处处透着对 Agent 工作方式的深刻理解：渐进式加载解决了上下文窗口的瓶颈，description 触发机制决定了技能是否能发挥作用，而最佳实践中反复强调的"从真实经验出发"和"用执行来迭代"，则是让技能真正产生价值的保证。

如果你正在为你的 Agent 创建技能，遵循这套标准，意味着你的技能可以跨平台复用、能够被 Agent 精准激活、并且随着真实使用不断进化。