---
name: git-commit
description: '帮助用户生成或改进 git commit message。当用户请求「写 commit」「生成提交信息」「帮我写 git 提交说明」或提供 diff/变更描述希望得到 commit 建议时，应先加载本技能再按以下规范生成。'
---

## 使用场景

在以下情况使用本技能并按要求生成 commit message：

- 用户明确要求写 commit、生成提交信息、或给一段变更/diff 要求写提交说明
- 用户提供了代码变更描述、diff 片段或文件改动摘要，希望得到符合规范的 commit 文案

先理解用户提供的变更内容，再按下列规范生成一条或多条建议。

## Commit Message 规范

- **首行（subject）**：简明扼要，50 字符内为宜；使用祈使句（如「添加」「修复」），句末不加句号
- **可选的 body**：需要时在首行后空一行再写正文，说明动机或细节，每行约 72 字符换行
- **可选的 footer**：如 Breaking Changes、关联 Issue（Closes #123）等放在文末

## 推荐格式（Conventional Commits）

优先采用 conventional commits 风格，首行格式：

```
<type>(<scope>): <subject>
```

- **type** 常用：`feat`（新功能）、`fix`（修复）、`docs`、`style`、`refactor`、`test`、`chore` 等
- **scope** 可选：影响范围（如模块名、文件名）
- **subject**：简短描述

示例：

- `feat(auth): 增加 JWT 登录`
- `fix(chat): 修正流式响应截断`
- `docs: 更新 API 说明`

若用户项目或团队有约定（如只用中文、或固定 type 列表），应优先遵循其约定。

## 示例

```
feat(skills): 增加 load_skill 与 git-commit 技能

- 后端 skills 根目录与 gray-matter 解析
- load_skill 工具接入 chat
- 内置 git-commit 技能说明
```

生成时根据用户提供的实际变更调整 type、scope 与 subject，保持简洁可读。
