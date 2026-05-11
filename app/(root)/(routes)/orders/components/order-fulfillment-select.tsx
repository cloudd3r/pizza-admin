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

import {
  FULFILLMENT_OPTIONS,
  type OrderFulfillmentStatus,
} from './order-fulfillment-options';

interface OrderFulfillmentSelectProps {
  orderId: number;
  initialStatus: OrderFulfillmentStatus;
  className?: string;
}

export const OrderFulfillmentSelect: React.FC<OrderFulfillmentSelectProps> = ({
  orderId,
  initialStatus,
  className,
}) => {
  const router = useRouter();
  const [status, setStatus] = useState<OrderFulfillmentStatus>(initialStatus);
  const [loading, setLoading] = useState(false);

  const onChange = async (value: OrderFulfillmentStatus) => {
    const previous = status;
    try {
      setStatus(value);
      setLoading(true);
      await axios.patch(`/api/orders/${orderId}`, { fulfillmentStatus: value });
      router.refresh();
      toast.success('Fulfillment status updated.');
    } catch {
      setStatus(previous);
      toast.error('Failed to update fulfillment status.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Select
      disabled={loading}
      value={status}
      onValueChange={(value) => onChange(value as OrderFulfillmentStatus)}
    >
      <SelectTrigger className={className ?? 'w-[160px]'}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {FULFILLMENT_OPTIONS.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
