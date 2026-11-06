export const EUROPEAN_COUNTRY_CODES = [
  'AD', 'AL', 'AT', 'BA', 'BE', 'BG', 'BY', 'CH', 'CY', 'CZ', 'DE', 'DK',
  'EE', 'ES', 'FI', 'FR', 'GB', 'GR', 'HR', 'HU', 'IE', 'IS', 'IT', 'LI',
  'LT', 'LU', 'LV', 'MC', 'MD', 'ME', 'MK', 'MT', 'NL', 'NO', 'PL', 'PT',
  'RO', 'RS', 'SE', 'SI', 'SK', 'SM', 'TR', 'UA', 'VA', 'XK',
] as const;

export type EuropeanCountryCode = (typeof EUROPEAN_COUNTRY_CODES)[number];

export function countryName(code: string, locale = 'fr'): string {
  const name = new Intl.DisplayNames([locale], { type: 'region' }).of(code.toUpperCase());

  if (!name || name === code.toUpperCase()) {
    throw new RangeError('Code pays non reconnu.');
  }

  return name;
}
