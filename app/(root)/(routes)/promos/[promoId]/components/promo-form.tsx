'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Promo, PromoKind } from '@prisma/client';
import axios from 'axios';
import { Trash } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import * as z from 'zod';

import { Heading } from '@/components/heading';
import { AlertModal } from '@/components/modals/alert-modal';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
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
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';

interface PromoFormProps {
  initialData: Promo | null;
}

const promoCodeRegex = /^[A-Z0-9_-]+$/;

const formSchema = z
  .object({
    code: z
      .string()
      .trim()
      .min(2, 'Минимум 2 символа')
      .max(64, 'Максимум 64 символа')
      .refine(
        (value) => promoCodeRegex.test(value.toUpperCase()),
        'Допустимы только A–Z, 0–9, "-" и "_"',
      ),
    kind: z.nativeEnum(PromoKind),
    valueOff: z.coerce
      .number({ invalid_type_error: 'Введите число' })
      .int('Целое число')
      .nonnegative('Не может быть отрицательным'),
    minOrderAmount: z
      .union([z.literal(''), z.coerce.number().int().nonnegative()])
      .optional(),
    maxDiscount: z
      .union([z.literal(''), z.coerce.number().int().nonnegative()])
      .optional(),
    validFrom: z.string().optional(),
    validUntil: z.string().optional(),
    usageLimit: z
      .union([z.literal(''), z.coerce.number().int().nonnegative()])
      .optional(),
    perUserLimit: z
      .union([z.literal(''), z.coerce.number().int().nonnegative()])
      .optional(),
    active: z.boolean().default(true),
    description: z.string().max(500, 'Слишком длинное описание').optional(),
  })
  .superRefine((data, ctx) => {
    if (data.kind === 'PERCENT' && (data.valueOff < 1 || data.valueOff > 100)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['valueOff'],
        message: 'Процент должен быть от 1 до 100',
      });
    }
    if (data.kind === 'FIXED' && data.valueOff < 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['valueOff'],
        message: 'Сумма должна быть >= 1',
      });
    }
    if (
      data.validFrom &&
      data.validUntil &&
      new Date(data.validUntil) <= new Date(data.validFrom)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['validUntil'],
        message: 'Дата окончания должна быть позже даты начала',
      });
    }
  });

type PromoFormValues = z.infer<typeof formSchema>;

const toLocalInputValue = (value: Date | null | undefined) => {
  if (!value) return '';
  const offsetMinutes = value.getTimezoneOffset();
  const local = new Date(value.getTime() - offsetMinutes * 60_000);
  return local.toISOString().slice(0, 16);
};

const fromLocalInputValue = (value: string | undefined) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
};

