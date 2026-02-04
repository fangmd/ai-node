import type { ApiResponse } from '@ai-node/types';
import { request } from '@/lib/request';

export function login(username: string, password: string) {
  return request.post<ApiResponse<{ token: string }>>('/api/auth/login', {
    username,
    password,
  });
}

export function register(username: string, password: string) {
  return request.post<ApiResponse<{ username: string }>>('/api/auth/register', {
    username,
    password,
  });
}
