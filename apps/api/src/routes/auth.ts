import { Router, type RequestHandler } from 'express';
import rateLimit from 'express-rate-limit';
import { loginSchema, passwordForgotSchema, passwordResetSchema, registrationSchema } from '@pcc/shared/schemas';
import type { AppConfig } from '../config/env.js';
import { CART_COOKIE, REFRESH_COOKIE, clearCartCookie, clearSessionCookies, readCookie, setSessionCookies } from '../lib/cookies.js';
import { AppError, asyncHandler } from '../lib/errors.js';
import { noStore, parseBody } from '../lib/http.js';
import { getAuth, requireAuth } from '../middleware/auth.js';
import type { AuthService } from '../services/auth.js';
import type { CartService } from '../services/cart.js';

function limiter(config: AppConfig, windowMs: number, limit: number, code: string): RequestHandler {
  return rateLimit({
    windowMs,
    limit,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    skip: () => config.nodeEnv === 'test',
    handler: (_request, response) => {
      response.status(429).json({ error: code, message: 'Trop de tentatives, réessayez plus tard.' });
    },
  });
}

export function authRouter(config: AppConfig, auth: AuthService, cart: CartService): Router {
  const router = Router();
  const authLimiter = limiter(config, 15 * 60 * 1000, 20, 'TOO_MANY_ATTEMPTS');
  const resetLimiter = limiter(config, 60 * 60 * 1000, 5, 'TOO_MANY_ATTEMPTS');

  router.use(noStore);

  router.post('/register', authLimiter, asyncHandler(async (request, response) => {
    await auth.register(parseBody(registrationSchema, request.body));
    // Réponse identique que l'adresse soit nouvelle ou déjà enregistrée.
    response.status(202).json({ status: 'ok' });
  }));

  router.post('/login', authLimiter, asyncHandler(async (request, response) => {
    const { email, password } = parseBody(loginSchema, request.body);
    const session = await auth.login(email, password);
    setSessionCookies(response, config, session.accessToken, session.refreshToken);

    const guestToken = readCookie(request.cookies, CART_COOKIE);
    if (guestToken) {
      await cart.mergeGuestCart(guestToken, session.user.id);
      clearCartCookie(response, config);
    }
    response.json({ user: session.user });
  }));

  router.post('/refresh', asyncHandler(async (request, response) => {
    const token = readCookie(request.cookies, REFRESH_COOKIE);
    try {
      if (!token) throw new AppError(401, 'SESSION_EXPIRED', 'Session expirée, reconnectez-vous.');
      const session = await auth.refresh(token);
      setSessionCookies(response, config, session.accessToken, session.refreshToken);
      response.json({ user: session.user });
    } catch (error) {
      clearSessionCookies(response, config);
      throw error;
    }
  }));

  router.post('/logout', asyncHandler(async (request, response) => {
    await auth.logout(readCookie(request.cookies, REFRESH_COOKIE));
    clearSessionCookies(response, config);
    response.status(204).end();
  }));

  router.get('/me', requireAuth, asyncHandler(async (_request, response) => {
    const user = await auth.me(getAuth(response)!.userId);
    if (!user) {
      clearSessionCookies(response, config);
      throw new AppError(401, 'SESSION_EXPIRED', 'Session expirée, reconnectez-vous.');
    }
    response.json({ user });
  }));

  router.post('/password/forgot', resetLimiter, asyncHandler(async (request, response) => {
    const { email, locale } = parseBody(passwordForgotSchema, request.body);
    await auth.forgotPassword(email, locale);
    response.status(202).json({ status: 'ok' });
  }));

  router.post('/password/reset', resetLimiter, asyncHandler(async (request, response) => {
    const { token, password } = parseBody(passwordResetSchema, request.body);
    await auth.resetPassword(token, password);
    clearSessionCookies(response, config);
    response.json({ status: 'ok' });
  }));

  return router;
}
