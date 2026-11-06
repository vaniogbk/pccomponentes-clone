import { Router } from 'express';
import { productQuerySchema, slugSchema } from '@pcc/shared/schemas';
import { asyncHandler, notFound, unprocessable } from '../lib/errors.js';
import type { CatalogueRepository } from '../repositories/catalogue.js';

/** Les réponses publiques peuvent être mises en cache brièvement par le CDN, jamais longtemps (prix et stocks). */
const PUBLIC_CACHE = 'public, max-age=0, s-maxage=60, stale-while-revalidate=300';

export function catalogueRouter(repository: CatalogueRepository): Router {
  const router = Router();

  router.get('/categories', asyncHandler(async (_request, response) => {
    response.setHeader('cache-control', PUBLIC_CACHE);
    response.json({ categories: await repository.listCategories() });
  }));

  router.get('/products', asyncHandler(async (request, response) => {
    const parsed = productQuerySchema.safeParse(request.query);
    if (!parsed.success) {
      throw unprocessable('INVALID_QUERY', 'Filtres du catalogue invalides.', parsed.error.flatten().fieldErrors);
    }

    const result = await repository.listProducts(parsed.data);
    if (!result) throw notFound('CATEGORY_NOT_FOUND', 'Catégorie introuvable.');

    response.setHeader('cache-control', PUBLIC_CACHE);
    response.json(result);
  }));

  router.get('/products/:slug', asyncHandler(async (request, response) => {
    const slug = slugSchema.safeParse(request.params.slug);
    const product = slug.success ? await repository.findProductBySlug(slug.data) : null;
    if (!product) throw notFound('PRODUCT_NOT_FOUND', 'Produit introuvable.');

    response.setHeader('cache-control', PUBLIC_CACHE);
    response.json({ product });
  }));

  router.get('/home', asyncHandler(async (_request, response) => {
    response.setHeader('cache-control', PUBLIC_CACHE);
    response.json(await repository.home());
  }));

  router.get('/sitemap', asyncHandler(async (_request, response) => {
    response.setHeader('cache-control', PUBLIC_CACHE);
    response.json(await repository.sitemap());
  }));

  return router;
}
