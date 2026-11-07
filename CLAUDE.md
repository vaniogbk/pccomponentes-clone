@AGENTS.md

# Instructions du projet

Ce dépôt est un monorepo npm : storefront Next.js 16 dans `apps/web`, API Express 4 / Prisma dans `apps/api`, règles métier
partagées dans `packages/shared`.

- Utiliser Node.js 24 et respecter TypeScript strict.
- Garder tous les montants en centimes `Int`; ne jamais utiliser de flottants pour l'argent.
- Valider toute entrée API avec Zod. Ne jamais journaliser de cookie, jeton, mot de passe, adresse e-mail, IBAN ni corps de requête.
- Les données du catalogue, les prix, stocks, délais, coordonnées et conditions actuels sont des données de démonstration : ne pas
  les publier comme faits sans source client vérifiable.
- Ne jamais supprimer la page « Mentions légales » (`apps/web/src/app/mentions-legales`) : elle est obligatoire. Ses valeurs
  viennent de l'éditeur (`packages/shared/src/legal.ts`), jamais devinées ni recopiées d'un autre site.
- Ne jamais ajouter de secret, de véritable IBAN ou de donnée personnelle au dépôt. R2 reste privé pour les justificatifs.
- Les commandes de carte et de virement restent désactivées tant que les fournisseurs et comptes ne sont pas configurés.
- Consulter les guides installés sous `node_modules/next/dist/docs/` avant tout changement Next.js. Pour Next.js 16, utiliser
  `proxy.ts` et non l'ancien nom `middleware.ts`.
- Avant une publication, exécuter `npm run check` et vérifier qu'aucun prix, stock, compte ou délai de démonstration n'est exposé.

Voir `README.md` pour les commandes, les variables à fournir et les limites fonctionnelles actuelles.
