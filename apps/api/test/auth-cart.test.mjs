import assert from 'node:assert/strict';
import test, { after, before } from 'node:test';
import { createClient, migrateTestDatabase, resetDatabase, skipDatabase as skip, startServer, stopServer } from './helpers.mjs';

const PASSWORD = 'un-mot-de-passe-solide';
let prisma;
let server;
let baseUrl;
const variants = {};

async function register(client, email, password = PASSWORD) {
  return client.request('POST', '/api/auth/register', { email, password, firstName: 'Alex', lastName: 'Martin' });
}

async function login(client, email, password = PASSWORD) {
  return client.request('POST', '/api/auth/login', { email, password });
}

before(async () => {
  if (skip) return;
  prisma = migrateTestDatabase();
  await resetDatabase(prisma);

  const category = await prisma.category.create({ data: { slug: 'consoles', name: 'Consoles', isVisible: true } });
  const size = await prisma.size.create({ data: { system: 'ONE_SIZE', label: 'Taille unique' } });
  const make = async (reference, status, stock, priceCents) => {
    const product = await prisma.product.create({
      data: {
        reference, slug: reference.toLowerCase(), name: `Produit ${reference}`, brand: 'Marque', categoryId: category.id,
        univers: 'CONSOLES', status, priceFromCents: priceCents,
        variants: { create: [{ sku: `${reference}-U`, sizeId: size.id, priceCents, isActive: true, stock: { create: { quantity: stock } } }] },
      },
      include: { variants: true },
    });
    return product.variants[0].id;
  };
  variants.plenty = await make('TST-100', 'ACTIVE', 50, 29990);
  variants.scarce = await make('TST-101', 'ACTIVE', 2, 4990);
  variants.draft = await make('TST-102', 'DRAFT', 10, 1000);

  ({ server, baseUrl } = await startServer(prisma));
});

after(async () => {
  await stopServer(server);
  if (prisma) {
    await resetDatabase(prisma);
    await prisma.$disconnect();
  }
});

test('registration answers identically for new and existing addresses and never opens a session', { skip }, async () => {
  const client = createClient(baseUrl);
  const first = await register(client, 'Client@Example.fr');
  const again = await register(client, 'client@example.fr', 'un-autre-mot-de-passe');

  assert.equal(first.status, 202);
  assert.deepEqual(again, { ...first, headers: again.headers });
  assert.equal(first.setCookie.length, 0);

  const user = await prisma.user.findUnique({ where: { email: 'client@example.fr' } });
  assert.match(user.passwordHash, /^\$argon2id\$/);
  assert.equal(user.role, 'CLIENT');
  assert.equal((await login(client, 'client@example.fr')).status, 200, 'the original password still works');
  assert.equal((await register(client, 'pas-un-email', 'court')).body.error, 'VALIDATION_FAILED');
});

