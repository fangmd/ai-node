import type { LlmProviderKind } from '@ai-node/types';
import { createAlibaba } from '@ai-sdk/alibaba';
import { createDeepSeek } from '@ai-sdk/deepseek';
import { createOpenAI } from '@ai-sdk/openai';
import { getProxyFetch } from './proxy-fetch';
import { localTools } from './tools';

export type { LlmProviderKind as ProviderKind };

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
    baseURL.includes('open.bigmodel.cn')
  );
}

export function createProvider(kind: LlmProviderKind, baseURL: string, apiKey: string, modelId?: string) {
  const fetchOption = getProxyFetch();
  if (kind === 'deepseek') {
    const deepseek = createDeepSeek({ baseURL, apiKey, fetch: fetchOption });
    return {
      kind,
      createModel: (modelId: string) => deepseek(modelId),
      tools: { ...localTools },
    };
  }
  if (kind === 'alibaba') {
    const alibaba = createAlibaba({ baseURL, apiKey, fetch: fetchOption });
    return {
      kind,
      createModel: (modelId: string) => alibaba(modelId),
      tools: { ...localTools },
    };
  }
  const openai = createOpenAI({ baseURL, apiKey, fetch: fetchOption });

  // OpenAI Web Search 属于 Responses API 工具；走 Chat API 时不启用，避免不兼容报错
  const enableWebSearch = modelId ? !useChatApi(baseURL, modelId) : true;

  return {
    kind,
    createModel: (modelId: string) => (useChatApi(baseURL, modelId) ? openai.chat(modelId) : openai(modelId)),
    tools: {
      ...localTools,
      ...(enableWebSearch
        ? {
            web_search: openai.tools.webSearch({
              externalWebAccess: true,
              searchContextSize: 'medium',
            }),
          }
        : {}),
    },
  };
}

export type Provider = ReturnType<typeof createProvider>;
