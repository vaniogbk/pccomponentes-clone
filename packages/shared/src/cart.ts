export const MAX_QUANTITY_PER_LINE = 10;

export interface CartLineInput {
  variantId: string;
  quantity: number;
}

export interface PricedCartLine extends CartLineInput {
  unitPriceCents: number;
}

export interface CartTotals {
  subtotalCents: number;
  itemCount: number;
}

export function validateCartLines(lines: readonly CartLineInput[]): string[] {
  const issues: string[] = [];

  if (lines.length === 0) {
    return ['Le panier est vide.'];
  }

  const variantIds = new Set<string>();

  for (const [index, line] of lines.entries()) {
    if (!line.variantId.trim()) {
      issues.push(`La variante de la ligne ${index + 1} est invalide.`);
    }

    if (variantIds.has(line.variantId)) {
      issues.push(`La variante ${line.variantId} apparaît plusieurs fois.`);
    }

    variantIds.add(line.variantId);

    if (!Number.isInteger(line.quantity) || line.quantity < 1 || line.quantity > MAX_QUANTITY_PER_LINE) {
      issues.push(`La quantité de la ligne ${index + 1} doit être comprise entre 1 et ${MAX_QUANTITY_PER_LINE}.`);
    }
  }

  return issues;
}

export function computeCartTotals(lines: readonly PricedCartLine[]): CartTotals {
  const subtotalCents = lines.reduce((total, line) => {
    if (!Number.isSafeInteger(line.unitPriceCents) || line.unitPriceCents < 0) {
      throw new RangeError('Prix de variante invalide.');
    }

    return total + line.unitPriceCents * line.quantity;
  }, 0);
  const itemCount = lines.reduce((total, line) => total + line.quantity, 0);

  if (!Number.isSafeInteger(subtotalCents) || !Number.isSafeInteger(itemCount)) {
    throw new RangeError('Total du panier hors limite.');
  }

  return { subtotalCents, itemCount };
}
