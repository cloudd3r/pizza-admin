import { z } from 'zod';

import { prisma } from '@/prisma/prisma-client';

export const ingredientBodySchema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  price: z.coerce
    .number({ invalid_type_error: 'Price is required' })
    .int('Price must be an integer')
    .nonnegative('Price must be non-negative'),
  imageUrl: z.string().trim().url('Image URL must be a valid URL'),
});

export type IngredientBody = z.infer<typeof ingredientBodySchema>;

export const parseIngredientId = (raw: string | undefined) => {
  if (!raw) return null;
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
};

export class IngredientInUseError extends Error {
  productCount: number;
  cartItemCount: number;

  constructor(productCount: number, cartItemCount: number) {
    super(
      `Ingredient is used by ${productCount} product(s) and ${cartItemCount} cart item(s) and cannot be removed`,
    );
    this.name = 'IngredientInUseError';
    this.productCount = productCount;
    this.cartItemCount = cartItemCount;
  }
}

export const listIngredients = () =>
  prisma.ingredient.findMany({ orderBy: { createdAt: 'desc' } });

export const getIngredient = (id: number) =>
  prisma.ingredient.findUnique({ where: { id } });

export const createIngredient = (body: IngredientBody) =>
  prisma.ingredient.create({
    data: {
      name: body.name,
      price: Math.round(body.price),
      imageUrl: body.imageUrl,
    },
  });

export const updateIngredient = (id: number, body: IngredientBody) =>
  prisma.ingredient.update({
    where: { id },
    data: {
      name: body.name,
      price: Math.round(body.price),
      imageUrl: body.imageUrl,
    },
  });

export const deleteIngredient = async (id: number) => {
  const [productCount, cartItemCount] = await Promise.all([
    prisma.product.count({ where: { ingredients: { some: { id } } } }),
    prisma.cartItem.count({ where: { ingredients: { some: { id } } } }),
  ]);

  if (productCount > 0 || cartItemCount > 0) {
    throw new IngredientInUseError(productCount, cartItemCount);
  }

  return prisma.ingredient.delete({ where: { id } });
};
