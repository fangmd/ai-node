export type ApiResponse<T = object> = {
  code: number;
  msg: string;
  data: T;
};

/** LLM 配置的 provider 可选值，与 createProvider(kind) 一致 */
export const LLM_PROVIDER_KINDS = ['openai', 'deepseek', 'alibaba'] as const;

/** LLM 配置的 provider 类型 */
export type LlmProviderKind = (typeof LLM_PROVIDER_KINDS)[number];
