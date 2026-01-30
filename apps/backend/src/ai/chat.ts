import { createOpenAI, openai } from "@ai-sdk/openai"
import { streamText } from "ai"

const CONFIG_MSG = "OPENAI_BASE_URL and OPENAI_API_KEY must be set"

function getProvider() {
  const baseURL = process.env.OPENAI_BASE_URL
  const apiKey = process.env.OPENAI_API_KEY
  if (!baseURL?.trim() || !apiKey?.trim()) {
    throw new Error(CONFIG_MSG)
  }
  return createOpenAI({ baseURL, apiKey })
}

export type ChatMessage = {
  role: "user" | "assistant" | "system"
  content: string
}

export function streamChat(messages: ChatMessage[]) {
  const provider = getProvider()
  const model = provider("gpt-5.2")
  return streamText({
    model,
    tools: {
      // web_search: openai.tools.webSearchPreview(),
    },
    messages: messages.map((m) => ({ role: m.role, content: m.content })),
  })
}

export { CONFIG_MSG }
