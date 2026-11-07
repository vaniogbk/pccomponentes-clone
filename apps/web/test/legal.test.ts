import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const source = (path: string) => fileURLToPath(new URL(`../src/${path}`, import.meta.url));

// La page « Mentions légales » est une obligation légale : ce test échoue si elle disparaît ou n'est plus accessible.
test("the legal notice page exists and is linked from the footer", async () => {
  assert.ok((await stat(source("app/mentions-legales/page.tsx"))).isFile(), "app/mentions-legales/page.tsx is missing");

  const footer = await readFile(source("components/Footer.tsx"), "utf8");
  assert.match(footer, /href="\/mentions-legales"/);
});

test("the legal notice covers every mandatory section", async () => {
  const page = await readFile(source("app/mentions-legales/page.tsx"), "utf8");
  for (const heading of [
    "Éditeur du site",
    "Directeur de la publication",
    "Hébergement",
    "Données personnelles",
    "Cookies",
    "Médiation de la consommation",
  ]) {
    assert.ok(page.includes(heading), `Missing section: ${heading}`);
  }
});
