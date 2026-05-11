import { getPromoRows } from '@/lib/admin-data';

import { PromoClient } from './components/client';

export const dynamic = 'force-dynamic';

const PromosPage = async () => {
  const formatted = await getPromoRows();

  return (
    <div className='flex-col'>
      <div className='flex-1 p-8 pt-6 space-y-4'>
        <PromoClient data={formatted} />
      </div>
    </div>
  );
};

export default PromosPage;
