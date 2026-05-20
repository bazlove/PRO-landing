/** Unicode dash variants normalized to ASCII hyphen for search matching. */
const DASH_VARIANTS = /[\u2010-\u2015\u2212\uFE58\uFE63\uFF0D-]/g;

/**
 * Normalizes catalog search text and user queries (trim, case, ё→е, dashes, whitespace).
 */
export function normalizeCatalogSearch(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/ё/g, "е")
    .replace(DASH_VARIANTS, "-")
    .replace(/\s+/g, " ");
}
