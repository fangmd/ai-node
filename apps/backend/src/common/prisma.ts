import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { PrismaClient } from '../generated/prisma/client.js';
import { config } from './env.js';
import { logger } from './logger.js';

function adapterConfigFromUrl(url: string) {
  if (!url || !url.trim()) {
    throw new Error('DATABASE_URL is required');
  }
  const u = new URL(url);
  return {
    host: u.hostname,
    port: u.port ? Number(u.port) : 3306,
    user: u.username,
    password: u.password,
    database: u.pathname.slice(1) || undefined,
    connectionLimit: 5,
    // Docker 内首次建连可能较慢（网络/握手），延长超时避免 pool timeout
    connectTimeout: 20_000,
    acquireTimeoutMillis: 20_000,
  };
}

const adapter = new PrismaMariaDb(adapterConfigFromUrl(config.database.url));

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };
const client =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: [
      { level: 'query', emit: 'event' },
      { level: 'error', emit: 'event' },
      { level: 'warn', emit: 'event' },
      { level: 'info', emit: 'event' },
    ],
  });

if (!globalForPrisma.prisma) {
  type ClientWithLog = PrismaClient<'query' | 'error' | 'warn' | 'info'>;
  const c = client as ClientWithLog;
  c.$on('query', (e) =>
    logger.debug(
      { query: e.query, params: e.params, duration_ms: e.duration },
      'prisma query',
    ),
  );
  c.$on('error', (e) => logger.error({ message: e.message }, 'prisma error'));
  c.$on('warn', (e) => logger.warn({ message: e.message }, 'prisma warn'));
  c.$on('info', (e) => logger.info({ message: e.message }, 'prisma info'));
}

export const prisma = client;

if (config.server.isDev) globalForPrisma.prisma = prisma;
