import { Hono } from "hono"
import { z } from "zod"
import { fail, success } from "../response.js"
import { register, login } from "../services/auth.service.js"

const registerBody = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
})
const loginBody = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
})

const auth = new Hono()

auth.post("/register", async (c) => {
  const parsed = registerBody.safeParse(await c.req.json())
  if (!parsed.success) {
    return fail(c, 400, "username and password are required")
  }
  const { username, password } = parsed.data
  const result = await register(username, password)
  if (!result.success) {
    return fail(c, result.code, result.msg)
  }
  return success(c, { username: result.username })
})

auth.post("/login", async (c) => {
  const parsed = loginBody.safeParse(await c.req.json())
  if (!parsed.success) {
    return fail(c, 400, "username and password are required")
  }
  const { username, password } = parsed.data
  const result = await login(username, password)
  if (!result.success) {
    return fail(c, result.code, result.msg)
  }
  return success(c, { token: result.token })
})

export default auth
