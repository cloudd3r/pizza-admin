'use client';

import { Heading } from '@/components/heading';
import { DataTable } from '@/components/ui/data-table';
import { Separator } from '@/components/ui/separator';

import { columns, OrderColumn } from './columns';

interface OrderClientProps {
  data: OrderColumn[];
}

export const OrderClient: React.FC<OrderClientProps> = ({ data }) => {
  return (
    <>
      <Heading
        title={`Orders (${data.length})`}
        description='Manage customer orders and payment statuses'
      />
      <Separator />
      <DataTable columns={columns} data={data} searchKey='customer' />
    </>
  );
};
