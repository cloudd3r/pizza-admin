import { getIngredientRows } from '@/lib/admin-data';

import { IngredientClient } from './components/client';

export const dynamic = 'force-dynamic';

const IngredientsPage = async () => {
  const formatted = await getIngredientRows();

  return (
    <div className='flex-col'>
      <div className='flex-1 p-8 pt-6 space-y-4'>
        <IngredientClient data={formatted} />
      </div>
    </div>
  );
};

export default IngredientsPage;
