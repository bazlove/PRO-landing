import { resolveCanonicalOrigin } from "./siteOrigin";

export const DIGITAL_PAGE_PATH = "/digital";

export const DIGITAL_PAGE_H1 = "Карта IT и digital работодателей России";

export const DIGITAL_PAGE_TITLE =
  "Айти компании России - список IT и digital работодателей";

export const DIGITAL_PAGE_DESCRIPTION =
  "Список айти компаний России - IT и digital работодатели, активный найм, удалёнка/гибрид, города, рейтинги HH/Habr и карьерные ссылки.";

export const DIGITAL_PAGE_OG_IMAGE_PATH = "/og/digital-cover.png";

export const DIGITAL_PAGE_OG_IMAGE_ALT =
  "Карта IT и digital работодателей России";

const WEB_PAGE_SCHEMA_DESCRIPTION =
  "Список IT и digital компаний России для поиска работодателей: активный найм, удалёнка/гибрид, города, рейтинги HH/Habr и карьерные ссылки.";

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

export function buildDigitalPageOgImageUrl(site: URL | string | undefined): string {
  const origin = resolveCanonicalOrigin(site);
  const url = new URL(DIGITAL_PAGE_OG_IMAGE_PATH, origin);
  url.search = "";
  url.hash = "";
  return url.toString();
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
