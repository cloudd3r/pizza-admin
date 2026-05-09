import { NextResponse } from 'next/server';
import { z } from 'zod';

import { invalidateAdminDataCache } from '@/lib/admin-data-cache';
import { apiInternalError, apiZodError } from '@/lib/api-error';
import { requireAdmin } from '@/lib/require-admin';
import { prisma } from '@/prisma/prisma-client';

export const dynamic = 'force-dynamic';

const categoryBodySchema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
});

export async function POST(req: Request) {
  const adminError = await requireAdmin();
  if (adminError) return adminError;

  try {
    const raw = await req.json();
    const parsed = categoryBodySchema.parse(raw);

    const category = await prisma.category.create({
      data: { name: parsed.name },
    });
    invalidateAdminDataCache();

    return NextResponse.json(category);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return apiZodError(err);
    }
    return apiInternalError('CATEGORIES_POST', err);
  }
}

export async function GET() {
  const adminError = await requireAdmin();
  if (adminError) return adminError;

  try {
    const categories = await prisma.category.findMany();

    return NextResponse.json(categories);
  } catch (err) {
    return apiInternalError('CATEGORIES_GET', err);
  }
}
