import type { Context, Next } from 'hono';
import { AppError, Unauthorized } from '../errors/index.js';
import { verifyToken } from './jwt.js';

export type AuthUser = { id: string; username: string };

export async function jwtAuth(c: Context, next: Next) {
  const auth = c.req.header('Authorization');
  const token = auth?.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) throw new AppError(Unauthorized);
  const payload = await verifyToken(token);
  if (!payload) throw new AppError(Unauthorized);
  c.set('user', { id: payload.sub, username: payload.username } as AuthUser);
  await next();
}
