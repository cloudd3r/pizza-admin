import { format } from 'date-fns';
import type { OrderEvent, OrderEventKind } from '@prisma/client';

import { fulfillmentLabel } from './order-fulfillment-options';

type Payload = Record<string, unknown> | null;

interface OrderTimelineProps {
  events: OrderEvent[];
}

const formatStatusValue = (kind: OrderEventKind, value: unknown): string => {
  if (typeof value !== 'string') return '—';
  if (kind === 'FULFILLMENT_STATUS_CHANGED') {
    return fulfillmentLabel(value as Parameters<typeof fulfillmentLabel>[0]);
  }
  return value;
};

const describeEvent = (event: OrderEvent): string => {
  const payload = (event.payload as Payload) ?? null;

  switch (event.kind) {
    case 'PAYMENT_STATUS_CHANGED': {
      const from = formatStatusValue(event.kind, payload?.from);
      const to = formatStatusValue(event.kind, payload?.to);
      return `Payment status: ${from} → ${to}`;
    }
    case 'FULFILLMENT_STATUS_CHANGED': {
      const from = formatStatusValue(event.kind, payload?.from);
      const to = formatStatusValue(event.kind, payload?.to);
      return `Fulfillment: ${from} → ${to}`;
    }
    case 'NOTE': {
      const note =
        typeof payload?.message === 'string'
          ? payload.message
          : typeof payload?.note === 'string'
            ? payload.note
            : '(empty note)';
      return `Note: ${note}`;
    }
    default:
      return event.kind;
  }
};

export const OrderTimeline: React.FC<OrderTimelineProps> = ({ events }) => {
  if (events.length === 0) {
    return (
      <div className='rounded-md border p-4 text-sm text-muted-foreground'>
        No events yet. Status changes and operator comments will appear here.
      </div>
    );
  }

  return (
    <ol className='space-y-3 rounded-md border p-4'>
      {events.map((event) => (
        <li
          key={event.id}
          className='flex items-start gap-3 border-b pb-3 last:border-b-0 last:pb-0'
        >
          <div className='min-w-[140px] text-xs text-muted-foreground'>
            {format(event.createdAt, 'MMM d, HH:mm')}
          </div>
          <div className='flex-1 text-sm'>
            <div>{describeEvent(event)}</div>
            {event.actorEmail ? (
              <div className='text-xs text-muted-foreground'>
                by {event.actorEmail}
              </div>
            ) : null}
          </div>
        </li>
      ))}
    </ol>
  );
};
