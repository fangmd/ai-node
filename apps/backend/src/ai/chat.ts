import { createOpenAI } from "@ai-sdk/openai"
import { generateText } from "ai"

const CONFIG_MSG = "OPENAI_BASE_URL and OPENAI_API_KEY must be set"

function getProvider() {
  const baseURL = process.env.OPENAI_BASE_URL
  const apiKey = process.env.OPENAI_API_KEY
  if (!baseURL?.trim() || !apiKey?.trim()) {
    throw new Error(CONFIG_MSG)
  }
  return createOpenAI({ baseURL, apiKey })
}

export type ChatMessage = { role: "user" | "assistant" | "system"; content: string }

export async function chat(messages: ChatMessage[]): Promise<{ text: string }> {
  const openai = getProvider()
  const model = openai("gpt-3.5-turbo")
  const { text } = await generateText({
    model,
    messages: messages.map((m) => ({ role: m.role, content: m.content })),
  })
  return { text }
}

export { CONFIG_MSG }
