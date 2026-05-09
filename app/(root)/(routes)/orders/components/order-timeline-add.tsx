'use client';

import axios from 'axios';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import toast from 'react-hot-toast';

import { Button } from '@/components/ui/button';

interface OrderTimelineAddProps {
  orderId: number;
}

export const OrderTimelineAdd: React.FC<OrderTimelineAddProps> = ({
  orderId,
}) => {
  const router = useRouter();
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    const trimmed = message.trim();
    if (!trimmed) {
      toast.error('Message is required.');
      return;
    }

    try {
      setLoading(true);
      await axios.post(`/api/orders/${orderId}/events`, {
        kind: 'NOTE',
        message: trimmed,
      });
      setMessage('');
      router.refresh();
      toast.success('Comment added.');
    } catch {
      toast.error('Failed to add comment.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='space-y-2'>
      <div className='text-sm font-medium text-muted-foreground'>
        Add timeline comment
      </div>
      <textarea
        className='flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50'
        placeholder='Operator comment (visible only in admin)'
        value={message}
        onChange={(event) => setMessage(event.target.value)}
        maxLength={2000}
        disabled={loading}
      />
      <div className='flex justify-end'>
        <Button
          type='button'
          size='sm'
          onClick={onSubmit}
          disabled={loading || !message.trim()}
        >
          {loading ? 'Posting…' : 'Add comment'}
        </Button>
      </div>
    </div>
  );
};
