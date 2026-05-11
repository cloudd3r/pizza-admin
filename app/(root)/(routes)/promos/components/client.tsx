'use client';

import { Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { Heading } from '@/components/heading';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { Separator } from '@/components/ui/separator';

import { columns, PromoColumn } from './columns';

interface PromoClientProps {
  data: PromoColumn[];
}

export const PromoClient: React.FC<PromoClientProps> = ({ data }) => {
  const router = useRouter();

  return (
    <>
      <div className='flex items-center justify-between'>
        <Heading
          title={`Промокоды (${data.length})`}
          description='Управление промокодами и скидками'
        />
        <Button onClick={() => router.push('/promos/new')}>
          <Plus className='w-4 h-4 mr-2' />
          Добавить
        </Button>
      </div>
      <Separator />
      <DataTable columns={columns} data={data} searchKey='code' />
    </>
  );
};
