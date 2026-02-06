import { devToolsMiddleware } from '@ai-sdk/devtools';
import { wrapLanguageModel } from 'ai';
import { config } from '../common/env';
import { createAiSdkLoggingMiddleware } from './middlewares/logging';
import { customLogMiddleware } from './middleware';
import type { Provider } from './provider';

export function getModel(provider: Provider, modelId: string) {
  const baseModel = provider.createModel(modelId);
  const middlewares = [
    customLogMiddleware,
    ...(config.aiSdkLog.enabled
      ? [
          createAiSdkLoggingMiddleware({
            enabled: config.aiSdkLog.enabled,
            sampleRate: config.aiSdkLog.sampleRate,
            maxFieldLength: config.aiSdkLog.maxFieldLength,
          }),
        ]
      : []),
    ...(config.server.isDev ? [devToolsMiddleware()] : []),
  ];

  return wrapLanguageModel({
    model: baseModel,
    middleware: middlewares,
  });
}
