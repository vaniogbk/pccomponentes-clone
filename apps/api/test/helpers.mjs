import { execFileSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PrismaClient } from '@prisma/client';
import { createApp } from '../dist/app.js';

export const databaseUrl = process.env.TEST_DATABASE_URL;
const databaseName = databaseUrl ? new URL(databaseUrl).pathname.slice(1) : '';

/** Raison d'ignorer les tests d'intégration, ou `false` si la base de test est utilisable. */
export const skipDatabase = !databaseUrl
  ? 'TEST_DATABASE_URL non défini : tests d’intégration ignorés.'
  : !databaseName.endsWith('_test')
    ? `Refus : « ${databaseName} » n'est pas une base de test (suffixe _test requis).`
    : false;

export const testConfig = {
  nodeEnv: 'test',
  port: 0,
  trustProxy: false,
  webOrigins: ['http://localhost:3000'],
  jwtAccessSecret: 'access-secret-for-integration-tests-0123456789',
  jwtRefreshSecret: 'refresh-secret-for-integration-tests-0123456789',
  accessTokenTtlSeconds: 900,
  refreshTokenTtlDays: 30,
  cookieSecure: false,
};

const apiDirectory = resolve(dirname(fileURLToPath(import.meta.url)), '..');

export function migrateTestDatabase() {
  execFileSync(process.execPath, [resolve(apiDirectory, '../../node_modules/prisma/build/index.js'), 'migrate', 'deploy'], {
    cwd: apiDirectory,
    env: { ...process.env, DATABASE_URL: databaseUrl },
    stdio: 'ignore',
  });
  return new PrismaClient({ datasourceUrl: databaseUrl });
}

export async function resetDatabase(prisma) {
  const tables = await prisma.$queryRaw`
    SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename <> '_prisma_migrations'`;
  const list = tables.map(({ tablename }) => `"public"."${tablename}"`).join(', ');
  if (list) await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${list} RESTART IDENTITY CASCADE`);
}

export async function startServer(prisma, config = testConfig) {
  const server = createApp(config, { prisma }).listen(0);
  await new Promise((done) => server.once('listening', done));
  return { server, baseUrl: `http://127.0.0.1:${server.address().port}` };
}

export function stopServer(server) {
  return server ? new Promise((done) => server.close(done)) : Promise.resolve();
}

/** Client HTTP avec boîte à cookies et en-têtes CSRF, comme le site le ferait via son proxy. */
export function createClient(baseUrl) {
  const jar = new Map();

  return {
    jar,
    async request(method, path, body, { headers: extraHeaders = {} } = {}) {
      const headers = { 'x-pcc-csrf': '1', origin: 'http://localhost:3000', ...extraHeaders };
      if (body !== undefined) headers['content-type'] = 'application/json';
      const cookie = [...jar].map(([name, value]) => `${name}=${value}`).join('; ');
      if (cookie) headers.cookie = cookie;

      const response = await fetch(`${baseUrl}${path}`, {
        method,
        headers,
        body: body === undefined ? undefined : JSON.stringify(body),
      });
      const setCookie = response.headers.getSetCookie();
      for (const line of setCookie) {
        const [pair, ...attributes] = line.split(';');
        const separator = pair.indexOf('=');
        const name = pair.slice(0, separator).trim();
        const value = pair.slice(separator + 1);
        const expired = value === '' || attributes.some((attribute) => /expires=thu, 01 jan 1970/i.test(attribute.trim()));
        if (expired) jar.delete(name);
        else jar.set(name, value);
      }
      const text = await response.text();
      return { status: response.status, headers: response.headers, setCookie, body: text ? JSON.parse(text) : null };
    },
  };
}
