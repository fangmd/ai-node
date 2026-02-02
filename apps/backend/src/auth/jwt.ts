import { SignJWT, jwtVerify } from "jose"
import { JWT_SECRET, JWT_EXPIRES_IN } from "../common/env.js"

const secret = new TextEncoder().encode(JWT_SECRET)

export type JwtPayload = { sub: string; username: string }

export async function signToken(payload: JwtPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(JWT_EXPIRES_IN)
    .sign(secret)
}

export async function verifyToken(token: string): Promise<JwtPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret)
    const sub = payload.sub as string | undefined
    const username = payload.username as string | undefined
    if (sub == null || username == null) return null
    return { sub, username }
  } catch {
    return null
  }
}
