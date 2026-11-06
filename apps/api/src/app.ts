import { randomUUID, timingSafeEqual } from 'node:crypto';
import express, { type ErrorRequestHandler, type NextFunction, type Request, type Response } from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import pino from 'pino';
import { pinoHttp } from 'pino-http';
import type { PrismaClient } from '@prisma/client';
import type { AppConfig } from './config/env.js';
import { AppError } from './lib/errors.js';
import { getPrisma } from './lib/prisma.js';
import { createCatalogueRepository } from './repositories/catalogue.js';
import { catalogueRouter } from './routes/catalogue.js';

export interface AppDependencies {
  prisma?: PrismaClient;
}

const SAFE_REQUEST_ID = /^[A-Za-z0-9._-]{1,100}$/;
const WRITING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

export function createApp(config: AppConfig, dependencies: AppDependencies = {}) {
  const app = express();
  const prisma = dependencies.prisma ?? getPrisma();
  const logger = pino({ level: process.env.LOG_LEVEL ?? 'info' });

  app.disable('x-powered-by');
  app.set('trust proxy', config.trustProxy);

  app.use((request, response, next) => {
    const suppliedId = request.header('x-request-id');
    const requestId = suppliedId && SAFE_REQUEST_ID.test(suppliedId) ? suppliedId : randomUUID();

    response.setHeader('x-request-id', requestId);
    response.locals.requestId = requestId;
    next();
  });

  app.use(pinoHttp({
    logger,
    genReqId: (request, response) => {
      const requestId = String(response.getHeader('x-request-id') ?? randomUUID());
      response.setHeader('x-request-id', requestId);
      return requestId;
    },
    serializers: {
      req(request) {
        return {
          id: request.id,
          method: request.method,
          path: request.url?.split('?')[0],
        };
      },
      res(response) {
        return { statusCode: response.statusCode };
      },
    },
    customLogLevel(request, response, error) {
      if (request.url?.split('?')[0] === '/api/health') {
        return 'silent';
      }

      if (error || response.statusCode >= 500) {
        return 'error';
      }

      if (response.statusCode >= 400) {
        return 'warn';
      }

      return 'info';
    },
  }));

  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'none'"],
        frameAncestors: ["'none'"],
      },
    },
    crossOriginResourcePolicy: { policy: 'same-site' },
  }));

  app.use((request, response, next) => {
    if (request.path === '/api/health' || !config.proxySecret) {
      next();
      return;
    }

    const supplied = Buffer.from(request.header('x-pcc-proxy') ?? '');
    const expected = Buffer.from(config.proxySecret);
    const valid = supplied.length === expected.length && timingSafeEqual(supplied, expected);

    if (!valid) {
      response.status(403).json({ error: 'PROXY_REQUIRED' });
      return;
    }

    next();
  });

  app.use('/api', rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 600,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    skip: (request) => request.path === '/health',
  }));

  app.use(express.json({ limit: '100kb' }));

  app.use((request, response, next) => {
    if (!WRITING_METHODS.has(request.method)) {
      next();
      return;
    }

    const originHeader = request.header('origin') ?? request.header('referer');
    const originIsAllowed = originHeader === undefined
      ? true
      : config.webOrigins.some((allowedOrigin) => {
          try {
            return new URL(originHeader).origin === new URL(allowedOrigin).origin;
          } catch {
            return false;
          }
        });

    if (request.header('x-pcc-csrf') !== '1' || !originIsAllowed) {
      response.status(403).json({ error: 'CSRF_REJECTED' });
      return;
    }

    next();
  });

  app.get('/api/health', (_request, response) => {
    response.setHeader('cache-control', 'no-store');
    response.status(200).json({ status: 'ok' });
  });

  app.use('/api/catalogue', catalogueRouter(createCatalogueRepository(prisma)));

  app.use('/api', (_request, response) => {
    response.status(404).json({ error: 'NOT_FOUND' });
  });

  const errorHandler: ErrorRequestHandler = (
    error: unknown,
    _request: Request,
    response: Response,
    _next: NextFunction,
  ) => {
    if (error instanceof AppError) {
      response.status(error.status).json({
        error: error.code,
        message: error.message,
        ...(error.details !== undefined && { details: error.details }),
      });
      return;
    }

    const bodyError = error as { type?: string; status?: number };
    if (bodyError.type === 'entity.parse.failed') {
      response.status(400).json({ error: 'INVALID_JSON', message: 'Corps de requête JSON invalide.' });
      return;
    }
    if (bodyError.type === 'entity.too.large') {
      response.status(413).json({ error: 'PAYLOAD_TOO_LARGE', message: 'Corps de requête trop volumineux.' });
      return;
    }

    // Seuls le nom et l'identifiant de requête sont journalisés : jamais le corps ni les en-têtes.
    logger.error(
      { requestId: response.locals.requestId, errorName: error instanceof Error ? error.name : typeof error },
      'Unhandled API error',
    );
    response.status(500).json({ error: 'INTERNAL_ERROR', message: 'Erreur interne.' });
  };

  app.use(errorHandler);

  return app;
}
