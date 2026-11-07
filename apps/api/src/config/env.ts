import { randomBytes } from 'node:crypto';
import { z } from 'zod';

const emptyToUndefined = (value: unknown) => value === '' ? undefined : value;
const optionalSecret = z.preprocess(emptyToUndefined, z.string().min(32).optional());
const optionalUrl = z.preprocess(emptyToUndefined, z.string().url().optional());
const optionalBoolean = z.preprocess(emptyToUndefined, z.enum(['true', 'false']).transform((value) => value === 'true').optional());

const environmentSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65_535).default(4000),
  TRUST_PROXY: z.enum(['true', 'false']).transform((value) => value === 'true').default('false'),
  DATABASE_URL: optionalUrl,
  WEB_ORIGIN: z.string().optional(),
  PUBLIC_SITE_URL: optionalUrl,
  PROXY_SECRET: optionalSecret,
  JWT_ACCESS_SECRET: optionalSecret,
  JWT_REFRESH_SECRET: optionalSecret,
  ACCESS_TOKEN_TTL_SECONDS: z.preprocess(emptyToUndefined, z.coerce.number().int().min(60).max(3600).default(900)),
  REFRESH_TOKEN_TTL_DAYS: z.preprocess(emptyToUndefined, z.coerce.number().int().min(1).max(90).default(30)),
  COOKIE_SECURE: optionalBoolean,
  EMAIL_PROVIDER: z.preprocess(emptyToUndefined, z.enum(['console', 'brevo']).default('console')),
  BREVO_API_KEY: z.preprocess(emptyToUndefined, z.string().min(10).optional()),
  EMAIL_FROM: z.preprocess(emptyToUndefined, z.string().email().optional()),
  EMAIL_FROM_NAME: z.preprocess(emptyToUndefined, z.string().max(100).optional()),
  EMAIL_MAX_ATTEMPTS: z.preprocess(emptyToUndefined, z.coerce.number().int().min(1).max(10).default(5)),
  EMAIL_WORKER_INTERVAL_MS: z.preprocess(emptyToUndefined, z.coerce.number().int().min(1000).max(3_600_000).default(30_000)),
});

export type AppConfig = {
  nodeEnv: 'development' | 'test' | 'production';
  port: number;
  trustProxy: boolean;
  databaseUrl?: string;
  webOrigins: string[];
  publicSiteUrl?: string;
  proxySecret?: string;
  /** Signature des JWT d'accès. */
  jwtAccessSecret: string;
  /** Empreinte HMAC des jetons opaques (refresh, panier, réinitialisation). */
  jwtRefreshSecret: string;
  accessTokenTtlSeconds: number;
  refreshTokenTtlDays: number;
  cookieSecure: boolean;
  email: {
    provider: 'console' | 'brevo';
    brevoApiKey?: string;
    fromEmail?: string;
    /** Nom de l'expéditeur, aussi affiché en tête des e-mails. */
    fromName: string;
    maxAttempts: number;
    workerIntervalMs: number;
  };
};

export function readConfig(environment: NodeJS.ProcessEnv = process.env): AppConfig {
  const parsed = environmentSchema.safeParse(environment);

  if (!parsed.success) {
    const invalidKeys = [...new Set(parsed.error.issues.map((issue) => String(issue.path[0])))];
    throw new Error(`Configuration invalide. Vérifiez les variables : ${invalidKeys.join(', ')}.`);
  }

  const values = parsed.data;
  const webOrigins = values.WEB_ORIGIN
    ?.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean) ?? [];

  if (values.NODE_ENV === 'production') {
    const requiredKeys = [
      ['DATABASE_URL', values.DATABASE_URL],
      ['WEB_ORIGIN', webOrigins.length > 0 ? values.WEB_ORIGIN : undefined],
      ['PUBLIC_SITE_URL', values.PUBLIC_SITE_URL],
      ['PROXY_SECRET', values.PROXY_SECRET],
      ['JWT_ACCESS_SECRET', values.JWT_ACCESS_SECRET],
      ['JWT_REFRESH_SECRET', values.JWT_REFRESH_SECRET],
    ] as const;
    const missingKeys = requiredKeys
      .filter(([, value]) => value === undefined)
      .map(([key]) => key);

    if (missingKeys.length > 0) {
      throw new Error(`Configuration de production incomplète : ${missingKeys.join(', ')}.`);
    }
  }

  if (values.EMAIL_PROVIDER === 'brevo' && (!values.BREVO_API_KEY || !values.EMAIL_FROM)) {
    throw new Error('EMAIL_PROVIDER=brevo exige BREVO_API_KEY et EMAIL_FROM.');
  }

  if (values.JWT_ACCESS_SECRET && values.JWT_ACCESS_SECRET === values.JWT_REFRESH_SECRET) {
    throw new Error('JWT_ACCESS_SECRET et JWT_REFRESH_SECRET doivent être différents.');
  }

  // Hors production, des secrets éphémères permettent de démarrer sans configuration : les sessions
  // sont simplement perdues au redémarrage.
  const ephemeral = () => randomBytes(48).toString('base64url');

  return {
    nodeEnv: values.NODE_ENV,
    port: values.PORT,
    trustProxy: values.TRUST_PROXY,
    ...(values.DATABASE_URL && { databaseUrl: values.DATABASE_URL }),
    ...(values.PUBLIC_SITE_URL && { publicSiteUrl: values.PUBLIC_SITE_URL }),
    ...(values.PROXY_SECRET && { proxySecret: values.PROXY_SECRET }),
    webOrigins,
    jwtAccessSecret: values.JWT_ACCESS_SECRET ?? ephemeral(),
    jwtRefreshSecret: values.JWT_REFRESH_SECRET ?? ephemeral(),
    accessTokenTtlSeconds: values.ACCESS_TOKEN_TTL_SECONDS,
    refreshTokenTtlDays: values.REFRESH_TOKEN_TTL_DAYS,
    cookieSecure: values.COOKIE_SECURE ?? values.NODE_ENV === 'production',
    email: {
      provider: values.EMAIL_PROVIDER,
      ...(values.BREVO_API_KEY && { brevoApiKey: values.BREVO_API_KEY }),
      ...(values.EMAIL_FROM && { fromEmail: values.EMAIL_FROM }),
      fromName: values.EMAIL_FROM_NAME ?? 'La boutique',
      maxAttempts: values.EMAIL_MAX_ATTEMPTS,
      workerIntervalMs: values.EMAIL_WORKER_INTERVAL_MS,
    },
  };
}
