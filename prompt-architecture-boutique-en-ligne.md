# Prompt — Boutique en ligne complète (site public multilingue + API + administration)

> Mode d'emploi : remplace chaque `{{VARIABLE}}` avant d'envoyer ce prompt (liste au § 0). Tout le reste décrit une architecture
> déjà éprouvée en production : la reproduire telle quelle, sauf mention contraire du client.

---

## 0. Variables du projet

| Variable | Rôle | Exemple de forme |
|---|---|---|
| `{{NOM_BOUTIQUE}}` | Nom commercial (logo, titres, e-mails) | « Maboutique » |
| `{{prefixe}}` | Préfixe technique en minuscules : scope npm, cookies, en-têtes | `shop` → `@shop/web`, `shop_at`, `x-shop-csrf` |
| `{{PREFIXE_REF}}` | 3 lettres majuscules : références commande et produit | `ABC` → `ABC-261026-7KQ4M`, `ABC-001` |
| `{{SECTEUR}}` | Ce que vend la boutique | « matériel de … » |
| `{{UNIVERS}}` | Les grands univers du catalogue (enum `Sport`/`Univers` en base) | `UNIVERS_A`, `UNIVERS_B` |
| `{{SYSTEMES_DE_TAILLE}}` | Systèmes de taille du secteur (+ toujours `ONE_SIZE` « Taille unique ») | longueur, pointure, vêtement… |
| `{{DOMAINE}}` | Domaine de production (www + apex redirigé) | `www.exemple.com` |
| `{{EMAIL_BOUTIQUE}}`, `{{TELEPHONE}}`, `{{WHATSAPP}}`, `{{ADRESSE}}` | Coordonnées réelles fournies par le client | — |
| `{{PAYS_LIVRES}}` | Pays de livraison (codes ISO) | FR, DE, AT, … |
| `{{LANGUES}}` | Une langue par pays livré ; la langue par défaut est servie sans préfixe | fr (défaut), de, en, … |
| `{{DOSSIER_CATALOGUE}}` | Dossier source du client (photos + fiches), lecture seule | `CATALOGUE_CLIENT/` |
| `{{MESSAGES_SUIVI}}` | Les 3 messages exacts du suivi client (voir § 6.4) | fournis par le client, mot pour mot |

Ne jamais écrire le nom d'un autre projet dans le code. Toute donnée d'identité (raison sociale, adresse, SIRET, IBAN) vient
du client et doit être à lui.

---

## 1. Règles non négociables

**Honnêteté des données**
- Ne jamais inventer de produits, prix, stocks, coloris, images, tarifs de livraison, avis ou nombre de clients.
- Prix initiaux = relevés de marché **sourcés** (URL + date dans un fichier de compléments versionné).
- Toute donnée d'exemple est marquée visiblement `[DÉMO]` et listée comme « à remplacer ».
- Aucun prix barré ni pourcentage de remise sans prix de référence réel (directive Omnibus : plus bas prix des 30 derniers jours).
- Données structurées (Product, Offer, BreadcrumbList, Organization) : uniquement des valeurs réelles venant de la base.

**Paiement**
- Paiement actif : **virement SEPA** avec QR code EPC et dépôt d'une preuve.
- Carte bancaire : affichée « Indisponible pour le moment », **jamais simulée**, aucune donnée de carte stockée. Prévoir l'interface
  `CardPaymentProvider` (`createPayment`, `verifyWebhook`) et `cardProvider = null`.
- Pied de page : « Paiement par carte bancaire (bientôt disponible) » tant que `NEXT_PUBLIC_CARD_PAYMENT_ENABLED` ≠ `true`.

**Secrets et données sensibles**
- Aucun secret dans le dépôt : `.env*` ignorés, seul `.env.example` (sans valeurs) est versionné.
- Aucun IBAN réel dans le code : IBAN = variables `BANK_*` (compte principal) ou table `BankAccount` (admin). Les IBAN d'exemple
  sont refusés hors dev/test.
- Le client saisit lui-même les secrets (clés API, IBAN, mots de passe) dans Vercel/Railway : ne jamais les demander dans le chat.
- Journaux : jamais de cookie, jeton, mot de passe, e-mail, IBAN ni corps de requête.
- Justificatifs de virement : jamais accessibles publiquement.

**Préférences du client**
- Page « Mentions légales » **obligatoire, ne jamais la supprimer** ; valeurs fournies par l'éditeur, repères `[[à compléter]]` sinon.

---

## 2. Pile technique et organisation

Monorepo **npm workspaces**, TypeScript strict partout, Node LTS (`.nvmrc`).

```
apps/web         Next.js 15 (App Router, React 19), Tailwind — Vercel (région fra1)
apps/api         Express 4 + Prisma (PostgreSQL) — Railway
packages/shared  Logique partagée et testée : schémas Zod, panier, livraison, QR SEPA, upload, statuts, langues
e2e/             Playwright : parcours d'achat complet
perf/            Playwright : vitesse sur mobile lent
docs/            DEPLOIEMENT.md (pas à pas Vercel + Railway + DNS + e-mails + stockage)
docker/          init-test-db.sql (crée la base de test)
{{DOSSIER_CATALOGUE}}/, identité graphique/   Sources client : lecture seule, jamais modifiées, non versionnées
```

Fichiers racine : `package.json` (scripts orchestrant les workspaces), `tsconfig.base.json`, `docker-compose.yml` (PostgreSQL local
sur un **port dédié** au projet, bases `{{prefixe}}` et `{{prefixe}}_test`), `playwright.config.ts`, `playwright.perf.config.ts`,
`railway.json`, `.vercelignore`, `.editorconfig`, `.gitattributes`, `.github/workflows/ci.yml`, `CLAUDE.md`, `README.md`.

Bibliothèques côté API : express, helmet, cookie-parser, pino / pino-http, express-rate-limit, zod, multer (mémoire),
argon2 (argon2id), jsonwebtoken, sharp (images), Prisma. Côté web : next, react, tailwind, clsx, @vercel/speed-insights.

### Commandes (à documenter dans CLAUDE.md et README)

| Besoin | Commande |
|---|---|
| Installer | `npm install` (postinstall : build `shared` + `prisma generate`) |
| Base locale | `npm run db:up` (Docker) |
| Migrations dev / prod | `npm run db:migrate` / `npm run db:deploy` |
| Seed | `npm run db:seed` (catégories, pays/zones, admin initial si `ADMIN_EMAIL`/`ADMIN_PASSWORD`) |
| Import catalogue | `npm run import:catalogue` (`-- --dry-run` pour simuler) |
| Développement | `npm run dev` (API :4000, web :3000, `/api` proxifié par Next) |
| Qualité | `npm run lint` · `npm run typecheck` · `npm run test` |
| Build / E2E | `npm run build` · `npm run test:e2e` (après `npx playwright install chromium`) |
| Vitesse mobile | `npm run test:perf` (site en ligne, `PERF_BASE_URL=…`, ou `PERF_LOCAL=1` pour le build local) |
| E-mails en attente | `npm run emails:process -w @{{prefixe}}/api` |
| Purge justificatifs | automatique (worker) ; à la main `npm run proofs:purge -w @{{prefixe}}/api` |

