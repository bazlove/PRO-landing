import { resolveCanonicalOrigin } from "./siteOrigin";

export const DIGITAL_PAGE_PATH = "/digital/";

export const DIGITAL_PAGE_H1 = "Карта IT и digital работодателей России";

export const DIGITAL_PAGE_TITLE =
  "IT компании России - список айти и диджитал работодателей";

export const DIGITAL_PAGE_DESCRIPTION =
  "Список айти компаний России - это IT и digital работодатели, статус найма, формат работы, города, рейтинги HH/Habr и ссылки на карьерные страницы.";

export const DIGITAL_PAGE_OG_IMAGE_PATH = "/og/digital-cover.png";

export const DIGITAL_PAGE_OG_IMAGE_ALT =
  "Карта IT и digital работодателей России";

const WEB_PAGE_SCHEMA_DESCRIPTION =
  "Список IT и digital компаний России для поиска работодателей: статус найма, удалёнка/гибрид/офис, города, рейтинги HH/Habr и карьерные ссылки.";

/** Clean `/digital/` URL without query params or hash. */
export function buildDigitalPageCanonicalUrl(site: URL | string | undefined): string {
  const origin = resolveCanonicalOrigin(site);
  const url = new URL(DIGITAL_PAGE_PATH, origin);
  url.search = "";
  url.hash = "";
  return url.toString();
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
