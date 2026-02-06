import type { ApiResponse } from '@ai-node/types';
import { request } from '@/lib/request';

export type SessionItem = {
  id: string;
  title?: string;
  updateTime: string;
  llmConfigId?: string;
};

export type SessionMessage = {
  id: string;
  role: string;
  parts: unknown[];
};

export function fetchSessions() {
  return request.get<ApiResponse<SessionItem[]>>('/api/ai/sessions');
}

export function fetchSessionMessages(sessionId: string) {
  return request.get<ApiResponse<SessionMessage[]>>(
    `/api/ai/sessions/${sessionId}/messages`
  );
}

export function deleteSessions(sessionIds: string[]) {
  return request.delete<ApiResponse<{ deleted: true }>>('/api/ai/sessions', {
    data: { sessionIds },
  });
}
