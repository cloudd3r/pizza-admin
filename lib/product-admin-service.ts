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
  description: z
    .string()
    .trim()
    .max(2000, 'Description is too long')
    .nullable()
    .optional()
    .transform((value) => (value && value.length > 0 ? value : null)),
  composition: z
    .string()
    .trim()
    .max(2000, 'Composition is too long')
    .nullable()
    .optional()
    .transform((value) => (value && value.length > 0 ? value : null)),
  calories: z
    .union([z.coerce.number().int().min(0).max(10000), z.literal(''), z.null()])
    .nullable()
    .optional()
    .transform((value) =>
      value === '' || value === null || value === undefined ? null : Number(value),
    ),
  proteins: z
    .union([z.coerce.number().min(0).max(1000), z.literal(''), z.null()])
    .nullable()
    .optional()
    .transform((value) =>
      value === '' || value === null || value === undefined ? null : Number(value),
    ),
  fats: z
    .union([z.coerce.number().min(0).max(1000), z.literal(''), z.null()])
    .nullable()
    .optional()
    .transform((value) =>
      value === '' || value === null || value === undefined ? null : Number(value),
    ),
  carbs: z
    .union([z.coerce.number().min(0).max(1000), z.literal(''), z.null()])
    .nullable()
    .optional()
    .transform((value) =>
      value === '' || value === null || value === undefined ? null : Number(value),
    ),
  allergens: z
    .union([z.string(), z.array(z.string())])
    .optional()
    .default([])
    .transform((value) => {
      const raw = Array.isArray(value) ? value : value.split(',');
      return Array.from(
        new Set(
          raw
            .map((entry) => entry.trim())
            .filter((entry) => entry.length > 0 && entry.length <= 64),
        ),
      );
    }),
  badges: z
    .union([z.string(), z.array(z.string())])
    .optional()
    .default([])
    .transform((value) => {
      const raw = Array.isArray(value) ? value : value.split(',');
      return Array.from(
        new Set(
          raw
            .map((entry) => entry.trim())
            .filter((entry) => entry.length > 0 && entry.length <= 64),
        ),
      );
    }),
  stopUntil: z
    .union([z.string(), z.date(), z.null()])
    .nullable()
    .optional()
    .transform((value) => {
      if (value === null || value === undefined || value === '') return null;
      const date = value instanceof Date ? value : new Date(value);
      if (Number.isNaN(date.getTime())) return null;
      return date;
    }),
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

export const parseProductId = (raw: string | undefined) => {
  if (!raw) return null;
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
};

const productScalarData = (body: ProductBody) => ({
  name: body.name,
  imageUrl: body.imageUrl,
  categoryId: body.categoryId,
  active: body.active,
  sortOrder: body.sortOrder,
  description: body.description,
  composition: body.composition,
  calories: body.calories,
  proteins: body.proteins,
  fats: body.fats,
  carbs: body.carbs,
  allergens: body.allergens,
  badges: body.badges,
  stopUntil: body.stopUntil,
});

export const listProductsWithRelations = () =>
  prisma.product.findMany({
    include: {
      category: true,
      ingredients: true,
      items: { orderBy: { price: 'asc' } },
    },
    orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
  });

export const getProductWithRelations = (id: number) =>
  prisma.product.findUnique({
    where: { id },
    include: {
      category: true,
      ingredients: true,
      items: {
        orderBy: [{ pizzaType: 'asc' }, { size: 'asc' }, { price: 'asc' }],
      },
    },
  });

export const createProductWithRelations = async (body: ProductBody) => {
  const product = await prisma.product.create({
    data: productScalarData(body),
  });

  await createProductItems(product.id, normalizeProductItems(body.items));
  await replaceProductIngredients(
    product.id,
    dedupeIngredientIds(body.ingredientIds),
  );

  return prisma.product.findUnique({
    where: { id: product.id },
    include: { items: true, ingredients: true },
  });
};

export const updateProductWithRelations = async (id: number, body: ProductBody) => {
  await prisma.product.update({
    where: { id },
    data: productScalarData(body),
  });

  await reconcileProductVariants(id, normalizeProductItems(body.items));
  await replaceProductIngredients(id, dedupeIngredientIds(body.ingredientIds));

  return prisma.product.findUnique({
    where: { id },
    include: { items: true, ingredients: true },
  });
};

export const deleteProduct = (id: number) =>
  prisma.product.delete({ where: { id } });
