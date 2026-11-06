import assert from 'node:assert/strict';
import test from 'node:test';
import {
  computeCartTotals,
  formatPrice,
  toCents,
  validateCartLines,
} from '../dist/index.js';
import {
  canTransition,
  generateOrderReference,
  trackingStep,
} from '../dist/order.js';
import {
  buildEpcQrPayload,
  formatIban,
  isValidIban,
} from '../dist/sepa.js';
import {
  quoteShipping,
  selectShippingQuote,
} from '../dist/shipping.js';
import {
  detectMimeFromBytes,
  sanitizeFileName,
  validateProofFile,
} from '../dist/upload.js';
import {
  addressSchema,
  cartLineSchema,
  checkoutSchema,
  productQuerySchema,
  registrationSchema,
} from '../dist/schemas.js';
import {
  countryName,
  EUROPEAN_COUNTRY_CODES,
} from '../dist/countries.js';
import {
  DEFAULT_LOCALE,
  intlTag,
  isSiteLocale,
  localizedPath,
} from '../dist/locales.js';

test('money parsing is exact and rejects fractions below one cent', () => {
  assert.equal(toCents('1 234,50'.replace(' ', '')), 123450);
  assert.equal(toCents('0.01'), 1);
  assert.throws(() => toCents('1.001'), RangeError);
  assert.equal(formatPrice(123450).replace(/[  ]/g, ' '), '1 234,50 €');
});

test('cart validation enforces unique variants and the line quantity limit', () => {
  assert.deepEqual(validateCartLines([]), ['Le panier est vide.']);
  assert.equal(validateCartLines([{ variantId: 'v1', quantity: 2 }]).length, 0);
  assert.equal(validateCartLines([
    { variantId: 'v1', quantity: 2 },
    { variantId: 'v1', quantity: 1 },
  ]).length, 1);
  assert.equal(validateCartLines([{ variantId: 'v1', quantity: 11 }]).length, 1);
  assert.deepEqual(
    computeCartTotals([{ variantId: 'v1', quantity: 2, unitPriceCents: 1599 }]),
    { subtotalCents: 3198, itemCount: 2 },
  );
});

test('shipping quotes are based only on active country rates', () => {
  const rates = [
    { id: 'fr', countryCode: 'FR', priceCents: 599, freeAboveCents: 5000, minDays: 2, maxDays: 4, isActive: true },
    { id: 'inactive', countryCode: 'FR', priceCents: 1, freeAboveCents: null, minDays: 1, maxDays: 1, isActive: false },
    { id: 'de', countryCode: 'DE', priceCents: 899, freeAboveCents: null, minDays: 3, maxDays: 5, isActive: true },
  ];

  assert.deepEqual(quoteShipping(rates, 'FR', 5000), [
    { rateId: 'fr', priceCents: 0, minDays: 2, maxDays: 4 },
  ]);
  assert.equal(quoteShipping(rates, 'FR', 4999)[0]?.priceCents, 599);
  assert.throws(() => selectShippingQuote([], 'missing'), RangeError);
});

test('order transitions, tracking and references are deterministic where injected', () => {
  assert.equal(canTransition('PENDING_PAYMENT_VERIFICATION', 'PAID'), true);
  assert.equal(canTransition('DELIVERED', 'CANCELLED'), false);
  assert.equal(trackingStep('SHIPPED'), 2);
  assert.equal(trackingStep('CANCELLED'), -1);
  assert.equal(
    generateOrderReference('PCC', new Date('2026-11-06T15:00:00Z'), () => 0),
    'PCC-261106-22222',
  );
  assert.throws(() => generateOrderReference('XX'), RangeError);
});

test('SEPA validation uses IBAN checksum and emits a valid EPC payload', () => {
  const iban = 'DE89 3704 0044 0532 0130 00';
  assert.equal(isValidIban(iban), true);
  assert.equal(isValidIban('DE00 3704 0044 0532 0130 00'), false);
  assert.equal(formatIban(iban), 'DE89 3704 0044 0532 0130 00');
  assert.throws(() => buildEpcQrPayload({
    accountHolder: 'Démo',
    iban: 'DE00',
    amountCents: 100,
    reference: 'PCC-DEMO',
    remittance: 'Commande de démonstration',
  }), RangeError);
  assert.match(buildEpcQrPayload({
    accountHolder: 'Démo',
    iban,
    amountCents: 1250,
    reference: 'PCC-DEMO',
    remittance: 'Commande de démonstration',
  }), /EUR12\.50/);
});

