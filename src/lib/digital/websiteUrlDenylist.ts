/** Generic aggregator roots that must never be public `websiteUrl` values. */
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
] as const;

const FORBIDDEN_GENERIC_WEBSITE_URL_SET = new Set<string>(FORBIDDEN_GENERIC_WEBSITE_URL_HREFS);

export function canonicalWebsiteUrlForDenylistCheck(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  try {
    return new URL(trimmed).href;
  } catch {
    return null;
  }
}

/** True when `websiteUrl` is a forbidden generic aggregator root (not a company profile). */
export function isForbiddenGenericWebsiteUrl(value: string | null | undefined): boolean {
  if (value === null || value === undefined) return false;
  const canonical = canonicalWebsiteUrlForDenylistCheck(String(value));
  if (!canonical) return false;
  return FORBIDDEN_GENERIC_WEBSITE_URL_SET.has(canonical);
}

/** Null out forbidden generic aggregator roots for public `websiteUrl`. */
export function sanitizePublicWebsiteUrl(value: string | null | undefined): string | null {
  if (value === null || value === undefined) return null;
  const trimmed = String(value).trim();
  if (!trimmed) return null;
  if (isForbiddenGenericWebsiteUrl(trimmed)) return null;
  return trimmed;
}
