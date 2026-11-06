import { z } from 'zod';

const emptyToUndefined = (value: unknown) => value === '' ? undefined : value;
const optionalSecret = z.preprocess(emptyToUndefined, z.string().min(32).optional());
const optionalUrl = z.preprocess(emptyToUndefined, z.string().url().optional());

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
});

export type AppConfig = {
  nodeEnv: 'development' | 'test' | 'production';
  port: number;
  trustProxy: boolean;
  databaseUrl?: string;
  webOrigins: string[];
  publicSiteUrl?: string;
  proxySecret?: string;
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

    if (values.JWT_ACCESS_SECRET === values.JWT_REFRESH_SECRET) {
      throw new Error('JWT_ACCESS_SECRET et JWT_REFRESH_SECRET doivent être différents.');
    }
  }

  return {
    nodeEnv: values.NODE_ENV,
    port: values.PORT,
    trustProxy: values.TRUST_PROXY,
    ...(values.DATABASE_URL && { databaseUrl: values.DATABASE_URL }),
    ...(values.PUBLIC_SITE_URL && { publicSiteUrl: values.PUBLIC_SITE_URL }),
    ...(values.PROXY_SECRET && { proxySecret: values.PROXY_SECRET }),
    webOrigins,
  };
}
