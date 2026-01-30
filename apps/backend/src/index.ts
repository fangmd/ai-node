import { Hono } from "hono"
import { cors } from "hono/cors"
import { serve } from "@hono/node-server"
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

const port = Number(process.env.PORT) || 3000
serve({ fetch: app.fetch, port }, (info) => {
  console.log(`Server running at http://localhost:${info.port}`)
})
