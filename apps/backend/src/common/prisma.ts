import { PrismaMariaDb } from "@prisma/adapter-mariadb"
import { PrismaClient } from "../generated/prisma/client.js"
import { config } from "./env.js"

function adapterConfigFromUrl(url: string) {
  if (!url || !url.trim()) {
    throw new Error("DATABASE_URL is required")
  }
  const u = new URL(url)
  return {
    host: u.hostname,
    port: u.port ? Number(u.port) : 3306,
    user: u.username,
    password: u.password,
    database: u.pathname.slice(1) || undefined,
    connectionLimit: 5,
  }
}

const adapter = new PrismaMariaDb(adapterConfigFromUrl(config.database.url))

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }
export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter })
if (config.server.isDev) globalForPrisma.prisma = prisma
