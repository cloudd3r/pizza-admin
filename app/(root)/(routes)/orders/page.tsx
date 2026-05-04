import { getOrderRows } from '@/lib/admin-data';

import { OrderClient } from './components/client';

export const dynamic = 'force-dynamic';

const OrdersPage = async () => {
  const formattedOrders = await getOrderRows();

  return (
    <div className='flex-col'>
      <div className='flex-1 p-8 pt-6 space-y-4'>
        <OrderClient data={formattedOrders} />
      </div>
    </div>
  );
};

export default OrdersPage;
