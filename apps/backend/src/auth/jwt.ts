import { SignJWT, jwtVerify } from 'jose';
import { config } from '../common/env.js';

const secret = new TextEncoder().encode(config.auth.jwtSecret);

export type JwtPayload = { sub: string; username: string };

export async function signToken(payload: JwtPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(config.auth.jwtExpiresIn)
    .sign(secret);
}

export async function verifyToken(token: string): Promise<JwtPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    const sub = payload.sub as string | undefined;
    const username = payload.username as string | undefined;
    if (sub == null || username == null) return null;
    return { sub, username };
  } catch {
    return null;
  }
}