export const PromoForm: React.FC<PromoFormProps> = ({ initialData }) => {
  const params = useParams();
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const title = initialData ? 'Редактировать промокод' : 'Создать промокод';
  const description = initialData
    ? 'Изменить параметры существующего промокода'
    : 'Добавить новый промокод';
  const toastMessage = initialData ? 'Промокод обновлён.' : 'Промокод создан.';
  const action = initialData ? 'Сохранить' : 'Создать';

  const form = useForm<PromoFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData
      ? {
          code: initialData.code,
          kind: initialData.kind,
          valueOff: initialData.valueOff,
          minOrderAmount: initialData.minOrderAmount ?? '',
          maxDiscount: initialData.maxDiscount ?? '',
          validFrom: toLocalInputValue(initialData.validFrom),
          validUntil: toLocalInputValue(initialData.validUntil),
          usageLimit: initialData.usageLimit ?? '',
          perUserLimit: initialData.perUserLimit ?? '',
          active: initialData.active,
          description: initialData.description ?? '',
        }
      : {
          code: '',
          kind: PromoKind.PERCENT,
          valueOff: 10,
          minOrderAmount: '',
          maxDiscount: '',
          validFrom: '',
          validUntil: '',
          usageLimit: '',
          perUserLimit: '',
          active: true,
          description: '',
        },
  });

  const kind = form.watch('kind');

  const onSubmit = async (data: PromoFormValues) => {
    try {
      setLoading(true);
      const payload = {
        code: data.code.trim().toUpperCase(),
        kind: data.kind,
        valueOff: data.kind === 'FREE_DELIVERY' ? 0 : data.valueOff,
        minOrderAmount:
          data.minOrderAmount === '' ? null : Number(data.minOrderAmount),
        maxDiscount:
          data.kind === 'PERCENT' && data.maxDiscount !== ''
            ? Number(data.maxDiscount)
            : null,
        validFrom: fromLocalInputValue(data.validFrom),
        validUntil: fromLocalInputValue(data.validUntil),
        usageLimit: data.usageLimit === '' ? null : Number(data.usageLimit),
        perUserLimit:
          data.perUserLimit === '' ? null : Number(data.perUserLimit),
        active: data.active,
        description: data.description?.trim() || null,
      };

      if (initialData) {
        await axios.patch(`/api/promos/${params.promoId}`, payload);
      } else {
        await axios.post('/api/promos', payload);
      }
      router.refresh();
      router.push('/promos');
      toast.success(toastMessage);
    } catch (err) {
      const message =
        axios.isAxiosError(err) && err.response?.status === 409
          ? err.response?.data?.message ?? 'Код уже используется.'
          : 'Не удалось сохранить промокод.';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const onDelete = async () => {
    try {
      setLoading(true);
      await axios.delete(`/api/promos/${params.promoId}`);
      router.refresh();
      router.push('/promos');
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
          <div className='grid grid-cols-2 gap-8'>
            <FormField
              control={form.control}
              name='code'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Код</FormLabel>
                  <FormControl>
                    <Input
                      disabled={loading}
                      placeholder='SUMMER25'
                      {...field}
                      onChange={(event) =>
                        field.onChange(event.target.value.toUpperCase())
                      }
                    />
                  </FormControl>
                  <FormDescription>
                    Буквы A–Z, цифры, дефис и подчёркивание.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='kind'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Тип</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={loading}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder='Выберите тип' />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={PromoKind.PERCENT}>
                        Процент от суммы
                      </SelectItem>
                      <SelectItem value={PromoKind.FIXED}>
                        Фиксированная сумма (₽)
                      </SelectItem>
                      <SelectItem value={PromoKind.FREE_DELIVERY}>
                        Бесплатная доставка
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {kind !== 'FREE_DELIVERY' && (
              <FormField
                control={form.control}
                name='valueOff'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {kind === 'PERCENT' ? 'Процент (1–100)' : 'Сумма (₽)'}
                    </FormLabel>
                    <FormControl>
                      <Input
                        type='number'
                        min={kind === 'PERCENT' ? 1 : 1}
                        max={kind === 'PERCENT' ? 100 : undefined}
                        step={1}
                        disabled={loading}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name='minOrderAmount'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Мин. сумма заказа (₽)</FormLabel>
                  <FormControl>
                    <Input
                      type='number'
                      min={0}
                      step={1}
                      disabled={loading}
                      placeholder='Без ограничения'
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {kind === 'PERCENT' && (
              <FormField
                control={form.control}
                name='maxDiscount'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Макс. скидка (₽)</FormLabel>
                    <FormControl>
                      <Input
                        type='number'
                        min={0}
                        step={1}
                        disabled={loading}
                        placeholder='Без ограничения'
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Верхний кэп скидки для процентных промокодов.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name='validFrom'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Действует с</FormLabel>
                  <FormControl>
                    <Input
                      type='datetime-local'
                      disabled={loading}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='validUntil'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Действует до</FormLabel>
                  <FormControl>
                    <Input
                      type='datetime-local'
                      disabled={loading}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='usageLimit'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Общий лимит использований</FormLabel>
                  <FormControl>
                    <Input
                      type='number'
                      min={0}
                      step={1}
                      disabled={loading}
                      placeholder='Без лимита'
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='perUserLimit'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Лимит на пользователя</FormLabel>
                  <FormControl>
                    <Input
                      type='number'
                      min={0}
                      step={1}
                      disabled={loading}
                      placeholder='Без лимита'
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name='description'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Описание (для внутреннего учёта)</FormLabel>
                <FormControl>
                  <Textarea
                    disabled={loading}
                    placeholder='Например: летняя акция, баннер на главной'
                    rows={3}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='active'
            render={({ field }) => (
              <FormItem className='flex items-center justify-between rounded-lg border p-4'>
                <div className='space-y-0.5'>
                  <FormLabel className='text-base'>Активен</FormLabel>
                  <FormDescription>
                    Неактивные промокоды не применяются на витрине.
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    disabled={loading}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          <Button disabled={loading} className='ml-auto' type='submit'>
            {action}
          </Button>
        </form>
      </Form>
    </>
  );
};
