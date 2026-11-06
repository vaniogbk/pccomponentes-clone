import type { PrismaClient } from '@prisma/client';
import type { RequestHandler, Response } from 'express';
import type { AppConfig } from '../config/env.js';
import { ACCESS_COOKIE, readCookie } from '../lib/cookies.js';
import { asyncHandler, forbidden, unauthorized } from '../lib/errors.js';
import { type AccessClaims, verifyAccessToken } from '../lib/tokens.js';

export function getAuth(response: Response): AccessClaims | undefined {
  return response.locals.auth as AccessClaims | undefined;
}

/** Lit le JWT d'accès (cookie httpOnly, ou en-tête Bearer pour les outils) sans rien exiger. */
export function optionalAuth(config: AppConfig): RequestHandler {
  return (request, response, next) => {
    const header = request.header('authorization');
    const bearer = header?.startsWith('Bearer ') ? header.slice(7).trim() : undefined;
    const token = bearer || readCookie(request.cookies, ACCESS_COOKIE);
    const claims = token ? verifyAccessToken(config.jwtAccessSecret, token) : null;
    if (claims) response.locals.auth = claims;
    next();
  };
}

export const requireAuth: RequestHandler = (_request, response, next) => {
  if (!getAuth(response)) {
    next(unauthorized('AUTH_REQUIRED', 'Connexion requise.'));
    return;
  }
  next();
};

/** Le rôle et l'activation sont revérifiés en base à chaque requête : un compte rétrogradé perd l'accès aussitôt. */
export function requireAdmin(prisma: PrismaClient): RequestHandler {
  return asyncHandler(async (_request, response, next) => {
    const auth = getAuth(response);
    if (!auth) throw unauthorized('AUTH_REQUIRED', 'Connexion requise.');

    const user = await prisma.user.findUnique({ where: { id: auth.userId }, select: { role: true, isActive: true } });
    if (!user || !user.isActive || user.role !== 'ADMIN') throw forbidden('ADMIN_REQUIRED', 'Accès réservé à l’administration.');

    next();
  });
}
