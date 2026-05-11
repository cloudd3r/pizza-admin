import { NextResponse } from 'next/server';
import { z, ZodError } from 'zod';

import { invalidateAdminDataCache } from '@/lib/admin-data-cache';
import { apiError, apiInternalError, apiZodError } from '@/lib/api-error';
import { requireAdmin } from '@/lib/require-admin';
import { prisma } from '@/prisma/prisma-client';

export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ productId: string }> };

const bodySchema = z.object({
  active: z.coerce.boolean(),
});

export async function PATCH(req: Request, { params }: Params) {
  const adminError = await requireAdmin();
  if (adminError) return adminError;

  try {
    const { productId } = await params;
    const id = Number(productId);
    if (!Number.isInteger(id) || id <= 0) {
      return apiError('Product id is required', 400);
    }

    const raw = await req.json();
    const parsed = bodySchema.parse(raw);

    const product = await prisma.product.update({
      where: { id },
      data: { active: parsed.active },
      select: { id: true, active: true },
    });
    invalidateAdminDataCache();

    return NextResponse.json(product);
  } catch (err) {
    if (err instanceof ZodError) {
      return apiZodError(err);
    }
    return apiInternalError('PRODUCT_ACTIVE_PATCH', err);
  }
}
