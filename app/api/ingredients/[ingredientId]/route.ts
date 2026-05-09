import { NextResponse } from 'next/server';
import { z } from 'zod';

import { invalidateAdminDataCache } from '@/lib/admin-data-cache';
import { apiError, apiInternalError, apiZodError } from '@/lib/api-error';
import { requireAdmin } from '@/lib/require-admin';
import { prisma } from '@/prisma/prisma-client';

export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ ingredientId: string }> };

const ingredientBodySchema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  price: z.coerce
    .number({ invalid_type_error: 'Price is required' })
    .int('Price must be an integer')
    .nonnegative('Price must be non-negative'),
  imageUrl: z.string().trim().url('Image URL must be a valid URL'),
});

const parseIngredientId = (raw: string | undefined) => {
  if (!raw) return null;
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
};

export async function GET(_req: Request, { params }: Params) {
  const adminError = await requireAdmin();
  if (adminError) return adminError;

  try {
    const { ingredientId } = await params;
    const id = parseIngredientId(ingredientId);
    if (!id) return apiError('Ingredient id is required', 400);

    const ingredient = await prisma.ingredient.findUnique({
      where: { id },
    });

    if (!ingredient) return apiError('Ingredient not found', 404);

    return NextResponse.json(ingredient);
  } catch (err) {
    return apiInternalError('INGREDIENT_GET', err);
  }
}

export async function PATCH(req: Request, { params }: Params) {
  const adminError = await requireAdmin();
  if (adminError) return adminError;

  try {
    const { ingredientId } = await params;
    const id = parseIngredientId(ingredientId);
    if (!id) return apiError('Ingredient id is required', 400);

    const raw = await req.json();
    const parsed = ingredientBodySchema.parse(raw);

    const ingredient = await prisma.ingredient.update({
      where: { id },
      data: {
        name: parsed.name,
        price: Math.round(parsed.price),
        imageUrl: parsed.imageUrl,
      },
    });
    invalidateAdminDataCache();

    return NextResponse.json(ingredient);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return apiZodError(err);
    }
    return apiInternalError('INGREDIENT_PATCH', err);
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  const adminError = await requireAdmin();
  if (adminError) return adminError;

  try {
    const { ingredientId } = await params;
    const id = parseIngredientId(ingredientId);
    if (!id) return apiError('Ingredient id is required', 400);

    const ingredient = await prisma.ingredient.delete({
      where: { id },
    });
    invalidateAdminDataCache();

    return NextResponse.json(ingredient);
  } catch (err) {
    return apiInternalError('INGREDIENT_DELETE', err);
  }
}
