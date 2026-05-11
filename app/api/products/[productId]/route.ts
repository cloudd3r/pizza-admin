import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

import { invalidateAdminDataCache } from '@/lib/admin-data-cache';
import { apiError, apiInternalError, apiZodError } from '@/lib/api-error';
import {
  dedupeIngredientIds,
  normalizeProductItems,
  productBodySchema,
  ProductVariantInUseError,
  reconcileProductVariants,
  replaceProductIngredients,
} from '@/lib/product-admin-service';
import { requireAdmin } from '@/lib/require-admin';
import { prisma } from '@/prisma/prisma-client';

export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ productId: string }> };

const parseProductId = (raw: string | undefined) => {
  if (!raw) return null;
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
};

export async function GET(_req: Request, { params }: Params) {
  const adminError = await requireAdmin();
  if (adminError) return adminError;

  try {
    const { productId } = await params;
    const id = parseProductId(productId);

    if (!id) {
      return apiError('Product id is required', 400);
    }

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        ingredients: true,
        items: {
          orderBy: [{ pizzaType: 'asc' }, { size: 'asc' }, { price: 'asc' }],
        },
      },
    });

    if (!product) {
      return apiError('Product not found', 404);
    }

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

    if (!id) {
      return apiError('Product id is required', 400);
    }

    const raw = await req.json();
    const parsed = productBodySchema.parse(raw);
    const items = normalizeProductItems(parsed.items);

    await prisma.product.update({
      where: { id },
      data: {
        name: parsed.name,
        imageUrl: parsed.imageUrl,
        categoryId: parsed.categoryId,
        active: parsed.active,
        sortOrder: parsed.sortOrder,
      },
    });

    await reconcileProductVariants(id, items);
    await replaceProductIngredients(id, dedupeIngredientIds(parsed.ingredientIds));

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        items: true,
        ingredients: true,
      },
    });
    invalidateAdminDataCache();

    return NextResponse.json(product);
  } catch (err) {
    if (err instanceof ZodError) {
      return apiZodError(err);
    }
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

    if (!id) {
      return apiError('Product id is required', 400);
    }

    await prisma.product.delete({
      where: { id },
    });
    invalidateAdminDataCache();

    return NextResponse.json({ ok: true });
  } catch (err) {
    return apiInternalError('PRODUCT_DELETE', err);
  }
}
