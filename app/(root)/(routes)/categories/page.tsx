import { getCategoryRows } from '@/lib/admin-data';
import { CategoryClient } from './components/client';

export const dynamic = 'force-dynamic';

const CategoriesPage = async () => {
  const formattedCategories = await getCategoryRows();

  return (
    <div className='flex-col'>
      <div className='flex-1 p-8 pt-6 space-y-4'>
        <CategoryClient data={formattedCategories} />
      </div>
    </div>
  );
};

export default CategoriesPage;
