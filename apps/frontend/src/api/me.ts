import type { ApiResponse } from '@ai-node/types';
import { request } from '@/lib/request';

export type MeData = { id: string; username: string };

export function getMe() {
  return request.get<ApiResponse<MeData>>('/api/me');
}
