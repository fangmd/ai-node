import type { Context, Next } from "hono"
import { verifyToken } from "./jwt.js"

export type AuthUser = { id: string; username: string }

export async function jwtAuth(c: Context, next: Next) {
  const auth = c.req.header("Authorization")
  const token = auth?.startsWith("Bearer ") ? auth.slice(7) : null
  if (!token) {
    return c.json({ code: 401, msg: "Unauthorized", data: {} }, 401)
  }
  const payload = await verifyToken(token)
  if (!payload) {
    return c.json({ code: 401, msg: "Unauthorized", data: {} }, 401)
  }
  c.set("user", { id: payload.sub, username: payload.username } as AuthUser)
  await next()
}
