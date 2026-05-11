import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

import { invalidateAdminDataCache } from '@/lib/admin-data-cache';
import { apiError, apiInternalError, apiZodError } from '@/lib/api-error';
import { requireAdmin } from '@/lib/require-admin';
import { moveCategory, moveDirectionSchema } from '@/lib/sort-order-service';

export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ categoryId: string }> };

export async function POST(req: Request, { params }: Params) {
  const adminError = await requireAdmin();
  if (adminError) return adminError;

  try {
    const { categoryId } = await params;
    const id = Number(categoryId);
    if (!Number.isInteger(id) || id <= 0) {
      return apiError('Category id is required', 400);
    }

    const raw = await req.json();
    const parsed = moveDirectionSchema.parse(raw);

    const result = await moveCategory(id, parsed.direction);
    if (!result.moved && result.reason === 'not_found') {
      return apiError('Category not found', 404);
    }

    invalidateAdminDataCache();
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof ZodError) {
      return apiZodError(err);
    }
    return apiInternalError('CATEGORY_MOVE_POST', err);
  }
}
