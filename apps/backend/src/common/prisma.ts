import { PrismaMariaDb } from "@prisma/adapter-mariadb"
import { PrismaClient } from "../generated/prisma/client.js"
import { isDev } from "./env.js"

function adapterConfigFromUrl(url: string) {
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

const url = process.env.DATABASE_URL ?? ""
const adapter = new PrismaMariaDb(adapterConfigFromUrl(url))

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }
export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter })
if (isDev) globalForPrisma.prisma = prisma
