import { z } from 'zod';

import { prisma } from '@/prisma/prisma-client';

export const sortUpdateSchema = z.object({
  updates: z
    .array(
      z.object({
        id: z.coerce.number().int().positive(),
        sortOrder: z.coerce.number().int().min(0),
      }),
    )
    .min(1, 'At least one update is required')
    .max(500, 'Too many updates in one batch'),
});

export type SortUpdates = z.infer<typeof sortUpdateSchema>['updates'];

export const moveDirectionSchema = z.object({
  direction: z.enum(['up', 'down']),
});

export type MoveDirection = z.infer<typeof moveDirectionSchema>['direction'];

/**
 * Bulk-apply sort order to rows of a single table.
 *
 * Uses batch-array transactions because the Neon HTTP adapter does not
 * support interactive ones. Each row is a small UPDATE; the array is
 * sent as a single round-trip.
 */
export const applySortOrder = async (
  table: 'product' | 'category',
  updates: SortUpdates,
) => {
  if (updates.length === 0) return [];

  const queries = updates.map((row) =>
    table === 'product'
      ? prisma.product.update({
          where: { id: row.id },
          data: { sortOrder: row.sortOrder },
          select: { id: true, sortOrder: true },
        })
      : prisma.category.update({
          where: { id: row.id },
          data: { sortOrder: row.sortOrder },
          select: { id: true, sortOrder: true },
        }),
  );

  return prisma.$transaction(queries);
};

const normalizeOrder = <T extends { id: number }>(rows: T[]): SortUpdates =>
  rows.map((row, index) => ({ id: row.id, sortOrder: index }));

export const moveProduct = async (productId: number, direction: MoveDirection) => {
  const target = await prisma.product.findUnique({
    where: { id: productId },
    select: { id: true, categoryId: true },
  });
  if (!target) return { moved: false, reason: 'not_found' as const };

  const siblings = await prisma.product.findMany({
    where: { categoryId: target.categoryId },
    select: { id: true },
    orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
  });

  const currentIndex = siblings.findIndex((row) => row.id === productId);
  if (currentIndex === -1) return { moved: false, reason: 'not_found' as const };

  const nextIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
  if (nextIndex < 0 || nextIndex >= siblings.length) {
    return { moved: false, reason: 'edge' as const };
  }

  const reordered = [...siblings];
  [reordered[currentIndex], reordered[nextIndex]] = [
    reordered[nextIndex],
    reordered[currentIndex],
  ];

  await applySortOrder('product', normalizeOrder(reordered));
  return { moved: true, reason: 'ok' as const };
};

export const moveCategory = async (categoryId: number, direction: MoveDirection) => {
  const siblings = await prisma.category.findMany({
    select: { id: true },
    orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
  });

  const currentIndex = siblings.findIndex((row) => row.id === categoryId);
  if (currentIndex === -1) return { moved: false, reason: 'not_found' as const };

  const nextIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
  if (nextIndex < 0 || nextIndex >= siblings.length) {
    return { moved: false, reason: 'edge' as const };
  }

  const reordered = [...siblings];
  [reordered[currentIndex], reordered[nextIndex]] = [
    reordered[nextIndex],
    reordered[currentIndex],
  ];

  await applySortOrder('category', normalizeOrder(reordered));
  return { moved: true, reason: 'ok' as const };
};
