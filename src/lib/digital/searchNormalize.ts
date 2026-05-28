/** Unicode dash variants normalized to ASCII hyphen for search matching. */
const DASH_VARIANTS = /[\u2010-\u2015\u2212\uFE58\uFE63\uFF0D-]/g;
const PUNCTUATION_TO_SPACE = /[.,/_&()'"`|«»“”„\/\\]+/g;

const RU_TO_LATIN_PRIMARY: Record<string, string> = {
  а: "a",
  б: "b",
  в: "v",
  г: "g",
  д: "d",
  е: "e",
  ё: "e",
  ж: "zh",
  з: "z",
  и: "i",
  й: "y",
  к: "k",
  л: "l",
  м: "m",
  н: "n",
  о: "o",
  п: "p",
  р: "r",
  с: "s",
  т: "t",
  у: "u",
  ф: "f",
  х: "h",
  ц: "c",
  ч: "ch",
  ш: "sh",
  щ: "shch",
  ъ: "",
  ы: "y",
  ь: "",
  э: "e",
  ю: "yu",
  я: "ya",
};

const RU_TO_LATIN_ALT: Partial<Record<keyof typeof RU_TO_LATIN_PRIMARY, string>> = {
  х: "kh",
  ц: "ts",
};

/**
 * Normalizes catalog search text and user queries (trim, case, ё→е, dashes, whitespace).
 */
export function normalizeCatalogSearch(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/ё/g, "е")
    .replace(DASH_VARIANTS, "-")
    .replace(PUNCTUATION_TO_SPACE, " ")
    .replace(/\s+/g, " ");
}

export function transliterateRuToLatin(value: string): string {
  return normalizeCatalogSearch(value)
    .split("")
    .map((char) => RU_TO_LATIN_PRIMARY[char] ?? char)
    .join("");
}

function transliterateRuToLatinAlt(value: string): string {
  return normalizeCatalogSearch(value)
    .split("")
    .map((char) => RU_TO_LATIN_ALT[char as keyof typeof RU_TO_LATIN_ALT] ?? RU_TO_LATIN_PRIMARY[char] ?? char)
    .join("");
}

export function compactCatalogSearch(value: string): string {
  return normalizeCatalogSearch(value).replace(/\s+/g, "");
}

function hasCyrillic(value: string): boolean {
  return /[а-я]/i.test(value);
}

export function getCatalogSearchVariants(value: string): string[] {
  const normalized = normalizeCatalogSearch(value);
  if (!normalized) return [];

  const variants = new Set<string>([normalized, compactCatalogSearch(normalized)]);

  if (hasCyrillic(normalized)) {
    variants.add(transliterateRuToLatin(normalized));
    variants.add(transliterateRuToLatinAlt(normalized));
  }

  return [...variants].filter(Boolean);
}
