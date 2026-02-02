import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import dotenv from "dotenv"
import { defineConfig } from "prisma/config"

const __dirname = dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: join(__dirname, ".env.example") })

console.log("process.env.DATABASE_URL", process.env.DATABASE_URL)

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env.DATABASE_URL,
  },
})
