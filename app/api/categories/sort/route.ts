import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

import { invalidateAdminDataCache } from '@/lib/admin-data-cache';
import { apiInternalError, apiZodError } from '@/lib/api-error';
import { requireAdmin } from '@/lib/require-admin';
import { applySortOrder, sortUpdateSchema } from '@/lib/sort-order-service';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const adminError = await requireAdmin();
  if (adminError) return adminError;

  try {
    const raw = await req.json();
    const parsed = sortUpdateSchema.parse(raw);

    const updated = await applySortOrder('category', parsed.updates);
    invalidateAdminDataCache();

    return NextResponse.json({ updated });
  } catch (err) {
    if (err instanceof ZodError) {
      return apiZodError(err);
    }
    return apiInternalError('CATEGORIES_SORT_POST', err);
  }
}
