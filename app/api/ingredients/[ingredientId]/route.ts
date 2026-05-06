import { NextResponse } from 'next/server';

import { invalidateAdminDataCache } from '@/lib/admin-data-cache';
import { requireAdmin } from '@/lib/require-admin';
import { prisma } from '@/prisma/prisma-client';

export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ ingredientId: string }> };

export async function GET(_req: Request, { params }: Params) {
  const adminError = await requireAdmin();
  if (adminError) return adminError;

  try {
    const { ingredientId } = await params;
    if (!ingredientId) {
      return new NextResponse('Ingredient id is required', { status: 400 });
    }

    const ingredient = await prisma.ingredient.findUnique({
      where: { id: Number(ingredientId) },
    });

    if (!ingredient) {
      return new NextResponse('Ingredient not found', { status: 404 });
    }

    return NextResponse.json(ingredient);
  } catch (err) {
    console.log('[INGREDIENT_GET]', err);
    return new NextResponse('Internal error', { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: Params) {
  const adminError = await requireAdmin();
  if (adminError) return adminError;

  try {
    const { ingredientId } = await params;
    const body = await req.json();
    const { name, price, imageUrl } = body as {
      name?: string;
      price?: number;
      imageUrl?: string;
    };

    if (!ingredientId) {
      return new NextResponse('Ingredient id is required', { status: 400 });
    }
    if (!name) return new NextResponse('Name is required', { status: 400 });
    if (typeof price !== 'number' || Number.isNaN(price)) {
      return new NextResponse('Price is required', { status: 400 });
    }
    if (!imageUrl) {
      return new NextResponse('Image is required', { status: 400 });
    }

    const ingredient = await prisma.ingredient.update({
      where: { id: Number(ingredientId) },
      data: { name, price: Math.round(price), imageUrl },
    });
    invalidateAdminDataCache();

    return NextResponse.json(ingredient);
  } catch (err) {
    console.log('[INGREDIENT_PATCH]', err);
    return new NextResponse('Internal error', { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  const adminError = await requireAdmin();
  if (adminError) return adminError;

  try {
    const { ingredientId } = await params;
    if (!ingredientId) {
      return new NextResponse('Ingredient id is required', { status: 400 });
    }

    const ingredient = await prisma.ingredient.delete({
      where: { id: Number(ingredientId) },
    });
    invalidateAdminDataCache();

    return NextResponse.json(ingredient);
  } catch (err) {
    console.log('[INGREDIENT_DELETE]', err);
    return new NextResponse('Internal error', { status: 500 });
  }
}
