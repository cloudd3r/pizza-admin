import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

import { invalidateAdminDataCache } from '@/lib/admin-data-cache';
import { apiError, apiInternalError, apiZodError } from '@/lib/api-error';
import { requireAdmin } from '@/lib/require-admin';
import { moveDirectionSchema, moveProduct } from '@/lib/sort-order-service';

export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ productId: string }> };

export async function POST(req: Request, { params }: Params) {
  const adminError = await requireAdmin();
  if (adminError) return adminError;

  try {
    const { productId } = await params;
    const id = Number(productId);
    if (!Number.isInteger(id) || id <= 0) {
      return apiError('Product id is required', 400);
    }

    const raw = await req.json();
    const parsed = moveDirectionSchema.parse(raw);

    const result = await moveProduct(id, parsed.direction);
    if (!result.moved && result.reason === 'not_found') {
      return apiError('Product not found', 404);
    }

    invalidateAdminDataCache();
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof ZodError) {
      return apiZodError(err);
    }
    return apiInternalError('PRODUCT_MOVE_POST', err);
  }
}
