# json-render 集成技术方案

## 目标

- 通过 **Skills** 方式让 AI 在对话中产出「可渲染的 UI 描述」（json-render spec）。
- AI 将 spec 以 **Markdown 代码块** 形式输出：\`\`\`json-render ... \`\`\`。
- **前端** 解析 Markdown，识别 \`json-render\` 代码块，用 [json-render](https://json-render.dev/docs/quick-start) 的 `Renderer` 在消息流内或 Artifacts 中渲染。

---

## 1. 整体架构

```
┌─────────────────────────────────────────────────────────────────┐
│  Backend (AI)                                                    │
│  - load_skill("json-render")  → 注入「何时、如何输出 spec」的说明   │
│  - 回复 Markdown 中携带 ```json-render\n{ spec }\n```            │
└─────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────┐
│  Frontend                                                        │
│  - Streamdown 渲染 text part                                     │
│  - code 块 language === 'json-render' → 解析 JSON，用 Renderer   │
│  - Catalog + Registry 与 Skill 约定一致                           │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Skills 方式引入（Backend）

### 2.1 新增 Skill 文件

- **位置**：与现有 skills 一致，例如 `apps/backend/skills/json-render/SKILL.md`（或项目配置的 `SKILLS_ROOT` 下）。
- **格式**：与现有 skill 一致，frontmatter `name` / `description`，正文为给 AI 的说明。

### 2.2 Skill 内容要点

- **何时使用**：当用户需要「生成可交互的 UI」「表单、卡片、按钮组合」等时，优先使用本技能，并在回复中以 \`\`\`json-render 代码块输出 spec，不要输出裸 HTML。
- **输出格式**：必须使用 **Markdown 代码块**，语言标识为 `json-render`，内容为 **单个 JSON 对象**（json-render 的 spec）：
  ```markdown
  ```json-render
  { "type": "Card", "props": { "title": "...", "description": "..." }, "children": [...] }
  ```
  ```
- **Spec 结构**：与前端 catalog 一致。在 Skill 中列出「可用组件」及「可用 actions」的简短说明（如 Card、Button、Text、submit、navigate），避免 AI 编造不存在的 type/action。
- **不要求**后端调用 json-render 的 API；仅通过「技能说明 + 约定格式」约束 AI 输出。可选后续：当加载了 json-render 技能时，将 `catalog.prompt()` 注入 system（需前端或共享包提供 catalog 的 prompt 文本），实现更强约束。

### 2.3 与现有 load_skill 的关系

- AI 通过现有 **load_skill** 工具按名称加载技能；加载 `json-render` 后，按 SKILL.md 的说明在后续回复中产出 \`\`\`json-render 代码块。
- 无需新增工具，仅新增一个 Skill 文件。

---

## 3. Markdown 嵌入格式与解析（Frontend）

### 3.1 约定格式

- 与现有 \`\`\`html 完全类比。
- 代码块语言标识：**json-render**。
- 代码块内容：**合法 JSON**，表示一个 json-render **spec**（单根节点，可嵌套 children）。

示例：

```markdown
这是一段说明文字。

\`\`\`json-render
{
  "type": "Card",
  "props": { "title": "示例", "description": "描述" },
  "children": [
    { "type": "Text", "props": { "content": "Hello" } },
    { "type": "Button", "props": { "label": "点击", "action": "press" } }
  ]
}
\`\`\`

其他内容…
```

### 3.2 解析与判断逻辑

- **解析**：仍在现有 Markdown 渲染链路中完成（Streamdown）。
- **判断**：在 Streamdown 的 `components.code` 自定义组件中，除已有 `language-html` 判断外，增加对 **language-json-render** 的判断（通过 `node.properties?.className` 包含 `language-json-render`，与 `language-html` 同一套方式）。
- **提取内容**：code 块的 `children` 转为字符串，即 code 块内的原始文本；对该字符串做 `JSON.parse`，得到 spec 对象。若解析失败，可降级为「显示原始 JSON 代码块」或简短错误提示。

### 3.3 与 HTML 块的关系

