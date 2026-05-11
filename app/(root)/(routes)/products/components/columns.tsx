'use client';

import { ColumnDef } from '@tanstack/react-table';
import Image from 'next/image';

import { CellAction } from './cell-action';
import { ProductActiveToggle } from './product-active-toggle';
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
    id: 'actions',
    cell: ({ row }) => <CellAction data={row.original} />,
  },
];
