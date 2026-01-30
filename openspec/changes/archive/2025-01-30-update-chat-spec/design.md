# Design: Update specs to reflect current chat implementation

## Context

The chat feature evolved from a simple text stream (request: `{ role, content }[]`, response: plain text SSE) to a UI message flow: the backend accepts AI SDK UIMessage format, runs streamText with a web_search tool, and returns a UI message stream; the frontend uses useChat and renders message parts (text + tool-web_search with “正在搜索…” and “引用来源”). The implementation is already in place. This change updates the specs (backend-ai-api, frontend-app) so they describe the current contract and behavior; no code changes are required for implementation.

## Goals / Non-Goals

**Goals:**

- Align backend-ai-api and frontend-app specs with the current chat implementation (UIMessage request, UI message stream response, web_search tool, useChat, parts-based rendering, tool-web_search UI).
- Preserve a single source of truth for chat behavior and make verification and future changes easier.

**Non-Goals:**

- Changing runtime behavior or adding new features.
- Migrating or supporting legacy clients that send the old `{ role, content }[]` body.

## Decisions

1. **Backend: UIMessage in, UI message stream out**
   - **Choice:** Accept `{ messages: UIMessage[] }`, use `convertToModelMessages(uiMessages, { tools })`, call `streamText` with the same tools, return `result.toUIMessageStreamResponse({ originalMessages: messages })`.
   - **Rationale:** useChat sends UIMessage[] and consumes the UI message stream; this keeps backend and frontend contract consistent. `originalMessages` lets the client match streamed message IDs to existing messages.
   - **Alternative:** Keep a second endpoint or query param for the old simple format; rejected to avoid maintaining two contracts when the only consumer is the frontend with useChat.

2. **Backend: Single chat path via streamChatFromUIMessages**
   - **Choice:** Route only uses `streamChatFromUIMessages`; no dual path for “simple” vs “UI” in the route.
   - **Rationale:** Simplifies the API surface; any legacy caller would need to be updated or use a separate service.

3. **Backend: Web search via OpenAI provider tool**
   - **Choice:** Use `provider.tools.webSearch({})` (OpenAI Responses API) inside streamText.
   - **Rationale:** Native provider tool, no extra search API or gateway; model (e.g. gpt-5.2) is already Responses API. Alternatives (e.g. gateway.perplexitySearch) would add another provider/config; current setup is minimal and sufficient.

4. **Frontend: useChat + DefaultChatTransport**
   - **Choice:** useChat with `transport: new DefaultChatTransport({ api: CHAT_URL })`; input state managed with useState; send via sendMessage.
   - **Rationale:** Matches AI SDK recommendation for consuming UI message streams; avoids manual stream parsing and keeps message/part handling consistent.

5. **Frontend: Parts-based rendering and tool-web_search UI**
   - **Choice:** Render each message from `message.parts`; for `tool-web_search`, show “正在搜索…” when state is not output-available, and “引用来源” (list of links) when `output.sources` exists.
   - **Rationale:** Makes tool usage and citations visible without over-specifying UI copy in the spec; exact wording can stay in frontend requirements.

## Risks / Trade-offs

- **[Risk] Specs no longer describe the old API** → **Mitigation:** Document the breaking change in the proposal and in the delta specs; no legacy clients in scope.
- **[Risk] UI message stream format is SDK-defined** → **Mitigation:** Specs reference “UI message stream” and “toUIMessageStreamResponse” rather than encoding the wire format; format is owned by the AI SDK.
- **[Trade-off] Backend no longer accepts simple { role, content }[]** → Accepted; frontend is the only consumer and already uses useChat.

## Migration Plan

Not applicable: this is a spec update only. Implementation is already deployed. If main specs are updated via sync from this change, the only “migration” is ensuring docs and any automated checks use the new spec (e.g. contract tests expect UIMessage body and UI message stream).

## Open Questions

None. Behavior and contract are fixed by the current implementation; this change only records them in the specs.
