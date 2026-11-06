import { Prisma, type PrismaClient } from '@prisma/client';
import { CATALOGUE_PAGE_SIZE, type ProductQuery } from '@pcc/shared/schemas';

/** Au-delà de ce seuil, la quantité exacte n'est jamais communiquée au site public. */
export const LOW_STOCK_THRESHOLD = 3;

export type Availability = 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';

export function availabilityOf(quantity: number): { availability: Availability; remaining?: number } {
  if (quantity <= 0) return { availability: 'OUT_OF_STOCK' };
  if (quantity <= LOW_STOCK_THRESHOLD) return { availability: 'LOW_STOCK', remaining: quantity };
  return { availability: 'IN_STOCK' };
}

/** Un produit n'est public que s'il est publié et rangé dans une catégorie visible. */
const PUBLIC_PRODUCT: Prisma.ProductWhereInput = {
  status: 'ACTIVE',
  category: { isVisible: true },
};

const ACTIVE_VARIANT: Prisma.ProductVariantWhereInput = { isActive: true };

const cardInclude = {
  category: { select: { slug: true, name: true } },
  images: { orderBy: { position: 'asc' }, take: 1, select: { url: true, alt: true, width: true, height: true, isIllustration: true } },
  variants: { where: ACTIVE_VARIANT, select: { priceCents: true, stock: { select: { quantity: true } } } },
} satisfies Prisma.ProductInclude;

type CardRow = Prisma.ProductGetPayload<{ include: typeof cardInclude }>;

function toCard(product: CardRow) {
  const prices = product.variants.map((variant) => variant.priceCents);
  const totalStock = product.variants.reduce((sum, variant) => sum + (variant.stock?.quantity ?? 0), 0);

  return {
    id: product.id,
    slug: product.slug,
    reference: product.reference,
    name: product.name,
    brand: product.brand,
    univers: product.univers,
    condition: product.condition,
    shortDescription: product.shortDescription,
    category: product.category,
    currency: product.currency,
    priceFromCents: prices.length > 0 ? Math.min(...prices) : product.priceFromCents,
    priceToCents: prices.length > 0 ? Math.max(...prices) : product.priceFromCents,
    isFeatured: product.isFeatured,
    isNew: product.isNew,
    colors: product.colors,
    image: product.images[0] ?? null,
    ...availabilityOf(totalStock),
  };
}

export type ProductCard = ReturnType<typeof toCard>;

function buildWhere(query: ProductQuery, categoryIds?: string[]): Prisma.ProductWhereInput {
  const and: Prisma.ProductWhereInput[] = [PUBLIC_PRODUCT];
  const variantFilter: Prisma.ProductVariantWhereInput = { ...ACTIVE_VARIANT };

  if (query.q) {
    const contains = { contains: query.q, mode: 'insensitive' as const };
    and.push({ OR: [{ name: contains }, { brand: contains }, { model: contains }, { reference: contains }] });
  }
  if (categoryIds) and.push({ categoryId: { in: categoryIds } });
  if (query.univers) and.push({ univers: query.univers });
  if (query.brand) and.push({ brand: { equals: query.brand, mode: 'insensitive' } });
  if (query.condition) and.push({ condition: query.condition });

  if (query.size) variantFilter.size = { label: query.size };
  if (query.minPriceCents !== undefined || query.maxPriceCents !== undefined) {
    variantFilter.priceCents = {
      ...(query.minPriceCents !== undefined && { gte: query.minPriceCents }),
      ...(query.maxPriceCents !== undefined && { lte: query.maxPriceCents }),
    };
  }
  if (query.inStock) variantFilter.stock = { quantity: { gt: 0 } };

  if (Object.keys(variantFilter).length > 1) and.push({ variants: { some: variantFilter } });

  return { AND: and };
}

function buildOrder(sort: ProductQuery['sort']): Prisma.ProductOrderByWithRelationInput[] {
  switch (sort) {
    case 'price_asc':
      return [{ priceFromCents: { sort: 'asc', nulls: 'last' } }, { id: 'asc' }];
    case 'price_desc':
      return [{ priceFromCents: { sort: 'desc', nulls: 'last' } }, { id: 'asc' }];
    case 'newest':
      return [{ createdAt: 'desc' }, { id: 'asc' }];
    case 'featured':
    default:
      return [{ isFeatured: 'desc' }, { createdAt: 'desc' }, { id: 'asc' }];
  }
}

