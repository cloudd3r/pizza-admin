'use client';

import axios from 'axios';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'react-hot-toast';

import { Button } from '@/components/ui/button';

interface RowReorderControlsProps {
  id: number;
  endpoint: string;
}

export const RowReorderControls: React.FC<RowReorderControlsProps> = ({
  id,
  endpoint,
}) => {
  const router = useRouter();
  const [loading, setLoading] = useState<'up' | 'down' | null>(null);

  const move = async (direction: 'up' | 'down') => {
    if (loading) return;
    setLoading(direction);
    try {
      const res = await axios.post(`${endpoint}/${id}/move`, { direction });
      if (res.data?.moved === false && res.data?.reason === 'edge') {
        toast(direction === 'up' ? 'Already first' : 'Already last');
      } else {
        router.refresh();
      }
    } catch (err) {
      const msg =
        axios.isAxiosError(err) && err.response?.data?.message
          ? String(err.response.data.message)
          : 'Could not reorder.';
      toast.error(msg);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className='flex items-center gap-1'>
      <Button
        type='button'
        variant='ghost'
        size='sm'
        className='w-7 h-7 p-0'
        disabled={loading !== null}
        onClick={() => move('up')}
        aria-label='Move up'
      >
        <ChevronUp className='w-4 h-4' />
      </Button>
      <Button
        type='button'
        variant='ghost'
        size='sm'
        className='w-7 h-7 p-0'
        disabled={loading !== null}
        onClick={() => move('down')}
        aria-label='Move down'
      >
        <ChevronDown className='w-4 h-4' />
      </Button>
    </div>
  );
};
