'use client';

import { getSession, useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { LoginForm } from './login-form';
import toast from 'react-hot-toast';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleLoginFeedback = async (
    setIsModalOpen: (state: boolean) => void
  ) => {
    const updatedSession = await getSession();

    if (updatedSession?.user.role === 'ADMIN') {
      setIsModalOpen(false);
      toast.success('Вы успешно вошли в аккаунт', {
        icon: '✅',
      });
    } else {
      toast.error('Вы не админ', {
        icon: '❌',
      });
    }
  };

  useEffect(() => {
    if (status === 'loading') return; // Ждем проверки сессии
    if (!session || session.user.role !== 'ADMIN') {
      setIsModalOpen(true);
    } else {
      setIsModalOpen(false);
    }
  }, [session, status]);

  if (status === 'loading') {
    return <p>Loading...</p>; // Замените на скелетон, если нужно
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
