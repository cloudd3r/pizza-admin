'use client';

import { Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Button } from './ui/button';

const STAGES: ReadonlyArray<{ afterMs: number; text: string }> = [
  { afterMs: 0, text: '' },
  { afterMs: 2_000, text: 'Подключаемся к серверу…' },
  { afterMs: 5_000, text: 'База данных запускается, ещё несколько секунд…' },
  { afterMs: 15_000, text: 'Что-то затянулось.' },
];

const findStage = (elapsedMs: number) => {
  let current = STAGES[0];
  for (const stage of STAGES) {
    if (elapsedMs >= stage.afterMs) current = stage;
  }
  return current;
};

/**
 * Full-screen loading state with progressive messaging.
 *
 * Bare spinners feel broken when they take more than ~2 seconds. We
 * gradually surface what's happening so the user can tell whether to
 * wait or to retry. Used by `AuthGuard` while NextAuth resolves the
 * initial session, and as a fallback in `app/(root)/loading.tsx`.
 */
export function LoadingScreen({ minHeight = 'min-h-screen' }: { minHeight?: string }) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const startedAt = Date.now();
    const id = setInterval(() => setElapsed(Date.now() - startedAt), 250);
    return () => clearInterval(id);
  }, []);

  const stage = findStage(elapsed);
  const showReload = elapsed >= 15_000;

  return (
    <div className={`flex flex-col items-center justify-center gap-4 ${minHeight}`}>
      <Loader2 className='w-8 h-8 animate-spin text-muted-foreground' />
      {stage.text && (
        <p className='text-sm text-muted-foreground text-center px-4 max-w-xs'>
          {stage.text}
        </p>
      )}
      {showReload && (
        <Button
          variant='outline'
          size='sm'
          onClick={() => window.location.reload()}
        >
          Перезагрузить страницу
        </Button>
      )}
    </div>
  );
}
