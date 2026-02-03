import { devToolsMiddleware } from '@ai-sdk/devtools';
import { wrapLanguageModel } from 'ai';
import { config } from '../common/env';
import { customLogMiddleware } from './middleware';
import { DEFAULT_MODEL } from './provider';
import type { Provider } from './provider';

export function getModel(provider: Provider) {
  const modelId = config.ai.model?.trim() ?? DEFAULT_MODEL[provider.kind];
  const baseModel = provider.createModel(modelId);
  if (config.server.isDev) {
    return wrapLanguageModel({
      model: baseModel,
      middleware: [customLogMiddleware, devToolsMiddleware()],
    });
  }
  return baseModel;
}
