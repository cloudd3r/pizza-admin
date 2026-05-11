'use client';

import axios from 'axios';
import { Eye, EyeOff } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'react-hot-toast';

import { Button } from '@/components/ui/button';

interface ProductActiveToggleProps {
  productId: number;
  active: boolean;
}

export const ProductActiveToggle: React.FC<ProductActiveToggleProps> = ({
  productId,
  active,
}) => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [optimistic, setOptimistic] = useState(active);

  const toggle = async () => {
    if (loading) return;
    const next = !optimistic;
    setOptimistic(next);
    setLoading(true);
    try {
      await axios.patch(`/api/products/${productId}/active`, { active: next });
      router.refresh();
    } catch (err) {
      setOptimistic(!next);
      const msg =
        axios.isAxiosError(err) && err.response?.data?.message
          ? String(err.response.data.message)
          : 'Could not update visibility.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      type='button'
      variant={optimistic ? 'outline' : 'secondary'}
      size='sm'
      className='h-8 px-2'
      disabled={loading}
      onClick={toggle}
      aria-pressed={optimistic}
      aria-label={optimistic ? 'Hide product' : 'Show product'}
    >
      {optimistic ? (
        <>
          <Eye className='w-4 h-4 mr-1' />
          Active
        </>
      ) : (
        <>
          <EyeOff className='w-4 h-4 mr-1' />
          Hidden
        </>
      )}
    </Button>
  );
};
