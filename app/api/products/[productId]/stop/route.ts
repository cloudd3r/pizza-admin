import { NextResponse } from 'next/server';
import { z, ZodError } from 'zod';

import { invalidateAdminDataCache } from '@/lib/admin-data-cache';
import { apiError, apiInternalError, apiZodError } from '@/lib/api-error';
import { requireAdmin } from '@/lib/require-admin';
import { prisma } from '@/prisma/prisma-client';

export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ productId: string }> };

const stopBodySchema = z
  .object({
    stopUntil: z
      .union([z.string(), z.date(), z.null()])
      .nullable()
      .optional()
      .transform((value) => {
        if (value === null || value === undefined || value === '') return null;
        const date = value instanceof Date ? value : new Date(value);
        if (Number.isNaN(date.getTime())) return null;
        return date;
      }),
    durationMinutes: z.coerce.number().int().positive().max(60 * 24 * 30).optional(),
  })
  .refine(
    (data) => data.stopUntil !== undefined || data.durationMinutes !== undefined,
    { message: 'Provide either stopUntil or durationMinutes' },
  );

export async function POST(req: Request, { params }: Params) {
  const adminError = await requireAdmin();
  if (adminError) return adminError;

  try {
    const { productId } = await params;
    const id = Number(productId);
    if (!Number.isInteger(id) || id <= 0) {
      return apiError('Product id is required', 400);
    }

    const parsed = stopBodySchema.parse(await req.json());

    let stopUntil: Date | null = null;
    if (parsed.durationMinutes !== undefined) {
      stopUntil = new Date(Date.now() + parsed.durationMinutes * 60 * 1000);
    } else if (parsed.stopUntil !== undefined) {
      stopUntil = parsed.stopUntil;
    }

    const updated = await prisma.product.update({
      where: { id },
      data: { stopUntil },
      select: { id: true, stopUntil: true },
    });

    invalidateAdminDataCache();

    return NextResponse.json(updated);
  } catch (err) {
    if (err instanceof ZodError) return apiZodError(err);
    return apiInternalError('PRODUCT_STOP', err);
  }
}
