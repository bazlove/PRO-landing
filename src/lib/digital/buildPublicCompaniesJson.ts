import type { CompanyPublic } from "../../types/digital";
import {
  compareCompaniesByDefaultOrder,
  createSlugAllocator,
  isPublicRow,
  normalizeCompany,
  resolvePublicHhVacanciesCheckedAt,
  warnDigital,
  type NormalizeCompanyOptions,
} from "./normalizeCompany";

export type { NormalizeCompanyOptions };

export type BuildPublicCompaniesOptions = {
  /** Keep source sheet row order instead of catalog sort. */
  preserveOrder?: boolean;
  /** Stop after this many valid public rows (e.g. 100 for Phase 9). */
  maxCount?: number;
} & Pick<NormalizeCompanyOptions, "allowSourceUrlInference">;

export type BuildPublicCompaniesReport = {
  rawCount: number;
  publicCandidatesCount: number;
  normalizedCount: number;
  skippedCount: number;
  /** Rows not exported because `maxCount` was reached (not validation failures). */
  cappedCount: number;
  warnings: string[];
};

/** Whitelisted public JSON shape written to `companies.json`. */
export function toPublicCompanyJsonRecord(company: CompanyPublic): CompanyPublic {
  return {
    id: company.id,
    slug: company.slug,
    name: company.name,
    city: company.city,
    companyType: company.companyType,
    niche: company.niche,
    size: company.size,
    careerUrl: company.careerUrl,
    vacanciesRange: company.vacanciesRange,
    vacanciesWeight: company.vacanciesWeight,
    hiringStatus: company.hiringStatus,
    workFormat: company.workFormat,
    hiringGeo: company.hiringGeo,
    international: company.international,
    hhRatingDisplay: company.hhRatingDisplay,
    hhRatingValue: company.hhRatingValue,
    habrRatingDisplay: company.habrRatingDisplay,
    habrRatingValue: company.habrRatingValue,
    awards2025: company.awards2025,
    hasAwards2025: company.hasAwards2025,
    presets: company.presets,
    hasActiveHiring: company.hasActiveHiring,
    hasRemote: company.hasRemote,
    hasHighHrRating: company.hasHighHrRating,
    lastCheckedAt: company.lastCheckedAt,
    hhVacanciesCheckedAt: resolvePublicHhVacanciesCheckedAt(
      company.vacanciesRange,
      company.hhVacanciesCheckedAt ?? null,
    ),
    websiteUrl: company.websiteUrl ?? null,
    hhCompanyUrl: company.hhCompanyUrl ?? null,
    habrUrl: company.habrUrl ?? null,
    linkedinUrl: company.linkedinUrl ?? null,
    employerRankingBadges: company.employerRankingBadges,
    publicStatus: "public",
  };
}

/** Rows where vacancies are unchecked must not carry an HH check date. */
export function findHiringFreshnessInconsistencies(companies: CompanyPublic[]): string[] {
  const issues: string[] = [];

  for (const company of companies) {
    if (company.vacanciesRange === "Не проверено" && company.hhVacanciesCheckedAt) {
      issues.push(
        `${company.id}: vacanciesRange="Не проверено" with hhVacanciesCheckedAt=${company.hhVacanciesCheckedAt}`,
      );
    }
  }

  return issues;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function buildPublicCompaniesFromRows(
  rawRows: unknown[],
  options: BuildPublicCompaniesOptions = {},
): { companies: CompanyPublic[]; report: BuildPublicCompaniesReport } {
  if (!Array.isArray(rawRows)) {
    throw new Error("[digital] Input must be a JSON array of company rows.");
  }

  const { preserveOrder = false, maxCount, allowSourceUrlInference = true } = options;
  const allocateSlug = createSlugAllocator();
  const warnings: string[] = [];
  const normalized: CompanyPublic[] = [];
  let skippedCount = 0;

  const publicCandidatesCount = rawRows.filter(
    (row) => isRecord(row) && isPublicRow(row),
  ).length;

  let stopIndex = rawRows.length;

  for (let index = 0; index < rawRows.length; index += 1) {
    if (maxCount !== undefined && normalized.length >= maxCount) {
      stopIndex = index;
      break;
    }

    const company = normalizeCompany(rawRows[index], index, allocateSlug, warnings, {
      allowSourceUrlInference,
    });
    if (company) {
      normalized.push(toPublicCompanyJsonRecord(company));
    } else {
      skippedCount += 1;
    }
  }

  const cappedCount = rawRows.length - stopIndex;

  if (!preserveOrder) {
    normalized.sort(compareCompaniesByDefaultOrder);
  }

  const freshnessIssues = findHiringFreshnessInconsistencies(normalized);
  if (freshnessIssues.length > 0) {
    throw new Error(
      `[digital] Hiring freshness inconsistency (${freshnessIssues.length} row(s)):\n` +
        freshnessIssues.map((line) => `  - ${line}`).join("\n"),
    );
  }

  if (skippedCount > 0 || cappedCount > 0) {
    const parts: string[] = [];
    if (skippedCount > 0) parts.push(`${skippedCount} skipped`);
    if (cappedCount > 0) parts.push(`${cappedCount} not exported (max ${maxCount})`);
    warnDigital(
      `[digital] Built ${normalized.length}/${rawRows.length} public companies (${parts.join(", ")}).`,
      warnings,
    );
  } else if (maxCount !== undefined && normalized.length < maxCount) {
    warnDigital(
      `[digital] Built ${normalized.length}/${rawRows.length} public companies (target ${maxCount}, fewer valid rows in sheet order).`,
      warnings,
    );
  }

  return {
    companies: normalized,
    report: {
      rawCount: rawRows.length,
      publicCandidatesCount,
      normalizedCount: normalized.length,
      skippedCount,
      cappedCount,
      warnings,
    },
  };
}
