import { PrismaClient } from '@prisma/client';

/**
 * Build the runtime database URL.
 *
 * Neon exposes two URLs:
 *   - POSTGRES_URL              — pooled (PgBouncer in transaction mode).
 *                                 Closes idle connections aggressively and
 *                                 doesn't tolerate prepared statements,
 *                                 which is what causes Prisma's
 *                                 "Server has closed the connection" errors.
 *   - POSTGRES_URL_NON_POOLING  — direct connection to the compute endpoint.
 *
 * For an admin panel with low concurrent load, the direct URL is the right
 * choice: no pooler-induced disconnects, and we won't hit Neon's connection
 * limits. If only the pooled URL is configured, we append the
 * `pgbouncer=true&connect_timeout=10` flags so Prisma disables prepared
 * statements, which keeps things working with PgBouncer.
 */
const buildDatabaseUrl = (): string | undefined => {
  const direct = process.env.POSTGRES_URL_NON_POOLING;
  if (direct) return direct;

  const pooled = process.env.POSTGRES_URL;
  if (!pooled) return undefined;
  if (pooled.includes('pgbouncer=')) return pooled;

  const sep = pooled.includes('?') ? '&' : '?';
  return `${pooled}${sep}pgbouncer=true&connect_timeout=10`;
};

const prismaClientSingleton = () => {
  return new PrismaClient({
    datasourceUrl: buildDatabaseUrl(),
    log:
      process.env.NODE_ENV === 'development'
        ? ['error', 'warn']
        : ['error'],
  });
};

declare global {
  // eslint-disable-next-line no-var
  var prismaGlobal: undefined | ReturnType<typeof prismaClientSingleton>;
}

export const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobal = prisma;
