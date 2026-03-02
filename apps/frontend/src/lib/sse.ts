/**
 * SSE endpoint URL with token for authenticated connection.
 * EventSource does not send headers; token is passed in query. Same origin (proxy in dev).
 */
export function getSSEUrl(token: string): string {
  return `/api/sse?token=${encodeURIComponent(token)}`;
}

export type SSEConnectionStatus = 'connecting' | 'open' | 'closed' | 'error';

export type SSEMessage = { event: string; data: unknown };

/** 发送用户消息提示：服务端推送后前端用通知展示 */
export const SSE_EVENT_USER_MESSAGE = 'user-message';

export type UserMessagePayload = {
  message: string;
  title?: string;
};
