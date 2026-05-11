import { NextResponse } from 'next/server';
import { z } from 'zod';

import { invalidateAdminDataCache } from '@/lib/admin-data-cache';
import { apiError, apiInternalError, apiZodError } from '@/lib/api-error';
import { requireAdmin } from '@/lib/require-admin';
import { prisma } from '@/prisma/prisma-client';

export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ categoryId: string }> };

const categoryBodySchema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
});

const parseCategoryId = (raw: string | undefined) => {
  if (!raw) return null;
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
};

export async function GET(_req: Request, { params }: Params) {
  const adminError = await requireAdmin();
  if (adminError) return adminError;

  try {
    const { categoryId } = await params;
    const id = parseCategoryId(categoryId);
    if (!id) return apiError('Category id is required', 400);

    const category = await prisma.category.findUnique({
      where: { id },
    });

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

    const raw = await req.json();
    const parsed = categoryBodySchema.parse(raw);

    const category = await prisma.category.update({
      where: { id },
      data: { name: parsed.name },
    });
    invalidateAdminDataCache();

    return NextResponse.json(category);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return apiZodError(err);
    }
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

    const category = await prisma.category.delete({
      where: { id },
    });
    invalidateAdminDataCache();

    return NextResponse.json(category);
  } catch (err) {
    return apiInternalError('CATEGORY_DELETE', err);
  }
}
