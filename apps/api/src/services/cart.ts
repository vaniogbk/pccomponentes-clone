import type { Prisma, PrismaClient } from '@prisma/client';
import { type CartIssueCode, computeCartTotals, MAX_QUANTITY_PER_LINE } from '@pcc/shared/cart';
import type { AppConfig } from '../config/env.js';
import { CART_TTL_DAYS } from '../lib/cookies.js';
import { unprocessable } from '../lib/errors.js';
import { hashToken, randomToken } from '../lib/tokens.js';
import { availabilityOf, LOW_STOCK_THRESHOLD } from '../repositories/catalogue.js';

const DAY_MS = 24 * 60 * 60 * 1000;
const expiry = () => new Date(Date.now() + CART_TTL_DAYS * DAY_MS);

export interface CartContext {
  userId?: string;
  guestToken?: string;
}

const lineInclude = {
  variant: {
    include: {
      size: { select: { label: true } },
      stock: { select: { quantity: true } },
      product: {
        select: {
          name: true, slug: true, reference: true, brand: true, status: true, currency: true,
          category: { select: { isVisible: true } },
          images: { orderBy: { position: 'asc' }, take: 1, select: { url: true, alt: true, width: true, height: true } },
        },
      },
    },
  },
} satisfies Prisma.CartItemInclude;

type LineRow = Prisma.CartItemGetPayload<{ include: typeof lineInclude }>;
type VariantRow = LineRow['variant'];

function isPurchasable(variant: VariantRow) {
  return variant.isActive && variant.product.status === 'ACTIVE' && variant.product.category.isVisible;
}

function issueFor(variant: VariantRow, quantity: number): CartIssueCode | undefined {
  if (!isPurchasable(variant)) return 'VARIANT_UNAVAILABLE';
  const stock = variant.stock?.quantity ?? 0;
  if (stock <= 0) return 'OUT_OF_STOCK';
  if (stock < quantity) return 'INSUFFICIENT_STOCK';
  if (quantity > MAX_QUANTITY_PER_LINE) return 'QUANTITY_LIMIT';
  return undefined;
}

function toLine(row: LineRow) {
  const { variant } = row;
  const issue = issueFor(variant, row.quantity);
  return {
    variantId: variant.id,
    sku: variant.sku,
    productName: variant.product.name,
    productSlug: variant.product.slug,
    productReference: variant.product.reference,
    brand: variant.product.brand,
    sizeLabel: variant.size.label,
    color: variant.color,
    image: variant.product.images[0] ?? null,
    unitPriceCents: variant.priceCents,
    quantity: row.quantity,
    lineTotalCents: variant.priceCents * row.quantity,
    ...availabilityOf(isPurchasable(variant) ? variant.stock?.quantity ?? 0 : 0),
    ...(issue && { issue }),
  };
}

export type CartLine = ReturnType<typeof toLine>;

export function emptyCart() {
  return { lines: [] as CartLine[], subtotalCents: 0, itemCount: 0, currency: 'EUR', hasIssues: false, canCheckout: false };
}

