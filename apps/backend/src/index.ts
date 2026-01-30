import { config } from "dotenv"
import { resolve } from "path"

const cwd = process.cwd()
config({ path: resolve(cwd, ".env.example") })
config({ path: resolve(cwd, ".env") })

import { Hono } from "hono"
import { cors } from "hono/cors"
import { serve } from "@hono/node-server"
import { isDev } from "./common"
import { success } from "./response"
import ai from "./routes/ai"

const app = new Hono()

app.use(
  "*",
  cors({
    origin: ["http://localhost:5173"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  })
)

app.get("/", (c) => success(c, { message: "Hello from Hono" }))
app.get("/health", (c) => success(c, { status: "ok" }))
app.route("/api/ai", ai)

console.log("process.env.OPENAI_BASE_URL", process.env.OPENAI_BASE_URL)
console.log("process.env.OPENAI_API_KEY", process.env.OPENAI_API_KEY)
console.log("process.env.PORT", process.env.PORT)
console.log("process.env.NODE_ENV", process.env.NODE_ENV)
console.log("isDev", isDev)

if (!isDev) {
  const port = Number(process.env.PORT) || 3000
  serve({ fetch: app.fetch, port }, (info) => {
    console.log(`Server running at http://localhost:${info.port}`)
  })
}

export default app
