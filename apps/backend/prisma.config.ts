import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import dotenv from "dotenv"
import { defineConfig } from "prisma/config"

// Exception: Prisma CLI (migrate, generate) runs before app entry; load only DATABASE_URL here.
const __dirname = dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: join(__dirname, ".env.example") })
dotenv.config({ path: join(__dirname, ".env") })

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env.DATABASE_URL,
  },
})
