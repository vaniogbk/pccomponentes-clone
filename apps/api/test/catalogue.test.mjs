import assert from 'node:assert/strict';
import test, { after, before } from 'node:test';
import { migrateTestDatabase, resetDatabase, skipDatabase as skip, startServer, stopServer } from './helpers.mjs';

let prisma;
let server;
let baseUrl;

async function get(path) {
  const response = await fetch(`${baseUrl}${path}`);
  return { status: response.status, headers: response.headers, body: await response.json() };
}

async function createProduct({ reference, slug, name, brand, categoryId, univers, status = 'ACTIVE', isFeatured = false, variants }) {
  const prices = variants.filter((variant) => variant.isActive !== false).map((variant) => variant.priceCents);
  return prisma.product.create({
    data: {
      reference,
      slug,
      name,
      brand,
      categoryId,
      univers,
      status,
      isFeatured,
      priceFromCents: prices.length ? Math.min(...prices) : null,
      images: { create: [{ url: `/images/${slug}.webp`, alt: name, width: 800, height: 800 }] },
      variants: {
        create: variants.map((variant, position) => ({
          sku: variant.sku,
          sizeId: variant.sizeId,
          priceCents: variant.priceCents,
          isActive: variant.isActive ?? true,
          position,
          stock: { create: { quantity: variant.stock } },
        })),
      },
    },
  });
}

before(async () => {
  if (skip) return;

  prisma = migrateTestDatabase();
  await resetDatabase(prisma);

  const gpu = await prisma.category.create({ data: { slug: 'cartes-graphiques', name: 'Cartes Graphiques', univers: 'CARTES_GRAPHIQUES', isVisible: true, position: 1 } });
  const consoles = await prisma.category.create({ data: { slug: 'consoles', name: 'Consoles', univers: 'CONSOLES', isVisible: true, position: 2 } });
  const hidden = await prisma.category.create({ data: { slug: 'cachee', name: 'Cachée', isVisible: false, position: 3 } });
  const unique = await prisma.size.create({ data: { system: 'ONE_SIZE', label: 'Taille unique' } });
  const storage = await prisma.size.create({ data: { system: 'STORAGE', label: '1 To', sortOrder: 1 } });
  const storage2 = await prisma.size.create({ data: { system: 'STORAGE', label: '2 To', sortOrder: 2 } });

  await createProduct({
    reference: 'TST-001', slug: 'carte-alpha', name: 'Carte Alpha', brand: 'Marque A', categoryId: gpu.id,
    univers: 'CARTES_GRAPHIQUES', isFeatured: true,
    variants: [{ sku: 'TST-001-U', sizeId: unique.id, priceCents: 100000, stock: 25 }],
  });
  await createProduct({
    reference: 'TST-002', slug: 'carte-beta', name: 'Carte Beta', brand: 'Marque B', categoryId: gpu.id,
    univers: 'CARTES_GRAPHIQUES',
    variants: [{ sku: 'TST-002-U', sizeId: unique.id, priceCents: 50000, stock: 0 }],
  });
  await createProduct({
    reference: 'TST-003', slug: 'console-gamma', name: 'Console Gamma', brand: 'Marque A', categoryId: consoles.id,
    univers: 'CONSOLES',
    variants: [
      { sku: 'TST-003-1', sizeId: storage.id, priceCents: 40000, stock: 2 },
      { sku: 'TST-003-2', sizeId: storage2.id, priceCents: 55000, stock: 9 },
      { sku: 'TST-003-X', sizeId: unique.id, priceCents: 1000, stock: 50, isActive: false },
    ],
  });
  await createProduct({
    reference: 'TST-004', slug: 'brouillon', name: 'Brouillon', brand: 'Marque A', categoryId: gpu.id,
    univers: 'CARTES_GRAPHIQUES', status: 'DRAFT',
    variants: [{ sku: 'TST-004-U', sizeId: unique.id, priceCents: 1000, stock: 5 }],
  });
  await createProduct({
    reference: 'TST-005', slug: 'produit-cache', name: 'Produit caché', brand: 'Marque A', categoryId: hidden.id,
    univers: 'CONSOLES',
    variants: [{ sku: 'TST-005-U', sizeId: unique.id, priceCents: 1000, stock: 5 }],
  });

  const started = await startServer(prisma);
  server = started.server;
  baseUrl = `${started.baseUrl}/api/catalogue`;
});

after(async () => {
  await stopServer(server);
  if (prisma) {
    await resetDatabase(prisma);
    await prisma.$disconnect();
  }
});

