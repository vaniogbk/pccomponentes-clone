# PcComponentes France — boutique de démonstration

Monorepo TypeScript strict pour le catalogue public, l'API boutique et la logique métier partagée.

> Les produits et photos servent à la démonstration. Les prix de l'interface portent la mention `[DÉMO]`. Aucun stock,
> tarif de livraison, délai, coordonnées bancaires ou identité juridique n'est validé. Le paiement et les commandes restent désactivés.

## Architecture

- `apps/web` : storefront Next.js 16 (App Router), React 19 et Tailwind CSS.
- `apps/api` : API Express 4, validation Zod, journaux Pino et schéma Prisma/PostgreSQL.
- `packages/shared` : montants en centimes, panier, livraison, références de commande, SEPA, fichiers, pays, langues et schémas.
- `apps/web/public/images/products` : originaux fournis et images WebP optimisées.
- `docker` : création de la base locale `pcc_test`.

Next.js reste en version 16 : le dépôt et son environnement utilisent déjà Next 16.3.5. La configuration suit les conventions
Next.js 16 (`proxy.ts` si un proxy Next est ajouté).

## Prérequis

- Node.js 24 LTS et npm.
- Docker Desktop pour la base locale.

## Démarrage local

```powershell
Copy-Item .env.example .env.local
```

Renseignez un mot de passe PostgreSQL local dans `.env.local` et une URL PostgreSQL locale pour `DATABASE_URL`. Les clés de
signature, les coordonnées bancaires et les clés R2 restent vides tant que les services correspondants ne sont pas configurés.

```powershell
npm ci
npm run db:up
npm run db:migrate
npm run db:seed
npm run dev
```

Le storefront est servi sur `http://localhost:3000`, l'API sur `http://localhost:4000`. `GET /api/health` est le contrôle de
santé public. À ce stade, aucun parcours de commande réel n'est activé.

### API disponible

| Route | Rôle |
|---|---|
| `GET /api/health` | Contrôle de santé (non journalisé, non mis en cache) |
| `GET /api/catalogue/categories` | Catégories visibles avec nombre de produits publiés |
| `GET /api/catalogue/products` | Liste filtrée : `q`, `category`, `univers`, `size`, `brand`, `condition`, `minPriceCents`, `maxPriceCents`, `inStock`, `sort` (`featured`, `price_asc`, `price_desc`, `newest`), `page` |
| `GET /api/catalogue/products/:slug` | Fiche produit publiée, variantes actives uniquement |
| `GET /api/catalogue/home` | Produits phares, nouveautés et catégories |
| `GET /api/catalogue/sitemap` | Slugs publics pour le plan du site |

Seuls les produits `ACTIVE` d'une catégorie visible sont exposés. Le stock exact n'est donné qu'à partir de 3 unités ou moins
(`LOW_STOCK`) ; au-delà, seule la disponibilité est renvoyée. Comme l'import crée des brouillons, le catalogue public reste vide
tant qu'aucun produit n'a été publié avec un prix sourcé.

## Commandes utiles

| Besoin | Commande |
|---|---|
| Développement web + API | `npm run dev` |
| Web seul / API seule | `npm run dev:web` / `npm run dev:api` |
| Base PostgreSQL locale | `npm run db:up` |
| Migration locale / migration déployée | `npm run db:migrate` / `npm run db:deploy` |
| Catégories et administrateur initial optionnel | `npm run db:seed` |
| Vérifier le catalogue fourni sans écriture | `npm run import:catalogue -- --dry-run` |
| Appliquer le catalogue dans la base configurée | `npm run import:catalogue -- --apply` |
| Optimiser les photos sources | `npm run images:optimize` |
| Lint, types, tests et builds | `npm run check` |

Les tests d'intégration de l'API utilisent `TEST_DATABASE_URL` (base `pcc_test` du conteneur). Le nom de la base doit finir par
`_test` : elle est vidée à chaque exécution. Sans cette variable, ces tests sont ignorés.

`npm run db:up` ne supprime ni ne réinitialise le volume Docker. Le mot de passe n'est pas fourni dans le dépôt. La base de test
est créée une seule fois à l'initialisation du volume.

L'import lit `data/catalogue.json` et `data/catalogue-complement.csv` (ou `CATALOGUE_DIR`). Le CSV contient une ligne par
variante et doit fournir le prix en centimes, l'URL et la date de vérification du prix ; le stock initial est facultatif.
Les chemins d'images doivent pointer vers des fichiers existants sous `apps/web/public`. L'import crée toujours les produits en
brouillon et les variantes inactives. Le mode par défaut est une simulation sans écriture ; aucune donnée de démonstration n'est
transformée en prix ou en stock vérifié.

## Configuration et données manquantes

`.env.example` ne contient aucun secret. `.env.local`, les identifiants Railway et les clés Cloudflare R2 ne doivent jamais être
commités. En production, l'API refuse de démarrer sans base PostgreSQL, origines web, secret proxy et deux secrets JWT distincts
d'au moins 32 caractères.

Avant de publier la boutique, renseignez dans les gestionnaires de secrets et fichiers de catalogue adaptés : domaine, raison
sociale et mentions obligatoires, coordonnées de contact, références et prix avec leurs sources datées, stocks, zones et tarifs de
livraison, conditions de vente, compte bancaire SEPA, fournisseur d'e-mail et secrets R2. Ne réutilisez pas les prix `[DÉMO]`.

Voir [docs/DEPLOIEMENT.md](docs/DEPLOIEMENT.md) pour les prérequis Vercel, Railway et Cloudflare R2. Aucun déploiement n'est
déclenché par les commandes locales.
