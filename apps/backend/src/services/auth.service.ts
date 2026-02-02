import { generateUUID } from "../common/snowflake.js"
import {
  findUserByUsername,
  createUser,
} from "../repositories/user.repository.js"
import { signToken } from "../auth/jwt.js"
import { hashPassword, verifyPassword } from "../auth/password.js"

type RegisterResult =
  | { success: true; username: string }
  | { success: false; code: number; msg: string }

type LoginResult =
  | { success: true; token: string }
  | { success: false; code: number; msg: string }

export async function register(
  username: string,
  password: string
): Promise<RegisterResult> {
  const existing = await findUserByUsername(username)
  if (existing) {
    return { success: false, code: 409, msg: "username already exists" }
  }
  const id = generateUUID() as bigint
  const passwordHash = await hashPassword(password)
  await createUser({
    id,
    username,
    passwordHash,
  })
  return { success: true, username }
}

export async function login(
  username: string,
  password: string
): Promise<LoginResult> {
  const user = await findUserByUsername(username)
  if (!user) {
    return { success: false, code: 401, msg: "invalid username or password" }
  }
  const ok = await verifyPassword(password, user.passwordHash)
  if (!ok) {
    return { success: false, code: 401, msg: "invalid username or password" }
  }
  const token = await signToken({
    sub: String(user.id),
    username: user.username,
  })
  return { success: true, token }
}
