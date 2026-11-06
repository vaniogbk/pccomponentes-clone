import type { RequestHandler } from 'express';
import type { z, ZodTypeAny } from 'zod';
import { unprocessable } from './errors.js';

/** Valide un corps de requête ; les erreurs de champ sont renvoyées pour que le site les traduise. */
export function parseBody<S extends ZodTypeAny>(schema: S, body: unknown): z.output<S> {
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    throw unprocessable('VALIDATION_FAILED', 'Certains champs sont invalides.', parsed.error.flatten().fieldErrors);
  }
  return parsed.data;
}

export const noStore: RequestHandler = (_request, response, next) => {
  response.setHeader('cache-control', 'no-store');
  next();
};
