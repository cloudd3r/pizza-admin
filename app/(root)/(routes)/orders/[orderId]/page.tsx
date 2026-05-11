import { format } from 'date-fns';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { Heading } from '@/components/heading';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { prisma } from '@/prisma/prisma-client';

import { OrderStatusSelect } from '../components/order-status-select';

import { OrderItemColumn } from '../components/columns';

export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ orderId: string }> };

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

const OrderDetailPage = async ({ params }: Params) => {
  const { orderId } = await params;
  const numericId = Number(orderId);

  if (!Number.isInteger(numericId) || numericId <= 0) {
    notFound();
  }

  const order = await prisma.order.findUnique({
    where: { id: numericId },
  });

  if (!order) {
    notFound();
  }

  const items = parseOrderItems(order.items);

  return (
    <div className='flex-col'>
      <div className='flex-1 p-8 pt-6 space-y-6'>
        <div className='flex items-center justify-between'>
          <Heading
            title={`Order #${order.id}`}
            description={`Created ${format(
              order.createdAt,
              'MMMM do, yyyy HH:mm',
            )}`}
          />
          <Button asChild variant='outline'>
            <Link href='/orders'>
              <ArrowLeft className='w-4 h-4 mr-2' />
              Back to orders
            </Link>
          </Button>
        </div>
        <Separator />

        <div className='grid gap-4 md:grid-cols-2'>
          <div className='space-y-2 rounded-md border p-4'>
            <div className='text-sm font-medium text-muted-foreground'>
              Customer
            </div>
            <div className='text-base font-medium'>{order.fullName}</div>
            <div className='text-sm'>{order.email}</div>
            <div className='text-sm'>{order.phone}</div>
            <div className='pt-2 text-sm'>
              <span className='font-medium'>Address:</span> {order.address}
            </div>
            {order.comment ? (
              <div className='text-sm'>
                <span className='font-medium'>Comment:</span> {order.comment}
              </div>
            ) : null}
          </div>
          <div className='space-y-2 rounded-md border p-4'>
            <div className='flex items-center justify-between'>
              <div className='text-sm font-medium text-muted-foreground'>
                Payment status
              </div>
              <OrderStatusSelect
                orderId={order.id}
                initialStatus={order.status}
              />
            </div>
            <div className='text-sm'>
              <span className='font-medium'>Total:</span>{' '}
              {formatCurrency(order.totalAmount)}
            </div>
            <div className='text-sm break-all'>
              <span className='font-medium'>Payment id:</span>{' '}
              {order.paymentId ?? '—'}
            </div>
            <div className='text-sm'>
              <span className='font-medium'>Last updated:</span>{' '}
              {format(order.updatedAt, 'MMMM do, yyyy HH:mm')}
            </div>
          </div>
        </div>

        <div className='rounded-md border'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Variant</TableHead>
                <TableHead>Ingredients</TableHead>
                <TableHead>Qty</TableHead>
                <TableHead>Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length ? (
                items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className='font-medium'>{item.name}</TableCell>
                    <TableCell>{item.variant}</TableCell>
                    <TableCell>{item.ingredients}</TableCell>
                    <TableCell>{item.quantity}</TableCell>
                    <TableCell>{formatCurrency(item.total)}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className='h-24 text-center'>
                    No items.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailPage;
