export const DEFAULT_LOCALE = 'fr';
export const SITE_LOCALES = [DEFAULT_LOCALE] as const;
export type SiteLocale = (typeof SITE_LOCALES)[number];

export function isSiteLocale(value: string): value is SiteLocale {
  return SITE_LOCALES.includes(value as SiteLocale);
}

export function localizedPath(path: string, locale: SiteLocale): string {
  const normalizedPath = `/${path.split('/').filter(Boolean).join('/')}`;

  return locale === DEFAULT_LOCALE ? normalizedPath : `/${locale}${normalizedPath === '/' ? '' : normalizedPath}`;
}

export function intlTag(locale: SiteLocale): string {
  return locale === 'fr' ? 'fr-FR' : locale;
}
