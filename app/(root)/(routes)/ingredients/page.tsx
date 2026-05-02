import { format } from 'date-fns';

import { prisma } from '@/prisma/prisma-client';

import { IngredientClient } from './components/client';
import { IngredientColumn } from './components/columns';

export const dynamic = 'force-dynamic';

const IngredientsPage = async () => {
  const ingredients = await prisma.ingredient.findMany({
    orderBy: { createdAt: 'desc' },
  });

  const formatted: IngredientColumn[] = ingredients.map((item) => ({
    id: item.id,
    name: item.name,
    price: item.price,
    imageUrl: item.imageUrl,
    createdAt: format(item.createdAt, 'MMMM do, yyyy'),
  }));

  return (
    <div className='flex-col'>
      <div className='flex-1 p-8 pt-6 space-y-4'>
        <IngredientClient data={formatted} />
      </div>
    </div>
  );
};

export default IngredientsPage;
