import { convertToModelMessages, stepCountIs, streamText, type UIMessage } from 'ai';
import { getModel } from './model.js';
import { createProvider, type ProviderKind } from './provider.js';
import logger from '../common/logger.js';

export type ChatMessage = {
  role: 'user' | 'assistant' | 'system';
  content: string;
};

export async function streamChatFromUIMessages(
  uiMessages: UIMessage[],
  llm: { provider: ProviderKind; baseURL: string; apiKey: string; modelId: string }
) {
  const provider = createProvider(llm.provider, llm.baseURL, llm.apiKey, llm.modelId);
  const model = getModel(provider, llm.modelId);
  const toolSet = provider.tools;
  const modelMessages = await convertToModelMessages(uiMessages, {
    tools: toolSet,
  });

  return streamText({
    model,
    tools: toolSet,
    messages: modelMessages,
    stopWhen: stepCountIs(5),
    providerOptions: {
      __llm: { baseURL: llm.baseURL, provider: llm.provider, modelId: llm.modelId },
    },
  });
}
