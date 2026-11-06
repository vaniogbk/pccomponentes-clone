import { createHash } from "node:crypto";
import { readFile, realpath } from "node:fs/promises";
import path from "node:path";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import sharp from "sharp";

const universes = [
  "CARTES_GRAPHIQUES",
  "PROCESSEURS",
  "CONSOLES",
  "PERIPHERIQUES_GAMING",
  "STOCKAGE_MEMOIRE",
] as const;

const productSchema = z.object({
  reference: z.string().regex(/^[A-Za-z0-9_-]{1,80}$/),
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  name: z.string().trim().min(1).max(200),
  brand: z.string().trim().min(1).max(100),
  model: z.string().trim().max(160).optional(),
  categorySlug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  univers: z.enum(universes),
  condition: z.enum(["NEW", "USED"]).default("NEW"),
  shortDescription: z.string().trim().max(500).optional(),
  description: z.string().trim().max(20_000).optional(),
  sourceUrl: z.string().url().optional(),
  specs: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).optional(),
  colors: z.array(z.string().trim().min(1).max(64)).default([]),
  isFeatured: z.boolean().default(false),
  isNew: z.boolean().default(false),
  images: z.array(z.object({
    publicPath: z.string().regex(/^\/images\/products\/(?:optimized\/)?[\w-]+\.(?:webp|png|jpe?g)$/i),
    alt: z.string().trim().max(300).optional(),
    isIllustration: z.boolean(),
  }).strict()).min(1),
}).strict();

const catalogueSchema = z.object({
  products: z.array(productSchema).max(5_000),
}).strict();

const priceRowSchema = z.object({
  reference: z.string().regex(/^[A-Za-z0-9_-]{1,80}$/),
  sku: z.string().trim().min(1).max(100).regex(/^[A-Za-z0-9._/-]+$/),
  sizeSystem: z.string().trim().min(1).max(32),
  sizeLabel: z.string().trim().min(1).max(64),
  color: z.string().trim().max(64).optional(),
  priceCents: z.number().int().positive().max(500_000_000),
  priceSourceUrl: z.string().url().refine((value) => ["http:", "https:"].includes(new URL(value).protocol)),
  priceCheckedAt: z.string().datetime({ offset: true }),
  initialStock: z.number().int().min(0).max(1_000_000).optional(),
}).strict();

type CatalogueProduct = z.infer<typeof productSchema>;
type PriceRow = z.infer<typeof priceRowSchema>;
type PreparedImage = {
  publicPath: string;
  sourceFile: string;
  alt: string;
  isIllustration: boolean;
  width: number;
  height: number;
  sha256: string;
};
type PreparedProduct = {
  product: CatalogueProduct;
  variants: PriceRow[];
  images: PreparedImage[];
  checksum: string;
};

function parseCsvLine(line: string, lineNumber: number): string[] {
  const cells: string[] = [];
  let cell = "";
  let quoted = false;

  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];

    if (quoted) {
      if (character === '"' && line[index + 1] === '"') {
        cell += '"';
        index += 1;
      } else if (character === '"') {
        quoted = false;
      } else {
        cell += character;
      }
    } else if (character === "," && !quoted) {
      cells.push(cell.trim());
      cell = "";
    } else if (character === '"') {
      if (cell.length > 0) {
        throw new Error(`CSV ligne ${lineNumber} : guillemet inattendu.`);
      }
      quoted = true;
    } else {
      cell += character;
    }
  }

  if (quoted) {
    throw new Error(`CSV ligne ${lineNumber} : guillemet non fermé.`);
  }

  cells.push(cell.trim());
  return cells;
}

function parsePriceRows(csv: string): PriceRow[] {
  const lines = csv.replace(/^\uFEFF/, "").split(/\r?\n/).filter((line) => line.trim() !== "");
  const expectedHeaders = [
    "reference",
    "sku",
    "size_system",
    "size_label",
    "color",
    "price_cents",
    "price_source_url",
    "price_checked_at",
    "initial_stock",
  ];
  const headers = parseCsvLine(lines[0] ?? "", 1);

  if (headers.length !== expectedHeaders.length || headers.some((header, index) => header !== expectedHeaders[index])) {
    throw new Error(`En-tête CSV attendu : ${expectedHeaders.join(",")}.`);
  }

  return lines.slice(1).map((line, index) => {
    const lineNumber = index + 2;
    const cells = parseCsvLine(line, lineNumber);

    if (cells.length !== expectedHeaders.length) {
      throw new Error(`CSV ligne ${lineNumber} : ${expectedHeaders.length} colonnes attendues.`);
    }

    const [reference, sku, sizeSystem, sizeLabel, color, priceCents, priceSourceUrl, priceCheckedAt, initialStock] = cells;
    const parsed = priceRowSchema.safeParse({
      reference,
      sku,
      sizeSystem,
      sizeLabel,
      ...(color && { color }),
      priceCents: /^\d+$/.test(priceCents) ? Number(priceCents) : Number.NaN,
      priceSourceUrl,
      priceCheckedAt,
      ...(initialStock && {
        initialStock: /^\d+$/.test(initialStock) ? Number(initialStock) : Number.NaN,
      }),
    });

    if (!parsed.success) {
      throw new Error(`CSV ligne ${lineNumber} invalide : ${parsed.error.issues.map((issue) => issue.message).join("; ")}.`);
    }

    return parsed.data;
  });
}

