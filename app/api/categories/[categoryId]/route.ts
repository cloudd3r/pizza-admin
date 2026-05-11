import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

import { invalidateAdminDataCache } from '@/lib/admin-data-cache';
import { apiError, apiInternalError, apiZodError } from '@/lib/api-error';
import {
  CategoryNotEmptyError,
  categoryBodySchema,
  deleteCategory,
  getCategory,
  parseCategoryId,
  updateCategory,
} from '@/lib/category-admin-service';
import { requireAdmin } from '@/lib/require-admin';

export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ categoryId: string }> };

export async function GET(_req: Request, { params }: Params) {
  const adminError = await requireAdmin();
  if (adminError) return adminError;

  try {
    const { categoryId } = await params;
    const id = parseCategoryId(categoryId);
    if (!id) return apiError('Category id is required', 400);

    const category = await getCategory(id);
    if (!category) return apiError('Category not found', 404);

    return NextResponse.json(category);
  } catch (err) {
    return apiInternalError('CATEGORY_GET', err);
  }
}

export async function PATCH(req: Request, { params }: Params) {
  const adminError = await requireAdmin();
  if (adminError) return adminError;

  try {
    const { categoryId } = await params;
    const id = parseCategoryId(categoryId);
    if (!id) return apiError('Category id is required', 400);

    const parsed = categoryBodySchema.parse(await req.json());
    const category = await updateCategory(id, parsed);
    invalidateAdminDataCache();
    return NextResponse.json(category);
  } catch (err) {
    if (err instanceof ZodError) return apiZodError(err);
    return apiInternalError('CATEGORY_PATCH', err);
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  const adminError = await requireAdmin();
  if (adminError) return adminError;

  try {
    const { categoryId } = await params;
    const id = parseCategoryId(categoryId);
    if (!id) return apiError('Category id is required', 400);

    const category = await deleteCategory(id);
    invalidateAdminDataCache();
    return NextResponse.json(category);
  } catch (err) {
    if (err instanceof CategoryNotEmptyError) {
      return apiError(err.message, 409);
    }
    return apiInternalError('CATEGORY_DELETE', err);
  }
}
