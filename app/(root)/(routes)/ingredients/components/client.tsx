'use client';

import { Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { Heading } from '@/components/heading';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { Separator } from '@/components/ui/separator';

import { columns, IngredientColumn } from './columns';

interface IngredientClientProps {
  data: IngredientColumn[];
}

export const IngredientClient: React.FC<IngredientClientProps> = ({ data }) => {
  const router = useRouter();

  return (
    <>
      <div className='flex items-center justify-between'>
        <Heading
          title={`Ingredients (${data.length})`}
          description='Manage ingredients for your products'
        />
        <Button onClick={() => router.push('/ingredients/new')}>
          <Plus className='w-4 h-4 mr-2' />
          Add New
        </Button>
      </div>
      <Separator />
      <DataTable columns={columns} data={data} searchKey='name' />
    </>
  );
};
