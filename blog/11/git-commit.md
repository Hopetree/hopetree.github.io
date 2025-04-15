# Git 提交信息规范与最佳实践

在日常开发中，Git 提交信息（commit message）不仅仅是记录代码变更的日志，更是团队协作、项目管理和自动化流程的核心组成部分。良好的提交信息规范可以帮助团队提高协作效率、自动化生成变更日志（changelog）、更清晰地回溯历史。

我们公司遵循 <https://github.com/lob/generate-changelog#usage></https://github.com/lob/generate-changelog#usage> 的书写方式

本文将详细探讨 Git 提交信息规范，包括命名约定、换行规则、常见工具的配合以及其他最佳实践。


## 1. Git 提交信息规范的重要性

- 可读性：清晰的提交信息能够快速告诉开发者本次变更的目的，避免需要阅读大量代码来理解提交。
- 协作：团队中的每个成员都能快速了解变更背景和细节，提升沟通效率。
- 自动化支持：工具如 generate-changelog、semantic-release、commitlint 等依赖于规范化的提交信息来自动化生成变更日志、版本发布、错误修复跟踪等。
- 代码审查与回溯：良好的提交信息可以帮助开发者在回溯历史时迅速找到相关改动，而无需重复审查整个代码库。


## 2. Git 提交信息的推荐格式

### 2.1 提交信息标准结构

一个规范的 Git 提交信息通常遵循以下结构：

```text
<type>(<scope>): <subject>

<body>

<footer>
```

解释：

- `<type>`：表示提交的类型，常见的有 feat（新功能）、fix（修复）、docs（文档）、style（格式调整）等。
- `<scope>`：可选，表示提交的范围或模块，如 auth、api 等。
- `<subject>`：简短的描述，通常限定在 50 个字符以内，采用祈使句，简洁明了。
- `<body>`：可选，详细描述本次提交的背景、原因及实施细节。推荐每行不超过 72 个字符。
- `<footer>`：可选，通常用来标注 BREAKING CHANGE 或关闭的 issue 编号。

示例：

```text
feat(auth): add support for two-factor authentication

This commit introduces two-factor authentication (2FA) to enhance security
during login. It uses a time-based one-time password (TOTP) generator app.

BREAKING CHANGE: This change removes the old login method that didn't require 2FA.
```


## 3. Git 提交信息的命名约定

Conventional Commits 是一种规范化的提交信息格式，它规定了如何使用统一的类型和格式来编写提交信息。通过这种格式，我们可以自动生成版本号、变更日志，并通过工具如 semantic-release 来自动发布版本。

常见的提交类型包括：

| 类型       | 描述                | 适用场景                     |
|------------|---------------------|------------------------------|
| `feat`     | 新特性              | 增加新功能                   |
| `fix`      | 修复问题            | 修复 bug                     |
| `docs`     | 文档更新            | 修改文档                     |
| `style`    | 格式调整（无逻辑变更） | 修改代码格式，如缩进、空格    |
| `refactor` | 代码重构            | 重构代码，非修复性改动       |
| `test`     | 添加/修改测试       | 修改测试代码                 |
| `chore`    | 其他杂项任务        | 比如更新依赖、构建工具等     |

示例：

```text
fix(user): handle edge case where username is null
```


### 4. 换行规则

在提交信息中，换行并不仅仅是为了可读性。换行在某些情况下也有结构化的作用，特别是在使用自动化工具时。良好的换行能够确保工具能正确解析提交信息的各个部分。

### 4.1 提交信息中的换行规则

| 部分               | 是否换行 | 说明                                    |
|--------------------|----------|-----------------------------------------|
| 第一行（subject）  | ❌ 不应换行 | 简洁明了，最多 50~72 个字符            |
| 第二行             | ✅ 必须为空行 | 用于分隔 subject 和 body               |
| 第三行及以后（body） | ✅ 每行不超过 72 个字符 | 可换行描述变更内容                       |
| footer             | ✅ 可另起一段 | 用来描述 BREAKING CHANGE、关闭 issue 编号等 |

示例：

```text
feat(auth): add new login flow

This commit refactors the login flow to include multi-factor authentication.
It also improves the session handling and timeout mechanisms.

BREAKING CHANGE: The session expiration logic has been completely redesigned.
```


## 5. 进行多行提交信息

### 5.1 使用多个 -m 参数

通过多个 -m 参数可以轻松创建多行的提交信息：

```bash
git commit -m "feat(auth): add login check" \
            -m "This prevents users from staying logged in with expired tokens." \
            -m "BREAKING CHANGE: requires token refresh endpoint."
```

### 5.2 使用文本文件提交

对于较长的提交信息，可以将提交内容写入文件，然后通过 git commit -F 提交：

```bash
echo -e "feat: add user pagination\n\nThis allows users to paginate their data." > commit-msg.txt
git commit -F commit-msg.txt
```