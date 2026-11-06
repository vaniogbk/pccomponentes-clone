import assert from 'node:assert/strict';
import test from 'node:test';
import { createApp } from '../dist/app.js';
import { readConfig } from '../dist/config/env.js';

const config = {
  nodeEnv: 'test',
  port: 4000,
  trustProxy: false,
  webOrigins: ['http://localhost:3000'],
  proxySecret: 'proxy-secret-for-tests-that-is-at-least-32',
};

test('health is public, unlogged, and explicitly non-cacheable', async (context) => {
  const server = createApp(config).listen(0);
  context.after(() => new Promise((resolve, reject) => {
    server.close((error) => error ? reject(error) : resolve());
  }));
  await new Promise((resolve) => server.once('listening', resolve));
  const address = server.address();

  assert.ok(address && typeof address !== 'string');
  const response = await fetch(`http://127.0.0.1:${address.port}/api/health`);

  assert.equal(response.status, 200);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  assert.equal(response.headers.get('x-request-id')?.length, 36);
  assert.deepEqual(await response.json(), { status: 'ok' });
});

test('writes enforce the proxy secret and CSRF header', async (context) => {
  const server = createApp(config).listen(0);
  context.after(() => new Promise((resolve, reject) => {
    server.close((error) => error ? reject(error) : resolve());
  }));
  await new Promise((resolve) => server.once('listening', resolve));
  const address = server.address();

  assert.ok(address && typeof address !== 'string');
  const endpoint = `http://127.0.0.1:${address.port}/api/orders`;
  const direct = await fetch(endpoint, { method: 'POST' });
  assert.equal(direct.status, 403);
  assert.deepEqual(await direct.json(), { error: 'PROXY_REQUIRED' });

  const withoutCsrf = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'x-pcc-proxy': config.proxySecret,
      origin: 'http://localhost:3000',
    },
  });
  assert.equal(withoutCsrf.status, 403);
  assert.deepEqual(await withoutCsrf.json(), { error: 'CSRF_REJECTED' });

  const wrongOrigin = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'x-pcc-proxy': config.proxySecret,
      'x-pcc-csrf': '1',
      origin: 'https://attacker.example',
    },
  });
  assert.equal(wrongOrigin.status, 403);
});

test('production configuration reports missing keys without echoing values', () => {
  assert.throws(
    () => readConfig({ NODE_ENV: 'production', JWT_ACCESS_SECRET: 'too-short' }),
    (error) => error instanceof Error && !error.message.includes('too-short'),
  );

  assert.throws(
    () => readConfig({
      NODE_ENV: 'production',
      DATABASE_URL: 'postgresql://localhost/store',
      WEB_ORIGIN: 'https://store.example',
      PUBLIC_SITE_URL: 'https://store.example',
      PROXY_SECRET: 'p'.repeat(32),
      JWT_ACCESS_SECRET: 'same-secret-that-is-long-enough-123456',
      JWT_REFRESH_SECRET: 'same-secret-that-is-long-enough-123456',
    }),
    /doivent être différents/,
  );
});
