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

const CONFIG_MSG = "OPENAI_BASE_URL and OPENAI_API_KEY must be set"

function getProvider() {
  const baseURL = process.env.OPENAI_BASE_URL
  const apiKey = process.env.OPENAI_API_KEY
  if (!baseURL?.trim() || !apiKey?.trim()) {
    throw new Error(CONFIG_MSG)
  }
  return createOpenAI({ baseURL, apiKey })
}

function getModel(provider: ReturnType<typeof createOpenAI>) {
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

const tools = (provider: ReturnType<typeof createOpenAI>) => ({
  ...localTools,
  web_search: provider.tools.webSearch({}),
})

export type ChatMessage = {
  role: "user" | "assistant" | "system"
  content: string
}

export function streamChat(messages: ChatMessage[]) {
  const provider = getProvider()
  return streamText({
    model: getModel(provider),
    tools: tools(provider),
    messages: messages.map((m) => ({ role: m.role, content: m.content })),
  })
}

export async function streamChatFromUIMessages(uiMessages: UIMessage[]) {
  const provider = getProvider()
  const model = getModel(provider)
  const toolSet = tools(provider)
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

export { CONFIG_MSG }
