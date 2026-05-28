/** Unicode dash variants treated as token separators. */
const DASH_VARIANTS = /[\u2010-\u2015\u2212\uFE58\uFE63\uFF0D-]/g;
const PUNCTUATION_TO_SPACE = /[.,/_&|:;()[\]'"`«»“”„\/\\]+/g;
const LEGAL_SEARCH_DENYLIST = new Set(["ооо", "инн", "огрн"]);

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

const RU_TO_LATIN_ALT_TS: Partial<Record<keyof typeof RU_TO_LATIN_PRIMARY, string>> = {
  ц: "ts",
};
const RU_TO_LATIN_ALT_KH: Partial<Record<keyof typeof RU_TO_LATIN_PRIMARY, string>> = {
  х: "kh",
};
const RU_TO_LATIN_ALT_BOTH: Partial<Record<keyof typeof RU_TO_LATIN_PRIMARY, string>> = {
  ц: "ts",
  х: "kh",
};

/**
 * Normalizes catalog search text and user queries (trim, case, ё→е, dashes, whitespace).
 */
export function normalizeCatalogSearch(value: string): string {
  const source = String(value ?? "");
  return source
    .trim()
    .toLowerCase()
    .replace(/ё/g, "е")
    .replace(DASH_VARIANTS, " ")
    .replace(PUNCTUATION_TO_SPACE, " ")
    .replace(/\s+/g, " ");
}

export function transliterateRuToLatin(value: string): string {
  return normalizeCatalogSearch(value)
    .split("")
    .map((char) => RU_TO_LATIN_PRIMARY[char] ?? char)
    .join("");
}

function transliterateRuToLatinWithOverrides(
  value: string,
  overrides: Partial<Record<keyof typeof RU_TO_LATIN_PRIMARY, string>>,
): string {
  return normalizeCatalogSearch(value)
    .split("")
    .map((char) => overrides[char as keyof typeof overrides] ?? RU_TO_LATIN_PRIMARY[char] ?? char)
    .join("");
}

export function compactCatalogSearch(value: string): string {
  return normalizeCatalogSearch(value).replace(/\s+/g, "");
}

export function isDeniedLegalSearchQuery(value: string): boolean {
  const normalized = normalizeCatalogSearch(value);
  const compact = compactCatalogSearch(value);
  return LEGAL_SEARCH_DENYLIST.has(normalized) || LEGAL_SEARCH_DENYLIST.has(compact);
}

function hasCyrillic(value: string): boolean {
  return /[а-я]/i.test(value);
}

export function getCatalogSearchVariants(value: string): string[] {
  const normalized = normalizeCatalogSearch(value);
  if (!normalized) return [];

  const variants = new Set<string>([normalized, compactCatalogSearch(normalized)]);

  if (hasCyrillic(normalized)) {
    const transliterated = transliterateRuToLatin(normalized);
    const transliteratedTs = transliterateRuToLatinWithOverrides(normalized, RU_TO_LATIN_ALT_TS);
    const transliteratedKh = transliterateRuToLatinWithOverrides(normalized, RU_TO_LATIN_ALT_KH);
    const transliteratedBoth = transliterateRuToLatinWithOverrides(normalized, RU_TO_LATIN_ALT_BOTH);
    variants.add(transliterated);
    variants.add(compactCatalogSearch(transliterated));
    variants.add(transliteratedTs);
    variants.add(compactCatalogSearch(transliteratedTs));
    variants.add(transliteratedKh);
    variants.add(compactCatalogSearch(transliteratedKh));
    variants.add(transliteratedBoth);
    variants.add(compactCatalogSearch(transliteratedBoth));
  }

  return [...variants].filter(Boolean);
}
