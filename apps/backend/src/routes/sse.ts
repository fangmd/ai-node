import { Hono } from 'hono';
import { streamSSE } from 'hono/streaming';
import { verifyToken } from '../auth/jwt.js';
import { add as registryAdd } from '../sse/registry.js';
import { Unauthorized } from '../errors/index.js';

const sse = new Hono();

sse.get('/sse', async (c) => {
  const token = c.req.query('token') ?? null;
  if (!token) return c.json({ code: 401, msg: Unauthorized.msg }, 401);
  const payload = await verifyToken(token);
  if (!payload) return c.json({ code: 401, msg: Unauthorized.msg }, 401);

  const userId = payload.sub;

  return streamSSE(c, async (stream) => {
    const unregister = registryAdd(userId, stream);

    await stream.writeSSE({
      event: 'connected',
      data: JSON.stringify({ userId }),
    });

    await stream.writeSSE({
      event: 'user-message',
      data: JSON.stringify({ message: '连接成功', title: 'AI' }),
    });

    await new Promise<void>((resolve) => {
      c.req.raw.signal?.addEventListener('abort', () => resolve(), { once: true });
    });
    unregister();
  });
});

export default sse;
