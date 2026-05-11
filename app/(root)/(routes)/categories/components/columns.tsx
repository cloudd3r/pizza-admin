'use client';

import { ColumnDef } from '@tanstack/react-table';

import { RowReorderControls } from '@/app/(root)/(routes)/products/components/row-reorder-controls';

import { CellAction } from './cell-action';

export type CategoryColumn = {
  id: number;
  name: string;
  sortOrder: number;
  createdAt: string;
};

export const columns: ColumnDef<CategoryColumn>[] = [
  {
    accessorKey: 'name',
    header: 'Name',
  },
  {
    accessorKey: 'sortOrder',
    header: 'Order',
    cell: ({ row }) => (
      <div className='flex items-center gap-2'>
        <span className='text-sm text-muted-foreground tabular-nums w-6 text-right'>
          {row.original.sortOrder}
        </span>
        <RowReorderControls id={row.original.id} endpoint='/api/categories' />
      </div>
    ),
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
