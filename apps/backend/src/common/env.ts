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
  aiSdkLog: z
    .object({
      enabled: z.coerce.boolean().default(false),
      sampleRate: z.coerce.number().min(0).max(1).default(1),
      maxFieldLength: z.coerce.number().int().positive().default(2000),
    })
    .default({ enabled: false, sampleRate: 1, maxFieldLength: 2000 }),
});

function raw() {
  const p = process.env;
  return {
    server: { port: p.PORT, nodeEnv: p.NODE_ENV },
    auth: { jwtSecret: p.JWT_SECRET, jwtExpiresIn: p.JWT_EXPIRES_IN },
    database: { url: p.DATABASE_URL },
    llm: { encryptionSecret: p.AI_KEY_ENCRYPTION_SECRET },
    proxy: { httpProxy: p.HTTP_PROXY?.trim(), httpsProxy: p.HTTPS_PROXY?.trim() },
    aiSdkLog: {
      enabled: p.AI_SDK_LOG_ENABLED,
      sampleRate: p.AI_SDK_LOG_SAMPLE_RATE,
      maxFieldLength: p.AI_SDK_LOG_MAX_FIELD_LENGTH,
    },
  };
}

function parse() {
  const parsed = schema.safeParse(raw());
  if (!parsed.success) {
    throw new Error(`Config validation failed: ${parsed.error.message}`);
  }
  const { server, auth, database, llm, proxy, aiSdkLog } = parsed.data;
  return {
    server: { ...server, isDev: server.nodeEnv !== 'production' },
    auth,
    database,
    llm,
    proxy,
    aiSdkLog,
  };
}

export const config = parse();
export type Config = ReturnType<typeof parse>;

/** 用于启动时打印的脱敏 env，便于排查 Docker/连接问题 */
export function getEnvSummaryForLog() {
  const r = raw();
  const dbUrl = r.database?.url ?? '';
  let dbDisplay = '(empty)';
  if (dbUrl) {
    try {
      const u = new URL(dbUrl);
      dbDisplay = `${u.protocol}//${u.username}:***@${u.hostname}:${u.port || 'default'}${u.pathname}`;
    } catch {
      dbDisplay = '(invalid url)';
    }
  }
  return {
    PORT: r.server?.port ?? process.env.PORT,
    NODE_ENV: r.server?.nodeEnv ?? process.env.NODE_ENV,
    DATABASE_URL: dbDisplay,
    JWT_SECRET: r.auth?.jwtSecret ? `set(${r.auth.jwtSecret.length} chars)` : 'missing',
    JWT_EXPIRES_IN: r.auth?.jwtExpiresIn ?? 'missing',
    AI_KEY_ENCRYPTION_SECRET: r.llm?.encryptionSecret ? `set(${r.llm.encryptionSecret.length} chars)` : 'missing',
  };
}

export const isDev = config.server.isDev;
export const JWT_SECRET = config.auth.jwtSecret;
export const JWT_EXPIRES_IN = config.auth.jwtExpiresIn;
