import { useState, useCallback } from "react"
import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"

const API_ORIGIN = import.meta.env.VITE_API_ORIGIN ?? "http://localhost:3000"
const CHAT_URL = `${API_ORIGIN}/api/ai/chat`

type Message = { role: "user" | "assistant"; content: string }

async function streamChat(
  messages: Message[],
  onChunk: (content: string) => void,
  onDone: (fullContent: string) => void
): Promise<void> {
  const res = await fetch(CHAT_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
    }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as { msg?: string }).msg ?? `HTTP ${res.status}`)
  }
  const reader = res.body?.getReader()
  if (!reader) throw new Error("No response body")
  const decoder = new TextDecoder()
  let fullContent = ""
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    const chunk = decoder.decode(value, { stream: true })
    fullContent += chunk
    onChunk(chunk)
  }
  onDone(fullContent)
}

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [streamingContent, setStreamingContent] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const send = useCallback(() => {
    const text = input.trim()
    if (!text || loading) return
    setInput("")
    setError(null)
    const userMessage: Message = { role: "user", content: text }
    const nextMessages: Message[] = [...messages, userMessage]
    setMessages(nextMessages)
    setStreamingContent("")
    setLoading(true)
    streamChat(
      nextMessages,
      (chunk) => {
        console.log("chunk", chunk)

        setStreamingContent((c) => c + chunk)
      },
      (fullContent) => {
        console.log("fullContent", fullContent)

        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: fullContent },
        ])
        setStreamingContent("")
      }
    )
      .catch((e) => setError(e instanceof Error ? e.message : "Request failed"))
      .finally(() => setLoading(false))
  }, [input, loading, messages])

  return (
    <div className="flex flex-col h-[80vh] max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-4">
        <h1 className="text-2xl font-bold">Chat</h1>
        <Link to="/" className="text-blue-600 underline">
          Home
        </Link>
      </div>
      <div className="flex-1 overflow-y-auto border rounded p-4 space-y-3 bg-gray-50">
        {messages.map((m, i) => (
          <div
            key={i}
            className={m.role === "user" ? "text-right" : "text-left"}
          >
            <span className="font-medium">
              {m.role === "user" ? "You" : "Assistant"}:{" "}
            </span>
            <span className="whitespace-pre-wrap">{m.content}</span>
          </div>
        ))}
        {streamingContent && (
          <div className="text-left">
            <span className="font-medium">Assistant: </span>
            <span className="whitespace-pre-wrap">{streamingContent}</span>
          </div>
        )}
      </div>
      {error && (
        <p className="mt-2 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
      <div className="flex gap-2 mt-4">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
          placeholder="Type a message..."
          className="flex-1 border rounded px-3 py-2"
          disabled={loading}
        />
        <Button onClick={send} disabled={loading || !input.trim()}>
          Send
        </Button>
      </div>
    </div>
  )
}
