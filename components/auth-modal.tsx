'use client';

import React from 'react';
import { useStoreModal } from './hooks/use-store-modal';

import { LoginForm } from './login-form';
import { Modal } from './modal';

export const AuthModal: React.FC = () => {
  const storeModal = useStoreModal();

  return (
    <Modal isOpen={storeModal.isOpen} onClose={storeModal.onClose}>
      <LoginForm />
    </Modal>
  );
};
