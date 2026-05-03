import { format } from 'date-fns';

import { prisma } from '@/prisma/prisma-client';

import { ProductClient } from './components/client';
import { ProductColumn } from './components/columns';

export const dynamic = 'force-dynamic';

const formatPriceRange = (prices: number[]) => {
  if (prices.length === 0) return '—';

  const min = Math.min(...prices);
  const max = Math.max(...prices);

  return min === max ? `${min} ₽` : `${min}–${max} ₽`;
};

const ProductsPage = async () => {
  const products = await prisma.product.findMany({
    include: {
      category: true,
      ingredients: true,
      items: {
        orderBy: { price: 'asc' },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  const formattedProducts: ProductColumn[] = products.map((item) => ({
    id: item.id,
    name: item.name,
    category: item.category.name,
    imageUrl: item.imageUrl,
    price: formatPriceRange(item.items.map((productItem) => productItem.price)),
    variantsCount: item.items.length,
    ingredientsCount: item.ingredients.length,
    isPizza: item.items.some((productItem) => productItem.pizzaType),
    createdAt: format(item.createdAt, 'MMMM do, yyyy'),
  }));

  return (
    <div className='flex-col'>
      <div className='flex-1 p-8 pt-6 space-y-4'>
        <ProductClient data={formattedProducts} />
      </div>
    </div>
  );
};

export default ProductsPage;
