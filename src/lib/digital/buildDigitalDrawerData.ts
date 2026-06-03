import type { CompanyPublic } from "../../types/digital";

/** Compact public fields required to render the company detail drawer client-side. */
export type DrawerCompanyData = {
  id: string;
  slug: string;
  name: string;
  city: string;
  companyType: string;
  niche: string;
  size: string | null;
  careerUrl: string;
  hhCompanyUrl: string | null;
  habrUrl: string | null;
  linkedinUrl: string | null;
  hiringStatus: CompanyPublic["hiringStatus"];
  vacanciesRange: CompanyPublic["vacanciesRange"];
  workFormat: CompanyPublic["workFormat"];
  hiringGeo: string;
  international: CompanyPublic["international"];
  hhRatingDisplay: string;
  habrRatingDisplay: string;
  awards2025: string | null;
  signals: CompanyPublic["signals"];
  employerRankingBadges: CompanyPublic["employerRankingBadges"];
  itAccreditation?: CompanyPublic["itAccreditation"];
  hhVacanciesCheckedAt: string | null;
  hasActiveHiring: boolean;
  hasRemote: boolean;
  hasHighHrRating: boolean;
  hasAwards2025: boolean;
  presets: CompanyPublic["presets"];
};

export function buildDigitalDrawerData(company: CompanyPublic): DrawerCompanyData {
  return {
    id: company.id,
    slug: company.slug,
    name: company.name,
    city: company.city,
    companyType: company.companyType,
    niche: company.niche,
    size: company.size,
    careerUrl: company.careerUrl,
    hhCompanyUrl: company.hhCompanyUrl,
    habrUrl: company.habrUrl,
    linkedinUrl: company.linkedinUrl,
    hiringStatus: company.hiringStatus,
    vacanciesRange: company.vacanciesRange,
    workFormat: company.workFormat,
    hiringGeo: company.hiringGeo,
    international: company.international,
    hhRatingDisplay: company.hhRatingDisplay,
    habrRatingDisplay: company.habrRatingDisplay,
    awards2025: company.awards2025,
    signals: company.signals,
    employerRankingBadges: company.employerRankingBadges,
    itAccreditation: company.itAccreditation,
    hhVacanciesCheckedAt: company.hhVacanciesCheckedAt,
    hasActiveHiring: company.hasActiveHiring,
    hasRemote: company.hasRemote,
    hasHighHrRating: company.hasHighHrRating,
    hasAwards2025: company.hasAwards2025,
    presets: company.presets,
  };
}

/** Cast drawer payload for shared display helpers typed against `CompanyPublic`. */
export function asDrawerDisplayCompany(company: DrawerCompanyData): CompanyPublic {
  return company as unknown as CompanyPublic;
}
