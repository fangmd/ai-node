import { generateUUID } from '../common/snowflake.js';
import { prisma } from '../common/prisma.js';

export function createSession(userId: bigint, title?: string) {
  const id = generateUUID() as bigint;
  return prisma.session.create({
    data: { id, user_id: userId, title: title ?? null },
  });
}

export function findSessionsByUserId(userId: bigint) {
  return prisma.session.findMany({
    where: { user_id: userId },
    orderBy: { update_time: 'desc' },
  });
}

export function findSessionByIdAndUserId(sessionId: bigint, userId: bigint) {
  return prisma.session.findFirst({
    where: { id: sessionId, user_id: userId },
  });
}
