import type { CookieOptions, Response } from 'express';
import type { AppConfig } from '../config/env.js';

export const ACCESS_COOKIE = 'pcc_at';
export const REFRESH_COOKIE = 'pcc_rt';
export const CART_COOKIE = 'pcc_cart';

const DAY_MS = 24 * 60 * 60 * 1000;
export const CART_TTL_DAYS = 30;

function base(config: AppConfig): CookieOptions {
  return { httpOnly: true, secure: config.cookieSecure };
}

export function setSessionCookies(response: Response, config: AppConfig, accessToken: string, refreshToken: string) {
  response.cookie(ACCESS_COOKIE, accessToken, {
    ...base(config),
    sameSite: 'lax',
    path: '/',
    maxAge: config.accessTokenTtlSeconds * 1000,
  });
  response.cookie(REFRESH_COOKIE, refreshToken, {
    ...base(config),
    sameSite: 'strict',
    path: '/api/auth',
    maxAge: config.refreshTokenTtlDays * DAY_MS,
  });
}

export function clearSessionCookies(response: Response, config: AppConfig) {
  response.clearCookie(ACCESS_COOKIE, { ...base(config), sameSite: 'lax', path: '/' });
  response.clearCookie(REFRESH_COOKIE, { ...base(config), sameSite: 'strict', path: '/api/auth' });
}

export function setCartCookie(response: Response, config: AppConfig, token: string) {
  response.cookie(CART_COOKIE, token, { ...base(config), sameSite: 'lax', path: '/', maxAge: CART_TTL_DAYS * DAY_MS });
}

export function clearCartCookie(response: Response, config: AppConfig) {
  response.clearCookie(CART_COOKIE, { ...base(config), sameSite: 'lax', path: '/' });
}

/** Lit un cookie sous forme de chaîne bornée, sans jamais le journaliser. */
export function readCookie(cookies: unknown, name: string): string | undefined {
  if (!cookies || typeof cookies !== 'object') return undefined;
  const value = (cookies as Record<string, unknown>)[name];
  return typeof value === 'string' && value.length > 0 && value.length <= 2048 ? value : undefined;
}
