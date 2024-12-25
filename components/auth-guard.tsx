'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { LoginForm } from './login-form';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);

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
        <DialogTitle>Login</DialogTitle>
        <DialogContent>
          <LoginForm
            onSuccess={() => {
              // Ждем обновления сессии
              setTimeout(() => {
                if (session?.user.role === 'ADMIN') {
                  setIsModalOpen(false);
                } else {
                  router.push('/'); // Redirect to the main site
                }
              }, 100); // Небольшая задержка для обновления сессии
            }}
          />
        </DialogContent>
      </Dialog>
    );
  }

  return <>{children}</>;
}
