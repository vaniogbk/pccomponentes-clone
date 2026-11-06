export const CURRENCY = 'EUR';

export function toCents(value: string): number {
  const normalized = value.trim().replace(',', '.');

  if (!/^(?:0|[1-9]\d*)(?:\.\d{1,2})?$/.test(normalized)) {
    throw new RangeError('Montant invalide.');
  }

  const [euros, fraction = ''] = normalized.split('.');
  const cents = BigInt(euros) * 100n + BigInt(fraction.padEnd(2, '0'));

  if (cents > BigInt(Number.MAX_SAFE_INTEGER)) {
    throw new RangeError('Montant hors limite.');
  }

  return Number(cents);
}

export function formatPrice(cents: number, locale = 'fr-FR'): string {
  if (!Number.isSafeInteger(cents)) {
    throw new RangeError('Le montant doit être un nombre entier de centimes.');
  }

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: CURRENCY,
  }).format(cents / 100);
}
