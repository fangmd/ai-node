/**
 * SSE endpoint URL with token for authenticated connection.
 * EventSource does not send headers; token is passed in query. Same origin (proxy in dev).
 */
export function getSSEUrl(token: string): string {
  return `/api/sse?token=${encodeURIComponent(token)}`;
}

export type SSEConnectionStatus = 'connecting' | 'open' | 'closed' | 'error';

export type SSEMessage = { event: string; data: unknown };
