import { getProductRows } from '@/lib/admin-data';

import { ProductClient } from './components/client';

export const dynamic = 'force-dynamic';

const ProductsPage = async () => {
  const formattedProducts = await getProductRows();

  return (
    <div className='flex-col'>
      <div className='flex-1 p-8 pt-6 space-y-4'>
        <ProductClient data={formattedProducts} />
      </div>
    </div>
  );
};

export default ProductsPage;
