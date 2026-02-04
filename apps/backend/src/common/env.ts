import { config as loadEnv } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { z } from 'zod';

const __dirname = dirname(fileURLToPath(import.meta.url));
loadEnv({ path: resolve(__dirname, '../../.env.example') });
loadEnv({ path: resolve(__dirname, '../../.env') });

const schema = z.object({
  server: z.object({
    port: z.coerce.number().default(3000),
    nodeEnv: z.string().default('development'),
  }),
  auth: z.object({
    jwtSecret: z.string().min(1, 'JWT_SECRET is required'),
    jwtExpiresIn: z.string().default('7d'),
  }),
  database: z.object({ url: z.string().min(1, 'DATABASE_URL is required') }),
  llm: z.object({
    encryptionSecret: z.string().min(16, 'AI_KEY_ENCRYPTION_SECRET is required'),
  }),
  proxy: z.object({
    httpProxy: z.string().optional(),
    httpsProxy: z.string().optional(),
  }),
});

function raw() {
  const p = process.env;
  return {
    server: { port: p.PORT, nodeEnv: p.NODE_ENV },
    auth: { jwtSecret: p.JWT_SECRET, jwtExpiresIn: p.JWT_EXPIRES_IN },
    database: { url: p.DATABASE_URL },
    llm: { encryptionSecret: p.AI_KEY_ENCRYPTION_SECRET },
    proxy: { httpProxy: p.HTTP_PROXY?.trim(), httpsProxy: p.HTTPS_PROXY?.trim() },
  };
}

function parse() {
  const parsed = schema.safeParse(raw());
  if (!parsed.success) {
    throw new Error(`Config validation failed: ${parsed.error.message}`);
  }
  const { server, auth, database, llm, proxy } = parsed.data;
  return {
    server: { ...server, isDev: server.nodeEnv !== 'production' },
    auth,
    database,
    llm,
    proxy,
  };
}

export const config = parse();
export type Config = ReturnType<typeof parse>;

export const isDev = config.server.isDev;
export const JWT_SECRET = config.auth.jwtSecret;
export const JWT_EXPIRES_IN = config.auth.jwtExpiresIn;
