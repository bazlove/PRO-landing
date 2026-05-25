/** Historical employer awards — removed from public MVP contract. */
export const FORBIDDEN_HISTORICAL_AWARDS_KEYS = new Set([
  "historicalEmployerAwards",
  "historical_employer_awards",
  "historical_awards_source_url",
]);

/** Internal P2 trust / legal pilot fields — must never appear in public JSON. */
export const FORBIDDEN_PUBLIC_EXACT_KEYS = new Set([
  "legal_name",
  "inn",
  "ogrn",
  "legal_identity_status",
  "legal_identity_source_url",
  "legal_checked_at",
  "it_accreditation_status",
  "it_accreditation_checked_at",
  "it_accreditation_source_url",
  "it_accreditation_query",
  "it_accreditation_note",
  "qa_confidence",
]);

export const FORBIDDEN_GENERIC_WEBSITE_URL_HREFS = [
  "https://hh.ru/",
  "https://www.hh.ru/",
  "https://career.habr.com/",
  "https://www.career.habr.com/",
  "https://habr.com/",
  "https://www.habr.com/",
  "https://linkedin.com/",
  "https://www.linkedin.com/",
  "https://ru.linkedin.com/",
];

const FORBIDDEN_GENERIC_WEBSITE_URL_SET = new Set(FORBIDDEN_GENERIC_WEBSITE_URL_HREFS);

export function isForbiddenGenericWebsiteUrl(value) {
  if (value === null || value === undefined) return false;
  try {
    return FORBIDDEN_GENERIC_WEBSITE_URL_SET.has(new URL(String(value).trim()).href);
  } catch {
    return false;
  }
}
