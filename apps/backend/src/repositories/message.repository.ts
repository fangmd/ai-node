import { generateUUID } from '../common/snowflake.js';
import { prisma } from '../common/prisma.js';

export function createMessage(sessionId: bigint, role: string, parts: unknown) {
  const id = generateUUID() as bigint;
  return prisma.message.create({
    data: { id, session_id: sessionId, role, parts: parts ?? [] },
  });
}

export function updateMessageParts(id: bigint, parts: unknown) {
  return prisma.message.update({
    where: { id },
    data: { parts: parts as any },
  });
}

export function findMessagesBySessionId(sessionId: bigint) {
  return prisma.message.findMany({
    where: { session_id: sessionId },
    orderBy: { create_time: 'asc' },
  });
}

export function deleteMessagesBySessionIds(sessionIds: bigint[]) {
  return prisma.message.deleteMany({
    where: { session_id: { in: sessionIds } },
  });
}
