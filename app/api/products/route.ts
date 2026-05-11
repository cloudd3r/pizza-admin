import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

import { invalidateAdminDataCache } from '@/lib/admin-data-cache';
import { apiError, apiInternalError, apiZodError } from '@/lib/api-error';
import {
  createProductWithRelations,
  listProductsWithRelations,
  productBodySchema,
} from '@/lib/product-admin-service';
import { requireAdmin } from '@/lib/require-admin';

export const dynamic = 'force-dynamic';

export async function GET() {
  const adminError = await requireAdmin();
  if (adminError) return adminError;

  try {
    return NextResponse.json(await listProductsWithRelations());
  } catch (err) {
    return apiInternalError('PRODUCTS_GET', err);
  }
}

export async function POST(req: Request) {
  const adminError = await requireAdmin();
  if (adminError) return adminError;

  try {
    const parsed = productBodySchema.parse(await req.json());
    const product = await createProductWithRelations(parsed);
    invalidateAdminDataCache();
    return NextResponse.json(product);
  } catch (err) {
    if (err instanceof ZodError) return apiZodError(err);
    if (err instanceof Error && err.message.startsWith('Category id')) {
      return apiError(err.message, 400);
    }
    return apiInternalError('PRODUCTS_POST', err);
  }
}
