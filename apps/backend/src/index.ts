import './common/env';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { serve } from '@hono/node-server';
import { ZodError } from 'zod';
import { config } from './common/env';
import { fail, success } from './response';
import { InternalError, isAppError, NotFound, ValidationError } from './errors';
import ai from './routes/ai';
import auth from './routes/auth';
import { jwtAuth } from './auth/middleware';

type AuthVariables = { user: { id: string; username: string } };
(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

const app = new Hono<{ Variables: AuthVariables }>();

app.use(
  '*',
  cors({
    origin: ['http://localhost:5173'],
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  })
);

app.get('/', (c) => success(c, { message: 'Hello from Hono' }));
app.get('/health', (c) => success(c, { status: 'ok' }));
app.route('/api/auth', auth);
app.route('/api/ai', ai);
// 受保护路由示例：使用 jwtAuth 中间件，通过 c.get('user') 读取当前用户
app.get('/api/me', jwtAuth, (c) => {
  const user = c.get('user');
  return success(c, { id: user.id, username: user.username });
});

app.onError((err, c) => {
  if (isAppError(err)) {
    return fail(c, err.code, err.message, err.data);
  }
  if (err instanceof ZodError) {
    const issues = err.issues.map((i) => ({
      path: i.path,
      message: i.message,
    }));
    return fail(c, ValidationError.code, ValidationError.msg, {
      type: 'validation',
      issues,
    });
  }
  const msg = config.server.isDev && err instanceof Error ? err.message : InternalError.msg;
  if (config.server.isDev) console.error(err);
  return fail(c, InternalError.code, msg);
});

app.notFound((c) => fail(c, NotFound.code, NotFound.msg));

if (!config.server.isDev) {
  serve({ fetch: app.fetch, port: config.server.port }, (info) => {
    console.log(`Server running at http://localhost:${info.port}`);
  });
}

export default app;
