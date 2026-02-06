import { createDeepSeek } from '@ai-sdk/deepseek';
import { createOpenAI } from '@ai-sdk/openai';
import { getProxyFetch } from './proxy-fetch';
import { localTools } from './tools';

export type ProviderKind = 'openai' | 'deepseek';

/**
 * Volc/方舟等兼容 Chat API(messages) 而非 Responses API(input)，用 chat 避免 input 报 nil
 */
function useChatApi(baseURL: string, modelId: string): boolean {
  // DashScope OpenAI-compatible mode 需要走 Responses API（openai(modelId)）
  // 例如：https://dashscope.aliyuncs.com/api/v2/apps/protocols/compatible-mode/v1
  if (baseURL.includes('dashscope.aliyuncs.com/api/v2/apps/protocols/compatible-mode')) {
    return false;
  }
  return (
    baseURL.includes('volces.com') ||
    baseURL.includes('volcengine') ||
    baseURL.includes('aliyuncs.com') ||
    modelId.startsWith('glm-')
  );
}

export function createProvider(kind: ProviderKind, baseURL: string, apiKey: string) {
  const fetchOption = getProxyFetch();
  if (kind === 'deepseek') {
    const deepseek = createDeepSeek({ baseURL, apiKey, fetch: fetchOption });
    return {
      kind,
      createModel: (modelId: string) => deepseek(modelId),
      tools: { ...localTools },
    };
  }
  const openai = createOpenAI({ baseURL, apiKey, fetch: fetchOption });
  return {
    kind,
    createModel: (modelId: string) => (useChatApi(baseURL, modelId) ? openai.chat(modelId) : openai(modelId)),
    tools: { ...localTools },
  };
}

export type Provider = ReturnType<typeof createProvider>;
