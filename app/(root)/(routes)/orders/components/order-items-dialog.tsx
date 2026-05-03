'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import { OrderColumn } from './columns';

interface OrderItemsDialogProps {
  order: OrderColumn;
}

export const OrderItemsDialog: React.FC<OrderItemsDialogProps> = ({
  order,
}) => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant='outline' size='sm'>
          View ({order.items.length})
        </Button>
      </DialogTrigger>
      <DialogContent className='max-w-4xl'>
        <DialogHeader>
          <DialogTitle>Order #{order.id}</DialogTitle>
          <DialogDescription>
            {order.customer} · {order.totalAmount}
          </DialogDescription>
        </DialogHeader>
        <div className='space-y-4'>
          <div className='grid gap-2 text-sm md:grid-cols-2'>
            <div>
              <span className='font-medium'>Contacts:</span> {order.contacts}
            </div>
            <div>
              <span className='font-medium'>Payment:</span> {order.paymentId}
            </div>
            <div className='md:col-span-2'>
              <span className='font-medium'>Address:</span> {order.address}
            </div>
          </div>
          <div className='border rounded-md'>
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
                {order.items.length ? (
                  order.items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.name}</TableCell>
                      <TableCell>{item.variant}</TableCell>
                      <TableCell>{item.ingredients}</TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell>{item.total} ₽</TableCell>
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
      </DialogContent>
    </Dialog>
  );
};