test('the public list only contains published products from visible categories', { skip }, async () => {
  const { status, headers, body } = await get('/products');
  assert.equal(status, 200);
  assert.match(headers.get('cache-control'), /s-maxage=60/);
  assert.deepEqual(body.items.map((item) => item.slug).sort(), ['carte-alpha', 'carte-beta', 'console-gamma']);
  assert.equal(body.total, 3);
  assert.equal(body.items[0].slug, 'carte-alpha', 'featured products come first');
  assert.deepEqual(body.facets.brands, [{ value: 'Marque A', count: 2 }, { value: 'Marque B', count: 1 }]);
  assert.deepEqual(body.facets.sizes.map((size) => size.label), ['Taille unique', '1 To', '2 To']);
});

test('exact stock is never exposed above the low-stock threshold', { skip }, async () => {
  const { body } = await get('/products');
  const bySlug = Object.fromEntries(body.items.map((item) => [item.slug, item]));
  assert.equal(bySlug['carte-alpha'].availability, 'IN_STOCK');
  assert.equal(bySlug['carte-alpha'].remaining, undefined);
  assert.equal(bySlug['carte-beta'].availability, 'OUT_OF_STOCK');
  // Variantes actives de la console : 2 + 9 = 11 (la variante inactive n'est pas comptée).
  assert.equal(bySlug['console-gamma'].availability, 'IN_STOCK');
  assert.equal(bySlug['console-gamma'].priceFromCents, 40000, 'inactive variants do not lower the price');
  assert.equal(bySlug['console-gamma'].priceToCents, 55000);
  assert.ok(!JSON.stringify(body).includes('"quantity"'));
});

test('filters, search and sorting combine', { skip }, async () => {
  assert.deepEqual((await get('/products?inStock=true&sort=price_asc')).body.items.map((item) => item.slug), ['console-gamma', 'carte-alpha']);
  assert.deepEqual((await get('/products?sort=price_desc')).body.items.map((item) => item.slug), ['carte-alpha', 'carte-beta', 'console-gamma']);
  assert.deepEqual((await get('/products?q=GAMMA')).body.items.map((item) => item.slug), ['console-gamma']);
  assert.deepEqual((await get('/products?brand=marque%20b')).body.items.map((item) => item.slug), ['carte-beta']);
  assert.deepEqual((await get('/products?univers=CONSOLES')).body.items.map((item) => item.slug), ['console-gamma']);
  assert.deepEqual((await get('/products?size=2%20To')).body.items.map((item) => item.slug), ['console-gamma']);
  assert.deepEqual((await get('/products?minPriceCents=45000&maxPriceCents=60000')).body.items.map((item) => item.slug).sort(), ['carte-beta', 'console-gamma']);
  const category = await get('/products?category=consoles');
  assert.equal(category.body.category.name, 'Consoles');
  assert.equal(category.body.total, 1);
});

test('invalid filters and hidden categories are rejected with stable codes', { skip }, async () => {
  const invalid = await get('/products?sort=random');
  assert.equal(invalid.status, 422);
  assert.equal(invalid.body.error, 'INVALID_QUERY');
  assert.equal((await get('/products?category=cachee')).body.error, 'CATEGORY_NOT_FOUND');
  assert.equal((await get('/products?category=inexistante')).status, 404);
});

test('product detail returns active variants and hides drafts', { skip }, async () => {
  const { status, body } = await get('/products/console-gamma');
  assert.equal(status, 200);
  assert.deepEqual(body.product.variants.map((variant) => variant.sku), ['TST-003-1', 'TST-003-2']);
  assert.equal(body.product.variants[0].availability, 'LOW_STOCK');
  assert.equal(body.product.variants[0].remaining, 2);
  assert.equal(body.product.variants[1].remaining, undefined);
  assert.deepEqual(body.product.breadcrumbs, [{ slug: 'consoles', name: 'Consoles' }]);

  for (const slug of ['brouillon', 'produit-cache', 'inexistant', 'Pas%20un%20slug']) {
    const response = await get(`/products/${slug}`);
    assert.equal(response.status, 404, slug);
    assert.equal(response.body.error, 'PRODUCT_NOT_FOUND');
  }
});

test('categories, home and sitemap only expose public content', { skip }, async () => {
  const categories = (await get('/categories')).body.categories;
  assert.deepEqual(categories.map((category) => [category.slug, category.productCount]), [['cartes-graphiques', 2], ['consoles', 1]]);

  const home = (await get('/home')).body;
  assert.deepEqual(home.featured.map((item) => item.slug), ['carte-alpha']);
  assert.equal(home.newest.length, 3);

  const sitemap = (await get('/sitemap')).body;
  assert.deepEqual(sitemap.products.map((product) => product.slug), ['carte-alpha', 'carte-beta', 'console-gamma']);
  assert.deepEqual(sitemap.categories.map((category) => category.slug), ['cartes-graphiques', 'consoles']);
});