export function createCatalogueRepository(prisma: PrismaClient) {
  /** Catégorie visible et ses sous-catégories visibles directes. */
  async function categoryScope(slug: string) {
    const category = await prisma.category.findFirst({
      where: { slug, isVisible: true },
      select: { id: true, slug: true, name: true, children: { where: { isVisible: true }, select: { id: true } } },
    });
    return category ? { category, ids: [category.id, ...category.children.map((child) => child.id)] } : null;
  }

  return {
    async listCategories() {
      const [categories, counts] = await Promise.all([
        prisma.category.findMany({
          where: { isVisible: true },
          orderBy: [{ position: 'asc' }, { name: 'asc' }],
          select: { id: true, slug: true, name: true, description: true, univers: true, parentId: true, position: true },
        }),
        prisma.product.groupBy({ by: ['categoryId'], where: PUBLIC_PRODUCT, _count: { _all: true } }),
      ]);
      const countByCategory = new Map(counts.map((row) => [row.categoryId, row._count._all]));
      return categories.map((category) => ({ ...category, productCount: countByCategory.get(category.id) ?? 0 }));
    },

    async listProducts(query: ProductQuery) {
      let categoryIds: string[] | undefined;
      let category: { slug: string; name: string } | null = null;

      if (query.category) {
        const scope = await categoryScope(query.category);
        if (!scope) return null;
        categoryIds = scope.ids;
        category = { slug: scope.category.slug, name: scope.category.name };
      }

      const where = buildWhere(query, categoryIds);
      const facetWhere = buildWhere({ ...query, brand: undefined, size: undefined }, categoryIds);
      const skip = (query.page - 1) * CATALOGUE_PAGE_SIZE;

      const [total, rows, brands, sizes] = await Promise.all([
        prisma.product.count({ where }),
        prisma.product.findMany({ where, orderBy: buildOrder(query.sort), skip, take: CATALOGUE_PAGE_SIZE, include: cardInclude }),
        prisma.product.groupBy({ by: ['brand'], where: facetWhere, _count: { _all: true }, orderBy: { brand: 'asc' } }),
        prisma.size.findMany({
          where: { variants: { some: { ...ACTIVE_VARIANT, product: facetWhere } } },
          orderBy: [{ system: 'asc' }, { sortOrder: 'asc' }, { label: 'asc' }],
          select: { system: true, label: true },
        }),
      ]);

      return {
        category,
        items: rows.map(toCard),
        total,
        page: query.page,
        pageSize: CATALOGUE_PAGE_SIZE,
        pageCount: Math.max(1, Math.ceil(total / CATALOGUE_PAGE_SIZE)),
        facets: {
          brands: brands.map((row) => ({ value: row.brand, count: row._count._all })),
          sizes,
        },
      };
    },

    async findProductBySlug(slug: string) {
      const product = await prisma.product.findFirst({
        where: { ...PUBLIC_PRODUCT, slug },
        include: {
          category: { select: { slug: true, name: true, parent: { select: { slug: true, name: true, isVisible: true } } } },
          images: {
            orderBy: { position: 'asc' },
            select: { id: true, url: true, alt: true, width: true, height: true, isIllustration: true, color: true, variantId: true },
          },
          variants: {
            where: ACTIVE_VARIANT,
            orderBy: [{ position: 'asc' }, { size: { sortOrder: 'asc' } }],
            include: { size: { select: { system: true, label: true } }, stock: { select: { quantity: true } } },
          },
        },
      });

      if (!product) return null;

      const { parent, ...category } = product.category;
      const variants = product.variants.map((variant) => ({
        id: variant.id,
        sku: variant.sku,
        size: variant.size,
        color: variant.color,
        priceCents: variant.priceCents,
        compareAtPriceCents: variant.compareAtPriceCents,
        ...availabilityOf(variant.stock?.quantity ?? 0),
      }));
      const prices = variants.map((variant) => variant.priceCents);

      return {
        id: product.id,
        slug: product.slug,
        reference: product.reference,
        name: product.name,
        brand: product.brand,
        model: product.model,
        shortDescription: product.shortDescription,
        description: product.description,
        univers: product.univers,
        condition: product.condition,
        currency: product.currency,
        priceFromCents: prices.length > 0 ? Math.min(...prices) : product.priceFromCents,
        priceToCents: prices.length > 0 ? Math.max(...prices) : product.priceFromCents,
        specs: product.specs,
        colors: product.colors,
        isNew: product.isNew,
        imagesAreIllustrations: product.imagesAreIllustrations,
        updatedAt: product.updatedAt,
        breadcrumbs: [...(parent?.isVisible ? [{ slug: parent.slug, name: parent.name }] : []), category],
        category,
        images: product.images,
        variants,
      };
    },

    async home() {
      const [featured, newest, categories] = await Promise.all([
        prisma.product.findMany({
          where: { ...PUBLIC_PRODUCT, isFeatured: true },
          orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
          take: 8,
          include: cardInclude,
        }),
        prisma.product.findMany({
          where: PUBLIC_PRODUCT,
          orderBy: [{ isNew: 'desc' }, { createdAt: 'desc' }, { id: 'asc' }],
          take: 8,
          include: cardInclude,
        }),
        this.listCategories(),
      ]);
      return { featured: featured.map(toCard), newest: newest.map(toCard), categories };
    },

    async sitemap() {
      const [products, categories] = await Promise.all([
        prisma.product.findMany({ where: PUBLIC_PRODUCT, select: { slug: true, updatedAt: true }, orderBy: { slug: 'asc' } }),
        prisma.category.findMany({ where: { isVisible: true }, select: { slug: true, updatedAt: true }, orderBy: { slug: 'asc' } }),
      ]);
      return { products, categories };
    },
  };
}

export type CatalogueRepository = ReturnType<typeof createCatalogueRepository>;
