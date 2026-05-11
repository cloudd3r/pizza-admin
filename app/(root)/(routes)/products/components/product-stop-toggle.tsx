'use client';

import axios from 'axios';
import { Clock, Hourglass } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'react-hot-toast';

import { Button } from '@/components/ui/button';

interface ProductStopToggleProps {
  productId: number;
  stopUntilIso: string | null;
}

const formatRemaining = (untilIso: string) => {
  const until = new Date(untilIso).getTime();
  const diffMs = until - Date.now();
  if (diffMs <= 0) return null;
  const minutes = Math.round(diffMs / 60000);
  if (minutes < 60) return `${minutes} мин`;
  const hours = Math.round(minutes / 60);
  if (hours < 48) return `${hours} ч`;
  const days = Math.round(hours / 24);
  return `${days} дн`;
};

export const ProductStopToggle: React.FC<ProductStopToggleProps> = ({
  productId,
  stopUntilIso,
}) => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [current, setCurrent] = useState<string | null>(stopUntilIso);

  const inStop = current ? new Date(current).getTime() > Date.now() : false;
  const remaining = current ? formatRemaining(current) : null;

  const setStop = async (durationMinutes: number | null) => {
    if (loading) return;
    setLoading(true);
    try {
      const body =
        durationMinutes === null ? { stopUntil: null } : { durationMinutes };
      const { data } = await axios.post(
        `/api/products/${productId}/stop`,
        body,
      );
      setCurrent(data?.stopUntil ?? null);
      toast.success(durationMinutes === null ? 'Снято со стопа' : 'В стопе');
      router.refresh();
    } catch (error) {
      const message =
        (axios.isAxiosError(error) && error.response?.data?.message) ||
        'Не получилось обновить стоп-лист';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  if (!inStop) {
    return (
      <Button
        type='button'
        variant='ghost'
        size='sm'
        disabled={loading}
        onClick={() => setStop(60)}
        title='В стоп на 60 минут'
        aria-label='Поставить в стоп-лист'
      >
        <Clock className='h-4 w-4 mr-1' />
        Стоп
      </Button>
    );
  }

  return (
    <div className='flex items-center gap-2'>
      <span className='inline-flex items-center gap-1 rounded bg-amber-100 px-2 py-0.5 text-xs text-amber-900'>
        <Hourglass className='h-3 w-3' />
        {remaining ?? 'до выкл.'}
      </span>
      <Button
        type='button'
        variant='outline'
        size='sm'
        disabled={loading}
        onClick={() => setStop(null)}
      >
        Снять
      </Button>
    </div>
  );
};
