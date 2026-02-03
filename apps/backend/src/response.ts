import type { Context } from 'hono';
import type { ApiResponse } from '@ai-node/types';

export function success<T = object>(c: Context, data?: T) {
  return c.json<ApiResponse<T>>({ code: 200, msg: 'success', data: (data ?? {}) as T }, 200);
}

export function fail(c: Context, code: number, msg: string, data?: object) {
  return c.json({ code, msg, data: data ?? {} }, 200);
}
