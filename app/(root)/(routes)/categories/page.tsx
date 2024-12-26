import { prisma } from '@/prisma/prisma-client';
import { format } from 'date-fns';

import { CategoryColumn } from './components/columns';
import { CategoryClient } from './components/client';

const CategoriesPage = async () => {
  const categories = await prisma.category.findMany({
    orderBy: {
      createdAt: 'desc',
    },
  });

  const formattedCategories: CategoryColumn[] = categories.map((item) => ({
    id: item.id,
    name: item.name,
    createdAt: format(item.createdAt, 'MMMM do, yyyy'),
  }));

  return (
    <div className='flex-col'>
      <div className='flex-1 p-8 pt-6 space-y-4'>
        <CategoryClient data={formattedCategories} />
      </div>
    </div>
  );
};

export default CategoriesPage;
