import { config } from "dotenv"
import { resolve, dirname } from "path"
import { fileURLToPath } from "url"

const __dirname = dirname(fileURLToPath(import.meta.url))
config({ path: resolve(__dirname, "../../.env.example") })
config({ path: resolve(__dirname, "../../.env") })

export const isDev = process.env.NODE_ENV !== "production"

export const JWT_SECRET = process.env.JWT_SECRET ?? ""
export const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN ?? "7d"
