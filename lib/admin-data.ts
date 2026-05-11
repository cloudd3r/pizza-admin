import { format } from 'date-fns';

import { prisma } from '@/prisma/prisma-client';

import { cachedAdminData } from './admin-data-cache';
import type { CategoryColumn } from '@/app/(root)/(routes)/categories/components/columns';
import type { IngredientColumn } from '@/app/(root)/(routes)/ingredients/components/columns';
import type { OrderColumn, OrderItemColumn } from '@/app/(root)/(routes)/orders/components/columns';
import type { ProductColumn } from '@/app/(root)/(routes)/products/components/columns';
import type { StoryColumn } from '@/app/(root)/(routes)/stories/components/columns';

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

const formatDate = (value: Date) => format(value, 'MMMM do, yyyy');

const formatCurrency = (value: number) => `${value} ₽`;

const formatPriceRange = (prices: number[]) => {
  if (prices.length === 0) return '—';

  const min = Math.min(...prices);
  const max = Math.max(...prices);

  return min === max ? `${min} ₽` : `${min}–${max} ₽`;
};

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

export const getCategoryRows = () =>
  cachedAdminData<CategoryColumn[]>('categories:rows', async () => {
    const categories = await prisma.category.findMany({
      orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
    });

    return categories.map((item) => ({
      id: item.id,
      name: item.name,
      sortOrder: item.sortOrder,
      createdAt: formatDate(item.createdAt),
    }));
  });

export const getProductRecords = () =>
  cachedAdminData('products:records', () =>
    prisma.product.findMany({
      include: {
        category: true,
        ingredients: true,
        items: {
          orderBy: { price: 'asc' },
        },
      },
      orderBy: [
        { category: { sortOrder: 'asc' } },
        { sortOrder: 'asc' },
        { id: 'asc' },
      ],
    }),
  );

const productToRow = (item: Awaited<ReturnType<typeof getProductRecords>>[number]): ProductColumn => ({
  id: item.id,
  name: item.name,
  category: item.category.name,
  imageUrl: item.imageUrl,
  price: formatPriceRange(item.items.map((productItem) => productItem.price)),
  variantsCount: item.items.length,
  ingredientsCount: item.ingredients.length,
  isPizza: item.items.some((productItem) => productItem.pizzaType),
  active: item.active,
  sortOrder: item.sortOrder,
  stopUntil: item.stopUntil ? item.stopUntil.toISOString() : null,
  badges: item.badges ?? [],
  createdAt: formatDate(item.createdAt),
});

export const getProductRows = async () => {
  const products = await getProductRecords();
  return products.map(productToRow);
};

export const getPizzaRows = async () => {
  const products = await getProductRecords();
  return products
    .filter((product) =>
      product.items.some((productItem) => productItem.pizzaType !== null),
    )
    .map((product) => ({
      ...productToRow(product),
      isPizza: true,
    }));
};

export const getIngredientRows = () =>
  cachedAdminData<IngredientColumn[]>('ingredients:rows', async () => {
    const ingredients = await prisma.ingredient.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return ingredients.map((item) => ({
      id: item.id,
      name: item.name,
      price: item.price,
      imageUrl: item.imageUrl,
      createdAt: formatDate(item.createdAt),
    }));
  });

export const getOrderRecords = () =>
  cachedAdminData('orders:records', () =>
    prisma.order.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    }),
  );

export const getOrderRows = async () => {
  const orders = await getOrderRecords();

  return orders.map<OrderColumn>((order) => ({
    id: order.id,
    customer: order.fullName,
    email: order.email,
    phone: order.phone,
    contacts: `${order.email} · ${order.phone}`,
    address: order.address,
    totalAmount: formatCurrency(order.totalAmount),
    totalAmountValue: order.totalAmount,
    status: order.status,
    fulfillmentStatus: order.fulfillmentStatus,
    paymentId: order.paymentId ?? '—',
    items: parseOrderItems(order.items),
    createdAt: formatDate(order.createdAt),
    createdAtIso: order.createdAt.toISOString(),
  }));
};

export const getStoryRows = () =>
  cachedAdminData<StoryColumn[]>('stories:rows', async () => {
    const stories = await prisma.story.findMany({
      include: {
        items: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return stories.map((story) => ({
      id: story.id,
      previewImageUrl: story.previewImageUrl,
      itemsCount: story.items.length,
      createdAt: formatDate(story.createdAt),
    }));
  });

export const getOverviewCards = async () => {
  const [categories, products, ingredients, orders, stories] = await Promise.all([
    getCategoryRows(),
    getProductRows(),
    getIngredientRows(),
    getOrderRecords(),
    getStoryRows(),
  ]);

  const pendingOrdersCount = orders.filter(
    (order) => order.status === 'PENDING',
  ).length;
  const revenue = orders
    .filter((order) => order.status === 'SUCCEEDED')
    .reduce((sum, order) => sum + order.totalAmount, 0);

  const inProgressCount = orders.filter((order) =>
    ['CONFIRMED', 'COOKING', 'READY'].includes(order.fulfillmentStatus),
  ).length;
  const deliveringCount = orders.filter(
    (order) => order.fulfillmentStatus === 'DELIVERING',
  ).length;

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const deliveredTodayCount = orders.filter(
    (order) =>
      order.fulfillmentStatus === 'DELIVERED' &&
      order.updatedAt.getTime() >= startOfDay.getTime(),
  ).length;

  return [
    {
      label: 'Revenue',
      value: formatCurrency(revenue),
      description: 'Succeeded orders total',
    },
    {
      label: 'Orders',
      value: String(orders.length),
      description: `${pendingOrdersCount} pending payment`,
    },
    {
      label: 'In progress',
      value: String(inProgressCount),
      description: 'Confirmed / Cooking / Ready',
    },
    {
      label: 'Delivering',
      value: String(deliveringCount),
      description: `${deliveredTodayCount} delivered today`,
    },
    {
      label: 'Products',
      value: String(products.length),
      description: `${categories.length} categories`,
    },
    {
      label: 'Ingredients',
      value: String(ingredients.length),
      description: 'Available modifiers',
    },
    {
      label: 'Stories',
      value: String(stories.length),
      description: 'Storefront carousel items',
    },
  ];
};