async function prepareCatalogue(sourceDirectory: string, publicDirectory: string): Promise<PreparedProduct[]> {
  const [catalogueText, priceCsv] = await Promise.all([
    readFile(path.join(sourceDirectory, "catalogue.json"), "utf8"),
    readFile(path.join(sourceDirectory, "catalogue-complement.csv"), "utf8"),
  ]);
  const parsedCatalogue = catalogueSchema.safeParse(JSON.parse(catalogueText) as unknown);

  if (!parsedCatalogue.success) {
    throw new Error(`Catalogue JSON invalide : ${parsedCatalogue.error.issues.map((issue) => issue.message).join("; ")}.`);
  }

  const products = parsedCatalogue.data.products;
  const priceRows = parsePriceRows(priceCsv);
  const productReferences = new Set(products.map((product) => product.reference));
  const productSlugs = new Set(products.map((product) => product.slug));
  const productVariants = new Map<string, PriceRow[]>();
  const seenSkus = new Set<string>();

  if (productReferences.size !== products.length || productSlugs.size !== products.length) {
    throw new Error("Le catalogue contient des références ou des URL distinctes en double.");
  }

  for (const row of priceRows) {
    if (!productReferences.has(row.reference)) {
      throw new Error(`La référence ${row.reference} du CSV est absente de catalogue.json.`);
    }
    if (seenSkus.has(row.sku)) {
      throw new Error(`SKU dupliqué dans le CSV : ${row.sku}.`);
    }
    seenSkus.add(row.sku);
    productVariants.set(row.reference, [...(productVariants.get(row.reference) ?? []), row]);
  }

  if (products.some((product) => !productVariants.has(product.reference))) {
    throw new Error("Chaque produit importé doit avoir au moins une variante tarifée et sourcée dans le CSV.");
  }

  const resolvedPublicDirectory = await realpath(publicDirectory);
  const prepared: PreparedProduct[] = [];

  for (const product of products) {
    const images: PreparedImage[] = [];

    for (const image of product.images) {
      const filePath = path.resolve(resolvedPublicDirectory, image.publicPath.slice(1));
      const realFilePath = await realpath(filePath);
      const relativeFilePath = path.relative(resolvedPublicDirectory, realFilePath);

      if (relativeFilePath.startsWith("..") || path.isAbsolute(relativeFilePath)) {
        throw new Error(`Le chemin d’image sort du dossier public : ${image.publicPath}.`);
      }

      const [metadata, bytes] = await Promise.all([
        sharp(realFilePath).metadata(),
        readFile(realFilePath),
      ]);

      if (!metadata.width || !metadata.height || !["jpeg", "png", "webp"].includes(metadata.format ?? "")) {
        throw new Error(`Format ou dimensions d’image invalides : ${image.publicPath}.`);
      }

      const sourceFile = relativeFilePath.split(path.sep).join("/");
      images.push({
        publicPath: `/${sourceFile}`,
        sourceFile,
        alt: image.alt ?? `${product.brand} ${product.name}`,
        isIllustration: image.isIllustration,
        width: metadata.width,
        height: metadata.height,
        sha256: createHash("sha256").update(bytes).digest("hex"),
      });
    }

    const variants = productVariants.get(product.reference) ?? [];
    const checksum = createHash("sha256")
      .update(JSON.stringify({ product, variants, images }))
      .digest("hex");

    prepared.push({ product, variants, images, checksum });
  }

  return prepared;
}

