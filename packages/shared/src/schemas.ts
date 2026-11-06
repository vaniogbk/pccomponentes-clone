import { z } from 'zod';
import { MAX_QUANTITY_PER_LINE } from './cart.js';
import { EUROPEAN_COUNTRY_CODES } from './countries.js';
import { DEFAULT_LOCALE, SITE_LOCALES } from './locales.js';

export const UNIVERS = [
  'CARTES_GRAPHIQUES',
  'PROCESSEURS',
  'CONSOLES',
  'PERIPHERIQUES_GAMING',
  'STOCKAGE_MEMOIRE',
] as const;
export type UniversCode = (typeof UNIVERS)[number];

export const PRODUCT_SORTS = ['featured', 'price_asc', 'price_desc', 'newest'] as const;
export type ProductSort = (typeof PRODUCT_SORTS)[number];

export const CATALOGUE_PAGE_SIZE = 24;

const emptyToUndefined = (value: unknown) => (value === '' ? undefined : value);
const optionalText = (max: number) => z.preprocess(emptyToUndefined, z.string().trim().min(1).max(max).optional());
const optionalCents = z.preprocess(emptyToUndefined, z.coerce.number().int().nonnegative().max(100_000_000).optional());

export const productQuerySchema = z
  .object({
    q: optionalText(120),
    category: z.preprocess(emptyToUndefined, z.string().trim().regex(/^[a-z0-9-]{1,100}$/).optional()),
    univers: z.preprocess(emptyToUndefined, z.enum(UNIVERS).optional()),
    size: optionalText(50),
    brand: optionalText(100),
    condition: z.preprocess(emptyToUndefined, z.enum(['NEW', 'USED']).optional()),
    minPriceCents: optionalCents,
    maxPriceCents: optionalCents,
    inStock: z.preprocess(
      (value) => (value === 'true' || value === '1' ? true : value === 'false' || value === '0' || value === '' ? undefined : value),
      z.literal(true).optional(),
    ),
    sort: z.preprocess(emptyToUndefined, z.enum(PRODUCT_SORTS).default('featured')),
    page: z.preprocess(emptyToUndefined, z.coerce.number().int().positive().max(1000).default(1)),
  })
  .refine(
    (query) => query.minPriceCents === undefined || query.maxPriceCents === undefined || query.minPriceCents <= query.maxPriceCents,
    { message: 'Le prix minimum dépasse le prix maximum.', path: ['minPriceCents'] },
  );

export type ProductQuery = z.infer<typeof productQuerySchema>;

export const slugSchema = z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(160);

export const addressSchema = z.object({
  firstName: z.string().trim().min(1).max(100),
  lastName: z.string().trim().min(1).max(100),
  company: z.string().trim().max(150).optional(),
  line1: z.string().trim().min(1).max(200),
  line2: z.string().trim().max(200).optional(),
  postalCode: z.string().trim().min(1).max(32),
  city: z.string().trim().min(1).max(120),
  region: z.string().trim().max(120).optional(),
  countryCode: z.enum(EUROPEAN_COUNTRY_CODES),
  phone: z.string().trim().max(32),
});

const emailSchema = z.string().trim().email().max(254).transform((email) => email.toLowerCase());
const localeSchema = z.enum(SITE_LOCALES).catch(DEFAULT_LOCALE).default(DEFAULT_LOCALE);
export const PASSWORD_MIN_LENGTH = 12;
const newPasswordSchema = z.string().min(PASSWORD_MIN_LENGTH).max(128);

export const registrationSchema = z.object({
  email: emailSchema,
  password: newPasswordSchema,
  firstName: z.string().trim().min(1).max(100),
  lastName: z.string().trim().min(1).max(100),
  locale: localeSchema,
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1).max(128),
});

export const passwordForgotSchema = z.object({
  email: emailSchema,
  locale: localeSchema,
});

export const passwordResetSchema = z.object({
  token: z.string().min(20).max(200),
  password: newPasswordSchema,
});

export const cartLineSchema = z.object({
  variantId: z.string().min(1).max(100),
  quantity: z.number().int().min(1).max(MAX_QUANTITY_PER_LINE),
});

export const cartQuantitySchema = z.object({
  quantity: z.number().int().min(1).max(MAX_QUANTITY_PER_LINE),
});

export const checkoutSchema = z.object({
  address: addressSchema,
  shippingRateId: z.string().min(1).max(100),
  acceptedTerms: z.literal(true),
  locale: localeSchema,
});
