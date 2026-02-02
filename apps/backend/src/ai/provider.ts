import { createDeepSeek } from "@ai-sdk/deepseek"
import { createOpenAI } from "@ai-sdk/openai"
import { config } from "../common/env.js"
import { getProxyFetch } from "./proxy-fetch"
import { localTools } from "./tools"

export const CONFIG_ERR_PREFIX = "Missing configuration: "
type ProviderKind = "openai" | "deepseek"
const PROVIDER_KINDS: ProviderKind[] = ["openai", "deepseek"]

export const DEFAULT_MODEL: Record<ProviderKind, string> = {
  openai: "gpt-5.2",
  deepseek: "deepseek-chat",
}

function getBaseURLAndApiKey(): { baseURL: string; apiKey: string } {
  const ai = config.ai
  if (ai.provider === "openai") {
    return {
      baseURL: ai.openaiBaseURL!.trim(),
      apiKey: ai.openaiApiKey!.trim(),
    }
  }
  return {
    baseURL: ai.deepseekBaseURL!.trim(),
    apiKey: ai.deepseekApiKey!.trim(),
  }
}

/**
 * Volc/方舟等兼容 Chat API(messages) 而非 Responses API(input)，用 chat 避免 input 报 nil
 */
function useChatApi(baseURL: string, modelId: string): boolean {
  return (
    baseURL.includes("volces.com") ||
    baseURL.includes("volcengine") ||
    baseURL.includes("aliyuncs.com") ||
    modelId.startsWith("glm-")
  )
}

export function getProvider() {
  const kind = config.ai.provider
  const { baseURL, apiKey } = getBaseURLAndApiKey()
  const fetchOption = getProxyFetch()
  if (kind === "deepseek") {
    const deepseek = createDeepSeek({ baseURL, apiKey, fetch: fetchOption })
    return {
      kind,
      createModel: (modelId: string) => deepseek(modelId),
      tools: { ...localTools },
    }
  }
  const openai = createOpenAI({ baseURL, apiKey, fetch: fetchOption })
  return {
    kind,
    createModel: (modelId: string) =>
      useChatApi(baseURL, modelId) ? openai.chat(modelId) : openai(modelId),
    tools: { ...localTools },
  }
}

export type Provider = ReturnType<typeof getProvider>
