# skill-git-commit

## Purpose

内置技能「帮助用户生成 git commit 信息」：约定该技能的用途、触发时机以及 SKILL.md 的内容与行为（规范、格式、示例），并作为后端技能树下的一个 SKILL.md 交付。

## ADDED Requirements

### Requirement: 技能文件位置与格式

系统 SHALL 在后端技能根目录下提供名为 git-commit 的技能，对应文件路径为 `skills/git-commit/SKILL.md`（相对于后端技能根目录）。该文件 SHALL 符合技能发现约定：YAML frontmatter 包含 `name` 与 `description`，且 `name` SHALL 为 `git-commit`（或与 load_skill 调用时使用的标识一致）。正文 SHALL 为 Markdown，描述如何帮助用户撰写 git commit message。

#### Scenario: git-commit 可被发现并加载

- **WHEN** 后端执行技能发现且存在 `skills/git-commit/SKILL.md`
- **THEN** 该技能 SHALL 出现在可用技能列表中，且通过 load_skill 传入对应 name 时 SHALL 返回该文件内容

#### Scenario: frontmatter 符合约定

- **WHEN** 解析 `skills/git-commit/SKILL.md`
- **THEN** frontmatter SHALL 包含 `name`（如 git-commit）和 `description`（简要说明该技能用于生成 git commit 信息）

### Requirement: 技能用途与触发时机

git-commit 技能 SHALL 用于在用户需要撰写或改进 git commit message 时，为模型提供统一指导。description SHALL 明确说明：当用户请求「写 commit」「生成 commit message」「帮我写一下 git 提交信息」等类似意图时，模型 SHOULD 先调用 load_skill 加载该技能，再按技能正文中的规范生成或建议 commit message。

#### Scenario: description 指导模型何时加载

- **WHEN** 用户消息表达「需要写 commit / 生成提交信息」等意图
- **THEN** 技能的 description SHALL 足以让模型识别应加载 git-commit 技能并据此回复

### Requirement: 技能正文内容要求

技能正文（SKILL.md 的 body）SHALL 包含以下方面的约定或说明（可为简要条文）：(1) commit message 的通用规范（如首行简明、可选的 body 与 footer）；(2) 推荐格式（如 conventional commits 或项目约定）；(3) 至少一个简短示例（如 feat: 或 fix: 风格）；(4) 何时使用该技能（如用户提供 diff 或变更描述时先理解再生成）。正文 SHALL 为人类与模型可读的 Markdown，不要求实现代码解析 commit。

#### Scenario: 正文包含规范与示例

- **WHEN** 模型通过 load_skill 加载 git-commit 技能并读取正文
- **THEN** 正文 SHALL 包含格式/规范说明以及至少一个 commit message 示例，使模型能按同一标准生成建议

#### Scenario: 正文说明使用场景

- **WHEN** 模型读取 git-commit 技能正文
- **THEN** 正文 SHALL 说明在何种用户请求下使用本技能（如「用户要写 commit」「用户给了代码变更描述」等），以便模型决定何时应用该指导
