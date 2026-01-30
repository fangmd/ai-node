import { createOpenAI } from "@ai-sdk/openai"
import { devToolsMiddleware } from "@ai-sdk/devtools"
import { streamText, wrapLanguageModel } from "ai"

const CONFIG_MSG = "OPENAI_BASE_URL and OPENAI_API_KEY must be set"

function getProvider() {
  const baseURL = process.env.OPENAI_BASE_URL
  const apiKey = process.env.OPENAI_API_KEY
  if (!baseURL?.trim() || !apiKey?.trim()) {
    throw new Error(CONFIG_MSG)
  }
  return createOpenAI({ baseURL, apiKey })
}

const isDev = process.env.NODE_ENV !== "production"

function getModel() {
  const provider = getProvider()
  const baseModel = provider("gpt-5.2")
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

export function streamChat(messages: ChatMessage[]) {
  const model = getModel()
  return streamText({
    model,
    tools: {
      // web_search: openai.tools.webSearchPreview(),
    },
    messages: messages.map((m) => ({ role: m.role, content: m.content })),
  })
}

export { CONFIG_MSG }
