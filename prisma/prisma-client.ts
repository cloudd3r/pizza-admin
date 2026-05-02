import { neonConfig } from '@neondatabase/serverless';
import { PrismaNeon } from '@prisma/adapter-neon';
import { PrismaClient } from '@prisma/client';
import ws from 'ws';

/**
 * PrismaClient via Neon's serverless driver (WebSocket transport).
 *
 * Why not the default Prisma TCP client?
 *   - Neon's pooled URL goes through PgBouncer in transaction mode, which
 *     drops idle connections and breaks Prisma's prepared statements
 *     (manifests as `Server has closed the connection`).
 *   - The default Prisma client maintains its own client-side TCP pool
 *     (default size = num_cpus * 2 + 1). In Next.js dev mode, HMR
 *     repeatedly re-evaluates modules and tends to leak PrismaClient
 *     instances; their pools fill up after a few hot reloads
 *     (manifests as `Timed out fetching a new connection from the
 *     connection pool`).
 *
 * Using `@prisma/adapter-neon` with `@neondatabase/serverless` swaps the
 * TCP transport for Neon's WebSocket driver. There's no per-instance TCP
 * pool to exhaust, and the adapter handles reconnects gracefully — works
 * the same in dev, in production Node, and in serverless/edge runtimes.
 *
 * The `webSocketConstructor` is required only in Node.js (in browsers /
 * edge, the global `WebSocket` is used). `ws` is a small peer dependency.
 */

if (typeof globalThis.WebSocket === 'undefined') {
  // Polyfill for Node.js so @neondatabase/serverless can open WebSockets.
  // No-op in edge / browser.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  neonConfig.webSocketConstructor = ws as any;
}

const buildConnectionString = (): string => {
  // Prefer the direct (non-pooled) URL — bypasses PgBouncer entirely.
  // The Neon serverless driver still uses HTTPS/WSS internally, so we don't
  // need the pooler for connection scaling here.
  const url = process.env.POSTGRES_URL_NON_POOLING ?? process.env.POSTGRES_URL;
  if (!url) {
    throw new Error(
      'Missing POSTGRES_URL_NON_POOLING (or POSTGRES_URL) env variable',
    );
  }
  return url;
};

const prismaClientSingleton = () => {
  const adapter = new PrismaNeon({ connectionString: buildConnectionString() });
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
