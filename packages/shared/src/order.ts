import { randomInt } from 'node:crypto';

export const ORDER_STATUSES = [
  'PENDING_PAYMENT_VERIFICATION',
  'PAID',
  'PREPARING',
  'SHIPPED',
  'DELIVERED',
  'CANCELLED',
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING_PAYMENT_VERIFICATION: 'En attente de vérification du paiement',
  PAID: 'Payée',
  PREPARING: 'En préparation',
  SHIPPED: 'En route',
  DELIVERED: 'Livrée',
  CANCELLED: 'Annulée',
};

export const ORDER_TRANSITIONS: Record<OrderStatus, readonly OrderStatus[]> = {
  PENDING_PAYMENT_VERIFICATION: ['PAID', 'CANCELLED'],
  PAID: ['PREPARING', 'CANCELLED'],
  PREPARING: ['SHIPPED', 'CANCELLED'],
  SHIPPED: ['DELIVERED'],
  DELIVERED: [],
  CANCELLED: [],
};

export const TRACKING_STEPS = ['PAID', 'PREPARING', 'SHIPPED', 'DELIVERED'] as const;

const REFERENCE_ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  return ORDER_TRANSITIONS[from].includes(to);
}

export function trackingStep(status: OrderStatus): number {
  return TRACKING_STEPS.indexOf(status as (typeof TRACKING_STEPS)[number]);
}

export function generateOrderReference(
  prefix: string,
  date = new Date(),
  random = randomInt,
): string {
  if (!/^[A-Z]{3}$/.test(prefix)) {
    throw new RangeError('Le préfixe de référence doit contenir trois lettres majuscules.');
  }

  const datePart = [
    String(date.getUTCFullYear()).slice(-2),
    String(date.getUTCMonth() + 1).padStart(2, '0'),
    String(date.getUTCDate()).padStart(2, '0'),
  ].join('');
  const suffix = Array.from({ length: 5 }, () =>
    REFERENCE_ALPHABET[random(REFERENCE_ALPHABET.length)],
  ).join('');

  return `${prefix}-${datePart}-${suffix}`;
}
