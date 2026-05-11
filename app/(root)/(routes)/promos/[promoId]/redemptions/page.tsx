import { format } from 'date-fns';
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
import {
  getPromo,
  listPromoRedemptions,
  parsePromoId,
} from '@/lib/promo-admin-service';

export const dynamic = 'force-dynamic';

const PromoRedemptionsPage = async ({
  params,
}: {
  params: Promise<{ promoId: string }>;
}) => {
  const { promoId } = await params;
  const id = parsePromoId(promoId);

  if (!id) notFound();

  const [promo, redemptions] = await Promise.all([
    getPromo(id),
    listPromoRedemptions(id),
  ]);

  if (!promo) notFound();

  const totalDiscount = redemptions.reduce(
    (sum, item) => sum + item.appliedAmount,
    0,
  );

  return (
    <div className='flex-col'>
      <div className='flex-1 p-8 pt-6 space-y-4'>
        <div className='flex items-center justify-between'>
          <Heading
            title={`Использования — ${promo.code}`}
            description={`Всего активаций: ${redemptions.length}, суммарная скидка ${totalDiscount} ₽`}
          />
          <Button asChild variant='outline'>
            <Link href='/promos'>← К списку</Link>
          </Button>
        </div>
        <Separator />

        {redemptions.length === 0 ? (
          <div className='rounded-md border p-6 text-sm text-muted-foreground'>
            Этот промокод ещё ни разу не использовался.
          </div>
        ) : (
          <div className='rounded-md border'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Заказ</TableHead>
                  <TableHead>Клиент</TableHead>
                  <TableHead>Контакты</TableHead>
                  <TableHead className='text-right'>Скидка</TableHead>
                  <TableHead className='text-right'>Итого заказа</TableHead>
                  <TableHead>Статус оплаты</TableHead>
                  <TableHead>Когда</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {redemptions.map((redemption) => (
                  <TableRow key={redemption.id}>
                    <TableCell>
                      <Link
                        href={`/orders/${redemption.order.id}`}
                        className='font-medium text-primary hover:underline'
                      >
                        #{redemption.order.id}
                      </Link>
                    </TableCell>
                    <TableCell>
                      {redemption.user?.fullName ?? redemption.order.fullName}
                    </TableCell>
                    <TableCell className='text-sm text-muted-foreground'>
                      {redemption.order.email}
                      <br />
                      {redemption.order.phone}
                    </TableCell>
                    <TableCell className='text-right tabular-nums'>
                      −{redemption.appliedAmount} ₽
                    </TableCell>
                    <TableCell className='text-right tabular-nums'>
                      {redemption.order.totalAmount} ₽
                    </TableCell>
                    <TableCell>{redemption.order.status}</TableCell>
                    <TableCell className='text-sm text-muted-foreground'>
                      {format(redemption.createdAt, 'dd.MM.yyyy HH:mm')}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
};

export default PromoRedemptionsPage;
