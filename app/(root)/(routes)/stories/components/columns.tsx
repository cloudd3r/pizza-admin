'use client';

import Image from 'next/image';
import { ColumnDef } from '@tanstack/react-table';

import { CellAction } from './cell-action';

export type StoryColumn = {
  id: number;
  previewImageUrl: string;
  itemsCount: number;
  createdAt: string;
};

export const columns: ColumnDef<StoryColumn>[] = [
  {
    id: 'image',
    header: 'Preview',
    cell: ({ row }) => (
      <div className='relative w-12 h-12 rounded-md overflow-hidden border'>
        <Image
          src={row.original.previewImageUrl}
          alt={`Story ${row.original.id}`}
          fill
          sizes='48px'
          className='object-cover'
        />
      </div>
    ),
  },
  {
    accessorKey: 'id',
    header: 'Story',
    cell: ({ row }) => `#${row.original.id}`,
  },
  {
    accessorKey: 'itemsCount',
    header: 'Items',
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
