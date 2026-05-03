import { PrismaNeonHTTP } from '@prisma/adapter-neon';
import { PrismaClient } from '@prisma/client';

/**
 * PrismaClient via Neon's serverless driver — HTTP transport, with
 * automatic retry on transient network errors.
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
 * However, even HTTPS requests can occasionally fail with transient
 * network errors (ECONNRESET, fetch failed, ETIMEDOUT) caused by ISP /
 * router NAT timeouts, brief Neon edge hiccups, etc. Without retry,
 * these surface as user-visible errors. We wrap every Prisma operation
 * with a small retry-with-backoff for these specific error classes.
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

const buildAdapter = () => {
  const url = process.env.POSTGRES_URL_NON_POOLING ?? process.env.POSTGRES_URL;

  if (!url) {
    return undefined;
  }

  return new PrismaNeonHTTP(url, {});
};

/**
 * Detect transient network errors that are safe to retry. We look at
 * Node's standard error codes and the wrapped causes from Neon's HTTP
 * driver (which throws NeonDbError wrapping the original fetch error).
 *
 * Note: retrying mutations on a connection error has a small risk of
 * duplicate writes (if the request reached the DB but the response was
 * lost). For an admin panel with low write volume and unique constraints
 * on writes, this is an acceptable trade-off versus user-visible failures
 * on every transient blip.
 */
const TRANSIENT_ERROR_CODES = new Set([
  'ECONNRESET',
  'ECONNREFUSED',
  'ETIMEDOUT',
  'EAI_AGAIN',
  'EPIPE',
  'ENETDOWN',
  'ENETUNREACH',
  'EHOSTUNREACH',
]);

const TRANSIENT_MESSAGE_FRAGMENTS = [
  'fetch failed',
  'Connection terminated',
  'socket hang up',
  'network error',
];

const isTransientError = (err: unknown): boolean => {
  if (!err || typeof err !== 'object') return false;
  const e = err as { code?: unknown; message?: unknown; cause?: unknown };
  if (typeof e.code === 'string' && TRANSIENT_ERROR_CODES.has(e.code)) {
    return true;
  }
  if (typeof e.message === 'string') {
    if (TRANSIENT_MESSAGE_FRAGMENTS.some((f) => (e.message as string).includes(f))) {
      return true;
    }
  }
  if (e.cause) return isTransientError(e.cause);
  return false;
};

const sleep = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

const retryOnTransient = async <T>(
  fn: () => Promise<T>,
  maxAttempts = 3,
): Promise<T> => {
  let lastError: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (attempt === maxAttempts || !isTransientError(err)) throw err;
      // Exponential backoff: 100ms, 300ms.
      const delay = 100 * Math.pow(3, attempt - 1);
      await sleep(delay);
    }
  }
  throw lastError;
};

const prismaClientSingleton = () => {
  const adapter = buildAdapter();
  const baseClient = new PrismaClient({
    ...(adapter ? { adapter } : {}),
    log:
      process.env.NODE_ENV === 'development'
        ? ['error', 'warn']
        : ['error'],
  });
  return baseClient.$extends({
    name: 'retryOnTransient',
    query: {
      $allOperations({ args, query }) {
        return retryOnTransient(() => query(args));
      },
    },
  });
};

declare global {
  // eslint-disable-next-line no-var
  var prismaGlobal: undefined | ReturnType<typeof prismaClientSingleton>;
}

export const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobal = prisma;
