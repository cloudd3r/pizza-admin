import {
  OrderEventKind,
  OrderFulfillmentStatus,
  OrderStatus,
} from '@prisma/client';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import { invalidateAdminDataCache } from '@/lib/admin-data-cache';
import { apiError, apiInternalError, apiZodError } from '@/lib/api-error';
import { getUserSession } from '@/lib/get-user-session';
import { requireAdmin } from '@/lib/require-admin';
import { prisma } from '@/prisma/prisma-client';

export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ orderId: string }> };

const orderPatchSchema = z
  .object({
    status: z.nativeEnum(OrderStatus).optional(),
    fulfillmentStatus: z.nativeEnum(OrderFulfillmentStatus).optional(),
    adminNote: z.string().max(2000, 'Note is too long').nullable().optional(),
  })
  .refine(
    (data) =>
      data.status !== undefined ||
      data.fulfillmentStatus !== undefined ||
      data.adminNote !== undefined,
    'At least one of status, fulfillmentStatus, or adminNote must be provided',
  );

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

    const existing = await prisma.order.findUnique({
      where: { id },
      select: {
        status: true,
        fulfillmentStatus: true,
        adminNote: true,
      },
    });

    if (!existing) {
      return apiError('Order not found', 404);
    }

    const session = await getUserSession();
    const actorEmail = session?.email ?? null;

    const data: {
      status?: OrderStatus;
      fulfillmentStatus?: OrderFulfillmentStatus;
      adminNote?: string | null;
    } = {};
    const events: Array<{
      kind: OrderEventKind;
      payload: Record<string, unknown>;
      actorEmail: string | null;
    }> = [];

    if (parsed.status !== undefined && parsed.status !== existing.status) {
      data.status = parsed.status;
      events.push({
        kind: OrderEventKind.PAYMENT_STATUS_CHANGED,
        payload: { from: existing.status, to: parsed.status },
        actorEmail,
      });
    }

    if (
      parsed.fulfillmentStatus !== undefined &&
      parsed.fulfillmentStatus !== existing.fulfillmentStatus
    ) {
      data.fulfillmentStatus = parsed.fulfillmentStatus;
      events.push({
        kind: OrderEventKind.FULFILLMENT_STATUS_CHANGED,
        payload: {
          from: existing.fulfillmentStatus,
          to: parsed.fulfillmentStatus,
        },
        actorEmail,
      });
    }

    if (
      parsed.adminNote !== undefined &&
      (parsed.adminNote ?? null) !== (existing.adminNote ?? null)
    ) {
      data.adminNote = parsed.adminNote ?? null;
      events.push({
        kind: OrderEventKind.NOTE,
        payload: { note: parsed.adminNote ?? null },
        actorEmail,
      });
    }

    if (Object.keys(data).length === 0) {
      const order = await prisma.order.findUnique({ where: { id } });
      return NextResponse.json(order);
    }

    const order = await prisma.order.update({
      where: { id },
      data,
    });

    if (events.length > 0) {
      await prisma.orderEvent.createMany({
        data: events.map((event) => ({
          orderId: id,
          kind: event.kind,
          payload: event.payload,
          actorEmail: event.actorEmail,
        })),
      });
    }

    invalidateAdminDataCache();

    return NextResponse.json(order);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return apiZodError(err);
    }
    return apiInternalError('ORDER_PATCH', err);
  }
}
