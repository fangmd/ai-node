# AI Artifacts（HTML）技术方案

## 目标

- Markdown 中的 **HTML 格式数据** 在消息流里**只显示为卡片**，不内联渲染 HTML。
- **完整 HTML 内容** 在 **ArtifactsView** 里通过 **iframe** 安全展示。

## 1. 数据来源

### 1.1 方案 A：仅来自 Markdown 代码块（推荐先做）

- **来源**：Assistant 的 `text` part 中的 markdown，其中的 **\`\`\`html ... \`\`\`** 代码块视为 HTML Artifact。
- **优点**：无需改后端与 AI 协议，只改前端渲染逻辑。
- **实现**：在 Streamdown 渲染时，对语言为 `html` 的 code 块做特殊处理——不按代码块展示，改为渲染「卡片」并把内容交给 ArtifactsView。

### 1.2 方案 B：扩展 Part 类型（可选后续）

- **来源**：新增 message part 类型，例如 `artifact`：`{ type: 'artifact', artifactId?, mimeType: 'text/html', title?, content: string }`。
- **优点**：HTML 与正文分离，可单独存储、复用；不依赖 markdown 语法。
- **实现**：需后端/AI 侧产出并持久化该类 part；前端在 `MessageParts` 里识别并渲染为卡片，点击后在 ArtifactsView 用 iframe 展示。

**建议**：先实现方案 A，后续如需再接入方案 B。

---

## 2. 消息流内：只显示「卡片」

- **位置**：在 `message.tsx` 的 Markdown 渲染链路中（Streamdown 的 code 块渲染）。
- **行为**：
  - 当 code 块 `language === 'html'` 时，不渲染原始代码块，改为渲染一个**卡片**：
    - 标题：如「HTML 预览」或首行注释/标题（若解析得到）。
    - 可选简短说明或占位图。
    - 操作：「在 Artifacts 中查看」按钮（或整卡可点）。
  - 点击后：打开 ArtifactsView，并传入该 HTML 内容（或对应 artifactId，若采用方案 B）。

- **技术点**：
  - 使用 Streamdown 的 **`components`** 扩展：为 `pre`+`code` 提供自定义组件，根据 `node.properties?.className` 或 `node` 上的 language 信息判断是否为 `html`；若是，则渲染上述卡片并**不**把原始 HTML 作为子节点渲染到 DOM。
  - 或使用 **remark/rehype 插件**：在 AST 中识别 html 代码块，替换为自定义节点，由自定义组件渲染卡片。  
  优先用 `components` 若 Streamdown 暴露了 code 节点的 language，否则用 rehype 插件。

---

## 3. ArtifactsView：用 iframe 展示 HTML

- **形态**：独立展示区，建议**侧栏**或**底部/右侧抽屉**，与消息列表并列，不占用正文流。
- **内容**：
  - 当前选中的 HTML 用 **iframe** 展示：`<iframe srcDoc={htmlContent} sandbox="..." />`。
  - 若有多个 artifact（同一消息多个 html 块，或方案 B 多 part），用 **Tab 或列表** 切换当前展示项。
- **状态**：
  - 当前选中的 artifact 来源：`{ messageId, index }`（第几条消息的第几个 html 块）或 `artifactId`（方案 B）。
  - 状态可放在 **Chat 页** 或 **Context**：`activeArtifact` + `setActiveArtifact`，ArtifactsView 根据 `activeArtifact` 取 HTML 内容并渲染 iframe。
- **安全**：
  - iframe 必须带 **sandbox**（如 `sandbox="allow-scripts"` 按需开放），避免内联 HTML 执行敏感操作；不开放 `allow-same-origin` 可降低 XSS 风险，若需脚本再按需放宽。
  - 不直接使用 `dangerouslySetInnerHTML` 在主文档中渲染用户/模型返回的 HTML。

---

## 4. 数据流与状态（方案 A）

1. **解析**：Streamdown 渲染 assistant 的 `text` 时，遇到 `html` 代码块 → 自定义组件渲染卡片，并将该块的 **原始 HTML 字符串** 与 **(messageId, blockIndex)** 存到可被上层访问的结构（如通过 callback 或 context 注册到 Chat 页的 `artifactsMap`）。
2. **点击卡片**：设置 `activeArtifact = { messageId, index }`，并打开 ArtifactsView（例如 setState 控制侧栏可见）。
3. **ArtifactsView**：从 `artifactsMap[messageId][index]` 取 HTML → 用 iframe 的 `srcDoc` 展示。

若采用方案 B，则用 `artifactId` 索引，HTML 来自 part 的 `content` 或服务端拉取。

---

## 5. 文件与职责（建议）

| 文件/模块 | 职责 |
|-----------|------|
| `message.tsx` | ① 在 Streamdown 上注入 `components`（或 rehype 插件），对 `html` 代码块渲染卡片；② 通过 callback/context 把 (messageId, index, html) 注册到 Chat；③ 不在此处直接渲染 iframe。 |
| `ArtifactsView.tsx`（新） | 接收 `activeArtifact` 与 `artifactsMap`（或等价数据源），用 iframe 展示当前选中的 HTML；支持多 artifact 切换。 |
| `chat.tsx` | 持有 `activeArtifact`、`artifactsMap`（或从 message 树推导），渲染 ArtifactsView（侧栏/抽屉），点击卡片时设置 `activeArtifact` 并打开视图。 |

---

## 6. 小结

- **Markdown 中的 HTML**：仅以**卡片**形式出现在消息流，不内联渲染。
- **ArtifactsView**：独立区域，用 **iframe + sandbox** 展示 HTML，安全且与主文档隔离。
- **先做方案 A**（markdown \`\`\`html 代码块 → 卡片 + ArtifactsView iframe），后续可再接方案 B（artifact part 类型）。

如需，我可以按该方案在 `message.tsx` / `chat.tsx` 里给出具体实现草稿（组件接口与最小状态设计）。
