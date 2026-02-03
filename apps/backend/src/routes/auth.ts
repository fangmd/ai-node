import { Hono } from "hono"
import { z } from "zod"
import { success } from "../response.js"
import { AppError, ValidationError } from "../errors/index.js"
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
    const issues = parsed.error.issues.map((i) => ({
      path: i.path as (string | number)[],
      message: i.message,
    }))
    throw new AppError(ValidationError, "username and password are required", {
      type: "validation",
      issues,
    })
  }
  const { username, password } = parsed.data
  const result = await register(username, password)
  return success(c, result)
})

auth.post("/login", async (c) => {
  const parsed = loginBody.safeParse(await c.req.json())
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => ({
      path: i.path as (string | number)[],
      message: i.message,
    }))
    throw new AppError(ValidationError, "username and password are required", {
      type: "validation",
      issues,
    })
  }
  const { username, password } = parsed.data
  const result = await login(username, password)
  return success(c, result)
})

export default auth
