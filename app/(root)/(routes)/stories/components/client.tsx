'use client';

import { Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { Heading } from '@/components/heading';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { Separator } from '@/components/ui/separator';

import { columns, StoryColumn } from './columns';

interface StoryClientProps {
  data: StoryColumn[];
}

export const StoryClient: React.FC<StoryClientProps> = ({ data }) => {
  const router = useRouter();

  return (
    <>
      <div className='flex items-center justify-between'>
        <Heading
          title={`Stories (${data.length})`}
          description='Manage storefront stories carousel'
        />
        <Button onClick={() => router.push('/stories/new')}>
          <Plus className='w-4 h-4 mr-2' />
          Add New
        </Button>
      </div>
      <Separator />
      <DataTable columns={columns} data={data} searchKey='id' />
    </>
  );
};
