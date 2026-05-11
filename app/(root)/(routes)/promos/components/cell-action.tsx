'use client';

import axios from 'axios';
import { Copy, Edit, MoreHorizontal, Receipt, Trash } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'react-hot-toast';

import { AlertModal } from '@/components/modals/alert-modal';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import { PromoColumn } from './columns';

interface CellActionProps {
  data: PromoColumn;
}

export const CellAction: React.FC<CellActionProps> = ({ data }) => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const onCopy = () => {
    navigator.clipboard.writeText(data.code);
    toast.success('Промокод скопирован.');
  };

  const onDelete = async () => {
    try {
      setLoading(true);
      await axios.delete(`/api/promos/${data.id}`);
      router.refresh();
      toast.success('Промокод удалён.');
    } catch (err) {
      const message =
        axios.isAxiosError(err) && err.response?.status === 409
          ? err.response?.data?.message ??
            'Промокод уже использовался и не может быть удалён.'
          : 'Не удалось удалить промокод.';
      toast.error(message);
    } finally {
      setLoading(false);
      setOpen(false);
    }
  };

  return (
    <>
      <AlertModal
        isOpen={open}
        onClose={() => setOpen(false)}
        onConfirm={onDelete}
        loading={loading}
      />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant='ghost' className='w-8 h-8 p-0'>
            <span className='sr-only'>Open menu</span>
            <MoreHorizontal className='w-4 h-4' />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align='end'>
          <DropdownMenuLabel>Действия</DropdownMenuLabel>
          <DropdownMenuItem onClick={onCopy}>
            <Copy className='w-4 h-4 mr-2' />
            Копировать код
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => router.push(`/promos/${data.id}`)}
          >
            <Edit className='w-4 h-4 mr-2' />
            Редактировать
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => router.push(`/promos/${data.id}/redemptions`)}
          >
            <Receipt className='w-4 h-4 mr-2' />
            История использования
          </DropdownMenuItem>
          <DropdownMenuItem
            className='text-red-500'
            onClick={() => setOpen(true)}
          >
            <Trash className='w-4 h-4 mr-2' />
            Удалить
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};
