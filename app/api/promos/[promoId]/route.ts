import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

import { invalidateAdminDataCache } from '@/lib/admin-data-cache';
import { apiError, apiInternalError, apiZodError } from '@/lib/api-error';
import {
  PromoCodeTakenError,
  PromoInUseError,
  deletePromo,
  getPromo,
  parsePromoId,
  promoBodySchema,
  updatePromo,
} from '@/lib/promo-admin-service';
import { requireAdmin } from '@/lib/require-admin';

export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ promoId: string }> };

export async function GET(_req: Request, { params }: Params) {
  const adminError = await requireAdmin();
  if (adminError) return adminError;

  try {
    const { promoId } = await params;
    const id = parsePromoId(promoId);
    if (!id) return apiError('Promo id is required', 400);

    const promo = await getPromo(id);
    if (!promo) return apiError('Promo not found', 404);

    return NextResponse.json(promo);
  } catch (err) {
    return apiInternalError('PROMO_GET', err);
  }
}

export async function PATCH(req: Request, { params }: Params) {
  const adminError = await requireAdmin();
  if (adminError) return adminError;

  try {
    const { promoId } = await params;
    const id = parsePromoId(promoId);
    if (!id) return apiError('Promo id is required', 400);

    const parsed = promoBodySchema.parse(await req.json());
    const promo = await updatePromo(id, parsed);
    invalidateAdminDataCache();
    return NextResponse.json(promo);
  } catch (err) {
    if (err instanceof ZodError) return apiZodError(err);
    if (err instanceof PromoCodeTakenError) return apiError(err.message, 409);
    return apiInternalError('PROMO_PATCH', err);
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  const adminError = await requireAdmin();
  if (adminError) return adminError;

  try {
    const { promoId } = await params;
    const id = parsePromoId(promoId);
    if (!id) return apiError('Promo id is required', 400);

    const promo = await deletePromo(id);
    invalidateAdminDataCache();
    return NextResponse.json(promo);
  } catch (err) {
    if (err instanceof PromoInUseError) return apiError(err.message, 409);
    return apiInternalError('PROMO_DELETE', err);
  }
}
