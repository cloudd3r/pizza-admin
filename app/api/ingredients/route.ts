import { NextResponse } from 'next/server';

import { prisma } from '@/prisma/prisma-client';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const ingredients = await prisma.ingredient.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(ingredients);
  } catch (err) {
    console.log(`[INGREDIENTS_GET] ${err}`);
    return new NextResponse('Internal error', { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, price, imageUrl } = body as {
      name?: string;
      price?: number;
      imageUrl?: string;
    };

    if (!name) return new NextResponse('Name is required', { status: 400 });
    if (typeof price !== 'number' || Number.isNaN(price)) {
      return new NextResponse('Price is required', { status: 400 });
    }
    if (!imageUrl) {
      return new NextResponse('Image is required', { status: 400 });
    }

    const ingredient = await prisma.ingredient.create({
      data: { name, price: Math.round(price), imageUrl },
    });

    return NextResponse.json(ingredient);
  } catch (err) {
    console.log(`[INGREDIENTS_POST] ${err}`);
    return new NextResponse('Internal error', { status: 500 });
  }
}
