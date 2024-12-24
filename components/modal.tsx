'use client';

import React from 'react';
import { Dialog, DialogContent } from './ui/dialog';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  children?: React.ReactNode;
}

export const Modal: React.FC<Props> = ({ isOpen, onClose, children }) => {
  const onChange = (open: boolean) => {
    if (!open) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onChange}>
      <DialogContent>
        <div>{children}</div>
      </DialogContent>
    </Dialog>
  );
};
