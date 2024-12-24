'use client';

import React from 'react';

import { AuthModal } from './auth-modal';

export const ModalProvider: React.FC = () => {
  const [isMounted, setIsMounted] = React.useState(false);

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return null;
  }

  return <AuthModal />;
};