- 同一段 Markdown 中可同时存在多个 \`\`\`html 和 \`\`\`json-render 块。
- 实现上：在同一个 `code` 自定义组件里，先判断 `language-json-render`，再判断 `language-html`，其余走默认 code 渲染。

---

## 4. 前端渲染方式

### 4.1 方案 A：内联渲染（推荐首阶段）

- 在**消息流内**直接渲染 json-render 块：识别到 \`json-render\` 且 JSON 解析成功后，用 `@json-render/react` 的 **Renderer** + 项目 **registry** 渲染该 spec，替代「显示代码块」。
- **优点**：与正文一体、无需跳转；实现简单，与现有 \`html\` 卡片+侧栏 解耦。
- **注意**：需在 Message 子树内提供 json-render 所需的 **StateProvider / ActionProvider / VisibilityProvider**（若用到），可在一处包装 Chat 或仅包装含 Renderer 的容器。

### 4.2 方案 B：卡片 + ArtifactsView（与 HTML 一致）

- 与现有 HTML Artifact 一致：消息流内只显示「json-render 卡片」，点击后在 ArtifactsView 中渲染 Renderer。
- **优点**：交互与 HTML 统一，适合 spec 很大或需要大屏查看的场景。
- **实现**：类似 `registerHtmlArtifact`，增加 `registerJsonRenderArtifact(messageId, index, spec)`；ArtifactsView 根据 `activeArtifact.type` 区分 html / json-render，对 json-render 用 iframe 内嵌一个仅含 Renderer 的页面，或同一视图内切换「HTML / json-render」展示。

**建议**：先做方案 A，后续若有「大块 UI、多 artifact 切换」需求再做方案 B 或混合（大块用卡片，小块内联）。

---

## 5. 前端模块与依赖

### 5.1 依赖

- **@json-render/core**：catalog 定义（defineCatalog）、schema。
- **@json-render/react**：defineRegistry、Renderer、StateProvider、ActionProvider、VisibilityProvider 等。
- **zod**：catalog 中 props/params 校验（若未在 monorepo 中已有，可加在前端或共享包）。

### 5.2 目录与职责（建议）

| 文件/目录 | 职责 |
|-----------|------|
| `src/lib/json-render/catalog.ts` | 定义 **catalog**（components + actions），与 Skill 文档中约定一致；可导出 `catalog.prompt()` 供后端或文档使用。 |
| `src/lib/json-render/registry.tsx` | 使用 **defineRegistry(catalog, { components, ... })** 定义 React 组件映射，导出 **registry**。 |
| `src/components/chat/json-render-block.tsx` | 接收 **spec 对象**（或 raw string 内部 parse），做安全 parse + 错误边界，内部使用 \<Renderer spec={spec} registry={registry} />；若需 Provider，可在此组件或上层包装。 |
| `message.tsx` | 在 Streamdown 的 **components.code** 中：若为 `language-json-render`，则取 code 内容 → parse → 渲染 \<JsonRenderBlock spec={parsed} />；否则保持现有 html / 默认 code 逻辑。 |

### 5.3 Catalog 与 Skill 的同步

- Skill 中列出的「可用组件名、action 名」必须与 **catalog** 中定义一致；建议在 Skill 正文或附录中写清列表（或指向前端 catalog 的文档/导出），避免 AI 使用未定义 type。
- 若后续引入 `catalog.prompt()` 注入 system，则 AI 输出会与 catalog 强一致。

---

## 6. 安全与健壮性

- **JSON 解析**：仅在识别为 \`json-render\` 块时对内容做 `JSON.parse`；try/catch，失败时降级为显示原文或错误提示，不抛到外层。
- **Renderer**：json-render 渲染的是声明式 UI 树，不执行任意 HTML/脚本；若 catalog 只开放安全组件，风险可控。若未来支持「自定义组件」或嵌入 HTML，需单独做沙箱策略（可与现有 HTML iframe 策略一致）。
- **Provider**：Action 的 handler 由前端写死（如 navigate、submit），不执行模型返回的任意代码。

---

## 7. 实现顺序建议

1. **前端**：安装 @json-render/core、@json-render/react（及 zod），新增 catalog + registry + JsonRenderBlock；在 message.tsx 的 code 组件中增加对 \`language-json-render\` 的识别与内联渲染（方案 A）。
2. **Backend**：新增 `skills/json-render/SKILL.md`，写明输出格式与可用组件/actions 列表。
3. **联调**：通过「加载 json-render 技能 + 用户请求生成 UI」验证端到端：AI 输出 \`\`\`json-render { ... }\`\`\`，前端正确解析并渲染。
4. **可选**：ArtifactsView 支持 json-render 类型（方案 B）；或后端在加载该技能时注入 catalog.prompt()。

---

## 8. 小结

| 项 | 方案 |
|----|------|
| 引入方式 | Skills：新增 `json-render/SKILL.md`，由 load_skill 加载，约束 AI 输出格式与可用组件。 |
| 嵌入格式 | Markdown 代码块 \`\`\`json-render\n{ spec JSON }\n\`\`\`。 |
| 前端解析 | Streamdown 的 code 组件中判断 `language-json-render`，取内容做 JSON.parse。 |
| 前端渲染 | 首阶段：消息流内嵌 Renderer + registry（方案 A）；可选：卡片 + ArtifactsView（方案 B）。 |
| 约定一致 | Catalog/Registry 与 Skill 文档中组件、actions 列表保持一致。 |

参考：[json-render Quick Start](https://json-render.dev/docs/quick-start)，项目内 [ai-artifacts-html-design.md](./ai-artifacts-html-design.md)。优化点分析见 [json-render-optimization.md](./json-render-optimization.md)。
