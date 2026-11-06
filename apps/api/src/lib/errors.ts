import type { NextFunction, Request, RequestHandler, Response } from 'express';

/**
 * Erreur métier avec un code stable que le site traduit. Le message n'est jamais affiché tel quel au client
 * en production pour les erreurs 5xx.
 */
export class AppError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export const notFound = (code = 'NOT_FOUND', message = 'Ressource introuvable.') => new AppError(404, code, message);
export const forbidden = (code = 'FORBIDDEN', message = 'Accès refusé.') => new AppError(403, code, message);
export const unauthorized = (code = 'UNAUTHORIZED', message = 'Authentification requise.') => new AppError(401, code, message);
export const unprocessable = (code: string, message: string, details?: unknown) => new AppError(422, code, message, details);

/** Transmet les rejets de promesse au gestionnaire d'erreurs central (Express 4 ne le fait pas seul). */
export function asyncHandler(
  handler: (request: Request, response: Response, next: NextFunction) => Promise<void>,
): RequestHandler {
  return (request, response, next) => {
    handler(request, response, next).catch(next);
  };
}
