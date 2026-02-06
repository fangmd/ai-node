import type { LanguageModelMiddleware } from 'ai';
import { logger } from '../common/logger';

const getBaseURL = (params: { providerOptions?: Record<string, unknown> }): string | undefined => {
  const llm = params.providerOptions?.__llm as { baseURL?: string } | undefined;
  return llm?.baseURL;
};

export const customLogMiddleware: LanguageModelMiddleware = {
  specificationVersion: 'v3',
  transformParams: async ({ type, params }) => {
    logger.info({ type, params }, '[chat] model request');

    const baseURL = getBaseURL(params);
    if (baseURL?.includes('dashscope.aliyuncs.com/api/v2/apps/protocols/compatible-mode')) {
      // 兼容 aliyun DashScope compatible-mode
      params.tools?.forEach((ele) => {
        // 增加 tools 必须要参数：required
        if ('inputSchema' in ele && ele.inputSchema && ele.inputSchema.required === undefined) {
          ele.inputSchema.required = [];
        }
      });
    }

    return params;
  },
};
