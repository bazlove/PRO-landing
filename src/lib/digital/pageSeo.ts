import { resolveCanonicalOrigin } from "./siteOrigin";

export const DIGITAL_PAGE_PATH = "/digital";

export const DIGITAL_PAGE_H1 = "Карта IT и digital работодателей России";

export const DIGITAL_PAGE_TITLE =
  "Список IT и digital работодателей России";

export const DIGITAL_PAGE_DESCRIPTION =
  "База айти компаний России - поиск работодателей в сфере IT. Сравнение digital организаций: активный найм, удалёнка, города, рейтинги и карьерные ссылки.";

const WEB_PAGE_SCHEMA_DESCRIPTION =
  "Список IT и digital компаний России для поиска работодателей: активный найм, удалёнка, города, рейтинги и карьерные ссылки.";

/** Clean `/digital` URL without query params or trailing slash. */
export function buildDigitalPageCanonicalUrl(site: URL | string | undefined): string {
  const origin = resolveCanonicalOrigin(site);
  const url = new URL(DIGITAL_PAGE_PATH, origin);
  url.search = "";
  url.hash = "";
  return url.pathname.endsWith("/") && url.pathname !== "/"
    ? url.toString().replace(/\/$/, "")
    : url.toString();
}

export function buildDigitalWebPageJsonLd(canonicalUrl: string): string {
  return JSON.stringify({
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: DIGITAL_PAGE_H1,
    description: WEB_PAGE_SCHEMA_DESCRIPTION,
    url: canonicalUrl,
    inLanguage: "ru",
  });
}
