# skill-loader

## Purpose

后端在固定技能根目录下发现 SKILL.md 文件，用 gray-matter 解析 frontmatter，并通过 `load_skill` 工具向对话模型提供「按名称加载技能」的能力，使模型能按技能说明执行任务。

## Requirements

### Requirement: 技能根目录与发现

系统 SHALL 在后端项目下定义唯一的技能根目录（如 `apps/backend/skills/`）。系统 SHALL 在该目录下递归扫描所有 `**/SKILL.md` 文件，并 SHALL 使用 gray-matter 解析每个文件的 YAML frontmatter，提取 `name` 与 `description` 及文件路径（location）。缺少有效 `name` 或 `description` 的文件 SHALL 被跳过（不纳入可用技能列表）。技能名称 SHALL 在本次发现结果中唯一；若存在重名，实现 MAY 记录告警并只保留其一。

#### Scenario: 扫描返回技能列表

- **WHEN** 后端完成技能发现（如启动时或首次使用时）
- **THEN** 系统 SHALL 得到一组技能信息，每项包含 `name`、`description`、`location`，且 `name` 与 frontmatter 中一致

#### Scenario: 无效 frontmatter 被跳过

- **WHEN** 某 SKILL.md 的 frontmatter 缺少 `name` 或 `description` 或解析失败
- **THEN** 该文件 SHALL 不被加入可用技能列表，且 SHALL 不导致发现流程崩溃

### Requirement: 按名称获取技能内容

系统 SHALL 提供「按名称获取技能」的能力：给定技能 `name`，SHALL 根据发现结果定位对应 SKILL.md 文件，SHALL 使用 gray-matter 读取该文件并分离 frontmatter 与正文（content）。返回给调用方的内容 SHALL 包含技能正文（Markdown body），并可包含基目录（该 SKILL.md 所在目录）等元信息，供模型按说明执行。

#### Scenario: 按有效名称返回技能内容

- **WHEN** 调用方请求一个已发现技能的名称（如 `git-commit`）
- **THEN** 系统 SHALL 返回该技能对应的文件正文（及约定的元信息，如基目录），且内容 SHALL 来自该 SKILL.md 的 body

#### Scenario: 无效名称返回错误或空

- **WHEN** 调用方请求的名称在已发现技能中不存在
- **THEN** 系统 SHALL 返回明确错误或空结果（如抛出错误或返回可区分的空），并 SHOULD 在错误信息中提示当前可用技能列表（名称）

### Requirement: load_skill 工具

系统 SHALL 提供名为 `load_skill` 的 AI 工具（符合 Vercel AI SDK 的 tool 定义）。该工具 SHALL 接受一个参数：技能名称（name）。该工具的 description SHALL 包含「可加载技能」的说明，并 SHALL 列出当前所有可用技能的名称与描述（name + description），以便模型决定何时调用及传入何名称。该工具的 execute(name) SHALL 调用「按名称获取技能内容」能力，并将返回内容作为工具结果返回给模型（格式可为单一文本，如 `## Skill: <name>`、基目录、正文拼接）。

#### Scenario: 工具描述中包含可用技能列表

- **WHEN** 构建或注册 `load_skill` 工具时
- **THEN** 工具的 description 文本 SHALL 包含当前发现到的每个技能的名称与描述，使模型能据此选择要加载的技能

#### Scenario: 调用 load_skill 返回技能内容

- **WHEN** 模型使用有效技能名称调用 `load_skill`
- **THEN** 工具 SHALL 返回该技能的完整可读内容（含标题与正文），模型可据此执行技能说明中的步骤

#### Scenario: 调用 load_skill 使用无效名称

- **WHEN** 模型使用不存在的技能名称调用 `load_skill`
- **THEN** 工具 SHALL 返回错误或明确失败信息，并 SHOULD 提示可用技能名称

### Requirement: 工具接入 Chat

系统 SHALL 将 `load_skill` 注册到后端 AI 的 localTools（或等效工具集合）中，并 SHALL 通过现有 provider 将包含 `load_skill` 的工具集传入 `streamText`，使 POST /api/ai/chat 的对话流中模型可调用 `load_skill`。不改变现有鉴权、路由或请求/响应格式。

#### Scenario: Chat 流中可调用 load_skill

- **WHEN** 客户端发送合法的 POST /api/ai/chat 请求并得到流式响应
- **THEN** 模型在回复过程中 SHALL 能够发起对 `load_skill` 的工具调用，且工具结果 SHALL 出现在流式消息中（如 tool-result 部分）

### Requirement: gray-matter 依赖

后端 SHALL 使用 npm 包 gray-matter 解析 SKILL.md 的 frontmatter 与正文。该依赖 SHALL 声明在 backend 的 package.json 中。

#### Scenario: gray-matter 为后端依赖

- **WHEN** 安装或构建后端项目
- **THEN** `gray-matter` SHALL 出现在 backend 的 dependencies 中
