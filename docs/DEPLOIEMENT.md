# Déploiement

La configuration de déploiement prépare les services ; elle n'autorise pas une mise en production avec les données actuelles.
Le catalogue affiche des prix `[DÉMO]`, aucune livraison ni aucun paiement n'est activé et plusieurs informations commerciales sont
encore manquantes.

## Préparation commune

1. Obtenir et vérifier le domaine, la raison sociale, les mentions obligatoires, les coordonnées client et les conditions de vente.
2. Remplacer les prix de démonstration par des prix sourcés (URL et date), et confirmer références, variantes et niveaux de stock.
3. Créer une base PostgreSQL de production et appliquer les migrations avec `npm run db:deploy`.
4. Configurer les secrets uniquement dans les paramètres Railway/Vercel ou le gestionnaire de secrets approprié.
5. Ne pas activer les commandes avant d'avoir configuré les tarifs de livraison, les conditions, le compte SEPA et la réception des
   preuves de virement.

## Railway — API et PostgreSQL

- Créer un service API depuis la racine du dépôt (`railway.json`).
- Ajouter PostgreSQL et lier son URL interne à `DATABASE_URL`.
- Définir les variables requises : `NODE_ENV=production`, `WEB_ORIGIN`, `PUBLIC_SITE_URL`, `PROXY_SECRET`,
  `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `DATABASE_URL`.
- Générer deux secrets JWT indépendants d'au moins 32 caractères. Ne pas les saisir dans le code ou le chat.
- Vérifier le contrôle de santé `/api/health` et appliquer les migrations avant d'ouvrir le service au web.
- Configurer `TRUST_PROXY=true` uniquement si Railway termine TLS en amont et que la configuration du proxy est maîtrisée.

L'API expose le point de santé, le catalogue public en lecture (`/api/catalogue/*`), l'authentification client (`/api/auth/*`)
et le panier (`/api/cart/*`). L'envoi des e-mails, la commande, le stockage des justificatifs et l'administration restent à
construire.

## Vercel — storefront

Configurer `apps/web` comme répertoire racine du projet. Les commandes du workspace utilisent l'installation npm à la racine.
Renseigner `NEXT_PUBLIC_SITE_URL`, `API_URL` et `PROXY_SECRET` lorsque la couche proxy web/API sera en place. Ne déployer que sur
un environnement de prévisualisation tant que les données et pages juridiques ne sont pas validées.

## Cloudflare R2 — justificatifs privés

Créer un bucket privé distinct. Configurer `STORAGE_DRIVER=r2`, `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`,
`R2_BUCKET` et `R2_ENDPOINT` dans Railway. Ne pas rendre le bucket public, ne servir aucun justificatif depuis `public/` et
limiter sa lecture à une route d'administration protégée. L'adaptateur R2 et le contrôle d'accès admin ne sont pas encore
implémentés : ne pas accepter de justificatif avant leur validation.

## À ne pas activer

- Aucun déploiement de production, compte bancaire ou paiement avec les valeurs de démonstration.
- Aucun email transactionnel réel avant configuration du fournisseur et de l'adresse d'envoi.
- Aucun justificatif de virement tant que stockage privé, autorisation admin et purge RGPD ne sont pas en place.
