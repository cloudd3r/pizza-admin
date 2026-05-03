'use client';

import { ColumnDef } from '@tanstack/react-table';
import Image from 'next/image';

import { CellAction } from './cell-action';

export type ProductColumn = {
  id: number;
  name: string;
  category: string;
  imageUrl: string;
  price: string;
  variantsCount: number;
  ingredientsCount: number;
  isPizza: boolean;
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
    accessorKey: 'createdAt',
    header: 'Date',
  },
  {
    id: 'actions',
    cell: ({ row }) => <CellAction data={row.original} />,
  },
];
