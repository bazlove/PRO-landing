import type { CompanyPublic } from "../../types/digital";
import { formatCatalogPresetIdsAttr } from "./catalogPresetIds";
import { normalizeCatalogSearch } from "./searchNormalize";

export function getCatalogSearchText(company: CompanyPublic): string {
  return normalizeCatalogSearch(
    `${company.name} ${company.city} ${company.companyType} ${company.niche}`,
  );
}

/** Public-safe data attributes for catalog filter script (table rows + mobile cards). */
export function getCatalogItemDataAttrs(company: CompanyPublic): Record<string, string> {
  return {
    "data-digital-catalog-item": "",
    "data-company-id": company.id,
    "data-company-slug": company.slug,
    "data-company-name": company.name,
    "data-city": company.city,
    "data-company-type": company.companyType,
    "data-niche": company.niche,
    "data-size": company.size,
    "data-hiring-status": company.hiringStatus,
    "data-work-format": company.workFormat,
    "data-hiring-geo": company.hiringGeo,
    "data-international": company.international,
    "data-has-active-hiring": String(company.hasActiveHiring),
    "data-has-remote": String(company.hasRemote),
    "data-has-high-hr-rating": String(company.hasHighHrRating),
    "data-has-awards-2025": String(company.hasAwards2025),
    "data-search-text": getCatalogSearchText(company),
    "data-preset-ids": formatCatalogPresetIdsAttr(company),
  };
}
