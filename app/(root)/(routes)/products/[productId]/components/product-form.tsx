'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Category, Ingredient, Product, ProductItem } from '@prisma/client';
import axios from 'axios';
import { Plus, Trash } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';

type ProductWithRelations = Product & {
  items: ProductItem[];
  ingredients: Ingredient[];
};

interface ProductFormProps {
  initialData: ProductWithRelations | null;
  categories: Category[];
  ingredients: Ingredient[];
}

const productItemSchema = z.object({
  id: z.number().optional(),
  price: z.coerce
    .number({ invalid_type_error: 'Цена должна быть числом' })
    .int('Цена должна быть целым числом')
    .min(1, 'Цена должна быть больше 0'),
  size: z.coerce.number().int().nullable().optional(),
  pizzaType: z.coerce.number().int().nullable().optional(),
});

const formSchema = z.object({
  name: z.string().min(1, 'Введите название'),
  imageUrl: z.string().url('Загрузите изображение'),
  categoryId: z.string().min(1, 'Выберите категорию'),
  ingredientIds: z.array(z.number()),
  items: z.array(productItemSchema).min(1, 'Добавьте хотя бы один вариант'),
});

type ProductFormValues = z.infer<typeof formSchema>;

const pizzaSizes = [
  { value: 20, label: '20 см' },
  { value: 30, label: '30 см' },
  { value: 40, label: '40 см' },
];

const pizzaTypes = [
  { value: 1, label: 'Традиционная' },
  { value: 2, label: 'Тонкая' },
];

const emptyItem = {
  price: 0,
  size: null,
  pizzaType: null,
};

const getDefaultValues = (
  initialData: ProductWithRelations | null,
): ProductFormValues => ({
  name: initialData?.name ?? '',
  imageUrl: initialData?.imageUrl ?? '',
  categoryId: initialData?.categoryId ? String(initialData.categoryId) : '',
  ingredientIds: initialData?.ingredients.map((ingredient) => ingredient.id) ?? [],
  items: initialData?.items.length
    ? initialData.items.map((item) => ({
        id: item.id,
        price: item.price,
        size: item.size,
        pizzaType: item.pizzaType,
      }))
    : [emptyItem],
});

export const ProductForm: React.FC<ProductFormProps> = ({
  initialData,
  categories,
  ingredients,
}) => {
  const params = useParams();
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const title = initialData ? 'Edit product' : 'Create product';
  const description = initialData
    ? 'Edit product data and variants'
    : 'Add a product or pizza to the storefront';
  const toastMessage = initialData ? 'Product updated.' : 'Product created.';
  const action = initialData ? 'Save changes' : 'Create';

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: getDefaultValues(initialData),
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'items',
  });

  const selectedIngredientIds = form.watch('ingredientIds');

  const toggleIngredient = (ingredientId: number) => {
    const nextValue = selectedIngredientIds.includes(ingredientId)
      ? selectedIngredientIds.filter((id) => id !== ingredientId)
      : [...selectedIngredientIds, ingredientId];

    form.setValue('ingredientIds', nextValue, {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

  const onSubmit = async (data: ProductFormValues) => {
    try {
      setLoading(true);
      if (initialData) {
        await axios.patch(`/api/products/${params.productId}`, data);
      } else {
        await axios.post('/api/products', data);
      }
      router.refresh();
      router.push('/products');
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
      await axios.delete(`/api/products/${params.productId}`);
      router.refresh();
      router.push('/products');
      toast.success('Product deleted.');
    } catch {
      toast.error('Make sure this product is not used in carts before deleting.');
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
                      placeholder='Product name'
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='categoryId'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select
                    disabled={loading}
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder='Select category' />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={String(category.id)}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className='space-y-4'>
            <div>
              <FormLabel>Ingredients</FormLabel>
              <p className='text-sm text-muted-foreground'>
                Select ingredients shown on the product card and pizza form.
              </p>
            </div>
            <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3'>
              {ingredients.map((ingredient) => {
                const selected = selectedIngredientIds.includes(ingredient.id);

                return (
                  <Button
                    key={ingredient.id}
                    type='button'
                    variant={selected ? 'default' : 'outline'}
                    disabled={loading}
                    onClick={() => toggleIngredient(ingredient.id)}
                    className='justify-start'
                  >
                    {ingredient.name} · {ingredient.price} ₽
                  </Button>
                );
              })}
            </div>
          </div>

          <div className='space-y-4'>
            <div className='flex items-center justify-between'>
              <div>
                <FormLabel>Product variants</FormLabel>
                <p className='text-sm text-muted-foreground'>
                  For regular products leave size and pizza type empty. For
                  pizzas fill size and type.
                </p>
              </div>
              <Button
                type='button'
                variant='outline'
                disabled={loading}
                onClick={() => append(emptyItem)}
              >
                <Plus className='w-4 h-4 mr-2' />
                Add variant
              </Button>
            </div>

            <div className='space-y-3'>
              {fields.map((field, index) => (
                <div
                  key={field.id}
                  className='grid grid-cols-[1fr_1fr_1fr_auto] gap-4 items-start border rounded-md p-4'
                >
                  <FormField
                    control={form.control}
                    name={`items.${index}.price`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Price (₽)</FormLabel>
                        <FormControl>
                          <Input
                            type='number'
                            min={1}
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
                  <FormField
                    control={form.control}
                    name={`items.${index}.size`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Pizza size</FormLabel>
                        <Select
                          disabled={loading}
                          value={field.value ? String(field.value) : 'none'}
                          onValueChange={(value) =>
                            field.onChange(value === 'none' ? null : Number(value))
                          }
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder='No size' />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value='none'>No size</SelectItem>
                            {pizzaSizes.map((size) => (
                              <SelectItem
                                key={size.value}
                                value={String(size.value)}
                              >
                                {size.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`items.${index}.pizzaType`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Pizza type</FormLabel>
                        <Select
                          disabled={loading}
                          value={field.value ? String(field.value) : 'none'}
                          onValueChange={(value) =>
                            field.onChange(value === 'none' ? null : Number(value))
                          }
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder='No type' />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value='none'>No type</SelectItem>
                            {pizzaTypes.map((type) => (
                              <SelectItem
                                key={type.value}
                                value={String(type.value)}
                              >
                                {type.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
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

          <Button disabled={loading} className='ml-auto' type='submit'>
            {action}
          </Button>
        </form>
      </Form>
    </>
  );
};
