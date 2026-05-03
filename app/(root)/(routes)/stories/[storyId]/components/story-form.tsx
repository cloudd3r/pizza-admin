'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Story, StoryItem } from '@prisma/client';
import axios from 'axios';
import { Plus, Trash } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import * as z from 'zod';

import { Heading } from '@/components/heading';
import { ImageUpload } from '@/components/image-upload';
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

const storyItemSchema = z.object({
  sourceUrl: z.string().min(1, 'Story item image is required'),
});

const formSchema = z.object({
  previewImageUrl: z.string().min(1, 'Preview image is required'),
  items: z.array(storyItemSchema).min(1, 'At least one story item is required'),
});

type StoryFormValues = z.infer<typeof formSchema>;

type StoryWithItems = Story & {
  items: StoryItem[];
};

interface StoryFormProps {
  initialData: StoryWithItems | null;
}

const emptyItem = {
  sourceUrl: '',
};

export const StoryForm: React.FC<StoryFormProps> = ({ initialData }) => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const title = initialData ? 'Edit story' : 'Create story';
  const description = initialData
    ? 'Update storefront story'
    : 'Add a new storefront story';
  const toastMessage = initialData ? 'Story updated.' : 'Story created.';
  const action = initialData ? 'Save changes' : 'Create';

  const form = useForm<StoryFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      previewImageUrl: initialData?.previewImageUrl ?? '',
      items: initialData?.items.length
        ? initialData.items.map((item) => ({ sourceUrl: item.sourceUrl }))
        : [emptyItem],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'items',
  });

  const onSubmit = async (data: StoryFormValues) => {
    try {
      setLoading(true);

      if (initialData) {
        await axios.patch(`/api/stories/${initialData.id}`, data);
      } else {
        await axios.post('/api/stories', data);
      }

      router.refresh();
      router.push('/stories');
      toast.success(toastMessage);
    } catch {
      toast.error('Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className='flex items-center justify-between'>
        <Heading title={title} description={description} />
      </div>
      <Separator />
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-8'>
          <FormField
            control={form.control}
            name='previewImageUrl'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Preview image</FormLabel>
                <FormControl>
                  <ImageUpload
                    value={field.value}
                    disabled={loading}
                    onChange={field.onChange}
                    onRemove={() => field.onChange('')}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className='space-y-4'>
            <div className='flex items-center justify-between'>
              <div>
                <h3 className='text-lg font-medium'>Story items</h3>
                <p className='text-sm text-muted-foreground'>
                  Images shown inside the story modal on the storefront.
                </p>
              </div>
              <Button
                type='button'
                variant='outline'
                disabled={loading}
                onClick={() => append(emptyItem)}
              >
                <Plus className='w-4 h-4 mr-2' />
                Add item
              </Button>
            </div>

            <div className='space-y-3'>
              {fields.map((field, index) => (
                <div
                  key={field.id}
                  className='grid grid-cols-[1fr_auto] gap-4 items-start border rounded-md p-4'
                >
                  <FormField
                    control={form.control}
                    name={`items.${index}.sourceUrl`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Item image URL</FormLabel>
                        <FormControl>
                          <Input
                            disabled={loading}
                            placeholder='https://...'
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button
                    type='button'
                    variant='destructive'
                    size='sm'
                    className='mt-8'
                    disabled={loading || fields.length === 1}
                    onClick={() => remove(index)}
                  >
                    <Trash className='w-4 h-4' />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <Button disabled={loading} loading={loading} type='submit'>
            {action}
          </Button>
        </form>
      </Form>
    </>
  );
};
