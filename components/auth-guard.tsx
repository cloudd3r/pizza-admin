'use client';

import { getSession, useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { LoginForm } from './login-form';
import { LoadingScreen } from './loading-screen';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Fire-and-forget DB warm-up. Neon's free tier suspends compute after
  // ~5 min idle; the first query takes a few seconds to wake it back
  // up. Triggering it as soon as the app mounts (in parallel with
  // rendering the login form) means the actual login click is fast.
  useEffect(() => {
    fetch('/api/health/warmup', { cache: 'no-store' }).catch(() => {});
  }, []);

  const handleLoginFeedback = async (
    setIsModalOpen: (state: boolean) => void,
  ) => {
    const updatedSession = await getSession();

    if (updatedSession?.user.role === 'ADMIN') {
      setIsModalOpen(false);
      toast.success('Вы успешно вошли в аккаунт');
    } else {
      toast.error('Вы не админ');
    }
  };

  useEffect(() => {
    if (status === 'loading') return;
    if (!session || session.user.role !== 'ADMIN') {
      setIsModalOpen(true);
    } else {
      setIsModalOpen(false);
    }
  }, [session, status]);

  if (status === 'loading') {
    return <LoadingScreen />;
  }

  if (!session || session.user.role !== 'ADMIN') {
    return (
      <Dialog open={isModalOpen}>
        <DialogTitle />
        <DialogContent>
          <LoginForm
            onSuccess={() => {
              handleLoginFeedback(setIsModalOpen);
            }}
          />
        </DialogContent>
      </Dialog>
    );
  }

  return <>{children}</>;
}
