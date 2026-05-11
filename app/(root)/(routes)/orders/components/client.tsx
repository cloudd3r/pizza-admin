'use client';

import { useMemo, useState } from 'react';

import { Heading } from '@/components/heading';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { columns, OrderColumn, OrderStatusValue } from './columns';

type StatusFilter = 'ALL' | OrderStatusValue;
type DateFilter = 'today' | '7d' | '30d' | 'all';

interface OrderClientProps {
  data: OrderColumn[];
}

const DATE_OPTIONS: { value: DateFilter; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: 'all', label: 'All time' },
];

const dateThresholdMs = (value: DateFilter): number | null => {
  if (value === 'all') return null;
  const now = Date.now();
  switch (value) {
    case 'today': {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      return d.getTime();
    }
    case '7d':
      return now - 7 * 24 * 60 * 60 * 1000;
    case '30d':
      return now - 30 * 24 * 60 * 60 * 1000;
  }
};

const matchesSearch = (order: OrderColumn, query: string) => {
  if (!query) return true;
  const needle = query.trim().toLowerCase();
  if (!needle) return true;

  const haystack = [
    String(order.id),
    order.customer,
    order.email,
    order.phone,
    order.address,
    order.paymentId,
  ]
    .join(' ')
    .toLowerCase();

  return haystack.includes(needle);
};

export const OrderClient: React.FC<OrderClientProps> = ({ data }) => {
  const [status, setStatus] = useState<StatusFilter>('ALL');
  const [dateRange, setDateRange] = useState<DateFilter>('all');
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const threshold = dateThresholdMs(dateRange);

    return data.filter((order) => {
      if (status !== 'ALL' && order.status !== status) return false;
      if (threshold !== null) {
        const ts = Date.parse(order.createdAtIso);
        if (Number.isNaN(ts) || ts < threshold) return false;
      }
      return matchesSearch(order, search);
    });
  }, [data, status, dateRange, search]);

  const counts = useMemo(() => {
    const totalsByStatus: Record<StatusFilter, number> = {
      ALL: data.length,
      PENDING: 0,
      SUCCEEDED: 0,
      CANCELLED: 0,
    };
    for (const order of data) totalsByStatus[order.status] += 1;
    return totalsByStatus;
  }, [data]);

  const resetFilters = () => {
    setStatus('ALL');
    setDateRange('all');
    setSearch('');
  };

  const filtersActive =
    status !== 'ALL' || dateRange !== 'all' || search.length > 0;

  return (
    <>
      <Heading
        title={`Orders (${filtered.length}/${data.length})`}
        description='Manage customer orders, search, filter by status and date'
      />
      <Separator />
      <div className='flex flex-wrap items-center gap-3 py-2'>
        <Input
          placeholder='Search by id, customer, email, phone, address...'
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className='max-w-sm'
        />
        <Select
          value={status}
          onValueChange={(value) => setStatus(value as StatusFilter)}
        >
          <SelectTrigger className='w-[180px]'>
            <SelectValue placeholder='Status' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='ALL'>All statuses ({counts.ALL})</SelectItem>
            <SelectItem value='PENDING'>
              Pending ({counts.PENDING})
            </SelectItem>
            <SelectItem value='SUCCEEDED'>
              Succeeded ({counts.SUCCEEDED})
            </SelectItem>
            <SelectItem value='CANCELLED'>
              Cancelled ({counts.CANCELLED})
            </SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={dateRange}
          onValueChange={(value) => setDateRange(value as DateFilter)}
        >
          <SelectTrigger className='w-[160px]'>
            <SelectValue placeholder='Date' />
          </SelectTrigger>
          <SelectContent>
            {DATE_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {filtersActive && (
          <Button variant='outline' size='sm' onClick={resetFilters}>
            Reset filters
          </Button>
        )}
      </div>
      <DataTable columns={columns} data={filtered} searchKey='customer' />
    </>
  );
};
