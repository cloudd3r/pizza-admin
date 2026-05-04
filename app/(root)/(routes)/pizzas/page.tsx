import { getPizzaRows } from '@/lib/admin-data';

import { ProductClient } from '../products/components/client';

export const dynamic = 'force-dynamic';

const PizzasPage = async () => {
  const formattedProducts = await getPizzaRows();

  return (
    <div className='flex-col'>
      <div className='flex-1 p-8 pt-6 space-y-4'>
        <ProductClient
          data={formattedProducts}
          title={`Pizzas (${formattedProducts.length})`}
          description='Manage pizza products and their size/type variants'
          newHref='/products/new'
        />
      </div>
    </div>
  );
};

export default PizzasPage;
