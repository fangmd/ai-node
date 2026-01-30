import { Hono } from "hono"
import type { UIMessage } from "ai"
import { streamChatFromUIMessages, CONFIG_ERR_PREFIX } from "../ai/chat"
import { fail, success } from "../response"

const ai = new Hono()

ai.get("/hello", (c) => success(c, { message: "AI API ready" }))

ai.post("/chat", async (c) => {
  try {
    const body = await c.req.json<{ messages?: UIMessage[] }>()
    const messages = body?.messages
    if (!Array.isArray(messages) || messages.length === 0) {
      return fail(c, 400, "messages array is required and must be non-empty")
    }

    console.log("chat messages", JSON.stringify(messages))
    const result = await streamChatFromUIMessages(messages)

    return result.toUIMessageStreamResponse({ originalMessages: messages })
  } catch (e) {
    console.error(e)
    const msg = e instanceof Error ? e.message : "chat failed"
    if (msg.startsWith(CONFIG_ERR_PREFIX)) {
      return fail(c, 503, msg)
    }
    return fail(c, 500, msg)
  }
})

export default ai
