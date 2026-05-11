import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

import { invalidateAdminDataCache } from '@/lib/admin-data-cache';
import { apiError, apiInternalError, apiZodError } from '@/lib/api-error';
import {
  PromoCodeTakenError,
  createPromo,
  listPromos,
  promoBodySchema,
} from '@/lib/promo-admin-service';
import { requireAdmin } from '@/lib/require-admin';

export const dynamic = 'force-dynamic';

export async function GET() {
  const adminError = await requireAdmin();
  if (adminError) return adminError;

  try {
    return NextResponse.json(await listPromos());
  } catch (err) {
    return apiInternalError('PROMOS_GET', err);
  }
}

export async function POST(req: Request) {
  const adminError = await requireAdmin();
  if (adminError) return adminError;

  try {
    const parsed = promoBodySchema.parse(await req.json());
    const promo = await createPromo(parsed);
    invalidateAdminDataCache();
    return NextResponse.json(promo);
  } catch (err) {
    if (err instanceof ZodError) return apiZodError(err);
    if (err instanceof PromoCodeTakenError) return apiError(err.message, 409);
    return apiInternalError('PROMOS_POST', err);
  }
}
