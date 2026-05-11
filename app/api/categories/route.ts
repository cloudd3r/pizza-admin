import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

import { invalidateAdminDataCache } from '@/lib/admin-data-cache';
import { apiInternalError, apiZodError } from '@/lib/api-error';
import {
  categoryBodySchema,
  createCategory,
  listCategories,
} from '@/lib/category-admin-service';
import { requireAdmin } from '@/lib/require-admin';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const adminError = await requireAdmin();
  if (adminError) return adminError;

  try {
    const parsed = categoryBodySchema.parse(await req.json());
    const category = await createCategory(parsed);
    invalidateAdminDataCache();
    return NextResponse.json(category);
  } catch (err) {
    if (err instanceof ZodError) return apiZodError(err);
    return apiInternalError('CATEGORIES_POST', err);
  }
}

export async function GET() {
  const adminError = await requireAdmin();
  if (adminError) return adminError;

  try {
    return NextResponse.json(await listCategories());
  } catch (err) {
    return apiInternalError('CATEGORIES_GET', err);
  }
}
