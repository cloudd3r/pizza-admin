import { prisma } from '@/prisma/prisma-client';

import { ProductForm } from './components/product-form';

const EditProductPage = async ({
  params,
}: {
  params: Promise<{ productId: string }>;
}) => {
  const { productId } = await params;

  const product =
    productId === 'new'
      ? null
      : await prisma.product.findUnique({
          where: { id: Number(productId) },
          include: {
            items: {
              orderBy: [{ pizzaType: 'asc' }, { size: 'asc' }, { price: 'asc' }],
            },
            ingredients: true,
          },
        });

  if (productId !== 'new' && !product) {
    return <div>Product not found</div>;
  }

  const [categories, ingredients] = await Promise.all([
    prisma.category.findMany({
      orderBy: { name: 'asc' },
    }),
    prisma.ingredient.findMany({
      orderBy: { name: 'asc' },
    }),
  ]);

  return (
    <div className='flex-col'>
      <div className='flex-1 p-8 pt-6 space-y-4'>
        <ProductForm
          initialData={product}
          categories={categories}
          ingredients={ingredients}
        />
      </div>
    </div>
  );
};

export default EditProductPage;
