'use client';

import { ColumnDef } from '@tanstack/react-table';

import { OrderStatusSelect } from './order-status-select';
import { OrderItemsDialog } from './order-items-dialog';

export type OrderItemColumn = {
  id: number;
  name: string;
  price: number;
  quantity: number;
  total: number;
  variant: string;
  ingredients: string;
};

export type OrderColumn = {
  id: number;
  customer: string;
  contacts: string;
  address: string;
  totalAmount: string;
  status: 'PENDING' | 'SUCCEEDED' | 'CANCELLED';
  paymentId: string;
  items: OrderItemColumn[];
  createdAt: string;
};

export const columns: ColumnDef<OrderColumn>[] = [
  {
    accessorKey: 'id',
    header: 'Order',
    cell: ({ row }) => `#${row.original.id}`,
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
    header: 'Status',
    cell: ({ row }) => (
      <OrderStatusSelect
        orderId={row.original.id}
        initialStatus={row.original.status}
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
];
