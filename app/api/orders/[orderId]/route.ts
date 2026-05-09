import { OrderStatus } from '@prisma/client';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import { invalidateAdminDataCache } from '@/lib/admin-data-cache';
import { apiError, apiInternalError, apiZodError } from '@/lib/api-error';
import { requireAdmin } from '@/lib/require-admin';
import { prisma } from '@/prisma/prisma-client';

export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ orderId: string }> };

const orderPatchSchema = z.object({
  status: z.nativeEnum(OrderStatus),
});

const parseOrderId = (raw: string | undefined) => {
  if (!raw) return null;
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
};

export async function PATCH(req: Request, { params }: Params) {
  const adminError = await requireAdmin();
  if (adminError) return adminError;

  try {
    const { orderId } = await params;
    const id = parseOrderId(orderId);

    if (!id) {
      return apiError('Order id is required', 400);
    }

    const raw = await req.json();
    const parsed = orderPatchSchema.parse(raw);

    const order = await prisma.order.update({
      where: { id },
      data: { status: parsed.status },
    });
    invalidateAdminDataCache();

    return NextResponse.json(order);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return apiZodError(err);
    }
    return apiInternalError('ORDER_PATCH', err);
  }
}
