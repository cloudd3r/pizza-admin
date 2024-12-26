'use client';

import React from 'react';
import { Toaster } from 'react-hot-toast';
import { SessionProvider } from 'next-auth/react';
import NextTopLoader from 'nextjs-toploader';
import AuthGuard from './auth-guard';

export const Providers: React.FC<React.PropsWithChildren> = ({ children }) => {
  return (
    <>
      <SessionProvider>
        <AuthGuard>{children}</AuthGuard>
      </SessionProvider>
      <Toaster />
    </>
  );
};
