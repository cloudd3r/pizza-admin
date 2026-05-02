'use client';

import { getSession, useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { Loader } from 'lucide-react';
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
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <Loader className='w-8 h-8 animate-spin text-muted-foreground' />
      </div>
    );
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
