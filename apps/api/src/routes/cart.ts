import { Router, type Request, type Response } from 'express';
import { cartLineSchema, cartQuantitySchema } from '@pcc/shared/schemas';
import { z } from 'zod';
import type { AppConfig } from '../config/env.js';
import { CART_COOKIE, readCookie, setCartCookie } from '../lib/cookies.js';
import { asyncHandler, unprocessable } from '../lib/errors.js';
import { getAuth } from '../middleware/auth.js';
import type { CartContext, CartService } from '../services/cart.js';
import { noStore, parseBody } from '../lib/http.js';

const variantIdSchema = z.string().min(1).max(100).regex(/^[A-Za-z0-9_-]+$/);

function context(request: Request, response: Response): CartContext {
  const auth = getAuth(response);
  return auth ? { userId: auth.userId } : { guestToken: readCookie(request.cookies, CART_COOKIE) };
}

function variantParam(request: Request): string {
  const parsed = variantIdSchema.safeParse(request.params.variantId);
  if (!parsed.success) throw unprocessable('VARIANT_UNAVAILABLE', "Cet article n'est plus disponible.");
  return parsed.data;
}

export function cartRouter(config: AppConfig, cart: CartService): Router {
  const router = Router();
  router.use(noStore);

  router.get('/', asyncHandler(async (request, response) => {
    response.json({ cart: await cart.get(context(request, response)) });
  }));

  router.post('/items', asyncHandler(async (request, response) => {
    const { variantId, quantity } = parseBody(cartLineSchema, request.body);
    const result = await cart.addItem(context(request, response), variantId, quantity);
    if (result.guestToken) setCartCookie(response, config, result.guestToken);
    response.status(201).json({ cart: result.cart });
  }));

  router.patch('/items/:variantId', asyncHandler(async (request, response) => {
    const { quantity } = parseBody(cartQuantitySchema, request.body);
    response.json({ cart: await cart.setQuantity(context(request, response), variantParam(request), quantity) });
  }));

  router.delete('/items/:variantId', asyncHandler(async (request, response) => {
    response.json({ cart: await cart.removeItem(context(request, response), variantParam(request)) });
  }));

  return router;
}
