import { createDeepSeek } from "@ai-sdk/deepseek"
import { createOpenAI } from "@ai-sdk/openai"
import { devToolsMiddleware } from "@ai-sdk/devtools"
import {
  convertToModelMessages,
  stepCountIs,
  streamText,
  type UIMessage,
  wrapLanguageModel,
} from "ai"
import { isDev } from "../common/env"
import { localTools } from "./tools"

const CONFIG_ERR_PREFIX = "Missing configuration: "
type ProviderKind = "openai" | "deepseek"
const PROVIDER_KINDS: ProviderKind[] = ["openai", "deepseek"]

const DEFAULT_MODEL: Record<ProviderKind, string> = {
  openai: "gpt-5.2",
  deepseek: "deepseek-chat",
}

const PROVIDER_ENV: Record<
  ProviderKind,
  { baseURL: string; apiKey: string }
> = {
  openai: { baseURL: "OPENAI_BASE_URL", apiKey: "OPENAI_API_KEY" },
  deepseek: { baseURL: "DEEPSEEK_BASE_URL", apiKey: "DEEPSEEK_API_KEY" },
}

function getProviderKind(): ProviderKind {
  const raw = (process.env.AI_PROVIDER ?? "openai").toLowerCase()
  if (PROVIDER_KINDS.includes(raw as ProviderKind)) {
    return raw as ProviderKind
  }
  throw new Error(
    `${CONFIG_ERR_PREFIX}Unknown AI_PROVIDER "${raw}". Use: ${PROVIDER_KINDS.join(", ")}`
  )
}

function requireEnv(kind: ProviderKind): { baseURL: string; apiKey: string } {
  const keys = PROVIDER_ENV[kind]
  const baseURL = process.env[keys.baseURL]?.trim()
  const apiKey = process.env[keys.apiKey]?.trim()
  const missing = [keys.baseURL, keys.apiKey].filter(
    (k) => !process.env[k]?.trim()
  )
  if (missing.length) {
    throw new Error(CONFIG_ERR_PREFIX + missing.join(", "))
  }
  return { baseURL: baseURL!, apiKey: apiKey! }
}

function getProvider() {
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
    createModel: (modelId: string) => openai(modelId),
    tools: {
      ...localTools,
      web_search: openai.tools.webSearch({}),
    },
  }
}

function getModel(provider: ReturnType<typeof getProvider>) {
  const modelId =
    process.env.AI_MODEL?.trim() ?? DEFAULT_MODEL[provider.kind]
  const baseModel = provider.createModel(modelId)
  if (isDev) {
    return wrapLanguageModel({
      model: baseModel,
      middleware: devToolsMiddleware() as Parameters<
        typeof wrapLanguageModel
      >[0]["middleware"],
    })
  }
  return baseModel
}

export type ChatMessage = {
  role: "user" | "assistant" | "system"
  content: string
}

export async function streamChatFromUIMessages(uiMessages: UIMessage[]) {
  const provider = getProvider()
  const model = getModel(provider)
  const toolSet = provider.tools
  const modelMessages = await convertToModelMessages(uiMessages, {
    tools: toolSet,
  })

  return streamText({
    model,
    tools: toolSet,
    messages: modelMessages,
    stopWhen: stepCountIs(5),
  })
}

export { CONFIG_ERR_PREFIX }
