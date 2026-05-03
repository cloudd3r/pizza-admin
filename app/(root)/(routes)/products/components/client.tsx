'use client';

import { Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { Heading } from '@/components/heading';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { Separator } from '@/components/ui/separator';

import { columns, ProductColumn } from './columns';

interface ProductClientProps {
  data: ProductColumn[];
  title?: string;
  description?: string;
  newHref?: string;
}

export const ProductClient: React.FC<ProductClientProps> = ({
  data,
  title = `Products (${data.length})`,
  description = 'Manage products and pizzas shown on the storefront',
  newHref = '/products/new',
}) => {
  const router = useRouter();

  return (
    <>
      <div className='flex items-center justify-between'>
        <Heading
          title={title}
          description={description}
        />
        <Button onClick={() => router.push(newHref)}>
          <Plus className='w-4 h-4 mr-2' />
          Add New
        </Button>
      </div>
      <Separator />
      <DataTable columns={columns} data={data} searchKey='name' />
    </>
  );
};