---

## 3. Modèle de données (Prisma, PostgreSQL)

Montants en **centimes (`Int`)**, devise ISO 4217 (`EUR`). Jamais de float pour l'argent. Identifiants `cuid()`.

**Enums** : `Role` (CLIENT, ADMIN) · `{{UNIVERS}}` (enum des univers) · `ProductCondition` (NEW, USED) · `ProductStatus` (DRAFT,
ACTIVE, ARCHIVED) · `OrderStatus` (PENDING_PAYMENT_VERIFICATION, PAID, PREPARING, SHIPPED, DELIVERED, CANCELLED) ·
`PaymentMethod` (BANK_TRANSFER, CARD) · `PaymentStatus` (PENDING_VERIFICATION, VERIFIED, REJECTED) · `EmailStatus` (QUEUED,
SENDING, SENT, LOGGED = mode dev non envoyé, FAILED) · `StockMovementType` (IMPORT, ADJUSTMENT, ORDER_RESERVE, ORDER_RELEASE).

**Modèles**
- `User` : email unique, passwordHash, role, **locale** (langue d'inscription → e-mails du compte), prénom, nom, téléphone,
  isActive, failedLoginCount, lockedUntil, lastLoginAt. Clients et admins partagent la table.
- `RefreshToken` : tokenHash unique, familyId, expiresAt, revokedAt, replacedBy (rotation + détection de réutilisation).
- `PasswordResetToken` : tokenHash unique, expiresAt, usedAt.
- `Category` : slug unique, nom, description, univers optionnel, arbre `parentId` (SetNull), position, isVisible.
- `Product` : **reference** unique (`{{PREFIXE_REF}}-001`, clé d'idempotence de l'import), slug unique, nom, marque, modèle,
  shortDescription, description, catégorie, univers, condition, status, currency, priceFromCents (prix d'appel ; le prix réel est
  sur chaque variante), compareAtPriceCents, weightGrams, dimensions, specs (Json), colors[], isFeatured, isNew, sourceUrl,
  priceSourceUrl, priceCheckedAt, imagesAreIllustrations, importChecksum, archivedAt. Index : (categoryId, status), (univers,
  status), brand, (status, priceFromCents), (status, createdAt).
- `Size` : system ({{SYSTEMES_DE_TAILLE}}, ONE_SIZE…), label, sortOrder ; unique (system, label).
- `ProductVariant` : sku unique, taille, **color** (coloris), priceCents, compareAtPriceCents, isActive, position.
- `Stock` (1-1 variante, quantity) + `StockMovement` (type, delta, reason, orderId, actorId) : tout mouvement est tracé.
- `ProductImage` : url, alt, position, width, height, isIllustration, **color** (coloris montré ; vide = commune à tous),
  variantId optionnel, sourceFile ; unique (productId, url).
- `Address` : carnet d'adresses du client (label, nom, société, lignes, CP, ville, région, pays, téléphone, isDefault).
- `Cart` (userId optionnel, **tokenHash** du cookie invité, expiresAt) + `CartItem` (unique cartId+variantId, quantity).
- `Order` : **reference** unique, email, **locale** (langue au moment de la commande → e-mails et lien de suivi), status, adresse
  de livraison dénormalisée (`ship*`), subtotal/shipping/total en centimes, shippingRateName, trackingCarrier/Number/Url,
  customerNote, adminNote, **accessTokenHash** (accès invité), paidAt, shippedAt, deliveredAt, cancelledAt.
- `OrderItem` : instantané figé (nom, référence, slug, sku, taille, coloris, image, prix unitaire, quantité, total ligne).
- `Payment` : méthode, statut, montant, transferReference, verifiedAt/By, rejectionReason, **receivingAccount** (libellé + IBAN
  masqué figés à la commande), bankAccountId.
- `TransferProof` : storageDriver, storageKey unique (aléatoire), originalName, mimeType, sizeBytes, sha256, deleteAfter, deletedAt.
- `ShippingZone` (nom unique, isActive) · `ShippingCountry` (code ISO, nom, isEnabled, zone) · `ShippingRate` (nom, priceCents,
  freeAboveCents, minDays, maxDays, isActive).
- `EmailMessage` (outbox) : toAddress, subject, template, payload Json, status, attempts, maxAttempts, nextAttemptAt, lastError,
  provider, providerMessageId, sentAt, deliveredAt, deliveryCheckedAt, orderId. Index (status, nextAttemptAt).
- `ActivityLog` : actorId, actorRole, action (`order.status_changed`, `payment.rejected`…), entityType, entityId, metadata.
- `ImportRun` : source, dates, compteurs créés / mis à jour / ignorés / erreurs, rapport Json, triggeredById.
- `BankAccount` : label, accountHolder, iban, bic, bankName, **countryCodes[]**, isActive. Le compte des variables `BANK_*` sert
  de compte principal.

---

## 4. API (apps/api)

### 4.1 Couches et conventions
- `routes` → services → Prisma (repositories pour les requêtes catalogue/livraison). Erreurs via `AppError` (`lib/errors.ts` :
  `notFound`, `forbidden`, `unauthorized`, `unprocessable(code, message)`) et un gestionnaire central (codes d'erreur stables
  que le front traduit).
- Validation **Zod de toute entrée** (body, query, params, fichiers). Configuration validée par Zod au démarrage (`config/env.ts`).
- `asyncHandler`, `Cache-Control: no-store` sur compte, panier, checkout, auth et admin.
- `server.ts` démarre l'app, le worker d'e-mails et le worker de maintenance ; arrêt propre.

### 4.2 Chaîne de middlewares (dans cet ordre)
1. `requestId` (accepte un `x-request-id` valide, sinon UUID ; renvoyé en en-tête).
2. `pino-http` : seulement méthode, chemin sans query string, statut ; `/api/health` non journalisé.
3. `helmet` : CSP `default-src 'none'; frame-ancestors 'none'`, CORP `same-site`, `x-powered-by` désactivé, `trust proxy` configurable.
4. **Garde proxy** : avec `PROXY_SECRET` défini, toute requête sans l'en-tête `x-{{prefixe}}-proxy` égal au secret (comparaison à
   temps constant) est refusée (403 « Accès direct à l'API refusé ») ; `/api/health` reste ouvert. Sans secret : rien n'est bloqué.
5. Limiteur global : 600 requêtes / 15 min.
6. `express.json({ limit: '100kb' })`, `cookie-parser`.
7. `optionalAuth` : lit le JWT d'accès (cookie httpOnly, ou `Bearer` pour les outils).
8. **CSRF** : toute écriture exige l'en-tête `x-{{prefixe}}-csrf: 1` **et**, si `Origin`/`Referer` est présent, une origine listée
   dans `WEB_ORIGIN`. Pas de CORS.
9. Routeur `/api`, puis 404 et gestionnaire d'erreurs.

Limiteurs dédiés : auth 20 / 15 min · réinitialisation 5 / h (+ 3 liens max par compte et par heure) · commande 30 / h ·
envoi de fichiers 20 / h. Désactivés en test.

### 4.3 Authentification et sessions
- Argon2id. Verrouillage 15 min après 5 échecs. Réponses identiques (inscription, connexion, mot de passe oublié) : aucune
  énumération de comptes.
- JWT d'accès 15 min dans le cookie `{{prefixe}}_at` (httpOnly, Secure, SameSite=Lax, path `/`).
- Refresh token opaque 30 j dans `{{prefixe}}_rt` (httpOnly, Secure, SameSite=Strict, path `/api/auth`), **rotatif** : empreinte
  HMAC en base, famille ; réutilisation d'un jeton déjà remplacé → toute la famille est révoquée.
- Jetons opaques (refresh, panier, réinitialisation, accès invité) : seule l'empreinte HMAC est stockée.
- `requireAuth` ; `requireAdmin` **revérifie le rôle et `isActive` en base à chaque requête** (compte rétrogradé = accès coupé).
- Désactiver un client ferme ses sessions.

### 4.4 Points d'accès

| Module | Routes |
|---|---|
| health | `GET /api/health` |
| media | `GET /api/media/products/:file` (images produit publiques) |
| catalogue | `GET /categories` · `GET /products` (q, catégorie, univers, taille, marque, prix min/max, état, `inStock`, `sort` = featured / price_asc / price_desc / newest, page) · `GET /products/:slug` · `GET /home` (produits phares, nouveautés, catégories avec compteurs) · `GET /sitemap` |
| cart | `GET /` · `POST /items` · `PATCH /items/:variantId` · `DELETE /items/:variantId` |
| checkout | `GET /config` (pays livrables, moyens de paiement, pays où le virement est possible, contraintes d'upload) · `GET /shipping-quotes?country=` · `POST /payment-details` · `POST /orders` (multipart : `data` + 1 à 3 fichiers `proof`) · `GET /orders/:reference` (propriétaire connecté, cookie invité ou lien signé `t=`) |
| auth | `POST /register` · `POST /login` · `POST /refresh` · `POST /logout` · `GET /me` · `POST /password/forgot` · `POST /password/reset` |
| account | `GET/PATCH /profile` · `GET/POST /addresses` · `PATCH/DELETE /addresses/:id` · `GET /orders` · `GET /orders/:reference` |
| admin (tout sous `requireAuth` + `requireAdmin`) | `GET /dashboard` · produits : `GET /products`, `GET /products/:id`, `POST /products`, `PATCH /products/:id`, `POST /products/:id/archive`, `DELETE /products/:id`, `POST /products/:id/variants`, `PATCH /products/variants/:variantId`, `PUT /products/variants/:variantId/stock`, `DELETE /products/variants/:variantId`, `POST /products/:id/images`, `PATCH /products/images/:imageId`, `DELETE /products/images/:imageId` · commandes : `GET /orders`, `GET /orders/:id`, `GET /orders/:id/proofs/:proofId`, `PATCH /orders/:id/status`, `PATCH /orders/:id/tracking`, `POST /orders/:id/payments/:paymentId/reject` · `GET/POST /bank-accounts`, `PATCH/DELETE /bank-accounts/:id` · `GET/POST /categories`, `PATCH/DELETE /categories/:id` · `GET /sizes` · `GET /customers`, `GET/PATCH /customers/:id` (lecture + activation uniquement) · `GET /shipping`, `POST /shipping/zones`, `PATCH/DELETE /shipping/zones/:id`, `POST /shipping/zones/:id/rates`, `PATCH/DELETE /shipping/rates/:id`, `PATCH /shipping/countries/:code` · `GET /activity` · `GET /emails`, `POST /emails/:id/retry` · `GET /import/runs`, `POST /import` |

### 4.5 Panier
- Panier invité via cookie `{{prefixe}}_cart` (jeton opaque, empreinte en base, expiration) ; rattaché au compte à la connexion.
- 10 unités max par ligne ; contrôle de disponibilité (variante active, produit publié, stock) avec codes d'anomalie partagés.
- Le stock exact n'est jamais exposé au-delà d'un seuil.

### 4.6 Commande par virement (cœur du métier)
1. **Devis** : `quoteShipping(zones, pays, sous-total)` (shared). Un pays n'est proposé que s'il est activé, rattaché à une zone
   active ayant au moins un tarif actif. Gratuité au-delà de `freeAboveCents` si renseigné.
2. **Coordonnées de paiement** (`POST /payment-details`) : montant définitif, **référence réservée** (`{{PREFIXE_REF}}-AAMMJJ-XXXXX`,
   alphabet sans caractères ambigus `23456789ABCDEFGHJKMNPQRSTUVWXYZ`), compte de réception, **QR code EPC SEPA** (valable 3 h).
   Le compte et la référence affichés sont signés dans un cookie (`{{prefixe}}_ref`) pour que la commande utilise exactement ceux-là.
3. **Choix du compte** : comptes actifs couvrant le pays de livraison ; s'il y en a plusieurs, rotation vers celui qui a reçu une
   commande le moins récemment ; sinon compte principal `BANK_*` ; sinon virement indisponible pour ce pays (message avec e-mail et
   WhatsApp de la boutique).
4. **Création** (`POST /orders`, multipart) : 1 à 3 preuves (PDF, JPG, PNG, WEBP ; type réel vérifié par signature binaire, nom
   assaini, clé aléatoire, sha256), transaction unique :
   - **réservation du stock par décrément conditionnel** (aucune survente, même en concurrence) + `StockMovement ORDER_RESERVE` ;
   - commande créée directement au statut `PREPARING` (étape 1 du suivi) ; paiement `PENDING_VERIFICATION` ;
   - `receivingAccount` figé (libellé + IBAN masqué `XXXX •••• XXXX`) ;
   - e-mails en file : `order-received` (client, dans sa langue) et `admin-transfer-proof` (boutique, preuves jointes si ≤ 4 Mo).
   - Accès invité : cookie `{{prefixe}}_order` (empreinte dans `accessTokenHash`) ; lien de suivi signé
     `/commande/suivi?ref=…&t=…` (HMAC de l'identifiant de commande), localisé selon `Order.locale`.
5. **Transitions autorisées** (shared `ORDER_TRANSITIONS`) :
   - PENDING_PAYMENT_VERIFICATION, PAID → PREPARING, SHIPPED, CANCELLED (statuts hérités)
   - PREPARING → SHIPPED, CANCELLED
   - SHIPPED → DELIVERED
   - DELIVERED, CANCELLED → (aucune)
   - **SHIPPED (« En route ») vérifie automatiquement le paiement** (l'admin ne l'indique qu'une fois le virement crédité).
   - **CANCELLED remet le stock** (`ORDER_RELEASE`).
   - SHIPPED et DELIVERED envoient toujours l'e-mail `order-status` ; les autres changements seulement si « Prévenir le client » est coché.
   - Chaque changement est journalisé (`ActivityLog`).
6. Refus d'un justificatif : `Payment.status = REJECTED` + motif (3 à 300 caractères), journalisé.

Libellés de statut (shared) : PENDING_PAYMENT_VERIFICATION « En attente de vérification du paiement » · PAID « Payée » ·
PREPARING « En préparation » · SHIPPED « En route » · DELIVERED « Livrée » · CANCELLED « Annulée ».
Paiement : « Virement à vérifier » · « Paiement vérifié » · « Paiement refusé ».

### 4.7 Stockage privé des justificatifs
- Pilote `local` (dossier hors `public/`) ou `r2` (bucket privé Cloudflare R2, délai d'attente court : échec rapide plutôt que
  requête suspendue). `assertSafeKey` contre les traversées de chemin.
- Lecture **uniquement** via `GET /api/admin/orders/:id/proofs/:proofId` (admin).
- Conservation RGPD : `deleteAfter = dépôt + PROOF_RETENTION_DAYS` (400 j par défaut), purge automatique.

### 4.8 E-mails transactionnels (outbox)
- `queueEmail` dans la transaction métier, `kickEmailQueue()` après commit (sans bloquer la réponse), worker périodique.
- Verrou optimiste par ligne (QUEUED → SENDING) ; SENDING bloqué depuis plus de 10 min → remis en file ; nouvelles tentatives à
  1, 5, 15, 60, 360 min ; FAILED après `maxAttempts`.
- Fournisseurs : `console` (dev → `LOGGED`) et Brevo (API). **`SENT` uniquement après accusé du fournisseur (`messageId`)**.
- Suivi de livraison : toutes les 10 min, les e-mails envoyés depuis moins de 72 h sont vérifiés dans les événements du fournisseur
  (livré → `deliveredAt` ; refusé → FAILED avec motif, renvoi possible depuis l'admin).
- Modèles : `order-received`, `order-status`, `password-reset`, `admin-transfer-proof`, `bank-account-changed` (alerte de sécurité
  à `ORDER_NOTIFICATION_EMAIL`). Textes des e-mails client dans les {{LANGUES}} (`email.i18n.ts`, `<html lang>`, prix formatés
  selon la langue) ; le payload porte `status` et `locale` (repli sur `statusLabel`/`message` pour les anciens messages en file).

### 4.9 Worker de maintenance (dans le process API, pas de cron externe)
Purge des preuves expirées au démarrage puis toutes les 6 h ; suivi de livraison des e-mails toutes les 10 min. Retourne une
fonction d'arrêt.

### 4.10 Import du catalogue
- Lit `{{DOSSIER_CATALOGUE}}` **sans jamais le modifier** + un fichier de compléments versionné (`data/catalogue-complement.csv` :
  prix sourcés, tailles). Tailles séparées par des virgules **hors parenthèses** (une virgule décimale n'est pas un séparateur).
- **Idempotent** : produit identifié par sa référence ; `importChecksum` inchangé → rien n'est réécrit ; le stock n'est fixé qu'à la
  création (le stock saisi dans l'admin n'est jamais écrasé). Chaque exécution crée un `ImportRun`.
- **Instantané** `data/catalogue-snapshot.json` versionné : permet d'installer le catalogue sur un serveur qui n'a pas le dossier
  (bouton « Importer le catalogue » de l'admin en production). L'import local réexporte l'instantané (seulement les produits importés ;
  ceux créés à la main restent hors instantané).
- Photos traitées par sharp (WebP, dimensions) vers `PRODUCT_MEDIA_DIR`. Photos de l'accueil associées par mots-clés de nom de fichier.

### 4.11 Scripts de maintenance (`apps/api/scripts`)
Simulation par défaut, `--apply` pour écrire ; à exécuter en production dans le conteneur (`railway ssh --service api -- "…"`)
puisque la base de production n'a pas d'adresse publique. Exemples : appliquer des prix de référence, appliquer des tarifs de
livraison sourcés, changer l'e-mail d'un utilisateur, tester l'e-mail, tester le stockage, exporter / installer l'instantané,
traiter la file d'e-mails, purger les preuves, seed e2e, stock minimal par taille, corriger des libellés de taille.

---

## 5. Package partagé (`packages/shared`)

Modules (chacun testé) : `schemas.ts` (Zod : checkout, inscription, réinitialisation, requête catalogue, adresses ; champ optionnel
`locale`), `cart.ts` (`MAX_QUANTITY_PER_LINE = 10`, `validateCartLines`, `computeCartTotals`, messages d'anomalie), `shipping.ts`
(`quoteShipping`, `selectShippingQuote`), `sepa.ts` (`normalizeIban`, `isValidIban` mod 97, `formatIban`, `buildEpcQrPayload`),
`upload.ts` (`PROOF_MIME_TYPES`, `detectMimeFromBytes`, `sanitizeFileName`, `validateProofFile`), `order.ts` (statuts, libellés,
`ORDER_TRANSITIONS`, `canTransition`, `TRACKING_STEPS`, `trackingStep`, `generateOrderReference`), `money.ts` (`CURRENCY`,
`formatPrice`, `toCents`), `countries.ts` (pays européens, pays activés par défaut, `countryName`), `contact.ts` (`BRAND` :
coordonnées réelles de la boutique), `locales.ts` (`SITE_LOCALES`, `isSiteLocale`, `localizedPath`, `intlTag`).

**Le code client importe les sous-chemins** (`@{{prefixe}}/shared/money`, `/order`, `/contact`…) : l'index racine embarque Zod
(~100 Ko gzip) dans chaque page.

---

## 6. Site public (apps/web)

### 6.1 Routage, langues et middleware
- `app/layout.tsx` : racine transparente (globals.css, metadataBase, manifest, viewport).
- `app/[locale]/layout.tsx` : `generateStaticParams` = toutes les langues, `<html lang>`, lien d'évitement, `I18nProvider`
  (uniquement les espaces de noms client), AuthProvider, CartProvider, Header, Footer, JSON-LD Organization, Speed Insights.
  **Pas de `dynamicParams = false`** sur ce layout (il se propage aux enfants et casse l'ISR des fiches produit).
- `app/[locale]/[...rest]/page.tsx` → `notFound()` ; `not-found.tsx` et `error.tsx` traduits ; `app/not-found.tsx` global.
- **Middleware** : `/xx/…` d'une langue non par défaut passe tel quel ; `/{défaut}/…` → 308 vers l'URL sans préfixe ; sinon langue
  choisie = cookie `{{prefixe}}_lang` > `Accept-Language` (poids q, alias de langues proches) ; langue par défaut → réécriture
  interne ; autre langue → 307 + cookie. Il ajoute aussi l'en-tête `x-{{prefixe}}-proxy` (`PROXY_SECRET`) aux appels `/api`.
  Matcher : `['/api/:path*', '/((?!api|_next|_vercel|admin|media|brand|.*\\..*).*)']`.
- Sélecteur de langue (en-tête ; dans le menu sur mobile) : pose le cookie puis recharge l'URL équivalente.
- **i18n maison, sans bibliothèque** : messages en objets TypeScript (`i18n/messages/<langue>.ts`, type `Messages = typeof <défaut>`),
  pluriels `Intl.PluralRules`, `fmt(text, vars)`, formats `Intl` (prix, dates, noms de pays `Intl.DisplayNames`), `Link` et
  `useLocalizedRouter` qui ajoutent le préfixe, `getI18n(params)` côté serveur, `alternates()` (canonical + hreflang + x-default),
  traduction du catalogue par slug (`i18n/catalogue/<langue>.ts` : catégories, descriptions courtes, clés et valeurs de
  caractéristiques), libellés de taille et de coloris, traduction des codes d'erreur API et des erreurs de champs Zod.
- **Test bloquant** : chaque langue a toutes les clés, les mêmes `{variables}`, les mêmes repères `[[…]]`, la forme plurielle
  `other`, et les messages de suivi exacts dans la langue par défaut.
- Aucun texte en dur dans les pages publiques.

### 6.2 Pages publiques (slugs en langue par défaut, préfixe `/xx` pour les autres)
- `/` **Accueil** : hero (surtitre, accroche, un bouton par univers), Catégories (avec nombre de produits), « Nos produits phares »,
  Collections (une carte par univers), rangées par univers, bandeau d'univers, Accessoires, « Nouveautés », « Pourquoi
  {{NOM_BOUTIQUE}} » (4 avantages : livraison en Europe, virement SEPA avec QR code, marques de référence, conseil par téléphone /
  WhatsApp), bloc contact. Sections sous la ligne de flottaison en `.cv-auto` (`content-visibility: auto`).
- `(listings)/catalogue`, `categorie/[slug]`, `recherche` : grille + filtres (catégorie, univers, taille, marque, prix min/max,
  état Neuf/Occasion, « Disponible uniquement »), tri (Recommandés, Prix croissant, Prix décroissant, Nouveautés), compteur de
  résultats, panneau de filtres mobile « Voir les N produits ». Squelette dans un `<Suspense>` **de page**
  (`CatalogueBodySkeleton`), **jamais de `loading.tsx` au niveau du groupe** (fige la navigation des filtres sous Next 15).
- `produit/[slug]` : **ISR** (`generateStaticParams` vide + `revalidate`), **sans `loading.tsx`** (la page mise en cache contient le
  produit, meilleur LCP). Fil d'Ariane sur une ligne (évite le CLS), galerie, choix du **coloris à côté de la taille** (pastilles ; la
  photo change avec le coloris), prix (« à partir de » si fourchette), ajout au panier optimiste, caractéristiques, JSON-LD
  Product/Offer/BreadcrumbList.
- `panier` : lignes, quantités, anomalies, total, accès à la commande.
- `commande` : une page en deux étapes :
  - « 1. Livraison » : « Déjà client ? Connectez-vous pour retrouver vos adresses », adresse enregistrée, pays (seuls les pays
    livrables, triés par nom localisé), prénom, nom, société (facultatif), adresse, complément (facultatif), code postal, ville,
    région (facultatif), téléphone, mode de livraison (« {min} à {max} jours ouvrés »).
  - « 2. Paiement » : « Virement bancaire » ; « Carte bancaire — Indisponible pour le moment » ; bouton « Afficher les coordonnées
    bancaires » (Bénéficiaire, IBAN, BIC, Banque, Montant exact, Référence à indiquer, QR code « Scannez avec votre application
    bancaire », rappel « Le QR code reste valable 3 heures ») ; « Preuve de virement (reçu PDF ou photos) » (jusqu'à 3 fichiers,
    contrôles de type et de taille côté client) ; « Total TTC » ; « J'accepte les conditions de vente » ; « Valider la commande ».
  - La commande envoie `locale`.
- `commande/confirmation` et `commande/suivi` : récapitulatif + suivi en 3 étapes (composant `OrderTracking`), accès par compte,
  cookie invité ou lien signé.
- `compte` (connexion, inscription, mot de passe oublié, réinitialiser, tableau de bord, adresses, commandes, détail de commande) ;
  retour sécurisé après connexion (`safe-return` : chemins internes uniquement).
- `conditions-de-vente` : sections traduites ; les informations légales manquantes apparaissent comme repères `[[à compléter]]`
  visibles ; mention que la version de référence est celle de la langue par défaut.

### 6.3 En-tête, pied de page, composants
- Header : logo, navigation par univers, recherche, compte, panier (compteur), sélecteur de langue, menu mobile.
- Footer (composant serveur) : slogan ; « Rayons » ; « Service client » (Mon compte, Suivre une commande, Conditions de vente,
  Paiement par carte bancaire (bientôt disponible), Paiement par virement bancaire) ; « Contact » (e-mail, « Appeler le … », WhatsApp,
  adresse).
- Composants : ProductCard, ProductGrid, Price, ProductGallery, ColorSelection, AddToCart, CatalogueView, Filters, FiltersPanel,
  OrderTracking, OrderFollowUp, AccountShell, Breadcrumbs, Field, Reveal, Skeleton, JsonLd, HomeVisual ; providers Auth et Cart
  (panier optimiste, requêtes `keepalive`).
- `lib/api-client.ts` (fetch avec en-tête CSRF, délais d'attente, `ApiError` avec code) et `lib/server-api.ts` (rendu serveur, cache).

### 6.4 Suivi client — messages exacts
Trois étapes, affichées sur la page de suivi et envoyées par e-mail à chaque étape, **mot pour mot** :
1. « En préparation » — {{MESSAGES_SUIVI.1}}
2. « En route » — {{MESSAGES_SUIVI.2}}
3. « Livrée » — {{MESSAGES_SUIVI.3}}

### 6.5 Thème, accessibilité, performance, SEO
- Couleurs, polices, rayons **uniquement** via `theme/tokens.ts` (Tailwind) ; aucune couleur en dur.
- Accessibilité : libellés liés, erreurs `aria-describedby`, cibles ≥ 44 px, `prefers-reduced-motion`, `aria-current`, `aria-live`.
- Polices locales woff2 : sous-ensemble latin préchargé ; latin-ext (`unicode-range`) **non préchargé**, placé en tête de pile.
- Images AVIF/WebP ; `/media/*` en cache immuable d'un an ; `/brand/*` 1 jour + stale-while-revalidate.
- En-têtes de sécurité (CSP, etc.) sur tout le site ; `/admin/*` en `X-Robots-Tag: noindex, nofollow`.
- Proxy `/api/:path*` → `API_URL` (rewrite Next) ; fonctions Vercel en `fra1`, proches de la base.
- Sitemap : chaque page dans chaque langue avec `alternates.languages` ; robots : interdire compte, panier, commande, recherche
  (aussi sous chaque préfixe de langue) et l'admin.
- Speed Insights (à activer dans le tableau de bord Vercel) ; test `perf/mobile-lent.spec.ts` (réseau et CPU bridés).

---

## 7. Administration (`/admin`) — à reproduire textuellement

Racine `<html>` séparée (`app/admin/layout.tsx`), **en français uniquement**, hors des versions traduites ; métadonnées
« Administration | {{NOM_BOUTIQUE}} », `noindex`. Écrans clients (`'use client'`) qui chargent leurs données avec
`useAdminData(path)` (chargement, rechargement, message d'erreur lisible ; à défaut « Chargement impossible. » / « Action
impossible, réessayez. »). Squelettes `PanelSkeleton` avec libellé (« Chargement de la commande… », etc.). Messages de succès en
`aria-live="polite"`. Tableaux qui s'empilent sur mobile (`data-label`).

### 7.1 Coque (`AdminShell`)
- Garde d'interface : sans session admin → redirection vers `/compte/connexion?retour=<chemin>` ; pendant la vérification :
  « Vérification de l'accès… ». (La vraie sécurité reste l'API.)
- Bandeau sombre : logo (lien `/admin`, `aria-label` « Administration {{NOM_BOUTIQUE}} »), pastille « Admin », lien « Voir la
  boutique » (« Boutique » sur mobile), bouton « Déconnexion » (icône seule sur mobile).
- Navigation latérale (`aria-label` « Administration ») ; sur mobile, un bouton déroulant affiche la rubrique actuelle
  (« Menu d'administration, rubrique actuelle : … »). Entrées, dans cet ordre :
  « Tableau de bord » · « Commandes » · « Produits » · « Catégories » · « Clients » · « Livraison » · « Coordonnées bancaires » ·
  « Import catalogue » · « Journaux & e-mails ».

### 7.2 Tableau de bord (`/admin`)
Titre « Tableau de bord ». Tuiles cliquables (valeur en rouge si alerte) :
- « Virements à vérifier » → `/admin/commandes?status=PREPARING` (alerte si > 0)
- « CA encaissé (30 j) » → commandes payées
- « Produits publiés » → `/admin/produits?status=ACTIVE`
- « Produits en brouillon » → `/admin/produits?status=DRAFT`
- « Variantes en stock faible (≤ 1) » → `/admin/produits` (alerte si > 0)
- « E-mails en échec » → `/admin/journaux` (alerte si > 0)

Section « Dernières commandes » : colonnes Référence (lien) · Client · Statut · Date · Total ; vide : « Aucune commande. ».

### 7.3 Commandes (`/admin/commandes`)
Titre « Commandes ». Filtre « Statut » (« Tous les statuts » + chaque statut), champ « Rechercher » (placeholder « Référence,
e-mail, nom »), bouton « Rechercher » ; filtres dans l'URL (`status`, `q`, `page`). Colonnes : Référence · Client · Pays · Statut ·
Paiement · Justificatif (Oui/Non) · Date · Total. Pagination. Vide : « Aucune commande. ».

### 7.4 Détail d'une commande (`/admin/commandes/[id]`)
Titre « Commande {référence} », pastille de statut, frise `OrderTracking`.
- **« Paiement et justificatif »** : Montant attendu · Référence de virement · Compte de réception · Statut · Vérifié le … par … ·
  Motif du refus. Sous-titre « Confirmation(s) de virement » : nom du fichier, taille (« Ko · »), liens « Ouvrir » et
  « Télécharger » (route admin), ou « Supprimé (conservation expirée) ».
  Actions :
  - « Virement crédité : marquer « En route » » — confirmation « Le virement est-il bien crédité ? La commande passe « En route » et
    le client est prévenu par e-mail. » → « Commande marquée « En route » : le client a été prévenu. »
  - « Marquer « Livrée » » (quand en route) → « Commande marquée « Livrée » : le client a été prévenu. »
  - « Refuser le justificatif » (paiement à vérifier) — invite « Motif du refus du justificatif ? » → « Justificatif refusé. »
- **« Client et livraison »** : adresse complète, téléphone (`tel:`), e-mail (`mailto:`), « Livraison : {tarif} », « Note client : … ».
- **« Articles »** : Produit (référence) · SKU · Taille · Qté · Total ; lignes « Livraison » et « Total ».
- **« Statut et suivi de livraison »** : « Nouveau statut » (transitions autorisées seulement ; sinon « Aucun changement de statut
  possible. »), « Transporteur », « Numéro de suivi », « Lien de suivi », « Note interne », case « Prévenir le client par e-mail »
  (cochée), bouton « Mettre à jour » → « Statut mis à jour. ». Annulation : confirmation « Annuler la commande ? Le stock sera
  remis en vente. ».
- **« E-mails »** : modèle, statut, « N tentative(s) », dernière erreur.
- **« Historique »** : date — action — « par » prénom nom.

### 7.5 Produits (`/admin/produits`)
Titre « Produits », bouton « Nouveau produit ». Filtre « Statut » (« Tous les statuts », « Publiés », « Brouillons »,
« Archivés »), « Rechercher » (placeholder « Nom, marque, référence »). Colonnes : Produit · Catégorie · Prix (« À définir » si
absent) · Stock · Statut · Actions (« Modifier », « Publier » / « Dépublier » → « Produit publié. » / « Produit retiré de la vente. »).

### 7.6 Ajouter un article (`/admin/produits/nouveau`)
Lien « ← Produits », titre « Ajouter un article », aide « Renseignez la fiche, les tailles avec leur prix et leur stock, puis la
photo. Les champs marqués * sont obligatoires. ». Trois blocs :
1. **« 1. Article »** (légende « Informations de l'article ») : Nom de l'article * · Marque * · Référence interne *
   (placeholder « ex. {{PREFIXE_REF}}-040 ») · Modèle exact / saison · Catégorie * (« Choisir ») · Univers ({{UNIVERS}}) · État
   (Neuf / Occasion) · Coloris (« ex. Noir / Bleu ») · Poids (kg) · Dimensions · Description courte (« Une phrase qui résume
   l'article (affichée sur la fiche) ») · Description détaillée.
2. **« 2. Tailles, prix et stock »** : Type de taille ({{SYSTEMES_DE_TAILLE}}) · Prix commun (€) (« Utilisé pour les tailles dont le
   prix est vide. ») · tableau Taille / Prix (€) / Stock, « Retirer », « + Ajouter une taille ».
3. **« 3. Photo et publication »** : « Photo (JPG, PNG, WEBP — 8 Mo max.) » · « Texte alternatif de la photo » · cases « Produit
   phare (accueil) », « Nouveauté », « Publier immédiatement sur la boutique » · bouton « Enregistrer l'article ».

Erreurs : « Ajoutez au moins une taille. » · « Chaque taille doit avoir un prix supérieur à 0 (ou renseignez le prix commun). » ·
« Ajoutez une photo pour publier l'article (ou décochez « Publier »). ».

### 7.7 Modifier un produit (`/admin/produits/[id]`)
- Barre « Publication » : « Publier sur la boutique » / « Dépublier (masquer de la boutique) », « Archiver » (« Produit archivé. »),
  « Supprimer » (confirmation « Supprimer définitivement ce produit ? »), lien « Voir la fiche publique ».
- **« Fiche produit »** : Nom de l'article * · Marque * · Référence * · Modèle exact · Catégorie * · Univers · État · Description
  courte · Description détaillée · Produit phare (accueil) · Nouveauté · « Enregistrer la fiche » → « Fiche produit enregistrée. ».
- **« Prix et stock par taille »** : « Prix initial relevé sur le marché le {date} : source » (lien) ; « Prix pour toutes les
  tailles (€) », « Prix barré (€, facultatif) », « Appliquer à toutes les tailles » → « Prix {montant} appliqué à toutes les
  tailles. ». Par taille : Prix (€) · Prix barré (€) · Coloris · Stock · « En vente » · « Enregistrer » → « Taille {libellé}
  enregistrée. ». Ajout : « Nouvelle taille » · « Type » ({{SYSTEMES_DE_TAILLE}}, « Taille unique ») · Coloris · Prix (€) · Stock ·
  « Ajouter la taille » → « Taille ajoutée. ».
- **« Ajouter un coloris »** : aide « Crée toutes les tailles actuelles dans le nouveau coloris (même prix). Sur la fiche, le client
  choisit le coloris à côté de la taille et la photo change. » ; champs « Coloris actuel * » (nomme les variantes et photos sans
  coloris), « Nouveau coloris * », « Stock par taille », « Photo de ce coloris » ; bouton « Ajouter le coloris » → « Coloris
  « {nom} » ajouté ({n} tailles). Vérifiez le stock de chaque taille. ». Erreurs : « Indiquez le nom du nouveau coloris. » ·
  « Le coloris « {nom} » existe déjà. » · « Indiquez d'abord le nom du coloris actuel (celui de la photo actuelle). » · « Ajoutez
  d'abord au moins une taille en vente. ».
- **« Images »** : par image, sélecteur « Coloris » (« Tous les coloris ») → « Coloris de la photo enregistré. », « Supprimer » →
  « Image supprimée. » ; ajout : « Fichier (JPG, PNG, WEBP) », « Coloris de la photo », « Texte alternatif * » (« Description de
  l'image »), « Ajouter l'image » → « Image ajoutée. ».

### 7.8 Catégories (`/admin/categories`)
Titre « Catégories », aide « Une catégorie principale masquée n'apparaît pas dans la navigation (tant qu'elle est vide, par
exemple). ». Création : Nom · Parent (« (catégorie principale) ») · Univers · Ordre · « Créer » → « Catégorie créée. ». Par
catégorie : nombre de « produit(s) », pastille « Masquée », visibilité → « Visibilité modifiée. », « Renommer » → « Catégorie
renommée. », « Supprimer » → « Catégorie supprimée. ».

### 7.9 Clients (`/admin/clients`)
Titre « Clients », « Rechercher un client » (placeholder « E-mail ou nom »), « Rechercher ». Colonnes : Client · Inscription ·
Commandes · Statut (Actif / Désactivé) · Actions (« Désactiver » → « Compte désactivé (sessions fermées). » / « Réactiver » →
« Compte réactivé. »). Vide : « Aucun client. ». Panneau « Fiche client » avec sa liste « Commandes ». Lecture et activation
uniquement.

### 7.10 Livraison (`/admin/livraison`)
Titre « Livraison », aide « Un pays n'est proposé au client que s'il est activé et rattaché à une zone active ayant au moins un tarif
actif. Les tarifs « [DÉMO] » sont des exemples à remplacer. ». Par zone : « Activer la zone » / « Désactiver la zone » (« Zone
modifiée. ») ; « Tarifs » : Nom du tarif · Prix (€) · Gratuit dès (€) · Délai min. (jours) · Délai max. (jours) · Actif ·
« Enregistrer » (« Tarif enregistré. ») · « Supprimer » (« Tarif supprimé. ») ; sans tarif : « Aucun tarif : les pays de cette zone
ne sont pas proposés au checkout. » ; ajout « Nouveau tarif » + « Ajouter un tarif » (« Tarif ajouté. ») ; « Pays » : bascule par
pays (« {Pays} activé. » / « {Pays} désactivé. »), « Tarif le plus bas : … ». En bas : « Nouvelle zone » + « Créer » (« Zone
créée. »).

### 7.11 Coordonnées bancaires (`/admin/banque`)
Titre « Coordonnées bancaires par pays », aide : « Au moment du paiement, le client voit le compte rattaché à son pays de
livraison. Un pays peut être servi par plusieurs comptes : chaque nouvelle commande est alors attribuée au compte de ce pays qui a
reçu une commande le moins récemment. Sans compte dédié, c'est le compte principal (variables d'environnement) qui s'affiche ; sans
aucun compte, le virement est indisponible pour ce pays. Chaque modification est journalisée et signalée par e-mail à la
boutique. »
- Alerte : « Virement impossible pour ces pays livrés, faute de compte bancaire : {pays}. Ajoutez-les à un compte ci-dessous (ou
  désactivez-les dans Livraison). »
- « Compte principal » « — modifiable uniquement via les variables d'environnement (BANK_*). » ; sinon « Aucun compte principal
  configuré : seuls les pays ayant un compte dédié peuvent payer par virement. »
- Liste des comptes (IBAN masqué, pastille « Désactivé », « Modifier », « Supprimer » — confirmation « Supprimer le compte
  « {nom} » ? Les pays concernés utiliseront le compte principal. » → « Compte supprimé. »), bouton « Ajouter un compte bancaire ».
- Formulaire (« Modifier « {nom} » ») : Nom interne * (« ex. Compte Suisse ») · Titulaire du compte * · IBAN (« (laisser vide pour
  ne pas changer) », validé mod 97) · BIC · Banque · « Pays de livraison servis par ce compte » (cases ; « aussi : » autres comptes
  du pays) · « Compte actif » · « Enregistrer » / « Annuler ». Changement d'IBAN : confirmation « Confirmer le changement d'IBAN ?
  Les prochains clients des pays concernés verront ce nouveau compte. Une alerte sera envoyée à la boutique. » → « Compte enregistré.
  Une alerte de sécurité a été envoyée à la boutique. ». Côté API : journal (IBAN masqué) + e-mail `bank-account-changed`.

### 7.12 Import du catalogue (`/admin/import`)
Titre « Import du catalogue », aide « L'import lit le dossier {{DOSSIER_CATALOGUE}} (sans jamais le modifier) et le fichier de
compléments (prix, tailles). Il est idempotent : un produit inchangé n'est pas réécrit, et le stock saisi dans l'admin n'est jamais
écrasé. » ; « Source sur ce serveur : instantané du catalogue du {date} ({n} produits). » ; « Pour y intégrer des changements du
dossier {{DOSSIER_CATALOGUE}} : lancez « npm run import:catalogue » sur le poste qui contient le dossier (l'instantané est mis à
jour), déployez, puis cliquez sur « Importer le catalogue ». » ; sans source : « Ni dossier catalogue ni instantané sur ce
serveur : lancez « npm run import:catalogue » depuis un poste qui contient le dossier, puis déployez. ». Bouton « Importer le
catalogue » → « Import terminé : {c} créé(s), {u} mis à jour, {i} inchangé(s), {e} erreur(s). ». Historique : Date · Créés · Mis à
jour · Ignorés / inchangés · Erreurs · Rapport.

### 7.13 Journaux & e-mails (`/admin/journaux`)
- « E-mails transactionnels », légende « SENT = accepté par le fournisseur (« livré » une fois la réception confirmée, vérifiée
  toutes les 10 min) · LOGGED = mode développement, non envoyé · FAILED = échec après toutes les tentatives ou refus du
  fournisseur. ». Colonnes : Date · Sujet · Commande · Statut (« · livraison non confirmée » si besoin) · Action (« Renvoyer » →
  « E-mail remis en file d'envoi. »).
- « Journal d'activité » : « Filtrer » (Tout, Commandes, Produits, Variantes et stocks, Comptes, Livraison, Imports). Colonnes :
  Date · Action · Objet · Auteur · Détail.

---

## 8. Tests, CI, déploiement, configuration

**Tests**
- API : Jest sur la base `{{prefixe}}_test` (remise à zéro automatique ; relancer la préparation e2e ensuite) — app, auth,
  comptes bancaires, instantané, checkout, i18n des e-mails, maintenance, coloris, services, découpage des tailles.
- Web : Jest + Testing Library — panier optimiste, composants, complétude i18n, coloris, retour sécurisé.
- Shared : panier + livraison, SEPA + upload + commande.
- E2E Playwright `e2e/parcours-achat.spec.ts` : seed dédié, achat complet (fiche → taille → panier → adresse → coordonnées →
  preuve → confirmation → admin « En route » → « Livrée »). Le serveur e2e efface les pages ISR générées (`.next/server/app/*/produit`)
  car la base de test change d'identifiants à chaque exécution.
- Perf : `perf/mobile-lent.spec.ts` (FCP, LCP, CLS). Les mesures locales varient de 2 à 5× : pas de conclusion sous ~1 s d'écart.

**CI GitHub Actions** : PostgreSQL de service, `npm ci`, `npm run lint`, `npm run typecheck`, `npm run test`, `npm run build`.

**Déploiement**
- Vercel : racine `apps/web`, `installCommand: cd ../.. && npm ci`, build `shared` puis `web`, région `fra1`, déploiement à chaque
  push. Domaine `{{DOMAINE}}` (apex → www en 308).
- Railway : builder Railpack, build `shared` puis `api`, `startCommand: npm start` (script `start` à la racine), healthcheck
  `/api/health` (60 s), redémarrage en cas d'échec (5 essais). Base PostgreSQL privée. Déploiement par `railway up --service api`
  depuis la racine ; migrations `db:deploy`.
- Ordre pour un secret partagé (`PROXY_SECRET`) : Vercel d'abord, redéployer, puis Railway.
- `WEB_ORIGIN` liste toutes les origines du site (sinon 403 CSRF).

**Variables d'environnement** (`.env.example`, sans valeurs, commentées)
- API : `NODE_ENV`, `APP_ENV`, `PORT`, `LOG_LEVEL`, `DATABASE_URL`, `WEB_ORIGIN`, `PUBLIC_SITE_URL`, `TRUST_PROXY`,
  `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` (≥ 32 caractères, différents), `ACCESS_TOKEN_TTL_SECONDS` (900),
  `REFRESH_TOKEN_TTL_DAYS` (30), `COOKIE_SECURE`, `PROXY_SECRET`, `BANK_ACCOUNT_HOLDER`, `BANK_IBAN`, `BANK_BIC`, `BANK_NAME`,
  `ORDER_NOTIFICATION_EMAIL`, `EMAIL_PROVIDER` (console | brevo), `BREVO_API_KEY`, `EMAIL_FROM`, `EMAIL_FROM_NAME`,
  `EMAIL_MAX_ATTEMPTS`, `EMAIL_WORKER_INTERVAL_MS`, `STORAGE_DRIVER` (local | r2) + identifiants R2, `STORAGE_LOCAL_DIR`,
  `UPLOAD_MAX_BYTES` (10 Mo), `PROOF_RETENTION_DAYS` (400), `CATALOGUE_DIR`, `PRODUCT_MEDIA_DIR`, `PRODUCT_MEDIA_BASE_URL`,
  `ADMIN_EMAIL`, `ADMIN_PASSWORD` (seed, à retirer ensuite), `SEED_DEMO_SHIPPING`.
- Web : `API_URL`, `NEXT_PUBLIC_SITE_URL`, `PROXY_SECRET`, `NEXT_PUBLIC_CARD_PAYMENT_ENABLED`.

---

## 9. Méthode de travail attendue

1. Commencer par `CLAUDE.md` (pile, commandes, conventions, règles de sécurité ci-dessus) et `.env.example`.
2. Construire par phases, chacune vérifiée (lint, types, tests, et le parcours réel dans le navigateur) avant la suivante, sans
   demander la permission entre les phases : shared → schéma + migrations + seed → API (auth, catalogue, panier, checkout, e-mails,
   stockage, admin) → site public → admin → i18n → e2e + perf → documentation de déploiement.
3. Vérifier chaque photo de chaque produit (jamais par échantillon) ; signaler toute incohérence au lieu de deviner.
4. Ne jamais déployer, publier ni exécuter d'écriture en production sans accord : donner la commande exacte au client. Vérifier
   l'espace disque avant les installations ; ne rien supprimer ni purger sans demander.
5. Finir chaque phase par un court résumé : ce qui marche (vérifié), ce qui reste à faire, ce que le client doit fournir.
