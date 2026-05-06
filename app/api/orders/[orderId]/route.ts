import { OrderStatus } from '@prisma/client';
import { NextResponse } from 'next/server';

import { invalidateAdminDataCache } from '@/lib/admin-data-cache';
import { requireAdmin } from '@/lib/require-admin';
import { prisma } from '@/prisma/prisma-client';

export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ orderId: string }> };

const isOrderStatus = (status: unknown): status is OrderStatus =>
  typeof status === 'string' &&
  Object.values(OrderStatus).includes(status as OrderStatus);

export async function PATCH(req: Request, { params }: Params) {
  const adminError = await requireAdmin();
  if (adminError) return adminError;

  try {
    const { orderId } = await params;
    const body = (await req.json()) as { status?: unknown };

    if (!orderId) {
      return new NextResponse('Order id is required', { status: 400 });
    }

    if (!isOrderStatus(body.status)) {
      return new NextResponse('Valid status is required', { status: 400 });
    }

    const order = await prisma.order.update({
      where: { id: Number(orderId) },
      data: { status: body.status },
    });
    invalidateAdminDataCache();

    return NextResponse.json(order);
  } catch (err) {
    console.log('[ORDER_PATCH]', err);
    return new NextResponse('Internal error', { status: 500 });
  }
}
