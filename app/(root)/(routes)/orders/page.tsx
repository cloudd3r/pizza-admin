import { format } from 'date-fns';

import { prisma } from '@/prisma/prisma-client';

import { OrderClient } from './components/client';
import { OrderColumn, OrderItemColumn } from './components/columns';

export const dynamic = 'force-dynamic';

type StoredOrderItem = {
  id?: number;
  quantity?: number;
  productItem?: {
    price?: number;
    size?: number | null;
    pizzaType?: number | null;
    product?: {
      name?: string;
    };
  };
  ingredients?: Array<{
    name?: string;
    price?: number;
  }>;
};

const formatCurrency = (value: number) => `${value} ₽`;

const parseOrderItems = (items: unknown): OrderItemColumn[] => {
  try {
    const parsed = (
      typeof items === 'string' ? JSON.parse(items) : items
    ) as StoredOrderItem[];

    if (!Array.isArray(parsed)) return [];

    return parsed.map((item, index) => {
      const price = Number(item.productItem?.price) || 0;
      const quantity = Number(item.quantity) || 0;
      const ingredients = item.ingredients ?? [];
      const ingredientsTotal = ingredients.reduce(
        (sum, ingredient) => sum + (Number(ingredient.price) || 0),
        0,
      );
      const variant = [
        item.productItem?.size ? `${item.productItem.size} см` : null,
        item.productItem?.pizzaType ? `тип ${item.productItem.pizzaType}` : null,
      ]
        .filter(Boolean)
        .join(', ');

      return {
        id: item.id ?? index,
        name: item.productItem?.product?.name ?? 'Unknown product',
        price,
        quantity,
        total: (price + ingredientsTotal) * quantity,
        variant: variant || '—',
        ingredients:
          ingredients
            .map((ingredient) => ingredient.name)
            .filter(Boolean)
            .join(', ') || '—',
      };
    });
  } catch {
    return [];
  }
};

const OrdersPage = async () => {
  const orders = await prisma.order.findMany({
    orderBy: {
      createdAt: 'desc',
    },
  });

  const formattedOrders: OrderColumn[] = orders.map((order) => ({
    id: order.id,
    customer: order.fullName,
    contacts: `${order.email} · ${order.phone}`,
    address: order.address,
    totalAmount: formatCurrency(order.totalAmount),
    status: order.status,
    paymentId: order.paymentId ?? '—',
    items: parseOrderItems(order.items),
    createdAt: format(order.createdAt, 'MMMM do, yyyy'),
  }));

  return (
    <div className='flex-col'>
      <div className='flex-1 p-8 pt-6 space-y-4'>
        <OrderClient data={formattedOrders} />
      </div>
    </div>
  );
};

export default OrdersPage;
