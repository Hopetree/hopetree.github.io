# 用 Claude Code Skill 实现博客文章一键发布

给博客加了一个 Claude Code Skill，现在可以通过对话直接发布文章了。之前写文章流程是：本地编辑 markdown → 打开浏览器 → 登录后台 → 粘贴内容 → 选分类 → 选标签 → 选主题 → 保存。现在变成：对话里给一个文件路径或者直接口述内容，AI 自动解析、匹配分类标签主题，确认后一键推送。

整个实现分两个部分：后端 API 和前端 Skill。

## 1. 后端：两个专用接口

API 挂载在 `/openapi/v1/skill/` 下，跟原有的 REST API 隔离开。

### 1.1 聚合查询接口

```text
GET /openapi/v1/skill/meta/
```

一次返回所有分类、标签、主题：

```json
{
  "categories": [{ "id": 1, "name": "Python 实战", "slug": "hello-python", "description": "..." }],
  "tags": [{ "id": 1, "name": "Python", "slug": "python", "description": "..." }],
  "topics": [{ "id": 29, "name": "实战经验", "subject_id": 5, "subject_name": "Python", "subject_status": "ongoing" }]
}
```

AI 拿到这份数据后，根据文章内容做匹配：分类名对上了就复用，标签名对上了就复用，主题找到最相关的就关联。对不上的才新建。

### 1.2 文章发布接口

```text
POST /openapi/v1/skill/articles/publish/
```

接口逻辑很薄，不做智能推断，只做数据操作：

- **分类/标签**：按 name 查，存在就关联（描述有改进就更新），不存在就创建
- **主题**：只查不建，找不到就返回可用主题列表让用户选
- **关键词**：简单的 get-or-create
- **作者**：从 Token 关联的用户自动获取
- **校验**：标题 ≤150 字符、slug ≤50 字符、摘要 ≤230 字符，不通过返回中文错误

一个典型的入参：

```json
{
  "title": "文章标题",
  "slug": "article-slug",
  "body": "markdown 正文",
  "summary": "AI 生成的摘要",
  "is_publish": false,
  "category": { "name": "Python 实战", "slug": "hello-python", "description": "..." },
  "tags": [{ "name": "Python", "slug": "python", "description": "..." }],
  "keywords": ["Python", "Django"],
  "topic": { "name": "实战经验" }
}
```

文章默认存为草稿（`is_publish: false`），管理员可以直接访问，发布后 `create_date` 自动更新为发布时间。

### 1.3 认证方案

全局启用了 DRF 的 TokenAuthentication，Token 在 Django Admin 后台管理。Skill 用环境变量 `IZONE_API_TOKEN` 传入 token，所有 API 请求带 `Authorization: Token xxx` 头。

## 2. 前端：Claude Code Skill

Skill 文件按标准结构组织：

```text
.claude/skills/publish-article/
├── SKILL.md                          # 入口，双模式工作流
└── references/
    ├── api-spec.md                   # API 文档和字段约束
    └── config.md                     # 环境变量说明
```

Skill 支持两种模式：

**写文章模式**：用户给主题或大纲，AI 按写作规范生成文章——标题用序号层级（1. / 1.1 / 1.2），代码块必须写语言类型，空行严格规范，不写 AI 味的套路话。写完展示给用户，不主动推送。

**发布模式**：用户明确说"发布"后才触发。AI 先从 meta 接口拉数据做匹配，然后展示分类/标签/主题的选择给用户确认，确认后调用 publish 接口推送。

两个模式之间有一个发布守卫：写文章后问"需要调整吗？确认后可以推送"，但用户不明确说"发布"绝不会推送。

### 2.1 文章写入流程

为了避免 shell 转义问题（代码块里的特殊字符被 shell 吃掉），文章先写到 `/tmp/<slug>.md`，再用 Python 读取文件构造 JSON 调用 curl。这样不管文章里有多少代码块和特殊字符都不会丢失。

## 3. 职责划分

这里有一个关键的边界：**AI 做智能的事，API 做机械的事**。

| 谁做 | 做什么 |
|------|--------|
| AI | 理解文章内容、生成 slug、提取摘要、推断分类和标签、匹配已有数据 |
| API | 按 name 查记录、创建或关联、校验字段长度、返回清晰的中文错误 |

API 不做任何"推断"，比如 slug 生成、分类匹配这些，全都放在 AI 侧。API 只是数据层的薄封装：给什么存什么，存不了就说明原因。

## 4. 写作规范

Skill 内置了一套写作规范，所有通过它写的文章自动遵守：

- 标题不超过三级，用数字序号（1. / 1.1 / 1.2 / 2. / 2.1 这种）
- 代码块必须标注语言类型，不确定写 `text`，禁止 `` ``` `` 后面空着
- 标题、代码块、列表前后都要有空行
- 不要装饰性 emoji，除非传递语义信息
- 避免 AI 味的套路词（"总而言之""值得注意的是""众所周知"），像同事写笔记，不像教科书

这些规范降低了后续整理历史文章的工作量——格式在源头就统一了，不用逐篇再去调整空行和代码块标注。