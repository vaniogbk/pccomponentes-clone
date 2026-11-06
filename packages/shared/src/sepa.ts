export function normalizeIban(iban: string): string {
  return iban.replace(/[\s-]/g, '').toUpperCase();
}

export function isValidIban(iban: string): boolean {
  const normalized = normalizeIban(iban);

  if (!/^[A-Z]{2}\d{2}[A-Z0-9]{11,30}$/.test(normalized)) {
    return false;
  }

  const rearranged = normalized.slice(4) + normalized.slice(0, 4);
  let remainder = 0;

  for (const character of rearranged) {
    const digits = character >= 'A' && character <= 'Z'
      ? String(character.charCodeAt(0) - 55)
      : character;

    for (const digit of digits) {
      remainder = (remainder * 10 + Number(digit)) % 97;
    }
  }

  return remainder === 1;
}

export function formatIban(iban: string): string {
  return normalizeIban(iban).replace(/(.{4})/g, '$1 ').trim();
}

export interface SepaQrDetails {
  accountHolder: string;
  iban: string;
  bic?: string;
  amountCents: number;
  reference: string;
  remittance: string;
}

export function buildEpcQrPayload(details: SepaQrDetails): string {
  if (!isValidIban(details.iban)) {
    throw new RangeError('IBAN invalide.');
  }

  if (!Number.isSafeInteger(details.amountCents) || details.amountCents < 1) {
    throw new RangeError('Le montant du virement doit être supérieur à zéro.');
  }

  const amount = (details.amountCents / 100).toFixed(2);
  const fields = [
    'BCD',
    '002',
    '1',
    'SCT',
    details.bic?.toUpperCase() ?? '',
    details.accountHolder.slice(0, 70),
    normalizeIban(details.iban),
    `EUR${amount}`,
    '',
    details.reference.slice(0, 35),
    details.remittance.slice(0, 140),
  ];

  return fields.join('\n');
}
