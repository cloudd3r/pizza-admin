import { redirect } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { prisma } from '@/prisma/prisma-client';

import { Navbar } from '@/components/navbar';

interface DashboardType {
  children: React.ReactNode;
}

export default async function Dashboard({ children }: DashboardType) {
  const { data: session } = useSession();

  if (!session) {
    redirect('/');
  }

  const user = await prisma.user.findFirst({
    where: {
      role: 'ADMIN',
    },
  });

  if (!user) {
    return null;
  }

  if (user.role !== session.user.role) {
    redirect('/');
  }

  return (
    <>
      <Navbar />
      {children}
    </>
  );
}
