import { generateUUID } from '../common/snowflake.js';
import { prisma } from '../common/prisma.js';

export function createSession(userId: bigint, title?: string, llmConfigId?: bigint | null) {
  const id = generateUUID() as bigint;
  return prisma.session.create({
    data: { id, user_id: userId, title: title ?? null, llm_config_id: llmConfigId ?? null },
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

export function updateSessionLlmConfigId(sessionId: bigint, userId: bigint, llmConfigId: bigint | null) {
  return prisma.session.updateMany({
    where: { id: sessionId, user_id: userId },
    data: { llm_config_id: llmConfigId },
  });
}

export async function deleteSessions(sessionIds: bigint[], userId: bigint) {
  // Verify ownership: all sessions must belong to the user
  const sessions = await prisma.session.findMany({
    where: { id: { in: sessionIds } },
    select: { id: true, user_id: true },
  });

  // Check if all requested sessions exist and belong to the user
  const foundIds = new Set(sessions.map((s) => s.id));
  const allExist = sessionIds.every((id) => foundIds.has(id));
  const allBelongToUser = sessions.every((s) => s.user_id === userId);

  if (!allExist || !allBelongToUser) {
    throw new Error('Some sessions do not exist or do not belong to the user');
  }

  // Delete in transaction: messages first, then sessions
  return prisma.$transaction(async (tx) => {
    await tx.message.deleteMany({
      where: { session_id: { in: sessionIds } },
    });
    return tx.session.deleteMany({
      where: { id: { in: sessionIds }, user_id: userId },
    });
  });
}
