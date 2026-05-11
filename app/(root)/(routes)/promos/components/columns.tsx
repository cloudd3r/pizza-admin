'use client';

import { ColumnDef } from '@tanstack/react-table';
import { CheckCircle2, XCircle } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';

import { CellAction } from './cell-action';

export type PromoKindValue = 'PERCENT' | 'FIXED' | 'FREE_DELIVERY';

export type PromoColumn = {
  id: number;
  code: string;
  kind: PromoKindValue;
  value: string;
  active: boolean;
  validity: string;
  limits: string;
  redemptionsCount: number;
  createdAt: string;
};

const kindLabels: Record<PromoKindValue, string> = {
  PERCENT: 'Процент',
  FIXED: 'Фикс. ₽',
  FREE_DELIVERY: 'Бесплатная доставка',
};

export const columns: ColumnDef<PromoColumn>[] = [
  {
    accessorKey: 'code',
    header: 'Code',
    cell: ({ row }) => (
      <span className='font-mono font-semibold uppercase'>
        {row.original.code}
      </span>
    ),
  },
  {
    accessorKey: 'kind',
    header: 'Type',
    cell: ({ row }) => kindLabels[row.original.kind],
  },
  {
    accessorKey: 'value',
    header: 'Value',
  },
  {
    accessorKey: 'validity',
    header: 'Validity',
  },
  {
    accessorKey: 'limits',
    header: 'Limits',
  },
  {
    accessorKey: 'redemptionsCount',
    header: 'Used',
    cell: ({ row }) => (
      <Button asChild variant='ghost' size='sm'>
        <Link href={`/promos/${row.original.id}/redemptions`}>
          {row.original.redemptionsCount}
        </Link>
      </Button>
    ),
  },
  {
    accessorKey: 'active',
    header: 'Active',
    cell: ({ row }) =>
      row.original.active ? (
        <CheckCircle2 className='w-4 h-4 text-emerald-600' />
      ) : (
        <XCircle className='w-4 h-4 text-muted-foreground' />
      ),
  },
  {
    accessorKey: 'createdAt',
    header: 'Created',
  },
  {
    id: 'actions',
    cell: ({ row }) => <CellAction data={row.original} />,
  },
];
