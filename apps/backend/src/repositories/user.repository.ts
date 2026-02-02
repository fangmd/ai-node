import { prisma } from "../common/prisma.js"

export function findUserByUsername(username: string) {
  return prisma.user.findUnique({ where: { username } })
}

export function createUser(data: {
  id: bigint
  username: string
  passwordHash: string
}) {
  return prisma.user.create({ data })
}
