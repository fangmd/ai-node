import { devToolsMiddleware } from '@ai-sdk/devtools';
import { wrapLanguageModel } from 'ai';
import { config } from '../common/env';
import { customLogMiddleware } from './middleware';
import type { Provider } from './provider';

export function getModel(provider: Provider, modelId: string) {
  const baseModel = provider.createModel(modelId);
  if (config.server.isDev) {
    return wrapLanguageModel({
      model: baseModel,
      middleware: [customLogMiddleware, devToolsMiddleware()],
    });
  } else {
    return wrapLanguageModel({
      model: baseModel,
      middleware: [customLogMiddleware],
    });
  }
}
