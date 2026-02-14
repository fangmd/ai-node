# json-render 优化点分析

本文档基于 [json-render/examples/chat](https://github.com/json-render/json-render/tree/main/examples/chat) 的用法，对比当前项目中 json-render 的实现，整理可优化点。

**已实现**：§1 结构化 Part 流式（pipeJsonRender + 前端 segment 渲染）、§2 Action 单一数据源、§3 handlers API、§4 Fallback、§5 Catalog 扩展与 SKILL 同步、§6 错误文案统一与解析错误详情、§7 加载技能时使用 catalog.prompt({ mode: "chat" }) 注入完整格式与组件/actions 约束（getJsonRenderSkillPrompt）。

---

## 1. Spec 数据通道：Markdown 代码块 vs 结构化 Part

**参考项目做法**

- 后端用 **`pipeJsonRender(result.toUIMessageStream())`** 将 spec 作为 **结构化 part**（`SPEC_DATA_PART_TYPE` / `data-spec`）流式输出。
- 前端用 **`useJsonRenderMessage(message.parts)`** 从 `message.parts` 中解析出 `spec`、`text`、`hasSpec`。
- Spec 的 **出现位置** 由 part 在 `parts` 数组中的顺序决定，可实现「前面一段文字 → 一块 spec UI → 后面再一段文字」的精确穿插。

**当前项目做法**

- Spec 来自 **Markdown 中的 \`\`\`json-render` 代码块**，在 Streamdown 的 code 组件里根据 `language-json-render` 解析 code 块内容为 JSON。
- 依赖 AI 严格输出「代码块 + 合法 JSON」，且 **spec 只能出现在「被解析为代码块」的那一段**，位置和格式都受 Markdown 解析限制。

**优化方向**

- 若希望与官方 chat 示例一致、且需要 **流式 + 精确定位**：可考虑在后端接入 **`pipeJsonRender`**，前端用 **`useJsonRenderMessage`** 消费结构化 part，用 part 顺序控制「文字中嵌入 UI」的位置。
- 若继续采用「代码块」方案：可保持现状，但需在 Skill 中强化「必须输出 \`\`\`json-render` 代码块」的约束，并考虑解析失败时的友好提示（见第 6 点）。

---

## 2. Action 定义重复：registry.actions vs JsonRenderBlock 里的 actionHandlers

**参考项目做法**

- 在 **registry** 中通过 `defineRegistry(catalog, { components, actions: {} })` 统一定义；chat 示例中 `actions` 为空，内置的 setState 等由 ActionProvider 处理。
- 若有自定义 action，一般通过 **`defineRegistry` 返回的 `handlers`** 生成传给 `ActionProvider` 的 handlers，**单一数据源**。

**当前项目做法**

- **catalog + registry**（`@ai-node/json-render` + `registry.tsx`）里已定义 `submit`、`navigate` 等 **actions**，并在 registry 的 components 里通过 `emit` 触发。
- 在 **`json-render-block.tsx`** 中又维护了一份 **`actionHandlers`**（submit、navigate），与 registry 的 actions **语义重复**，只是实现位置不同。

**优化方向**

- 以 **registry 为唯一真相源**：用 `defineRegistry` 返回的 **`handlers`**（或等价机制）生成传给 Provider 的 handlers，在 `JsonRenderBlock` 中只做「把 registry 的 handlers 传给 JSONUIProvider」，不再在 block 内重复写 submit/navigate。
- 这样新增/修改 action 时只改 catalog + registry 一处，避免两处不一致。

---

## 3. JSONUIProvider 的 API 命名：handlers vs actionHandlers

**当前 @json-render/react**

- `JSONUIProvider` 的 props 为 **`handlers`**（见 renderer 中的 `JSONUIProviderProps`）。
- 文档/CHANGELOG 中已说明从 **`actionHandlers`** 迁移为 **`handlers`**。

**当前项目做法**

- `json-render-block.tsx` 中使用的是 **`actionHandlers={actionHandlers}`**。

**优化方向**

- 确认当前使用的 `@json-render/react` 版本：若已只支持 `handlers`，应改为 **`handlers={...}`**，避免依赖废弃或未文档化的别名。

---

## 4. Renderer 封装：缺少 fallback 与 loading

**参考项目做法**

- 使用独立的 **`ExplorerRenderer`**，内部包好 `StateProvider` → `VisibilityProvider` → `ActionProvider`，并：
  - 给 **`Renderer`** 传入 **`fallback`**：遇到 catalog 中未注册的组件类型时，渲染占位而非报错或空白。
  - 传入 **`loading`**：流式未完成时显示加载态。

**当前项目做法**

- 直接使用 **`<Renderer spec={spec} registry={registry} />`**，未传 **fallback**、**loading**。
- 若 AI 生成了 catalog 中不存在的组件类型，或 spec 在流式阶段不完整，体验和排错都会受影响。

**优化方向**

- 增加 **fallback**（例如未知组件显示 “Unknown component: xxx” 或简单占位），与参考项目中的 `Fallback` 一致。
- 若后续采用「结构化 part + 流式」方案，在 spec 尚未完整时传 **loading**，提升流式时的观感。

---

## 5. Catalog 与组件能力

**参考项目做法**

- catalog 非常丰富：**Stack / Grid / Card / Heading / Text / Table / BarChart / LineChart / Tabs / Accordion / TextInput / SelectInput / RadioGroup / Button** 等，还有 3D 相关组件。
- 多数条目带 **description**、**example**，便于 AI 生成符合 schema 的 spec。

**当前项目做法**

- `@ai-node/json-render` 的 catalog 仅 **Card、Button、Text** 三个组件，能力偏少。
- 若希望 AI 生成更复杂的 UI（表单、列表、图表等），当前 catalog 会成为瓶颈。

**优化方向**

- 按产品需求逐步扩展 catalog（如布局类 Stack/Grid、表单类 TextInput/Select、展示类 Table/Alert 等），并为每个组件补充 **description** 与 **example**。✓ 已为 Card/Button/Text 补充 `example`；✓ 已新增 Stack、Grid、Heading、Alert、Separator、Link，并补全 description/example。
- 与 **SKILL.md**（或同类技能文档）中「可用组件/actions」描述保持同步。✓ 已更新 `apps/backend/skills/json-render/SKILL.md` 组件表。

---

## 6. 错误与边界处理

**当前项目做法**

- 在 **message.tsx** 中：若 `language === 'json-render'` 但 `parseJsonRenderSpec(content)` 失败，会渲染一段错误提示（「json-render 块内容不是合法的 spec…」）。
- 在 **JsonRenderBlock** 中：若 `!spec?.root || !spec?.elements`，会渲染「无效的 spec（缺少 root 或 elements）」。

**优化方向**

- 两处错误提示可统一为一套文案或组件，避免用户看到两种说法。✓ 已统一为 `INVALID_SPEC_MESSAGE`。
- 若需更好排错：在 **解析失败** 时尽量保留「原始内容片段」或「解析错误信息」（如 JSON 报错的行/列），便于调试与后续改进 Skill 提示。✓ 已实现：`parseJsonRenderSpec` 返回 `parseError`，界面在无效 spec 时展示该错误信息。

---

## 7. 后端与 Spec 来源（若采用结构化 Part 方案）

**参考项目做法**

- 后端 **不** 在 Markdown 中塞 \`\`\`json-render`，而是由 Agent 产出结构化消息，通过 **`pipeJsonRender(toUIMessageStream())`** 将 spec 以 part 形式流出。
- 前端完全不解析 json-render 代码块，只消费 `useJsonRenderMessage` 的结果。

**当前项目做法**

- 依赖 **Skill** 约束 AI 在回复中写 \`\`\`json-render` 代码块；后端未使用 `pipeJsonRender`，也没有 data part。

**优化方向**

- 若采用「结构化 part」方案：需在后端接入 **pipeJsonRender**，并让 Agent/工具输出的内容以 part 形式进入 `toUIMessageStream()`，前端再切到 `useJsonRenderMessage`。
- 若继续「代码块」方案：可考虑在加载 json-render 技能时，将 **catalog.prompt()**（若包内提供）注入 system，进一步约束 AI 输出的 spec 形状，减少无效或越界组件。✓ 已实现：使用 `catalog.prompt({ mode: "chat" })`（`getJsonRenderSkillPrompt()` 导出自 `@ai-node/json-render`），在 `load_skill("json-render")` 时将完整格式说明与「允许的组件与 actions」追加到技能内容后注入。

---

## 8. 小结表

| 维度             | 参考 chat 示例                     | 当前项目                                                                 | 建议优化方向 |
|------------------|------------------------------------|--------------------------------------------------------------------------|--------------|
| Spec 来源        | 结构化 part + pipeJsonRender       | ✓ 已实现：后端 pipeJsonRender，前端 segment + useJsonRenderMessage；保留代码块兼容 | 已实现 |
| Action 定义      | 仅在 registry，无重复              | ✓ 已实现：仅 registry，handlers 注入 ActionProvider                     | 已实现 |
| Provider API     | 使用 handlers                      | ✓ 已实现：StateProvider + ActionProvider，传 registry.handlers          | 已实现 |
| Fallback/Loading | 有 fallback、loading               | ✓ 已实现 fallback；Renderer 支持 loading（流式 part 接入后可用）         | 已实现 |
| Catalog          | 组件多且带 example/description     | ✓ 已实现：Stack/Grid/Heading/Alert/Separator/Link + example，SKILL 已同步 | 已实现 |
| 错误与边界       | 有统一占位与加载态                 | ✓ 已实现：INVALID_SPEC_MESSAGE 统一 + 解析错误详情展示                    | 已实现 |

---

## 9. 结构化 Part 流式方案（已实现）

- **后端**：`apps/backend/src/routes/ai.ts` 使用 **createUIMessageStream** + **pipeJsonRender(result.toUIMessageStream(...))**，将模型输出中的 \`\`\`spec 代码块解析为 **data-spec** patch parts，保留 originalMessages / onFinish / messageMetadata。
- **Skill**：`apps/backend/skills/json-render/SKILL.md` 已改为 \`\`\`spec + JSONL 格式（RFC 6902 patch），与官方 chat 示例一致。
- **前端**：`message.tsx` 的 **MessageParts** 当存在 data-spec parts 时使用 **segment 渲染**（useJsonRenderMessage + 按 part 顺序的 text / spec / tools），精确定位「文字 → UI → 文字」；并保留 \`\`\`json-render 代码块与单次 flat data-spec 的兼容。

---

## 参考

- [json-render Quick Start](https://json-render.dev/docs/quick-start)
- 项目内 [json-render 集成技术方案](./json-render-integration.md)
- 参考实现：`/Users/double/projects/json-render/examples/chat`（lib/render/renderer.tsx、registry.tsx、catalog.ts；app/page.tsx；app/api/generate/route.ts）
