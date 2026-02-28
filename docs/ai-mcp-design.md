# AI 增加 MCP 功能 — 技术方案

## 1. 目标与背景

- **目标**：在现有 AI 对话能力上接入 Model Context Protocol (MCP)，使模型能调用外部 MCP 服务器提供的工具（Tools）、资源（Resources）、提示（Prompts）等。
- **背景**：当前 `streamChatFromUIMessages` 已使用 `provider.tools`（如 web_search）与 `createBoundTools(userId)`（如 read_file、write_file、shell 等）。MCP 作为统一协议，可接入更多标准化工具源（如 Cursor 的 MCP 服务器、自建 MCP 服务），且与 AI SDK 官方支持对齐。

## 2. 技术选型

| 项目 | 选型 | 说明 |
|------|------|------|
| 客户端 | `@ai-sdk/mcp` 的 `createMCPClient()` | AI SDK 官方 MCP 客户端，自动将 MCP tools 转为 AI SDK tools，与现有 `streamText({ tools })` 一致 |
| Transport | 以 **HTTP** 为主，可选 **SSE** | 生产环境推荐 HTTP；SSE 适合需服务端推送的场景；Stdio 仅本地/开发 |
| 生命周期 | 按请求创建、用后关闭 | 每次 `streamChatFromUIMessages` 按配置创建 MCP 客户端，在 stream 结束或异常时 `client.close()`，避免长连占用 |

**依赖**：在 `apps/backend` 增加 `@ai-sdk/mcp`（与当前 `ai` 版本兼容，如 ai ^6.x）。

## 3. 架构设计

### 3.1 工具合并顺序（与现有逻辑一致）

当前工具合并方式（见 `chat.ts`）：

```ts
toolSet = options?.userId != null
  ? { ...provider.tools, ...createBoundTools(options.userId) }
  : provider.tools;
```

引入 MCP 后建议：

```ts
// 1. 先合并 provider.tools（如 web_search）
// 2. 再合并 MCP 各服务器返回的 tools（可做命名空间避免冲突，见下）
// 3. 最后合并 createBoundTools(userId)，保证本地工具优先、可覆盖同名 MCP 工具
const toolSet = {
  ...provider.tools,
  ...mcpTools,           // 来自所有启用的 MCP 客户端
  ...(options?.userId != null ? createBoundTools(options.userId) : {}),
};
```

同名时后合并覆盖前者，因此 **本地 bound tools 优先级最高**，避免 MCP 暴露的 `read_file` 等覆盖用户工作区能力。

### 3.2 MCP 配置来源（建议分阶段）

- **阶段一**：环境变量或后端配置  
  例如 `MCP_SERVERS='[{"name":"fs","url":"http://localhost:3000/mcp"}]'`，在应用启动时解析，在每次 chat 时传入 `streamChatFromUIMessages` 的 options。
- **阶段二（可选）**：用户/会话级配置  
  在 DB 中存用户或会话绑定的 MCP 服务器列表（如 URL + 名称 + 是否启用），请求时从 session 或 user 配置读取并覆盖或追加全局配置。

无论哪种方式，建议在 **chat 入口**（如 `routes/ai.ts`）解析出「本次请求要用的 MCP 服务器列表」，再传给 `streamChatFromUIMessages(..., { ..., mcpServers })`。

### 3.3 命名与冲突 (不需要考虑命名冲突)

- 多个 MCP 服务器可能暴露同名 tool（如 `read_file`）。可选策略：
  - **前缀**：按 server name 前缀，如 `mcp_fs_read_file`，在描述中说明来源；
  - **或保持原名**：后合并的覆盖先合并的（当前建议：本地 bound tools 最后合并，不改变现有行为，MCP 之间可约定顺序或仅启用不重名服务器）。

## 4. 实现要点

### 4.1 创建 MCP 客户端并获取 tools

