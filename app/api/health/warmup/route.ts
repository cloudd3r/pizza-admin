import { NextResponse } from 'next/server';

import { prisma } from '@/prisma/prisma-client';

/**
 * Opportunistic database warm-up endpoint.
 *
 * Neon's free tier suspends compute after ~5 minutes of inactivity. The
 * first query after a long idle takes 1-10s to wake the compute back
 * up. The client fires this endpoint as soon as it mounts, in parallel
 * with rendering the login form, so by the time the user submits their
 * credentials the database is already warm.
 *
 * It's intentionally fire-and-forget — failures here are silent and
 * don't surface to the user.
 */
export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.warn('[warmup] DB not ready yet:', err);
    return NextResponse.json({ ok: false }, { status: 503 });
  }
}

// Always run this on the server, never cache the result.
export const dynamic = 'force-dynamic';
