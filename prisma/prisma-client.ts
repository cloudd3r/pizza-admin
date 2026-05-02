import { PrismaNeonHTTP } from '@prisma/adapter-neon';
import { PrismaClient } from '@prisma/client';

/**
 * PrismaClient via Neon's serverless driver — HTTP transport.
 *
 * Why HTTP and not the (default) TCP / WebSocket variants?
 *
 *   - Default Prisma TCP client maintains its own client-side connection
 *     pool (default size = num_cpus * 2 + 1). In Next.js dev mode, HMR
 *     re-evaluates modules and tends to leak PrismaClient instances; their
 *     pools fill up after a few hot reloads → 'Timed out fetching a new
 *     connection from the connection pool'.
 *
 *   - Neon's pooled URL goes through PgBouncer in transaction mode, which
 *     drops idle connections and breaks Prisma's prepared statements
 *     → 'Server has closed the connection'.
 *
 *   - The WebSocket adapter (`PrismaNeon` + `Pool`) keeps a persistent WS
 *     to Neon. It can be silently terminated by the network or Neon's
 *     frontend after some idle period; the next query then fails with
 *     'Connection terminated unexpectedly' and takes ~20s to recover.
 *
 * The HTTP adapter (`PrismaNeonHTTP`) makes each query a discrete HTTPS
 * request to Neon's SQL-over-HTTP endpoint. There is no persistent
 * connection, no client-side pool, no idle disconnects. It works
 * identically in dev, in Node, and in serverless / edge runtimes.
 *
 * Trade-off: interactive transactions (`prisma.$transaction(async (tx) => …)`)
 * are not supported over HTTP. Batch transactions (`prisma.$transaction([…])`)
 * still work. The current admin app does not use interactive transactions.
 */

const buildConnectionString = (): string => {
  // Prefer the direct (non-pooled) URL. The HTTP adapter doesn't open a
  // long-lived pool either way, but the direct URL avoids PgBouncer flags
  // tagging onto the SQL-over-HTTP requests.
  const url = process.env.POSTGRES_URL_NON_POOLING ?? process.env.POSTGRES_URL;
  if (!url) {
    throw new Error(
      'Missing POSTGRES_URL_NON_POOLING (or POSTGRES_URL) env variable',
    );
  }
  return url;
};

const prismaClientSingleton = () => {
  const adapter = new PrismaNeonHTTP(buildConnectionString(), {});
  return new PrismaClient({
    adapter,
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
