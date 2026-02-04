import type { ApiResponse } from '@ai-node/types';
import { request } from '@/lib/request';

export type LlmProvider = 'openai' | 'deepseek';

export type LlmConfigItem = {
  id: string;
  name: string;
  provider: LlmProvider;
  baseURL: string;
  modelId: string;
  isDefault: boolean;
  hasKey: boolean;
  updateTime: string;
};

export type CreateLlmConfigInput = {
  name: string;
  provider: LlmProvider;
  baseURL: string;
  modelId: string;
  apiKey: string;
  isDefault?: boolean;
};

export type UpdateLlmConfigInput = Partial<Omit<CreateLlmConfigInput, 'isDefault'>>; // default via separate endpoint

export function fetchLlmConfigs() {
  return request.get<ApiResponse<LlmConfigItem[]>>('/api/settings/llm/configs');
}

export function createLlmConfig(input: CreateLlmConfigInput) {
  return request.post<ApiResponse<LlmConfigItem>>('/api/settings/llm/configs', input);
}

export function updateLlmConfig(id: string, input: UpdateLlmConfigInput) {
  return request.put<ApiResponse<{ updated: true }>>(`/api/settings/llm/configs/${id}`, input);
}

export function deleteLlmConfig(id: string) {
  return request.delete<ApiResponse<{ deleted: true }>>(`/api/settings/llm/configs/${id}`);
}

export function setDefaultLlmConfig(id: string) {
  return request.post<ApiResponse<{ updated: true }>>(`/api/settings/llm/configs/${id}/default`);
}

