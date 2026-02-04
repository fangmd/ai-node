import { convertToModelMessages, stepCountIs, streamText, type UIMessage } from 'ai';
import { getModel } from './model.js';
import { CONFIG_ERR_PREFIX, getProvider } from './provider.js';

export type ChatMessage = {
  role: 'user' | 'assistant' | 'system';
  content: string;
};

export async function streamChatFromUIMessages(uiMessages: UIMessage[]) {
  const provider = getProvider();
  const model = getModel(provider);
  const toolSet = provider.tools;
  const modelMessages = await convertToModelMessages(uiMessages, {
    tools: toolSet,
  });

  return streamText({
    model,
    tools: toolSet,
    messages: modelMessages,
    stopWhen: stepCountIs(5),
  });
}

export { CONFIG_ERR_PREFIX };
