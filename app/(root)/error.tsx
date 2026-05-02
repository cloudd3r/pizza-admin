'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className='flex flex-col items-center justify-center min-h-[60vh] gap-4 p-8 text-center'>
      <h2 className='text-2xl font-semibold'>Что-то пошло не так</h2>
      <p className='text-muted-foreground max-w-md break-words'>
        {error.message || 'Произошла непредвиденная ошибка'}
      </p>
      <Button onClick={() => reset()}>Попробовать снова</Button>
    </div>
  );
}
