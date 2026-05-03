'use client';

import axios from 'axios';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import toast from 'react-hot-toast';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type OrderStatus = 'PENDING' | 'SUCCEEDED' | 'CANCELLED';

interface OrderStatusSelectProps {
  orderId: number;
  initialStatus: OrderStatus;
}

export const OrderStatusSelect: React.FC<OrderStatusSelectProps> = ({
  orderId,
  initialStatus,
}) => {
  const router = useRouter();
  const [status, setStatus] = useState<OrderStatus>(initialStatus);
  const [loading, setLoading] = useState(false);

  const onChange = async (value: OrderStatus) => {
    const previousStatus = status;

    try {
      setStatus(value);
      setLoading(true);
      await axios.patch(`/api/orders/${orderId}`, { status: value });
      router.refresh();
      toast.success('Order status updated.');
    } catch {
      setStatus(previousStatus);
      toast.error('Failed to update order status.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Select
      disabled={loading}
      value={status}
      onValueChange={(value) => onChange(value as OrderStatus)}
    >
      <SelectTrigger className='w-[140px]'>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value='PENDING'>Pending</SelectItem>
        <SelectItem value='SUCCEEDED'>Succeeded</SelectItem>
        <SelectItem value='CANCELLED'>Cancelled</SelectItem>
      </SelectContent>
    </Select>
  );
};
