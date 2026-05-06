import { prisma } from '@/prisma/prisma-client';
import { invalidateAdminDataCache } from '@/lib/admin-data-cache';
import { requireAdmin } from '@/lib/require-admin';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ categoryId: string }> };

export async function GET(_req: Request, { params }: Params) {
  const adminError = await requireAdmin();
  if (adminError) return adminError;

  try {
    const { categoryId } = await params;
    if (!categoryId) {
      return new NextResponse('Category id is required', { status: 400 });
    }

    const category = await prisma.category.findUnique({
      where: {
        id: Number(categoryId),
      },
    });

    if (!category) {
      return new NextResponse('Category not found', { status: 404 });
    }

    return NextResponse.json(category);
  } catch (err) {
    console.log('[CATEGORY_GET]', err);
    return new NextResponse('Internal error', { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: Params) {
  const adminError = await requireAdmin();
  if (adminError) return adminError;

  try {
    const body = await req.json();
    const { name } = body;
    const { categoryId } = await params;

    if (!name) {
      return new NextResponse('Name is required', { status: 400 });
    }

    if (!categoryId) {
      return new NextResponse('Category id is required', { status: 400 });
    }

    const category = await prisma.category.update({
      where: {
        id: Number(categoryId),
      },
      data: {
        name,
      },
    });
    invalidateAdminDataCache();

    return NextResponse.json(category);
  } catch (err) {
    console.log('[CATEGORY_PATCH]', err);
    return new NextResponse('Internal error', { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  const adminError = await requireAdmin();
  if (adminError) return adminError;

  try {
    const { categoryId } = await params;

    if (!categoryId) {
      return new NextResponse('Category id is required', { status: 400 });
    }

    const category = await prisma.category.delete({
      where: {
        id: Number(categoryId),
      },
    });
    invalidateAdminDataCache();

    return NextResponse.json(category);
  } catch (err) {
    console.log('[CATEGORY_DELETE]', err);
    return new NextResponse('Internal error', { status: 500 });
  }
}
