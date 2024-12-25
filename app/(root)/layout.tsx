import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth/next';
import { prisma } from '@/prisma/prisma-client';

import { Navbar } from '@/components/navbar';
import { authOptions } from '@/constants/auth-options';

interface DashboardType {
  children: React.ReactNode;
}

export default async function Dashboard({ children }: DashboardType) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/');
  }

  const user = await prisma.user.findFirst({
    where: {
      role: 'ADMIN',
    },
  });

  if (!user || user.role !== session.user.role) {
    redirect('/');
  }

  return (
    <>
      <Navbar />
      {children}
    </>
  );
}
