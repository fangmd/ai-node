import { Hono } from "hono"
import type { UIMessage } from "ai"
import { jwtAuth } from "../auth/middleware"
import { streamChatFromUIMessages, CONFIG_ERR_PREFIX } from "../ai/chat"
import { AppError, BadRequest, InternalError, ServiceUnavailable } from "../errors"
import { success } from "../response"

const ai = new Hono()

ai.get("/hello", (c) => success(c, { message: "AI API ready" }))

ai.post("/chat", jwtAuth, async (c) => {
  const body = await c.req.json<{ messages?: UIMessage[] }>()
  const messages = body?.messages
  if (!Array.isArray(messages) || messages.length === 0) {
    throw new AppError(BadRequest, "messages array is required and must be non-empty")
  }

  try {
    console.log("chat messages", JSON.stringify(messages))
    const result = await streamChatFromUIMessages(messages)
    return result.toUIMessageStreamResponse({ originalMessages: messages })
  } catch (e) {
    const msg = e instanceof Error ? e.message : "chat failed"
    if (msg.startsWith(CONFIG_ERR_PREFIX))
      throw new AppError(ServiceUnavailable, msg, undefined, e)
    throw new AppError(InternalError, msg, undefined, e)
  }
})

export default ai
