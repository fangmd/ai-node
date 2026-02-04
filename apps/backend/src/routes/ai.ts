import { Hono } from 'hono';
import type { UIMessage } from 'ai';
import { jwtAuth, type AuthUser } from '../auth/middleware.js';
import { streamChatFromUIMessages, CONFIG_ERR_PREFIX } from '../ai/chat.js';
import { AppError, BadRequest, InternalError, NotFound, ServiceUnavailable } from '../errors/index.js';
import { createSession, findSessionsByUserId, findSessionByIdAndUserId } from '../repositories/session.repository.js';
import { createMessage, findMessagesBySessionId, updateMessageParts } from '../repositories/message.repository.js';
import { success } from '../response.js';

const ai = new Hono<{ Variables: { user: AuthUser } }>();

const SESSION_TITLE_MAX_LEN = 50;

function extractFirstUserMessageText(messages: UIMessage[]): string | undefined {
  const userMsg = messages.find((m) => m.role === 'user');
  if (!userMsg || !Array.isArray(userMsg.parts)) return undefined;
  for (const part of userMsg.parts) {
    if (
      part &&
      typeof part === 'object' &&
      'type' in part &&
      part.type === 'text' &&
      typeof (part as { text?: string }).text === 'string'
    ) {
      const text = (part as { text: string }).text.trim();
      return text.length > SESSION_TITLE_MAX_LEN ? text.slice(0, SESSION_TITLE_MAX_LEN) + '…' : text || undefined;
    }
  }
  return undefined;
}

ai.get('/hello', (c) => success(c, { message: 'AI API ready' }));

ai.get('/sessions', jwtAuth, async (c) => {
  const user = c.get('user');
  const userId = BigInt(user.id);
  const sessions = await findSessionsByUserId(userId);
  return success(
    c,
    sessions.map((s: { id: bigint; title: string | null; update_time: Date }) => ({
      id: String(s.id),
      title: s.title ?? undefined,
      updateTime: s.update_time.toISOString(),
    }))
  );
});

ai.get('/sessions/:sessionId/messages', jwtAuth, async (c) => {
  const user = c.get('user');
  const userId = BigInt(user.id);
  const sessionIdStr = c.req.param('sessionId');
  const sessionId = BigInt(sessionIdStr);
  const session = await findSessionByIdAndUserId(sessionId, userId);
  if (!session) throw new AppError(NotFound, 'session not found');
  const messages = await findMessagesBySessionId(sessionId);
  return success(
    c,
    messages.map((m: { id: bigint; role: string; parts: unknown }) => ({
      id: String(m.id),
      role: m.role,
      parts: m.parts as unknown[],
    }))
  );
});

ai.post('/chat', jwtAuth, async (c) => {
  const body = await c.req.json<{ messages?: UIMessage[]; sessionId?: string }>();
  const messages = body?.messages;
  if (!Array.isArray(messages) || messages.length === 0) {
    throw new AppError(BadRequest, 'messages array is required and must be non-empty');
  }

  const user = c.get('user');
  const userId = BigInt(user.id);
  let sessionId: bigint;
  let isNewSession = false;

  if (body.sessionId != null && body.sessionId !== '') {
    const session = await findSessionByIdAndUserId(BigInt(body.sessionId), userId);
    if (!session) throw new AppError(NotFound, 'session not found');
    sessionId = session.id;
  } else {
    const title = extractFirstUserMessageText(messages);
    const session = await createSession(userId, title);
    sessionId = session.id;
    isNewSession = true;
  }

  const lastMessage = messages[messages.length - 1];
  if (lastMessage?.role === 'user' && Array.isArray(lastMessage.parts)) {
    await createMessage(sessionId, 'user', lastMessage.parts);
  }

  const assistantMsg = await createMessage(sessionId, 'assistant', []);
  const assistantIdStr = String(assistantMsg.id);

  try {
    const result = await streamChatFromUIMessages(messages);
    const response = result.toUIMessageStreamResponse({
      originalMessages: messages,
      generateMessageId: () => assistantIdStr,
      onFinish: async ({ responseMessage }) => {
        await updateMessageParts(assistantMsg.id, responseMessage.parts ?? []);
      },
    });
    if (isNewSession) {
      response.headers.set('X-Session-Id', String(sessionId));
    }
    return response;
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'chat failed';
    if (msg.startsWith(CONFIG_ERR_PREFIX)) throw new AppError(ServiceUnavailable, msg, undefined, e);
    throw new AppError(InternalError, msg, undefined, e);
  }
});

export default ai;