test('login sets hardened cookies and errors do not reveal whether an account exists', { skip }, async () => {
  const client = createClient(baseUrl);
  await register(client, 'login@example.fr');

  const unknown = await login(client, 'inconnu@example.fr');
  const wrong = await login(client, 'login@example.fr', 'mauvais-mot-de-passe');
  assert.equal(unknown.status, 401);
  assert.deepEqual(unknown.body, wrong.body);
  assert.equal(wrong.body.error, 'INVALID_CREDENTIALS');

  const ok = await login(client, 'login@example.fr');
  assert.equal(ok.status, 200);
  assert.equal(ok.body.user.email, 'login@example.fr');
  assert.equal(ok.body.user.passwordHash, undefined);
  assert.equal(ok.headers.get('cache-control'), 'no-store');

  const access = ok.setCookie.find((line) => line.startsWith('pcc_at='));
  const refresh = ok.setCookie.find((line) => line.startsWith('pcc_rt='));
  assert.match(access, /HttpOnly/);
  assert.match(access, /SameSite=Lax/);
  assert.match(access, /Path=\//);
  assert.match(refresh, /HttpOnly/);
  assert.match(refresh, /SameSite=Strict/);
  assert.match(refresh, /Path=\/api\/auth/);

  const stored = await prisma.refreshToken.findMany({ where: { user: { email: 'login@example.fr' } } });
  assert.equal(stored.length, 1);
  assert.notEqual(stored[0].tokenHash, client.jar.get('pcc_rt'), 'only the HMAC fingerprint is stored');

  const me = await client.request('GET', '/api/auth/me');
  assert.equal(me.body.user.email, 'login@example.fr');
  assert.equal((await createClient(baseUrl).request('GET', '/api/auth/me')).body.error, 'AUTH_REQUIRED');
});

test('five failures lock the account for fifteen minutes, even with the right password', { skip }, async () => {
  const client = createClient(baseUrl);
  await register(client, 'lock@example.fr');
  for (let attempt = 0; attempt < 5; attempt += 1) {
    assert.equal((await login(client, 'lock@example.fr', 'mauvais-mot-de-passe')).status, 401);
  }
  const locked = await login(client, 'lock@example.fr');
  assert.equal(locked.status, 401);
  assert.equal(locked.body.error, 'INVALID_CREDENTIALS');

  const user = await prisma.user.findUnique({ where: { email: 'lock@example.fr' } });
  assert.ok(user.lockedUntil.getTime() > Date.now() + 14 * 60 * 1000);

  await prisma.user.update({ where: { id: user.id }, data: { lockedUntil: new Date(Date.now() - 1000) } });
  assert.equal((await login(client, 'lock@example.fr')).status, 200);
});

test('refresh tokens rotate and a reused token revokes the whole session family', { skip }, async () => {
  const client = createClient(baseUrl);
  await register(client, 'rotation@example.fr');
  await login(client, 'rotation@example.fr');
  const firstToken = client.jar.get('pcc_rt');

  const rotated = await client.request('POST', '/api/auth/refresh');
  assert.equal(rotated.status, 200);
  const secondToken = client.jar.get('pcc_rt');
  assert.notEqual(secondToken, firstToken);

  const thief = createClient(baseUrl);
  thief.jar.set('pcc_rt', firstToken);
  const reuse = await thief.request('POST', '/api/auth/refresh');
  assert.equal(reuse.status, 401);
  assert.equal(reuse.body.error, 'SESSION_EXPIRED');

  const legit = await client.request('POST', '/api/auth/refresh');
  assert.equal(legit.status, 401, 'the legitimate session is revoked too');
  assert.equal(client.jar.has('pcc_rt'), false, 'cookies are cleared');
});

test('logout revokes the refresh token', { skip }, async () => {
  const client = createClient(baseUrl);
  await register(client, 'logout@example.fr');
  await login(client, 'logout@example.fr');
  const token = client.jar.get('pcc_rt');

  assert.equal((await client.request('POST', '/api/auth/logout')).status, 204);
  assert.equal(client.jar.has('pcc_at'), false);

  const replay = createClient(baseUrl);
  replay.jar.set('pcc_rt', token);
  assert.equal((await replay.request('POST', '/api/auth/refresh')).status, 401);
});

test('password reset is silent, rate limited per account, single use and closes sessions', { skip }, async () => {
  const client = createClient(baseUrl);
  await register(client, 'reset@example.fr');
  await login(client, 'reset@example.fr');
  const oldRefresh = client.jar.get('pcc_rt');

  const unknown = await client.request('POST', '/api/auth/password/forgot', { email: 'personne@example.fr' });
  const known = await client.request('POST', '/api/auth/password/forgot', { email: 'reset@example.fr' });
  assert.equal(unknown.status, 202);
  assert.deepEqual(unknown.body, known.body);

  for (let attempt = 0; attempt < 3; attempt += 1) {
    await client.request('POST', '/api/auth/password/forgot', { email: 'reset@example.fr' });
  }
  const emails = await prisma.emailMessage.findMany({ where: { template: 'password-reset' }, orderBy: { createdAt: 'asc' } });
  assert.equal(emails.length, 3, 'at most three links per account per hour');
  assert.ok(emails.every((email) => email.toAddress === 'reset@example.fr'));

  const token = new URL(emails[0].payload.resetUrl).searchParams.get('token');
  assert.ok(emails[0].payload.resetUrl.startsWith('http://localhost:3000/compte/reinitialiser?token='));

  const reset = await client.request('POST', '/api/auth/password/reset', { token, password: 'nouveau-mot-de-passe-solide' });
  assert.equal(reset.status, 200);
  assert.equal((await client.request('POST', '/api/auth/password/reset', { token, password: 'encore-un-autre-mot-de-passe' })).body.error, 'RESET_TOKEN_INVALID');

  assert.equal((await login(createClient(baseUrl), 'reset@example.fr')).status, 401);
  assert.equal((await login(createClient(baseUrl), 'reset@example.fr', 'nouveau-mot-de-passe-solide')).status, 200);

  const replay = createClient(baseUrl);
  replay.jar.set('pcc_rt', oldRefresh);
  assert.equal((await replay.request('POST', '/api/auth/refresh')).status, 401, 'sessions opened before the reset are closed');
});

test('guest cart: add, update, remove, with limits and availability checks', { skip }, async () => {
  const client = createClient(baseUrl);

  const added = await client.request('POST', '/api/cart/items', { variantId: variants.plenty, quantity: 2 });
  assert.equal(added.status, 201);
  assert.match(added.setCookie.find((line) => line.startsWith('pcc_cart=')), /HttpOnly/);
  assert.equal(added.body.cart.subtotalCents, 59980);
  assert.equal(added.body.cart.itemCount, 2);
  assert.equal(added.body.cart.canCheckout, true);
  assert.equal(added.body.cart.lines[0].availability, 'IN_STOCK');

  const stored = await prisma.cart.findFirst({ where: { userId: null } });
  assert.notEqual(stored.tokenHash, client.jar.get('pcc_cart'));

  const again = await client.request('POST', '/api/cart/items', { variantId: variants.plenty, quantity: 3 });
  assert.equal(again.body.cart.lines[0].quantity, 5, 'adding the same variant increments the line');
  assert.equal(again.setCookie.length, 0, 'the cart cookie is only set once');

  const overLimit = await client.request('POST', '/api/cart/items', { variantId: variants.plenty, quantity: 6 });
  assert.equal(overLimit.body.error, 'QUANTITY_LIMIT');
  assert.equal((await client.request('POST', '/api/cart/items', { variantId: variants.plenty, quantity: 11 })).body.error, 'VALIDATION_FAILED');

  const scarce = await client.request('POST', '/api/cart/items', { variantId: variants.scarce, quantity: 3 });
  assert.equal(scarce.body.error, 'INSUFFICIENT_STOCK');
  assert.deepEqual(scarce.body.details, { maxQuantity: 2 });
  assert.equal((await client.request('POST', '/api/cart/items', { variantId: variants.draft, quantity: 1 })).body.error, 'VARIANT_UNAVAILABLE');
  assert.equal((await client.request('POST', '/api/cart/items', { variantId: 'inexistant', quantity: 1 })).body.error, 'VARIANT_UNAVAILABLE');

  const updated = await client.request('PATCH', `/api/cart/items/${variants.plenty}`, { quantity: 1 });
  assert.equal(updated.body.cart.subtotalCents, 29990);
  const removed = await client.request('DELETE', `/api/cart/items/${variants.plenty}`);
  assert.deepEqual(removed.body.cart.lines, []);
  assert.equal(removed.body.cart.canCheckout, false);

  const missingCsrf = await client.request('POST', '/api/cart/items', { variantId: variants.plenty, quantity: 1 }, { headers: { 'x-pcc-csrf': '0' } });
  assert.equal(missingCsrf.status, 403);
});

test('a line whose stock dropped is flagged in the cart and excluded from the total', { skip }, async () => {
  const client = createClient(baseUrl);
  await client.request('POST', '/api/cart/items', { variantId: variants.plenty, quantity: 1 });
  await client.request('POST', '/api/cart/items', { variantId: variants.scarce, quantity: 2 });

  await prisma.stock.update({ where: { variantId: variants.scarce }, data: { quantity: 1 } });
  const cart = (await client.request('GET', '/api/cart')).body.cart;
  const scarceLine = cart.lines.find((line) => line.variantId === variants.scarce);
  assert.equal(scarceLine.issue, 'INSUFFICIENT_STOCK');
  assert.equal(scarceLine.remaining, 1);
  assert.equal(cart.subtotalCents, 29990);
  assert.equal(cart.hasIssues, true);
  assert.equal(cart.canCheckout, false);
  await prisma.stock.update({ where: { variantId: variants.scarce }, data: { quantity: 2 } });
});

test('logging in merges the guest cart into the account cart, capped per line', { skip }, async () => {
  const owner = createClient(baseUrl);
  await register(owner, 'merge@example.fr');
  await login(owner, 'merge@example.fr');
  await owner.request('POST', '/api/cart/items', { variantId: variants.plenty, quantity: 9 });

  const guest = createClient(baseUrl);
  await guest.request('POST', '/api/cart/items', { variantId: variants.plenty, quantity: 4 });
  await guest.request('POST', '/api/cart/items', { variantId: variants.scarce, quantity: 1 });
  const guestCarts = await prisma.cart.count({ where: { userId: null } });

  const loggedIn = await login(guest, 'merge@example.fr');
  assert.equal(loggedIn.status, 200);
  assert.equal(guest.jar.has('pcc_cart'), false, 'the guest cookie is cleared');
  assert.equal(await prisma.cart.count({ where: { userId: null } }), guestCarts - 1, 'the guest cart is deleted');

  const cart = (await guest.request('GET', '/api/cart')).body.cart;
  const quantities = Object.fromEntries(cart.lines.map((line) => [line.variantId, line.quantity]));
  assert.deepEqual(quantities, { [variants.plenty]: 10, [variants.scarce]: 1 });
});
