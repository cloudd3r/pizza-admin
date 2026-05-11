import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

import { invalidateAdminDataCache } from '@/lib/admin-data-cache';
import { apiInternalError, apiZodError } from '@/lib/api-error';
import {
  createIngredient,
  ingredientBodySchema,
  listIngredients,
} from '@/lib/ingredient-admin-service';
import { requireAdmin } from '@/lib/require-admin';

export const dynamic = 'force-dynamic';

export async function GET() {
  const adminError = await requireAdmin();
  if (adminError) return adminError;

  try {
    return NextResponse.json(await listIngredients());
  } catch (err) {
    return apiInternalError('INGREDIENTS_GET', err);
  }
}

export async function POST(req: Request) {
  const adminError = await requireAdmin();
  if (adminError) return adminError;

  try {
    const parsed = ingredientBodySchema.parse(await req.json());
    const ingredient = await createIngredient(parsed);
    invalidateAdminDataCache();
    return NextResponse.json(ingredient);
  } catch (err) {
    if (err instanceof ZodError) return apiZodError(err);
    return apiInternalError('INGREDIENTS_POST', err);
  }
}
