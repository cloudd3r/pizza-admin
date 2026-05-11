'use client';

import axios from 'axios';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import toast from 'react-hot-toast';

import { Button } from '@/components/ui/button';

interface OrderAdminNoteProps {
  orderId: number;
  initialNote: string | null;
}

export const OrderAdminNote: React.FC<OrderAdminNoteProps> = ({
  orderId,
  initialNote,
}) => {
  const router = useRouter();
  const [note, setNote] = useState(initialNote ?? '');
  const [saved, setSaved] = useState(initialNote ?? '');
  const [loading, setLoading] = useState(false);

  const dirty = note.trim() !== (saved ?? '').trim();

  const onSave = async () => {
    try {
      setLoading(true);
      await axios.patch(`/api/orders/${orderId}`, {
        adminNote: note.trim() ? note.trim() : null,
      });
      setSaved(note);
      router.refresh();
      toast.success('Note saved.');
    } catch {
      toast.error('Failed to save note.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='space-y-2'>
      <div className='text-sm font-medium text-muted-foreground'>
        Admin note
      </div>
      <textarea
        className='flex min-h-[96px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50'
        placeholder='Internal note for operators (not visible to customer)'
        value={note}
        onChange={(event) => setNote(event.target.value)}
        maxLength={2000}
        disabled={loading}
      />
      <div className='flex justify-end'>
        <Button
          type='button'
          size='sm'
          onClick={onSave}
          disabled={loading || !dirty}
        >
          {loading ? 'Saving…' : 'Save note'}
        </Button>
      </div>
    </div>
  );
};
