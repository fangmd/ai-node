import { convertToModelMessages, stepCountIs, streamText, type UIMessage } from 'ai';
import { getModel } from './model.js';
import { CONFIG_ERR_PREFIX, getProvider } from './provider.js';

export type ChatMessage = {
  role: 'user' | 'assistant' | 'system';
  content: string;
};

export type StreamChatOptions = {
  onFinish?: (event: { content: unknown[] }) => void | Promise<void>;
  generateMessageId?: () => string;
};

export async function streamChatFromUIMessages(uiMessages: UIMessage[], options?: StreamChatOptions) {
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
    onFinish: options?.onFinish
      ? (event) => {
          void Promise.resolve(options.onFinish!({ content: event.content ?? [] })).catch(() => {});
        }
      : undefined,
  });
}

export { CONFIG_ERR_PREFIX };
