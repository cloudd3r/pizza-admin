'use client';

import { ColumnDef } from '@tanstack/react-table';
import Image from 'next/image';

import { CellAction } from './cell-action';
import { ProductActiveToggle } from './product-active-toggle';
import { ProductStopToggle } from './product-stop-toggle';
import { RowReorderControls } from './row-reorder-controls';

export type ProductColumn = {
  id: number;
  name: string;
  category: string;
  imageUrl: string;
  price: string;
  variantsCount: number;
  ingredientsCount: number;
  isPizza: boolean;
  active: boolean;
  sortOrder: number;
  stopUntil: string | null;
  badges: string[];
  createdAt: string;
};

export const columns: ColumnDef<ProductColumn>[] = [
  {
    id: 'image',
    header: '',
    cell: ({ row }) => (
      <div className='relative w-12 h-12 rounded-md overflow-hidden border'>
        <Image
          src={row.original.imageUrl}
          alt={row.original.name}
          fill
          sizes='48px'
          className='object-cover'
        />
      </div>
    ),
  },
  {
    accessorKey: 'name',
    header: 'Name',
  },
  {
    accessorKey: 'category',
    header: 'Category',
  },
  {
    accessorKey: 'price',
    header: 'Price',
  },
  {
    accessorKey: 'variantsCount',
    header: 'Variants',
  },
  {
    accessorKey: 'ingredientsCount',
    header: 'Ingredients',
  },
  {
    accessorKey: 'isPizza',
    header: 'Type',
    cell: ({ row }) => (row.original.isPizza ? 'Pizza' : 'Product'),
  },
  {
    accessorKey: 'active',
    header: 'Active',
    cell: ({ row }) => (
      <ProductActiveToggle
        productId={row.original.id}
        active={row.original.active}
      />
    ),
  },
  {
    accessorKey: 'sortOrder',
    header: 'Order',
    cell: ({ row }) => (
      <div className='flex items-center gap-2'>
        <span className='text-sm text-muted-foreground tabular-nums w-6 text-right'>
          {row.original.sortOrder}
        </span>
        <RowReorderControls id={row.original.id} endpoint='/api/products' />
      </div>
    ),
  },
  {
    id: 'stop',
    header: 'Stop',
    cell: ({ row }) => (
      <ProductStopToggle
        productId={row.original.id}
        stopUntilIso={row.original.stopUntil}
      />
    ),
  },
  {
    id: 'badges',
    header: 'Badges',
    cell: ({ row }) =>
      row.original.badges.length === 0 ? (
        <span className='text-xs text-muted-foreground'>—</span>
      ) : (
        <div className='flex flex-wrap gap-1'>
          {row.original.badges.slice(0, 3).map((badge) => (
            <span
              key={badge}
              className='inline-flex items-center rounded bg-slate-100 px-1.5 py-0.5 text-[11px] text-slate-700'
            >
              {badge}
            </span>
          ))}
          {row.original.badges.length > 3 ? (
            <span className='text-[11px] text-muted-foreground'>
              +{row.original.badges.length - 3}
            </span>
          ) : null}
        </div>
      ),
  },
  {
    id: 'actions',
    cell: ({ row }) => <CellAction data={row.original} />,
  },
];
