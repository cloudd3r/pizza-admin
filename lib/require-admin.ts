import { NextResponse } from 'next/server';

import { getUserSession } from './get-user-session';

export const requireAdmin = async () => {
  const user = await getUserSession();

  if (!user) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  if (user.role !== 'ADMIN') {
    return new NextResponse('Forbidden', { status: 403 });
  }

  return null;
};
