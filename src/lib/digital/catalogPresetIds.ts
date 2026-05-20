import type { CompanyPublic } from "../../types/digital";

function typeNicheHaystack(company: CompanyPublic): string {
  return `${company.companyType} ${company.niche}`.toLowerCase();
}

/** Digital-агентства: type or niche signals (server-side, stable preset id). */
export function matchesDigitalAgenciesPreset(company: CompanyPublic): boolean {
  const hay = typeNicheHaystack(company);
  return /\bdigital\b/.test(hay) || /агент/.test(hay) || /\bagency\b/.test(hay);
}

/** Веб-разработка preset. */
export function matchesWebDevPreset(company: CompanyPublic): boolean {
  const hay = typeNicheHaystack(company);
  return (
    /\bвеб\b/.test(hay) ||
    /\bweb\b/.test(hay) ||
    /разработка/.test(hay) ||
    hay.includes("custom software")
  );
}

/** Performance / SEO preset. */
export function matchesPerformanceSeoPreset(company: CompanyPublic): boolean {
  const hay = typeNicheHaystack(company);
  return (
    /\bperformance\b/.test(hay) ||
    /\bseo\b/.test(hay) ||
    hay.includes("paid media") ||
    /перформанс/.test(hay)
  );
}

/**
 * Public-safe preset ids for `data-preset-ids` (pipe-separated in DOM).
 * Client matches active chips by id membership — no substring logic in the browser.
 */
export function getCatalogPresetIds(company: CompanyPublic): string[] {
  const ids: string[] = [];

  if (company.hasActiveHiring) ids.push("active-hiring");
  if (company.hasRemote) ids.push("remote");
  if (company.hasHighHrRating) ids.push("high-rating");
  if (company.hasAwards2025) ids.push("awards-2025");
  if (company.international === "Да" || company.international === "Частично") {
    ids.push("international");
  }
  if (matchesDigitalAgenciesPreset(company)) ids.push("digital-agencies");
  if (matchesWebDevPreset(company)) ids.push("web-dev");
  if (matchesPerformanceSeoPreset(company)) ids.push("performance-seo");
  if (company.city === "Москва") ids.push("moscow");
  if (company.city === "Санкт-Петербург") ids.push("spb");

  return ids;
}

export function formatCatalogPresetIdsAttr(company: CompanyPublic): string {
  return getCatalogPresetIds(company).join("|");
}
