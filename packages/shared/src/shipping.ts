export interface ShippingRate {
  id: string;
  countryCode: string;
  priceCents: number;
  freeAboveCents: number | null;
  minDays: number;
  maxDays: number;
  isActive: boolean;
}

export interface ShippingQuote {
  rateId: string;
  priceCents: number;
  minDays: number;
  maxDays: number;
}

export function quoteShipping(
  rates: readonly ShippingRate[],
  countryCode: string,
  subtotalCents: number,
): ShippingQuote[] {
  if (!Number.isSafeInteger(subtotalCents) || subtotalCents < 0) {
    throw new RangeError('Sous-total invalide.');
  }

  return rates
    .filter((rate) => rate.isActive && rate.countryCode === countryCode.toUpperCase())
    .map((rate) => ({
      rateId: rate.id,
      priceCents:
        rate.freeAboveCents !== null && subtotalCents >= rate.freeAboveCents
          ? 0
          : rate.priceCents,
      minDays: rate.minDays,
      maxDays: rate.maxDays,
    }))
    .sort((left, right) => left.priceCents - right.priceCents || left.maxDays - right.maxDays);
}

export function selectShippingQuote(
  quotes: readonly ShippingQuote[],
  rateId: string,
): ShippingQuote {
  const quote = quotes.find((item) => item.rateId === rateId);

  if (!quote) {
    throw new RangeError('Tarif de livraison indisponible.');
  }

  return quote;
}
