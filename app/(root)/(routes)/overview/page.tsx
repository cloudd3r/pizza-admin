import { prisma } from '@/prisma/prisma-client';

export const dynamic = 'force-dynamic';

const formatCurrency = (value: number) => `${value} ₽`;

const OverviewPage = async () => {
  const [
    categoriesCount,
    productsCount,
    ingredientsCount,
    orders,
    pendingOrdersCount,
    storiesCount,
  ] = await Promise.all([
    prisma.category.count(),
    prisma.product.count(),
    prisma.ingredient.count(),
    prisma.order.findMany({
      select: {
        totalAmount: true,
        status: true,
      },
    }),
    prisma.order.count({
      where: {
        status: 'PENDING',
      },
    }),
    prisma.story.count(),
  ]);

  const revenue = orders
    .filter((order) => order.status === 'SUCCEEDED')
    .reduce((sum, order) => sum + order.totalAmount, 0);

  const cards = [
    {
      label: 'Revenue',
      value: formatCurrency(revenue),
      description: 'Succeeded orders total',
    },
    {
      label: 'Orders',
      value: String(orders.length),
      description: `${pendingOrdersCount} pending`,
    },
    {
      label: 'Products',
      value: String(productsCount),
      description: `${categoriesCount} categories`,
    },
    {
      label: 'Ingredients',
      value: String(ingredientsCount),
      description: 'Available modifiers',
    },
    {
      label: 'Stories',
      value: String(storiesCount),
      description: 'Storefront carousel items',
    },
  ];

  return (
    <div className='flex-col'>
      <div className='flex-1 p-8 pt-6 space-y-6'>
        <div>
          <h1 className='text-3xl font-bold tracking-tight'>Overview</h1>
          <p className='text-sm text-muted-foreground'>
            Quick summary of storefront content and orders.
          </p>
        </div>
        <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
          {cards.map((card) => (
            <div key={card.label} className='rounded-lg border p-6 shadow-sm'>
              <p className='text-sm font-medium text-muted-foreground'>
                {card.label}
              </p>
              <div className='mt-2 text-3xl font-bold'>{card.value}</div>
              <p className='mt-1 text-xs text-muted-foreground'>
                {card.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default OverviewPage;