- 根据 `mcpServers` 配置，对每个 server 使用 `createMCPClient({ transport: { type: 'http', url } })`（或 `type: 'sse'`）创建客户端。
- `const mcpTools = {}; for (const client of clients) { Object.assign(mcpTools, await client.tools()); }`，注意同名的后覆盖。
- 若某台 MCP 连接失败，可选：整请求失败 / 仅跳过该服务器并打日志，建议先「跳过 + 日志」保证可用性。

### 4.2 生命周期与关闭

- 在 `streamChatFromUIMessages` 内，在 `streamText` 返回的 stream 被消费完毕或出错后，对所有已创建的 MCP 客户端调用 `client.close()`。
- 可用 `try/finally` 或包装 `result` 的消费逻辑，在 finally 里统一 close；若使用 `createUIMessageStream` 的 `execute`，需在 `execute` 完成（或 reject）后关闭，避免 stream 未结束就关连接。

### 4.3 错误处理

- **连接/初始化失败**：捕获 `MCPClientError`，记录日志，该 server 的 tools 不加入；可选在 system 或首条 assistant 里提示「部分 MCP 未就绪」。
- **Tool 执行失败**：AI SDK 会得到 `CallToolError`，现有中间件/日志可一并记录；无需在 MCP 层单独处理，除非要重试或降级。

### 4.4 与 convertToModelMessages 的兼容

- `convertToModelMessages(uiMessages, { tools: toolSet })` 已接收 `toolSet`，只要 `mcpTools` 与现有 tool 形状一致（AI SDK 的 tool 定义），无需改 `convertToModelMessages` 逻辑。

## 5. 配置与扩展

### 5.1 配置结构示例（环境变量阶段）

```ts
// 类型
type MCPServerConfig = {
  name: string;   // 用于日志与可选命名前缀
  url: string;    // http(s) 或 sse endpoint
  type?: 'http' | 'sse';  // 默认 'http'
  headers?: Record<string, string>;
};

// 从 env 读取，例如 JSON 数组
// MCP_SERVERS='[{"name":"my-mcp","url":"http://localhost:3000/mcp"}]'
```

### 5.2 后续扩展

- **OAuth**：`createMCPClient` 的 transport 支持 `authProvider`，若 MCP 需 OAuth，可在配置中增加 auth 相关字段，在创建 transport 时传入。
- **Resources/Prompts**：当前以 tools 为主；若需在 system 或首轮注入 MCP 的 resources/prompts，可先 `client.listResources()` / `client.experimental_listPrompts()`，再在 `buildSystemPrompt` 或消息构造里使用，与本次「只做 tools」的改动解耦。

## 6. 风险与注意事项

- **延迟**：每次请求创建 MCP 客户端并拉取 tools，会有一次到多台服务器的 round-trip；若 MCP 列表固定且较少，可考虑「启动时预建客户端 + 健康检查」，但需处理重连与配置热更新，建议首版按请求创建，简单可靠。
- **安全**：仅连接受信任的 MCP URL；若后续支持用户配置 URL，需做白名单或校验，避免 SSRF。
- **流式与 close 时机**：必须在 stream 完全消费或出错后再 close，否则可能截断响应或报错；与现有 `onFinish`/`execute` 的调用顺序要一致。

## 7. 小结

| 项 | 内容 |
|----|------|
| 依赖 | `@ai-sdk/mcp` |
| 入口 | `streamChatFromUIMessages` 增加可选 `options.mcpServers`，内部创建 MCP 客户端、合并 tools、用后关闭 |
| 配置 | 阶段一：环境变量/后端配置；阶段二：用户/会话级 |
| 合并顺序 | provider.tools → MCP tools → createBoundTools(userId) |
| 错误 | 单台 MCP 失败不阻塞整请求，记录日志并跳过该台 |

按上述方案可实现「AI 增加 MCP 功能」且与现有 tools、会话、流式响应兼容；实现时建议先做「单台 HTTP MCP + 环境变量配置」，再扩展多台与可选 SSE/用户配置。
