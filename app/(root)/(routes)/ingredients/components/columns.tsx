'use client';

import { ColumnDef } from '@tanstack/react-table';
import Image from 'next/image';

import { CellAction } from './cell-action';

export type IngredientColumn = {
  id: number;
  name: string;
  price: number;
  imageUrl: string;
  createdAt: string;
};

export const columns: ColumnDef<IngredientColumn>[] = [
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
    accessorKey: 'price',
    header: 'Price',
    cell: ({ row }) => `${row.original.price} ₽`,
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
