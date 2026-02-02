import { createDeepSeek } from "@ai-sdk/deepseek"
import { createOpenAI } from "@ai-sdk/openai"
import { localTools } from "./tools"

export const CONFIG_ERR_PREFIX = "Missing configuration: "
type ProviderKind = "openai" | "deepseek"
const PROVIDER_KINDS: ProviderKind[] = ["openai", "deepseek"]

export const DEFAULT_MODEL: Record<ProviderKind, string> = {
  openai: "gpt-5.2",
  deepseek: "deepseek-chat",
}

const PROVIDER_ENV: Record<ProviderKind, { baseURL: string; apiKey: string }> =
  {
    openai: { baseURL: "OPENAI_BASE_URL", apiKey: "OPENAI_API_KEY" },
    deepseek: { baseURL: "DEEPSEEK_BASE_URL", apiKey: "DEEPSEEK_API_KEY" },
  }

function getProviderKind(): ProviderKind {
  const raw = (process.env.AI_PROVIDER ?? "openai").toLowerCase()
  if (PROVIDER_KINDS.includes(raw as ProviderKind)) {
    return raw as ProviderKind
  }
  throw new Error(
    `${CONFIG_ERR_PREFIX}Unknown AI_PROVIDER "${raw}". Use: ${PROVIDER_KINDS.join(
      ", "
    )}`
  )
}

function requireEnv(kind: ProviderKind): { baseURL: string; apiKey: string } {
  const keys = PROVIDER_ENV[kind]
  const missing = [keys.baseURL, keys.apiKey].filter(
    (k) => !process.env[k]?.trim()
  )
  if (missing.length) {
    throw new Error(CONFIG_ERR_PREFIX + missing.join(", "))
  }
  return {
    baseURL: process.env[keys.baseURL]!.trim(),
    apiKey: process.env[keys.apiKey]!.trim(),
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
  const kind = getProviderKind()
  const { baseURL, apiKey } = requireEnv(kind)
  if (kind === "deepseek") {
    const deepseek = createDeepSeek({ baseURL, apiKey })
    return {
      kind,
      createModel: (modelId: string) => deepseek(modelId),
      tools: { ...localTools },
    }
  }
  const openai = createOpenAI({ baseURL, apiKey })
  return {
    kind,
    createModel: (modelId: string) =>
      useChatApi(baseURL, modelId) ? openai.chat(modelId) : openai(modelId),
    tools: { ...localTools },
  }
}

export type Provider = ReturnType<typeof getProvider>
