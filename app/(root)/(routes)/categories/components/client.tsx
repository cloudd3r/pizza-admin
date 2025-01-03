'use client';

import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { CategoryColumn, columns } from './columns';
// import { ApiList } from "@/components/ui/api-list"
import { Heading } from '@/components/heading';
import { Separator } from '@/components/ui/separator';
import { DataTable } from '@/components/ui/data-table';

interface CategoryClientProps {
  data: CategoryColumn[];
}

export const CategoryClient: React.FC<CategoryClientProps> = ({ data }) => {
  const router = useRouter();
  return (
    <>
      <div className='flex items-center justify-between'>
        <Heading
          title={`Categories (${data?.length})`}
          description='Manage categories for your store'
        />
        <Button onClick={() => router.push(`/categories/new`)}>
          <Plus className='w-4 h-4 mr-2' />
          Add New
        </Button>
      </div>
      <Separator />
      <DataTable columns={columns} data={data} searchKey='name' />
      <Heading title='API' description='API calls for Categories' />
      {/* <Separator /> */}
      {/* <ApiList entityName="categories" entityIdName="categoryId" /> */}
    </>
  );
};
