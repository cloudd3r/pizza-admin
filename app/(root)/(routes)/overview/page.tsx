import { getOverviewCards } from '@/lib/admin-data';

export const dynamic = 'force-dynamic';

const OverviewPage = async () => {
  const cards = await getOverviewCards();

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
