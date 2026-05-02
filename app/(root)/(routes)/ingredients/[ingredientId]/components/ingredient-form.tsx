'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Ingredient } from '@prisma/client';
import axios from 'axios';
import { Trash } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import * as z from 'zod';

import { Heading } from '@/components/heading';
import { ImageUpload } from '@/components/image-upload';
import { AlertModal } from '@/components/modals/alert-modal';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';

interface IngredientFormProps {
  initialData: Ingredient | null;
}

const formSchema = z.object({
  name: z.string().min(1, 'Введите название'),
  price: z.coerce
    .number({ invalid_type_error: 'Цена должна быть числом' })
    .int('Цена должна быть целым числом')
    .min(0, 'Цена не может быть отрицательной'),
  imageUrl: z.string().url('Загрузите изображение'),
});

type IngredientFormValues = z.infer<typeof formSchema>;

export const IngredientForm: React.FC<IngredientFormProps> = ({
  initialData,
}) => {
  const params = useParams();
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const title = initialData ? 'Edit ingredient' : 'Create ingredient';
  const description = initialData
    ? 'Edit an ingredient'
    : 'Add a new ingredient';
  const toastMessage = initialData
    ? 'Ingredient updated.'
    : 'Ingredient created.';
  const action = initialData ? 'Save changes' : 'Create';

  const form = useForm<IngredientFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData
      ? {
          name: initialData.name,
          price: initialData.price,
          imageUrl: initialData.imageUrl,
        }
      : {
          name: '',
          price: 0,
          imageUrl: '',
        },
  });

  const onSubmit = async (data: IngredientFormValues) => {
    try {
      setLoading(true);
      if (initialData) {
        await axios.patch(`/api/ingredients/${params.ingredientId}`, data);
      } else {
        await axios.post('/api/ingredients', data);
      }
      router.refresh();
      router.push('/ingredients');
      toast.success(toastMessage);
    } catch {
      toast.error('Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  const onDelete = async () => {
    try {
      setLoading(true);
      await axios.delete(`/api/ingredients/${params.ingredientId}`);
      router.refresh();
      router.push('/ingredients');
      toast.success('Ingredient deleted.');
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
      <div className='flex items-center justify-between'>
        <Heading title={title} description={description} />
        {initialData && (
          <Button
            variant='destructive'
            size='sm'
            onClick={() => setOpen(true)}
            disabled={loading}
          >
            <Trash className='w-4 h-4' />
          </Button>
        )}
      </div>
      <Separator />
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className='w-full space-y-8'
        >
          <FormField
            control={form.control}
            name='imageUrl'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Image</FormLabel>
                <FormControl>
                  <ImageUpload
                    value={field.value}
                    onChange={(url) => field.onChange(url)}
                    onRemove={() => field.onChange('')}
                    disabled={loading}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className='grid grid-cols-2 gap-8'>
            <FormField
              control={form.control}
              name='name'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input
                      disabled={loading}
                      placeholder='Ingredient name'
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='price'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Price (₽)</FormLabel>
                  <FormControl>
                    <Input
                      type='number'
                      min={0}
                      step={1}
                      disabled={loading}
                      placeholder='0'
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <Button disabled={loading} className='ml-auto' type='submit'>
            {action}
          </Button>
        </form>
      </Form>
    </>
  );
};