test('proof upload checks actual file signatures and sanitizes path names', () => {
  const png = Uint8Array.from([137, 80, 78, 71, 13, 10, 26, 10]);
  assert.equal(detectMimeFromBytes(png), 'image/png');
  assert.deepEqual(validateProofFile({
    name: 'C:\\private\\virement.png',
    declaredMimeType: 'image/png',
    bytes: png,
  }), []);
  assert.equal(sanitizeFileName('../../preuve avec espaces.png'), 'preuve-avec-espaces.png');
  assert.notDeepEqual(validateProofFile({
    name: 'fichier.exe',
    declaredMimeType: 'image/png',
    bytes: Uint8Array.from([0, 1, 2]),
  }), []);
});

test('catalogue query parses filters from a query string and rejects inconsistent ranges', () => {
  const parsed = productQuerySchema.parse({
    q: ' rtx ',
    univers: 'CARTES_GRAPHIQUES',
    inStock: 'true',
    minPriceCents: '10000',
    maxPriceCents: '',
    sort: 'price_asc',
  });
  assert.equal(parsed.q, 'rtx');
  assert.equal(parsed.inStock, true);
  assert.equal(parsed.minPriceCents, 10000);
  assert.equal(parsed.maxPriceCents, undefined);
  assert.equal(parsed.sort, 'price_asc');
  assert.equal(productQuerySchema.parse({}).sort, 'featured');
  assert.equal(productQuerySchema.parse({ inStock: 'false' }).inStock, undefined);
  assert.equal(productQuerySchema.safeParse({ minPriceCents: '500', maxPriceCents: '100' }).success, false);
  assert.equal(productQuerySchema.safeParse({ category: '../admin' }).success, false);
  assert.equal(productQuerySchema.safeParse({ sort: 'random' }).success, false);
});

test('schemas reject invalid input and normalize account email', () => {
  assert.equal(productQuerySchema.parse({ page: '2' }).page, 2);
  assert.equal(cartLineSchema.safeParse({ variantId: 'v1', quantity: 10 }).success, true);
  assert.equal(cartLineSchema.safeParse({ variantId: 'v1', quantity: 11 }).success, false);
  assert.equal(registrationSchema.parse({
    email: ' CLIENT@EXAMPLE.FR ',
    password: 'a-secure-demo-password',
    firstName: 'Alex',
    lastName: 'Martin',
  }).email, 'client@example.fr');
  assert.equal(registrationSchema.safeParse({
    email: 'client@example.fr',
    password: 'short',
    firstName: 'Alex',
    lastName: 'Martin',
  }).success, false);
  assert.equal(addressSchema.safeParse({
    firstName: 'Alex',
    lastName: 'Martin',
    line1: '1 rue de test',
    postalCode: '75001',
    city: 'Paris',
    countryCode: 'FR',
    phone: '+33123456789',
  }).success, true);
  assert.equal(checkoutSchema.safeParse({
    address: {
      firstName: 'Alex',
      lastName: 'Martin',
      line1: '1 rue de test',
      postalCode: '75001',
      city: 'Paris',
      countryCode: 'FR',
      phone: '+33123456789',
    },
    shippingRateId: 'rate',
    acceptedTerms: true,
  }).success, true);
});

test('locales and European country labels are explicit', () => {
  assert.equal(DEFAULT_LOCALE, 'fr');
  assert.equal(isSiteLocale('fr'), true);
  assert.equal(isSiteLocale('en'), false);
  assert.equal(localizedPath('/catalogue', 'fr'), '/catalogue');
  assert.equal(localizedPath('/', 'fr'), '/');
  assert.equal(intlTag('fr'), 'fr-FR');
  assert.equal(countryName('FR', 'fr'), 'France');
  assert.ok(EUROPEAN_COUNTRY_CODES.includes('FR'));
});
