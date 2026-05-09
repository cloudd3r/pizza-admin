import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

import { invalidateAdminDataCache } from '@/lib/admin-data-cache';
import { apiError, apiInternalError, apiZodError } from '@/lib/api-error';
import {
  createProductItems,
  dedupeIngredientIds,
  normalizeProductItems,
  productBodySchema,
  replaceProductIngredients,
} from '@/lib/product-admin-service';
import { requireAdmin } from '@/lib/require-admin';
import { prisma } from '@/prisma/prisma-client';

export const dynamic = 'force-dynamic';

export async function GET() {
  const adminError = await requireAdmin();
  if (adminError) return adminError;

  try {
    const products = await prisma.product.findMany({
      include: {
        category: true,
        ingredients: true,
        items: {
          orderBy: { price: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(products);
  } catch (err) {
    return apiInternalError('PRODUCTS_GET', err);
  }
}

export async function POST(req: Request) {
  const adminError = await requireAdmin();
  if (adminError) return adminError;

  try {
    const raw = await req.json();
    const parsed = productBodySchema.parse(raw);
    const items = normalizeProductItems(parsed.items);

    const product = await prisma.product.create({
      data: {
        name: parsed.name,
        imageUrl: parsed.imageUrl,
        categoryId: parsed.categoryId,
      },
    });

    await createProductItems(product.id, items);
    await replaceProductIngredients(
      product.id,
      dedupeIngredientIds(parsed.ingredientIds),
    );

    const productWithRelations = await prisma.product.findUnique({
      where: { id: product.id },
      include: {
        items: true,
        ingredients: true,
      },
    });
    invalidateAdminDataCache();

    return NextResponse.json(productWithRelations);
  } catch (err) {
    if (err instanceof ZodError) {
      return apiZodError(err);
    }
    if (err instanceof Error && err.message.startsWith('Category id')) {
      return apiError(err.message, 400);
    }
    return apiInternalError('PRODUCTS_POST', err);
  }
}
