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
});

export type ProductBody = z.infer<typeof productBodySchema>;
export type NormalizedProductItem = {
  price: number;
  size: number | null;
  pizzaType: number | null;
};

export const normalizeProductItems = (
  items: ProductBody['items'],
): NormalizedProductItem[] =>
  items.map((item) => ({
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

export const replaceProductVariants = async (
  productId: number,
  items: NormalizedProductItem[],
) => {
  await prisma.productItem.deleteMany({ where: { productId } });
  await createProductItems(productId, items);
};