export function createCartService(prisma: PrismaClient, config: AppConfig) {
  const hash = (token: string) => hashToken(config.jwtRefreshSecret, token);

  async function findCart(context: CartContext) {
    const now = new Date();
    if (context.userId) {
      return prisma.cart.findFirst({
        where: { userId: context.userId, expiresAt: { gt: now } },
        orderBy: { updatedAt: 'desc' },
        select: { id: true },
      });
    }
    if (context.guestToken) {
      return prisma.cart.findFirst({ where: { tokenHash: hash(context.guestToken), userId: null, expiresAt: { gt: now } }, select: { id: true } });
    }
    return null;
  }

  /** Renvoie le panier existant ou en crée un ; `guestToken` est fourni quand un cookie doit être posé. */
  async function ensureCart(context: CartContext): Promise<{ cartId: string; guestToken?: string }> {
    const existing = await findCart(context);
    if (existing) {
      await prisma.cart.update({ where: { id: existing.id }, data: { expiresAt: expiry() } });
      return { cartId: existing.id };
    }
    if (context.userId) {
      const cart = await prisma.cart.create({ data: { userId: context.userId, expiresAt: expiry() }, select: { id: true } });
      return { cartId: cart.id };
    }
    const guestToken = randomToken();
    const cart = await prisma.cart.create({ data: { tokenHash: hash(guestToken), expiresAt: expiry() }, select: { id: true } });
    return { cartId: cart.id, guestToken };
  }

  async function view(cartId: string | undefined) {
    if (!cartId) return emptyCart();
    const rows = await prisma.cartItem.findMany({ where: { cartId }, include: lineInclude, orderBy: { createdAt: 'asc' } });
    const lines = rows.map(toLine);
    const valid = lines.filter((line) => !line.issue);
    const totals = computeCartTotals(valid.map((line) => ({ variantId: line.variantId, quantity: line.quantity, unitPriceCents: line.unitPriceCents })));
    const hasIssues = valid.length !== lines.length;
    return { lines, ...totals, currency: 'EUR', hasIssues, canCheckout: lines.length > 0 && !hasIssues };
  }

  /** Vérifie qu'une quantité donnée d'une variante peut être placée dans le panier. */
  async function assertAvailable(variantId: string, quantity: number) {
    if (quantity > MAX_QUANTITY_PER_LINE) {
      throw unprocessable('QUANTITY_LIMIT', `La quantité est limitée à ${MAX_QUANTITY_PER_LINE} par article.`);
    }
    const variant = await prisma.productVariant.findUnique({ where: { id: variantId }, include: lineInclude.variant.include });
    if (!variant || !isPurchasable(variant)) {
      throw unprocessable('VARIANT_UNAVAILABLE', "Cet article n'est plus disponible.");
    }
    const stock = variant.stock?.quantity ?? 0;
    if (stock <= 0) throw unprocessable('OUT_OF_STOCK', 'Cet article est en rupture de stock.');
    if (stock < quantity) {
      throw unprocessable(
        'INSUFFICIENT_STOCK',
        'La quantité demandée dépasse le stock disponible.',
        stock <= LOW_STOCK_THRESHOLD ? { maxQuantity: stock } : undefined,
      );
    }
  }

  return {
    async get(context: CartContext) {
      const cart = await findCart(context);
      return view(cart?.id);
    },

    async addItem(context: CartContext, variantId: string, quantity: number) {
      const existingCart = await findCart(context);
      const existingLine = existingCart
        ? await prisma.cartItem.findUnique({ where: { cartId_variantId: { cartId: existingCart.id, variantId } }, select: { quantity: true } })
        : null;
      const target = (existingLine?.quantity ?? 0) + quantity;
      await assertAvailable(variantId, target);

      const { cartId, guestToken } = await ensureCart(context);
      await prisma.cartItem.upsert({
        where: { cartId_variantId: { cartId, variantId } },
        create: { cartId, variantId, quantity: target },
        update: { quantity: target },
      });
      return { cart: await view(cartId), guestToken };
    },

    async setQuantity(context: CartContext, variantId: string, quantity: number) {
      const cart = await findCart(context);
      const line = cart
        ? await prisma.cartItem.findUnique({ where: { cartId_variantId: { cartId: cart.id, variantId } }, select: { id: true } })
        : null;
      if (!cart || !line) throw unprocessable('CART_LINE_NOT_FOUND', "Cet article n'est pas dans le panier.");

      await assertAvailable(variantId, quantity);
      await prisma.cartItem.update({ where: { id: line.id }, data: { quantity } });
      await prisma.cart.update({ where: { id: cart.id }, data: { expiresAt: expiry() } });
      return view(cart.id);
    },

    async removeItem(context: CartContext, variantId: string) {
      const cart = await findCart(context);
      if (!cart) return emptyCart();
      await prisma.cartItem.deleteMany({ where: { cartId: cart.id, variantId } });
      return view(cart.id);
    },

    /**
     * À la connexion, le panier invité rejoint celui du compte : les quantités s'additionnent (plafonnées),
     * puis le panier invité est supprimé.
     */
    async mergeGuestCart(guestToken: string | undefined, userId: string) {
      if (!guestToken) return;
      const guest = await findCart({ guestToken });
      if (!guest) return;

      const guestItems = await prisma.cartItem.findMany({ where: { cartId: guest.id }, select: { variantId: true, quantity: true } });
      if (guestItems.length === 0) {
        await prisma.cart.delete({ where: { id: guest.id } });
        return;
      }

      const { cartId } = await ensureCart({ userId });
      await prisma.$transaction(async (transaction) => {
        for (const item of guestItems) {
          const current = await transaction.cartItem.findUnique({
            where: { cartId_variantId: { cartId, variantId: item.variantId } },
            select: { quantity: true },
          });
          const quantity = Math.min(MAX_QUANTITY_PER_LINE, (current?.quantity ?? 0) + item.quantity);
          await transaction.cartItem.upsert({
            where: { cartId_variantId: { cartId, variantId: item.variantId } },
            create: { cartId, variantId: item.variantId, quantity },
            update: { quantity },
          });
        }
        await transaction.cart.delete({ where: { id: guest.id } });
      });
    },
  };
}

export type CartService = ReturnType<typeof createCartService>;
