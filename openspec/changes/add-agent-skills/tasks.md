# Tasks: Add Agent Skills

## 1. 依赖与目录

- [x] 1.1 在 backend 的 package.json 中添加 gray-matter 依赖
- [x] 1.2 创建技能根目录 apps/backend/skills/
- [x] 1.3 创建技能模块（如 apps/backend/src/ai/skills/），导出 getSkillInfoList、getSkillByName，技能根路径基于后端运行目录解析

## 2. 技能发现与解析

- [x] 2.1 在技能根目录下递归扫描 **/SKILL.md（Node 兼容：fs + 递归 readdir 或 fast-glob）
- [x] 2.2 使用 gray-matter 解析每个 SKILL.md，提取 name、description；缺少有效 name/description 的跳过，重名时记录告警并只保留其一
- [x] 2.3 实现缓存：首次使用时扫描并缓存技能列表（name → { name, description, location }），getSkillInfoList() 与 getSkillByName(name) 基于缓存

## 3. load_skill 工具

- [x] 3.1 在 apps/backend/src/ai/tools/ 中新增 load_skill：使用 Vercel AI SDK 的 tool()，参数为 name（string）
- [x] 3.2 工具 description 动态包含「可用技能」列表（每个技能的 name 与 description），无技能时给出明确说明
- [x] 3.3 execute(name) 调用 getSkillByName，读取文件并解析，返回格式：`## Skill: <name>\n\n**Base directory**: <dir>\n\n<body>`；name 不存在时抛出错误并提示可用技能名称

## 4. 接入 Chat

- [x] 4.1 将 load_skill 加入 localTools，在 provider 的 tools 中一并暴露，确保 POST /api/ai/chat 的 streamText 可调用 load_skill

## 5. 内置 git-commit 技能

- [x] 5.1 创建 apps/backend/skills/git-commit/SKILL.md，frontmatter 含 name（git-commit）与 description（说明用于生成 git commit 信息、何时加载）
- [x] 5.2 正文包含：commit message 规范（首行简明、body/footer）、推荐格式（如 conventional commits）、至少一个示例、使用场景说明（如用户提供 diff 或变更描述时先理解再生成）
