import { NextResponse } from 'next/server';
import { z } from 'zod';

import { invalidateAdminDataCache } from '@/lib/admin-data-cache';
import { apiInternalError, apiZodError } from '@/lib/api-error';
import { requireAdmin } from '@/lib/require-admin';
import { prisma } from '@/prisma/prisma-client';

export const dynamic = 'force-dynamic';

const ingredientBodySchema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  price: z.coerce
    .number({ invalid_type_error: 'Price is required' })
    .int('Price must be an integer')
    .nonnegative('Price must be non-negative'),
  imageUrl: z.string().trim().url('Image URL must be a valid URL'),
});

export async function GET() {
  const adminError = await requireAdmin();
  if (adminError) return adminError;

  try {
    const ingredients = await prisma.ingredient.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(ingredients);
  } catch (err) {
    return apiInternalError('INGREDIENTS_GET', err);
  }
}

export async function POST(req: Request) {
  const adminError = await requireAdmin();
  if (adminError) return adminError;

  try {
    const raw = await req.json();
    const parsed = ingredientBodySchema.parse(raw);

    const ingredient = await prisma.ingredient.create({
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
    return apiInternalError('INGREDIENTS_POST', err);
  }
}
