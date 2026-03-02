import { convertToModelMessages, stepCountIs, streamText, type UIMessage } from 'ai';
import { getModel } from './model.js';
import type { LlmProviderKind } from '@ai-node/types';
import { createProvider } from './provider.js';
import { createBoundTools } from './tools/index.js';
import { createMCPClientsAndTools, closeMCPClients, getDefaultMCPServers, type MCPServerConfig } from './mcp.js';
import { logger } from '../common/logger.js';

export type ChatMessage = {
  role: 'user' | 'assistant' | 'system';
  content: string;
};

export async function streamChatFromUIMessages(
  uiMessages: UIMessage[],
  llm: { provider: LlmProviderKind; baseURL: string; apiKey: string; modelId: string },
  options?: {
    systemPrompt?: string;
    userId?: string | bigint;
    abortSignal?: AbortSignal;
    mcpServers?: MCPServerConfig[];
  }
) {
  const provider = createProvider(llm.provider, llm.baseURL, llm.apiKey, llm.modelId);
  const model = getModel(provider, llm.modelId);

  const mcpServers = options?.mcpServers ?? getDefaultMCPServers();
  logger.info({ mcpServers }, 'MCP servers');
  const { tools: mcpTools, clients: mcpClients } =
    mcpServers.length > 0 ? await createMCPClientsAndTools(mcpServers) : { tools: {}, clients: [] };
  logger.info({ mcpTools }, 'MCP tools');

  const toolSet = {
    ...provider.tools,
    ...mcpTools,
    ...(options?.userId != null ? createBoundTools(options.userId) : {}),
  };

  const modelMessages = await convertToModelMessages(uiMessages, {
    tools: toolSet,
  });

  const system = options?.systemPrompt ?? '';

  logger.info({ toolSet }, 'toolSet');

  const result = await streamText({
    model,
    system: system || undefined,
    tools: toolSet,
    messages: modelMessages,
    stopWhen: stepCountIs(10),
    abortSignal: options?.abortSignal,
    providerOptions: {
      __llm: { baseURL: llm.baseURL, provider: llm.provider, modelId: llm.modelId },
    },
  });

  if (mcpClients.length === 0) return result;

  const closeAll = () => {
    closeMCPClients(mcpClients).catch(() => {});
  };
  const originalToUIMessageStream = result.toUIMessageStream.bind(result);
  result.toUIMessageStream = (opts) => {
    const inner = originalToUIMessageStream(opts);
    const reader = inner.getReader();
    return new ReadableStream({
      async pull(controller) {
        const { done, value } = await reader.read();
        if (done) {
          closeAll();
          controller.close();
          return;
        }
        controller.enqueue(value);
      },
      cancel() {
        closeAll();
        return reader.cancel();
      },
    });
  };
  return result;
}
