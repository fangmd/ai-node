import type { LanguageModelMiddleware } from 'ai';
import { config } from '../common/env';
import { logger } from '../common/logger';

export const customLogMiddleware: LanguageModelMiddleware = {
  specificationVersion: 'v3',
  transformParams: async ({ type, params }) => {
    if (config.server.isDev) {
      logger.debug({ type, params }, '[chat] model request');
    }
    return params;
  },
};
