import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

import { invalidateAdminDataCache } from '@/lib/admin-data-cache';
import { apiError, apiInternalError, apiZodError } from '@/lib/api-error';
import {
  ProductVariantInUseError,
  deleteProduct,
  getProductWithRelations,
  parseProductId,
  productBodySchema,
  updateProductWithRelations,
} from '@/lib/product-admin-service';
import { requireAdmin } from '@/lib/require-admin';

export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ productId: string }> };

export async function GET(_req: Request, { params }: Params) {
  const adminError = await requireAdmin();
  if (adminError) return adminError;

  try {
    const { productId } = await params;
    const id = parseProductId(productId);
    if (!id) return apiError('Product id is required', 400);

    const product = await getProductWithRelations(id);
    if (!product) return apiError('Product not found', 404);

    return NextResponse.json(product);
  } catch (err) {
    return apiInternalError('PRODUCT_GET', err);
  }
}

export async function PATCH(req: Request, { params }: Params) {
  const adminError = await requireAdmin();
  if (adminError) return adminError;

  try {
    const { productId } = await params;
    const id = parseProductId(productId);
    if (!id) return apiError('Product id is required', 400);

    const parsed = productBodySchema.parse(await req.json());
    const product = await updateProductWithRelations(id, parsed);
    invalidateAdminDataCache();
    return NextResponse.json(product);
  } catch (err) {
    if (err instanceof ZodError) return apiZodError(err);
    if (err instanceof ProductVariantInUseError) {
      return apiError(err.message, 409);
    }
    if (err instanceof Error && err.message.startsWith('Category id')) {
      return apiError(err.message, 400);
    }
    return apiInternalError('PRODUCT_PATCH', err);
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  const adminError = await requireAdmin();
  if (adminError) return adminError;

  try {
    const { productId } = await params;
    const id = parseProductId(productId);
    if (!id) return apiError('Product id is required', 400);

    await deleteProduct(id);
    invalidateAdminDataCache();
    return NextResponse.json({ ok: true });
  } catch (err) {
    return apiInternalError('PRODUCT_DELETE', err);
  }
}
