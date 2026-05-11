import { z } from 'zod';

import { prisma } from '@/prisma/prisma-client';

export const categoryBodySchema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  sortOrder: z.coerce
    .number()
    .int('Sort order must be an integer')
    .min(0, 'Sort order must be 0 or higher')
    .optional()
    .default(0),
});

export type CategoryBody = z.infer<typeof categoryBodySchema>;

export const parseCategoryId = (raw: string | undefined) => {
  if (!raw) return null;
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
};

export class CategoryNotEmptyError extends Error {
  productCount: number;

  constructor(productCount: number) {
    super(
      `Category has ${productCount} product(s) and cannot be removed`,
    );
    this.name = 'CategoryNotEmptyError';
    this.productCount = productCount;
  }
}

export const listCategories = () =>
  prisma.category.findMany({
    orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
  });

export const getCategory = (id: number) =>
  prisma.category.findUnique({ where: { id } });

export const createCategory = (body: CategoryBody) =>
  prisma.category.create({
    data: { name: body.name, sortOrder: body.sortOrder },
  });

export const updateCategory = (id: number, body: CategoryBody) =>
  prisma.category.update({
    where: { id },
    data: { name: body.name, sortOrder: body.sortOrder },
  });

export const deleteCategory = async (id: number) => {
  const productCount = await prisma.product.count({
    where: { categoryId: id },
  });
  if (productCount > 0) {
    throw new CategoryNotEmptyError(productCount);
  }
  return prisma.category.delete({ where: { id } });
};
