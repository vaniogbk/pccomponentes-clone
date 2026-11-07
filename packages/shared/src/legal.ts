/**
 * Mentions légales (LCEN art. 6-III, Code de la consommation art. L612-1).
 *
 * La page « Mentions légales » est obligatoire et ne doit jamais être supprimée. Chaque valeur doit être fournie par
 * l'éditeur du site à partir de ses documents officiels (Kbis ou équivalent, contrat d'hébergement, médiateur désigné) :
 * ne jamais la deviner ni la recopier d'un autre site. Tant qu'une valeur vaut `null`, la page affiche un repère visible
 * « [[à compléter]] ».
 */
export interface LegalNotice {
  publisher: {
    companyName: string | null;
    legalForm: string | null;
    shareCapital: string | null;
    address: string | null;
    registration: string | null;
    vatNumber: string | null;
    phone: string | null;
    email: string | null;
  };
  publicationDirector: string | null;
  host: {
    name: string | null;
    address: string | null;
    phone: string | null;
  };
  privacy: {
    controller: string | null;
    contactEmail: string | null;
  };
  consumerMediator: {
    name: string | null;
    address: string | null;
    website: string | null;
  };
}

export const LEGAL_NOTICE: LegalNotice = {
  publisher: {
    companyName: null,
    legalForm: null,
    shareCapital: null,
    address: null,
    registration: null,
    vatNumber: null,
    phone: null,
    email: null,
  },
  publicationDirector: null,
  host: {
    name: null,
    address: null,
    phone: null,
  },
  privacy: {
    controller: null,
    contactEmail: null,
  },
  consumerMediator: {
    name: null,
    address: null,
    website: null,
  },
};

/** Cookies déposés par le site : tous strictement nécessaires, donc exemptés de consentement. */
export const SITE_COOKIES = [
  { name: 'pcc_at', purpose: 'Maintien de la connexion au compte client', duration: '15 minutes' },
  { name: 'pcc_rt', purpose: 'Renouvellement sécurisé de la connexion', duration: '30 jours' },
  { name: 'pcc_cart', purpose: 'Conservation du panier sans compte', duration: '30 jours' },
] as const;

export function missingLegalFields(notice: LegalNotice = LEGAL_NOTICE): string[] {
  const missing: string[] = [];
  const walk = (value: unknown, path: string) => {
    if (value === null) missing.push(path);
    else if (typeof value === 'object') {
      for (const [key, child] of Object.entries(value as Record<string, unknown>)) walk(child, path ? `${path}.${key}` : key);
    }
  };
  walk(notice, '');
  return missing;
}
