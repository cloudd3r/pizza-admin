import { prisma } from '@/prisma/prisma-client';
import { invalidateAdminDataCache } from '@/lib/admin-data-cache';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name } = body;

    if (!name) {
      return new NextResponse('Name is required', { status: 400 });
    }

    const category = await prisma.category.create({
      data: {
        name,
      },
    });
    invalidateAdminDataCache();

    return NextResponse.json(category);
  } catch (err) {
    console.log(`[CATEGORIES_POST] ${err}`);
    return new NextResponse(`Internal error`, { status: 500 });
  }
}

export async function GET() {
  try {
    const categories = await prisma.category.findMany();

    return NextResponse.json(categories);
  } catch (err) {
    console.log(`[CATEGORIES_GET] ${err}`);
    return new NextResponse(`Internal error`, { status: 500 });
  }
}
