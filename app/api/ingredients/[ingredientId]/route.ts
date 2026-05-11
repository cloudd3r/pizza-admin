import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

import { invalidateAdminDataCache } from '@/lib/admin-data-cache';
import { apiError, apiInternalError, apiZodError } from '@/lib/api-error';
import {
  IngredientInUseError,
  deleteIngredient,
  getIngredient,
  ingredientBodySchema,
  parseIngredientId,
  updateIngredient,
} from '@/lib/ingredient-admin-service';
import { requireAdmin } from '@/lib/require-admin';

export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ ingredientId: string }> };

export async function GET(_req: Request, { params }: Params) {
  const adminError = await requireAdmin();
  if (adminError) return adminError;

  try {
    const { ingredientId } = await params;
    const id = parseIngredientId(ingredientId);
    if (!id) return apiError('Ingredient id is required', 400);

    const ingredient = await getIngredient(id);
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

    const parsed = ingredientBodySchema.parse(await req.json());
    const ingredient = await updateIngredient(id, parsed);
    invalidateAdminDataCache();
    return NextResponse.json(ingredient);
  } catch (err) {
    if (err instanceof ZodError) return apiZodError(err);
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

    const ingredient = await deleteIngredient(id);
    invalidateAdminDataCache();
    return NextResponse.json(ingredient);
  } catch (err) {
    if (err instanceof IngredientInUseError) {
      return apiError(err.message, 409);
    }
    return apiInternalError('INGREDIENT_DELETE', err);
  }
}
