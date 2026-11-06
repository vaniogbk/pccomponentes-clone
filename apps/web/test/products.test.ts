import assert from "node:assert/strict";
import { stat } from "node:fs/promises";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { PCCOMPONENTES_CATALOG } from "../src/data/products";

test("the demonstration catalogue has a distinct, available optimized image for each product", async () => {
  assert.equal(PCCOMPONENTES_CATALOG.length, 16);

  const imagePaths = PCCOMPONENTES_CATALOG.map((product) => product.image);
  assert.equal(new Set(imagePaths).size, PCCOMPONENTES_CATALOG.length);

  await Promise.all(
    PCCOMPONENTES_CATALOG.map(async (product) => {
      assert.match(product.image, /^\/images\/products\/optimized\/[\w-]+\.webp$/);
      assert.equal(product.dataStatus, "DEMO");
      assert.ok(Number.isSafeInteger(product.priceCents) && product.priceCents > 0);

      const file = fileURLToPath(new URL(`../public${product.image}`, import.meta.url));
      assert.ok((await stat(file)).isFile(), `Missing image for ${product.id}: ${product.image}`);
    }),
  );
});
