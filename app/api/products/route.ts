import { NextResponse } from 'next/server';

import { prisma } from '@/prisma/prisma-client';

export const dynamic = 'force-dynamic';

type ProductItemBody = {
  id?: number;
  price?: number;
  size?: number | null;
  pizzaType?: number | null;
};

type ProductBody = {
  name?: string;
  imageUrl?: string;
  categoryId?: string;
  ingredientIds?: number[];
  items?: ProductItemBody[];
};

type NormalizedProductItem = {
  price: number;
  size: number | null;
  pizzaType: number | null;
};

const normalizeItems = (items?: ProductItemBody[]) => {
  if (!items?.length) return null;

  return items.map((item) => ({
    price: Math.round(Number(item.price)),
    size: item.size ? Number(item.size) : null,
    pizzaType: item.pizzaType ? Number(item.pizzaType) : null,
  }));
};

const validateBody = (body: ProductBody) => {
  const { name, imageUrl, categoryId, items } = body;
  const normalizedItems = normalizeItems(items);

  if (!name) return { error: 'Name is required' };
  if (!imageUrl) return { error: 'Image is required' };
  if (!categoryId) return { error: 'Category id is required' };
  if (!normalizedItems?.length) return { error: 'At least one item is required' };
  if (normalizedItems.some((item) => !item.price || Number.isNaN(item.price))) {
    return { error: 'Valid item prices are required' };
  }

  return { normalizedItems };
};

const normalizeIngredientIds = (ids?: number[]) =>
  Array.from(
    new Set(
      ids
        ?.map((id) => Number(id))
        .filter((id) => Number.isInteger(id) && id > 0) ?? [],
    ),
  );

const createProductItems = async (
  productId: number,
  items: NormalizedProductItem[],
) => {
  for (const item of items) {
    await prisma.productItem.create({
      data: {
        productId,
        price: item.price,
        size: item.size,
        pizzaType: item.pizzaType,
      },
    });
  }
};

const replaceProductIngredients = async (
  productId: number,
  ingredientIds: number[],
) => {
  await prisma.$executeRaw`
    DELETE FROM "_IngredientToProduct"
    WHERE "B" = ${productId}
  `;

  for (const ingredientId of ingredientIds) {
    await prisma.$executeRaw`
      INSERT INTO "_IngredientToProduct" ("A", "B")
      VALUES (${ingredientId}, ${productId})
      ON CONFLICT DO NOTHING
    `;
  }
};

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      include: {
        category: true,
        ingredients: true,
        items: {
          orderBy: { price: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(products);
  } catch (err) {
    console.log(`[PRODUCTS_GET] ${err}`);
    return new NextResponse('Internal error', { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as ProductBody;
    const validation = validateBody(body);

    if ('error' in validation) {
      return new NextResponse(validation.error, { status: 400 });
    }

    const product = await prisma.product.create({
      data: {
        name: body.name as string,
        imageUrl: body.imageUrl as string,
        categoryId: Number(body.categoryId),
      },
    });

    await createProductItems(product.id, validation.normalizedItems);
    await replaceProductIngredients(
      product.id,
      normalizeIngredientIds(body.ingredientIds),
    );

    const productWithRelations = await prisma.product.findUnique({
      where: { id: product.id },
      include: {
        items: true,
        ingredients: true,
      },
    });

    return NextResponse.json(productWithRelations);
  } catch (err) {
    console.log(`[PRODUCTS_POST] ${err}`);
    return new NextResponse('Internal error', { status: 500 });
  }
}