async function applyCatalogue(prisma: PrismaClient, products: PreparedProduct[]) {
  const counts = { created: 0, updated: 0, unchanged: 0 };

  await prisma.$transaction(async (transaction) => {
    for (const entry of products) {
      const existingProduct = await transaction.product.findUnique({
        where: { reference: entry.product.reference },
        select: { id: true, importChecksum: true },
      });

      if (existingProduct?.importChecksum === entry.checksum) {
        counts.unchanged += 1;
        continue;
      }

      const category = await transaction.category.findUnique({
        where: { slug: entry.product.categorySlug },
        select: { id: true },
      });

      if (!category) {
        throw new Error(`Catégorie inconnue pour ${entry.product.reference} : ${entry.product.categorySlug}.`);
      }

      const lowestPriceVariant = entry.variants.reduce((lowest, variant) => (
        variant.priceCents < lowest.priceCents ? variant : lowest
      ));
      const productData = {
        slug: entry.product.slug,
        name: entry.product.name,
        brand: entry.product.brand,
        model: entry.product.model,
        shortDescription: entry.product.shortDescription,
        description: entry.product.description,
        categoryId: category.id,
        univers: entry.product.univers,
        condition: entry.product.condition,
        priceFromCents: Math.min(...entry.variants.map((variant) => variant.priceCents)),
        sourceUrl: entry.product.sourceUrl,
        priceSourceUrl: lowestPriceVariant.priceSourceUrl,
        priceCheckedAt: new Date(lowestPriceVariant.priceCheckedAt),
        specs: entry.product.specs,
        colors: entry.product.colors,
        isFeatured: entry.product.isFeatured,
        isNew: entry.product.isNew,
        imagesAreIllustrations: entry.images.some((image) => image.isIllustration),
        importChecksum: entry.checksum,
      };

      const savedProduct = await transaction.product.upsert({
        where: { reference: entry.product.reference },
        create: {
          ...productData,
          reference: entry.product.reference,
          status: "DRAFT",
        },
        update: productData,
      });

      for (const image of entry.images) {
        await transaction.productImage.upsert({
          where: { productId_url: { productId: savedProduct.id, url: image.publicPath } },
          create: {
            productId: savedProduct.id,
            url: image.publicPath,
            alt: image.alt,
            width: image.width,
            height: image.height,
            isIllustration: image.isIllustration,
            sourceFile: image.sourceFile,
          },
          update: {
            alt: image.alt,
            width: image.width,
            height: image.height,
            isIllustration: image.isIllustration,
            sourceFile: image.sourceFile,
          },
        });
      }

      for (const [position, variantData] of entry.variants.entries()) {
        const existingVariant = await transaction.productVariant.findUnique({
          where: { sku: variantData.sku },
          select: { id: true, productId: true, stock: { select: { id: true } } },
        });

        if (existingVariant && existingVariant.productId !== savedProduct.id) {
          throw new Error(`Le SKU ${variantData.sku} appartient déjà à un autre produit.`);
        }

        const size = await transaction.size.upsert({
          where: { system_label: { system: variantData.sizeSystem, label: variantData.sizeLabel } },
          create: { system: variantData.sizeSystem, label: variantData.sizeLabel, sortOrder: position },
          update: { sortOrder: position },
        });

        const variant = await transaction.productVariant.upsert({
          where: { sku: variantData.sku },
          create: {
            productId: savedProduct.id,
            sizeId: size.id,
            sku: variantData.sku,
            color: variantData.color,
            priceCents: variantData.priceCents,
            isActive: false,
            position,
          },
          update: {
            sizeId: size.id,
            color: variantData.color,
            priceCents: variantData.priceCents,
            position,
          },
        });

        if (variantData.initialStock !== undefined && !existingVariant?.stock) {
          await transaction.stock.create({
            data: { variantId: variant.id, quantity: variantData.initialStock },
          });

          if (variantData.initialStock > 0) {
            await transaction.stockMovement.create({
              data: {
                variantId: variant.id,
                type: "IMPORT",
                delta: variantData.initialStock,
                reason: "Stock initial du fichier catalogue sourcé",
              },
            });
          }
        }
      }

      counts[existingProduct ? "updated" : "created"] += 1;
    }

    await transaction.importRun.create({
      data: {
        source: "catalogue-files",
        completedAt: new Date(),
        created: counts.created,
        updated: counts.updated,
        unchanged: counts.unchanged,
        report: { mode: "apply", productCount: products.length },
      },
    });
  });

  return counts;
}

const argumentsList = process.argv.slice(2);
const unknownArguments = argumentsList.filter((argument) => !["--apply", "--dry-run"].includes(argument));

if (unknownArguments.length > 0 || (argumentsList.includes("--apply") && argumentsList.includes("--dry-run"))) {
  throw new Error("Options valides : --dry-run (par défaut) ou --apply.");
}

const apply = argumentsList.includes("--apply");
const projectRoot = path.resolve(process.cwd(), "../..");
const sourceDirectory = path.resolve(process.env.CATALOGUE_DIR ?? path.join(projectRoot, "data"));
const publicDirectory = path.join(projectRoot, "apps", "web", "public");
const preparedProducts = await prepareCatalogue(sourceDirectory, publicDirectory);

if (!apply) {
  console.info(JSON.stringify({
    mode: "dry-run",
    products: preparedProducts.length,
    variants: preparedProducts.reduce((total, entry) => total + entry.variants.length, 0),
    images: preparedProducts.reduce((total, entry) => total + entry.images.length, 0),
    writesPerformed: false,
  }, null, 2));
} else {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL est requis pour l’import avec --apply.");
  }

  const prisma = new PrismaClient();
  try {
    const counts = await applyCatalogue(prisma, preparedProducts);
    console.info(JSON.stringify({ mode: "apply", ...counts }, null, 2));
  } finally {
    await prisma.$disconnect();
  }
}
