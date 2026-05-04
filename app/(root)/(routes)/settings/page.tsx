import { getServerSession } from 'next-auth';

import { Heading } from '@/components/heading';
import { Separator } from '@/components/ui/separator';
import { authOptions } from '@/constants/auth-options';
import { prisma } from '@/prisma/prisma-client';

export const dynamic = 'force-dynamic';

const envStatus = [
  {
    name: 'POSTGRES_URL',
    value: Boolean(process.env.POSTGRES_URL),
  },
  {
    name: 'POSTGRES_URL_NON_POOLING',
    value: Boolean(process.env.POSTGRES_URL_NON_POOLING),
  },
  {
    name: 'NEXTAUTH_SECRET',
    value: Boolean(process.env.NEXTAUTH_SECRET),
  },
  {
    name: 'NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME',
    value: Boolean(process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME),
  },
  {
    name: 'NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET',
    value: Boolean(process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET),
  },
];

const SettingsPage = async () => {
  const session = await getServerSession(authOptions);
  const adminUsers = await prisma.user.findMany({
    where: {
      role: 'ADMIN',
    },
    orderBy: {
      createdAt: 'asc',
    },
  });

  return (
    <div className='flex-col'>
      <div className='flex-1 p-8 pt-6 space-y-6'>
        <Heading
          title='Settings'
          description='Admin account and environment diagnostics'
        />
        <Separator />
        <div className='grid gap-4 lg:grid-cols-2'>
          <div className='rounded-lg border p-6 shadow-sm'>
            <h2 className='text-lg font-semibold'>Current session</h2>
            <div className='mt-4 space-y-2 text-sm'>
              <p>
                <span className='font-medium'>Email:</span>{' '}
                {session?.user?.email ?? '—'}
              </p>
              <p>
                <span className='font-medium'>Role:</span>{' '}
                {session?.user?.role ?? '—'}
              </p>
            </div>
          </div>
          <div className='rounded-lg border p-6 shadow-sm'>
            <h2 className='text-lg font-semibold'>Environment</h2>
            <div className='mt-4 space-y-2 text-sm'>
              {envStatus.map((item) => (
                <div key={item.name} className='flex justify-between gap-4'>
                  <span>{item.name}</span>
                  <span className={item.value ? 'text-green-600' : 'text-red-600'}>
                    {item.value ? 'Configured' : 'Missing'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className='rounded-lg border p-6 shadow-sm'>
          <h2 className='text-lg font-semibold'>Admin users</h2>
          <div className='mt-4 divide-y text-sm'>
            {adminUsers.map((user) => (
              <div key={user.id} className='flex justify-between py-3'>
                <div>
                  <div className='font-medium'>{user.fullName}</div>
                  <div className='text-muted-foreground'>{user.email}</div>
                </div>
                <div className='text-muted-foreground'>#{user.id}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
