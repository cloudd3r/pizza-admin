'use client';

import { ColumnDef } from '@tanstack/react-table';
import Link from 'next/link';

import { Button } from '@/components/ui/button';

import { OrderFulfillmentSelect } from './order-fulfillment-select';
import { OrderItemsDialog } from './order-items-dialog';
import { OrderStatusSelect } from './order-status-select';
import type { OrderFulfillmentStatus } from './order-fulfillment-options';

export type OrderItemColumn = {
  id: number;
  name: string;
  price: number;
  quantity: number;
  total: number;
  variant: string;
  ingredients: string;
};

export type OrderStatusValue = 'PENDING' | 'SUCCEEDED' | 'CANCELLED';

export type OrderColumn = {
  id: number;
  customer: string;
  email: string;
  phone: string;
  contacts: string;
  address: string;
  totalAmount: string;
  totalAmountValue: number;
  status: OrderStatusValue;
  fulfillmentStatus: OrderFulfillmentStatus;
  paymentId: string;
  items: OrderItemColumn[];
  createdAt: string;
  createdAtIso: string;
};

export const columns: ColumnDef<OrderColumn>[] = [
  {
    accessorKey: 'id',
    header: 'Order',
    cell: ({ row }) => (
      <Link
        href={`/orders/${row.original.id}`}
        className='font-medium text-primary hover:underline'
      >
        #{row.original.id}
      </Link>
    ),
  },
  {
    accessorKey: 'customer',
    header: 'Customer',
  },
  {
    accessorKey: 'contacts',
    header: 'Contacts',
  },
  {
    accessorKey: 'totalAmount',
    header: 'Total',
  },
  {
    accessorKey: 'status',
    header: 'Payment',
    cell: ({ row }) => (
      <OrderStatusSelect
        orderId={row.original.id}
        initialStatus={row.original.status}
      />
    ),
  },
  {
    accessorKey: 'fulfillmentStatus',
    header: 'Fulfillment',
    cell: ({ row }) => (
      <OrderFulfillmentSelect
        orderId={row.original.id}
        initialStatus={row.original.fulfillmentStatus}
      />
    ),
  },
  {
    accessorKey: 'createdAt',
    header: 'Date',
  },
  {
    id: 'items',
    header: 'Items',
    cell: ({ row }) => <OrderItemsDialog order={row.original} />,
  },
  {
    id: 'open',
    header: '',
    cell: ({ row }) => (
      <Button asChild variant='outline' size='sm'>
        <Link href={`/orders/${row.original.id}`}>Open</Link>
      </Button>
    ),
  },
];
