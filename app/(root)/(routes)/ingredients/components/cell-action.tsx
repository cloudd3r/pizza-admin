'use client';

import axios from 'axios';
import { Copy, Edit, MoreHorizontal, Trash } from 'lucide-react';
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

import { IngredientColumn } from './columns';

interface CellActionProps {
  data: IngredientColumn;
}

export const CellAction: React.FC<CellActionProps> = ({ data }) => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const onCopy = (id: string) => {
    navigator.clipboard.writeText(id);
    toast.success('Ingredient Id copied to the clipboard.');
  };

  const onDelete = async () => {
    try {
      setLoading(true);
      await axios.delete(`/api/ingredients/${data.id}`);
      router.refresh();
      toast.success('Ingredient deleted successfully.');
    } catch {
      toast.error(
        'Make sure no products reference this ingredient before deleting.',
      );
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
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuItem onClick={() => onCopy(String(data.id))}>
            <Copy className='w-4 h-4 mr-2' />
            Copy Id
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => router.push(`/ingredients/${data.id}`)}
          >
            <Edit className='w-4 h-4 mr-2' />
            Update
          </DropdownMenuItem>
          <DropdownMenuItem
            className='text-red-500'
            onClick={() => setOpen(true)}
          >
            <Trash className='w-4 h-4 mr-2' />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};
