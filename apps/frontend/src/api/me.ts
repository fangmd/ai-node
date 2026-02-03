import { request } from '@/lib/request';

export type MeData = { id: string; username: string };

export function getMe() {
  return request.get<{ code: number; msg?: string; data?: MeData }>('/api/me');
}
