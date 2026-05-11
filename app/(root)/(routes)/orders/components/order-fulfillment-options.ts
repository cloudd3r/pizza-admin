export type OrderFulfillmentStatus =
  | 'NEW'
  | 'CONFIRMED'
  | 'COOKING'
  | 'READY'
  | 'DELIVERING'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'REFUNDED';

export const FULFILLMENT_OPTIONS: ReadonlyArray<{
  value: OrderFulfillmentStatus;
  label: string;
}> = [
  { value: 'NEW', label: 'New' },
  { value: 'CONFIRMED', label: 'Confirmed' },
  { value: 'COOKING', label: 'Cooking' },
  { value: 'READY', label: 'Ready' },
  { value: 'DELIVERING', label: 'Delivering' },
  { value: 'DELIVERED', label: 'Delivered' },
  { value: 'CANCELLED', label: 'Cancelled' },
  { value: 'REFUNDED', label: 'Refunded' },
];

export const fulfillmentLabel = (value: OrderFulfillmentStatus): string =>
  FULFILLMENT_OPTIONS.find((option) => option.value === value)?.label ?? value;
