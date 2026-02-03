import { AppError, Conflict, Unauthorized } from '../errors/index.js';
import { generateUUID } from '../common/snowflake.js';
import { findUserByUsername, createUser } from '../repositories/user.repository.js';
import { signToken } from '../auth/jwt.js';
import { hashPassword, verifyPassword } from '../auth/password.js';

export async function register(username: string, password: string): Promise<{ username: string }> {
  const existing = await findUserByUsername(username);
  if (existing) throw new AppError(Conflict, 'username already exists');
  const id = generateUUID() as bigint;
  const passwordHash = await hashPassword(password);
  await createUser({
    id,
    username,
    passwordHash,
  });
  return { username };
}

export async function login(username: string, password: string): Promise<{ token: string }> {
  const user = await findUserByUsername(username);
  if (!user) throw new AppError(Unauthorized, 'invalid username or password');
  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) throw new AppError(Unauthorized, 'invalid username or password');
  const token = await signToken({
    sub: String(user.id),
    username: user.username,
  });
  return { token };
}
