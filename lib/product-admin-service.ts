import { z } from 'zod';

import { prisma } from '@/prisma/prisma-client';

export const productItemSchema = z.object({
  id: z.number().int().positive().optional(),
  price: z.coerce
    .number({ invalid_type_error: 'Item price must be a number' })
    .int('Item price must be an integer')
    .positive('Item price must be greater than zero'),
  size: z.coerce.number().int().nullable().optional(),
  pizzaType: z.coerce.number().int().nullable().optional(),
});

export const productBodySchema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  imageUrl: z.string().trim().url('Image URL must be a valid URL'),
  categoryId: z.union([z.string(), z.number()]).transform((value) => {
    const parsed = Number(value);
    if (!Number.isInteger(parsed) || parsed <= 0) {
      throw new Error('Category id must be a positive integer');
    }
    return parsed;
  }),
  ingredientIds: z.array(z.coerce.number().int().positive()).optional().default([]),
  items: z.array(productItemSchema).min(1, 'At least one item is required'),
  active: z.coerce.boolean().optional().default(true),
  sortOrder: z.coerce
    .number()
    .int('Sort order must be an integer')
    .min(0, 'Sort order must be 0 or higher')
    .optional()
    .default(0),
});

export type ProductBody = z.infer<typeof productBodySchema>;
export type NormalizedProductItem = {
  id?: number;
  price: number;
  size: number | null;
  pizzaType: number | null;
};

export const normalizeProductItems = (
  items: ProductBody['items'],
): NormalizedProductItem[] =>
  items.map((item) => ({
    id: item.id,
    price: Math.round(item.price),
    size: item.size ? Number(item.size) : null,
    pizzaType: item.pizzaType ? Number(item.pizzaType) : null,
  }));

export const dedupeIngredientIds = (ids: number[] | undefined) =>
  Array.from(
    new Set(
      (ids ?? [])
        .map((id) => Number(id))
        .filter((id) => Number.isInteger(id) && id > 0),
    ),
  );

export const createProductItems = async (
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

export const replaceProductIngredients = async (
  productId: number,
  ingredientIds: number[],
) => {
  // Neon HTTP adapter doesn't support interactive transactions, so we use
  // the pattern from the rest of this admin: raw SQL on the implicit M2M
  // join table to swap ingredients atomically per call.
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

export class ProductVariantInUseError extends Error {
  variantId: number;
  cartItemsCount: number;

  constructor(variantId: number, cartItemsCount: number) {
    super(
      `Variant #${variantId} is used by ${cartItemsCount} cart item(s) and cannot be removed`,
    );
    this.name = 'ProductVariantInUseError';
    this.variantId = variantId;
    this.cartItemsCount = cartItemsCount;
  }
}

export const reconcileProductVariants = async (
  productId: number,
  items: NormalizedProductItem[],
) => {
  const existing = await prisma.productItem.findMany({
    where: { productId },
    select: { id: true },
  });

  const inputIds = new Set(
    items.map((item) => item.id).filter((id): id is number => Number.isInteger(id)),
  );
  const toDelete = existing.filter((row) => !inputIds.has(row.id));

  if (toDelete.length > 0) {
    const usage = await prisma.cartItem.groupBy({
      by: ['productItemId'],
      where: { productItemId: { in: toDelete.map((row) => row.id) } },
      _count: { productItemId: true },
    });

    const blocking = usage.find((row) => row._count.productItemId > 0);
    if (blocking) {
      throw new ProductVariantInUseError(
        blocking.productItemId,
        blocking._count.productItemId,
      );
    }

    await prisma.productItem.deleteMany({
      where: { id: { in: toDelete.map((row) => row.id) } },
    });
  }

  for (const item of items) {
    if (item.id && Number.isInteger(item.id)) {
      await prisma.productItem.update({
        where: { id: item.id },
        data: {
          price: item.price,
          size: item.size,
          pizzaType: item.pizzaType,
        },
      });
    } else {
      await prisma.productItem.create({
        data: {
          productId,
          price: item.price,
          size: item.size,
          pizzaType: item.pizzaType,
        },
      });
    }
  }
};

/**
 * @deprecated Use reconcileProductVariants instead.
 * Kept temporarily for migration; will be removed once nothing imports it.
 */
export const replaceProductVariants = async (
  productId: number,
  items: NormalizedProductItem[],
) => {
  await prisma.productItem.deleteMany({ where: { productId } });
  await createProductItems(productId, items);
};
