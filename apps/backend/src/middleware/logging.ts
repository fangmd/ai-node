import type { Context, Next } from 'hono';
import { logger } from '../common/logger';

/**
 * 请求/响应日志中间件：记录 method、path、query、status、耗时；
 * 对 application/json 响应尝试记录 body（流式响应不读 body）。
 */
export async function requestLogging(c: Context, next: Next) {
  const start = Date.now();
  const method = c.req.method;
  const path = c.req.path;
  const query = c.req.query();
  const queryStr = Object.keys(query).length ? `?${new URLSearchParams(query).toString()}` : '';
  logger.info({ method, path, query: queryStr || undefined }, 'request');

  await next();

  const ms = Date.now() - start;
  const status = c.res.status;
  const contentType = c.res.headers.get('content-type') ?? '';
  let responseBody: unknown = undefined;
  if (contentType.includes('application/json')) {
    try {
      const cloned = c.res.clone();
      responseBody = await cloned.json();
    } catch {
      // 流式或大 body 不可读时忽略
    }
  }

  logger.info(
    { method, path, status, ms, ...(responseBody !== undefined && { response: responseBody }) },
    'response'
  );
}
