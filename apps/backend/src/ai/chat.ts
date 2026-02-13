import { convertToModelMessages, stepCountIs, streamText, type UIMessage } from 'ai';
import { getModel } from './model.js';
import type { LlmProviderKind } from '@ai-node/types';
import { createProvider } from './provider.js';
import { buildToolsSection } from './context.js';
import { createBoundTools } from './tools/index.js';

export type ChatMessage = {
  role: 'user' | 'assistant' | 'system';
  content: string;
};

export async function streamChatFromUIMessages(
  uiMessages: UIMessage[],
  llm: { provider: LlmProviderKind; baseURL: string; apiKey: string; modelId: string },
  options?: { systemPrompt?: string; userId?: string | bigint; abortSignal?: AbortSignal }
) {
  const provider = createProvider(llm.provider, llm.baseURL, llm.apiKey, llm.modelId);
  const model = getModel(provider, llm.modelId);
  const toolSet = options?.userId != null ? { ...provider.tools, ...createBoundTools(options.userId) } : provider.tools;
  const modelMessages = await convertToModelMessages(uiMessages, {
    tools: toolSet,
  });

  let system = options?.systemPrompt ?? '';
  // const toolsSection = buildToolsSection(toolSet as Record<string, { description?: string }>);
  // if (system && toolsSection) system += '\n\n---\n\n' + toolsSection;

  return streamText({
    model,
    system: system || undefined,
    tools: toolSet,
    messages: modelMessages,
    stopWhen: stepCountIs(5),
    abortSignal: options?.abortSignal,
    providerOptions: {
      __llm: { baseURL: llm.baseURL, provider: llm.provider, modelId: llm.modelId },
    },
  });
}
