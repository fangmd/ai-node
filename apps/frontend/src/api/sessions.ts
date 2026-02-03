import { request } from '@/lib/request';

export type SessionItem = {
  id: string;
  title?: string;
  updateTime: string;
};

export type SessionMessage = {
  id: string;
  role: string;
  parts: unknown[];
};

export async function fetchSessions(): Promise<SessionItem[]> {
  const res = await request.get<{ code: number; data: SessionItem[] }>('/api/ai/sessions');
  if (res.data?.code === 200 && Array.isArray(res.data.data)) {
    return res.data.data;
  }
  return [];
}

export async function fetchSessionMessages(sessionId: string): Promise<SessionMessage[]> {
  const res = await request.get<{ code: number; data: SessionMessage[] }>(
    `/api/ai/sessions/${sessionId}/messages`
  );
  if (res.data?.code === 200 && Array.isArray(res.data.data)) {
    return res.data.data;
  }
  return [];
}
