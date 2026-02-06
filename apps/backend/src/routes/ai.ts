import { Hono } from 'hono';
import type { UIMessage } from 'ai';
import { jwtAuth, type AuthUser } from '../auth/middleware.js';
import { streamChatFromUIMessages } from '../ai/chat.js';
import { AppError, BadRequest, InternalError, NotFound } from '../errors/index.js';
import {
  createSession,
  findSessionsByUserId,
  findSessionByIdAndUserId,
  updateSessionLlmConfigId,
  deleteSessions,
} from '../repositories/session.repository.js';
import { createMessage, findMessagesBySessionId, updateMessageParts } from '../repositories/message.repository.js';
import { success } from '../response.js';
import {
  findDefaultLlmConfigByUserId,
  findLlmConfigByIdAndUserId,
  type LlmProviderKind,
} from '../repositories/llm-config.repository.js';
import { decryptApiKey, DecryptError } from '../common/crypto.js';

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
    sessions.map((s: { id: bigint; title: string | null; update_time: Date; llm_config_id: bigint | null }) => ({
      id: s.id,
      title: s.title ?? undefined,
      updateTime: s.update_time.toISOString(),
      llmConfigId: s.llm_config_id != null ? String(s.llm_config_id) : undefined,
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
      id: m.id,
      role: m.role,
      parts: m.parts as unknown[],
    }))
  );
});

ai.delete('/sessions', jwtAuth, async (c) => {
  const body = await c.req.json<{ sessionIds?: string[] }>();
  const sessionIds = body?.sessionIds;

  // Validate request body (task 2.2)
  if (!Array.isArray(sessionIds) || sessionIds.length === 0) {
    throw new AppError(BadRequest, 'sessionIds array is required and must be non-empty');
  }

  const user = c.get('user');
  const userId = BigInt(user.id);

  try {
    // Convert string IDs to BigInt and delete (ownership verification handled in deleteSessions)
    const sessionIdsBigInt = sessionIds.map((id) => BigInt(id));
    await deleteSessions(sessionIdsBigInt, userId);
    return success(c, { deleted: true });
  } catch (e) {
    // Handle error cases (task 2.5)
    if (e instanceof Error && e.message.includes('do not exist or do not belong')) {
      throw new AppError(NotFound, 'some sessions do not exist or do not belong to the user');
    }
    const msg = e instanceof Error ? e.message : 'failed to delete sessions';
    throw new AppError(InternalError, msg, undefined, e);
  }
});

ai.post('/chat', jwtAuth, async (c) => {
  const body = await c.req.json<{ messages?: UIMessage[]; sessionId?: string; llmConfigId?: string }>();
  const messages = body?.messages;
  if (!Array.isArray(messages) || messages.length === 0) {
    throw new AppError(BadRequest, 'messages array is required and must be non-empty');
  }

  const user = c.get('user');
  const userId = BigInt(user.id);
  let sessionId: bigint;
  let isNewSession = false;
  let sessionLlmConfigId: bigint | null = null;

  if (body.sessionId != null && body.sessionId !== '') {
    const session = await findSessionByIdAndUserId(BigInt(body.sessionId), userId);
    if (!session) throw new AppError(NotFound, 'session not found');
    sessionId = session.id;
    sessionLlmConfigId = (session as { llm_config_id?: bigint | null }).llm_config_id ?? null;
  } else {
    const title = extractFirstUserMessageText(messages);
    // new session: bind to request llmConfigId or user default
    let bindId: bigint | null = null;
    if (body.llmConfigId) {
      const cfg = await findLlmConfigByIdAndUserId(BigInt(body.llmConfigId), userId);
      if (!cfg) throw new AppError(NotFound, 'llm config not found');
      bindId = cfg.id;
    } else {
      const def = await findDefaultLlmConfigByUserId(userId);
      if (!def) throw new AppError(BadRequest, 'please configure a default llm model first');
      bindId = def.id;
    }
    const session = await createSession(userId, title, bindId);
    sessionId = session.id;
    isNewSession = true;
    sessionLlmConfigId = bindId;
  }

  // existing session: allow switching binding via request llmConfigId
  if (!isNewSession && body.llmConfigId) {
    const cfg = await findLlmConfigByIdAndUserId(BigInt(body.llmConfigId), userId);
    if (!cfg) throw new AppError(NotFound, 'llm config not found');
    await updateSessionLlmConfigId(sessionId, userId, cfg.id);
    sessionLlmConfigId = cfg.id;
  }

  // binding补齐: if still null, use user default and persist binding
  if (sessionLlmConfigId == null) {
    const def = await findDefaultLlmConfigByUserId(userId);
    if (!def) throw new AppError(BadRequest, 'please configure a default llm model first');
    await updateSessionLlmConfigId(sessionId, userId, def.id);
    sessionLlmConfigId = def.id;
  }

  const lastMessage = messages[messages.length - 1];
  if (lastMessage?.role === 'user' && Array.isArray(lastMessage.parts)) {
    await createMessage(sessionId, 'user', lastMessage.parts);
  }

  const assistantMsg = await createMessage(sessionId, 'assistant', []);
  const assistantIdStr = String(assistantMsg.id);

  try {
    const cfg = await findLlmConfigByIdAndUserId(sessionLlmConfigId, userId);
    if (!cfg) throw new AppError(NotFound, 'llm config not found');
    const result = await streamChatFromUIMessages(messages, {
      provider: cfg.provider as LlmProviderKind,
      baseURL: cfg.base_url,
      apiKey: decryptApiKey(cfg.api_key_enc),
      modelId: cfg.model_id,
    });
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
    const msg =
      e instanceof DecryptError
        ? e.message
        : e instanceof Error
          ? e.message
          : 'chat failed';
    throw new AppError(InternalError, msg, undefined, e);
  }
});

export default ai;
