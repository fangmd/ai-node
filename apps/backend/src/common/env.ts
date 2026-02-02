import { config as loadEnv } from "dotenv"
import { resolve, dirname } from "path"
import { fileURLToPath } from "url"
import { z } from "zod"

const __dirname = dirname(fileURLToPath(import.meta.url))
loadEnv({ path: resolve(__dirname, "../../.env.example") })
loadEnv({ path: resolve(__dirname, "../../.env") })

const schema = z.object({
  server: z.object({
    port: z.coerce.number().default(3000),
    nodeEnv: z.string().default("development"),
  }),
  auth: z.object({
    jwtSecret: z.string().min(1, "JWT_SECRET is required"),
    jwtExpiresIn: z.string().default("7d"),
  }),
  database: z.object({ url: z.string().min(1, "DATABASE_URL is required") }),
  ai: z.object({
    provider: z.enum(["openai", "deepseek"]).default("openai"),
    model: z.string().optional(),
    openaiBaseURL: z.string().optional(),
    openaiApiKey: z.string().optional(),
    deepseekBaseURL: z.string().optional(),
    deepseekApiKey: z.string().optional(),
  }),
  proxy: z.object({
    httpProxy: z.string().optional(),
    httpsProxy: z.string().optional(),
  }),
})

function raw() {
  const p = process.env
  return {
    server: { port: p.PORT, nodeEnv: p.NODE_ENV },
    auth: { jwtSecret: p.JWT_SECRET, jwtExpiresIn: p.JWT_EXPIRES_IN },
    database: { url: p.DATABASE_URL },
    ai: {
      provider: (p.AI_PROVIDER ?? "openai").toLowerCase(),
      model: p.AI_MODEL?.trim(),
      openaiBaseURL: p.OPENAI_BASE_URL?.trim(),
      openaiApiKey: p.OPENAI_API_KEY?.trim(),
      deepseekBaseURL: p.DEEPSEEK_BASE_URL?.trim(),
      deepseekApiKey: p.DEEPSEEK_API_KEY?.trim(),
    },
    proxy: { httpProxy: p.HTTP_PROXY?.trim(), httpsProxy: p.HTTPS_PROXY?.trim() },
  }
}

function parse() {
  const parsed = schema.safeParse(raw())
  if (!parsed.success) {
    throw new Error(`Config validation failed: ${parsed.error.message}`)
  }
  const { server, auth, database, ai, proxy } = parsed.data
  if (ai.provider === "openai" && (!ai.openaiBaseURL || !ai.openaiApiKey)) {
    throw new Error("When AI_PROVIDER=openai, OPENAI_BASE_URL and OPENAI_API_KEY are required")
  }
  if (ai.provider === "deepseek" && (!ai.deepseekBaseURL || !ai.deepseekApiKey)) {
    throw new Error("When AI_PROVIDER=deepseek, DEEPSEEK_BASE_URL and DEEPSEEK_API_KEY are required")
  }
  return {
    server: { ...server, isDev: server.nodeEnv !== "production" },
    auth,
    database,
    ai,
    proxy,
  }
}

export const config = parse()
export type Config = ReturnType<typeof parse>

export const isDev = config.server.isDev
export const JWT_SECRET = config.auth.jwtSecret
export const JWT_EXPIRES_IN = config.auth.jwtExpiresIn
