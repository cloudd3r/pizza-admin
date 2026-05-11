import { OrderEventKind } from '@prisma/client';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import { invalidateAdminDataCache } from '@/lib/admin-data-cache';
import { apiError, apiInternalError, apiZodError } from '@/lib/api-error';
import { getUserSession } from '@/lib/get-user-session';
import { requireAdmin } from '@/lib/require-admin';
import { prisma } from '@/prisma/prisma-client';

export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ orderId: string }> };

const eventBodySchema = z.object({
  kind: z.nativeEnum(OrderEventKind).default(OrderEventKind.NOTE),
  message: z.string().trim().min(1, 'Message is required').max(2000, 'Message is too long'),
});

const parseOrderId = (raw: string | undefined) => {
  if (!raw) return null;
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
};

export async function POST(req: Request, { params }: Params) {
  const adminError = await requireAdmin();
  if (adminError) return adminError;

  try {
    const { orderId } = await params;
    const id = parseOrderId(orderId);
    if (!id) return apiError('Order id is required', 400);

    const raw = await req.json();
    const parsed = eventBodySchema.parse(raw);

    const exists = await prisma.order.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!exists) return apiError('Order not found', 404);

    const session = await getUserSession();

    const event = await prisma.orderEvent.create({
      data: {
        orderId: id,
        kind: parsed.kind,
        payload: { message: parsed.message },
        actorEmail: session?.email ?? null,
      },
    });

    invalidateAdminDataCache();

    return NextResponse.json(event);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return apiZodError(err);
    }
    return apiInternalError('ORDER_EVENT_POST', err);
  }
}
