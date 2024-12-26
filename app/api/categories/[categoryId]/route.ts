import { prisma } from '@/prisma/prisma-client';
import { NextResponse } from 'next/server';

export async function GET(
  req: Request,
  { params }: { params: { categoryId: string } }
) {
  try {
    const { categoryId } = params; // Убираем await
    if (!categoryId) {
      return new NextResponse('Category id is required', { status: 400 });
    }

    const category = await prisma.category.findUnique({
      where: {
        id: Number(categoryId), // Преобразуем в число
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

export async function PATCH(
  req: Request,
  { params }: { params: { categoryId: string } }
) {
  try {
    const body = await req.json();
    const { name } = body;
    const { categoryId } = params; // Убираем await

    if (!name) {
      return new NextResponse('Name is required', { status: 400 });
    }

    if (!categoryId) {
      return new NextResponse('Category id is required', { status: 400 });
    }

    const category = await prisma.category.update({
      where: {
        id: Number(categoryId), // Преобразуем в число
      },
      data: {
        name,
      },
    });

    return NextResponse.json(category);
  } catch (err) {
    console.log('[CATEGORY_PATCH]', err);
    return new NextResponse('Internal error', { status: 500 });
  }
}

//// Delete Method

export async function DELETE(
  req: Request,
  { params }: { params: { categoryId: string } }
) {
  try {
    const { categoryId } = params; // Убираем await

    if (!categoryId) {
      return new NextResponse('Category id is required', { status: 400 });
    }

    const category = await prisma.category.delete({
      where: {
        id: Number(categoryId), // Преобразуем в число
      },
    });

    return NextResponse.json(category);
  } catch (err) {
    console.log('[CATEGORY_DELETE]', err);
    return new NextResponse('Internal error', { status: 500 });
  }
}
