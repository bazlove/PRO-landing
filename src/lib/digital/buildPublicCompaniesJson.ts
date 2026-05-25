import type { CompanyPublic } from "../../types/digital";
import {
  assertNoRegionalHeadHunterEmployerUrlsInRows,
  compareCompaniesByDefaultOrder,
  createSlugAllocator,
  getPublicExportSkipReason,
  isPublicExportEligibleRow,
  normalizeCompany,
  parseCompanyId,
  recalculateDerivedFields,
  resolvePublicHhVacanciesCheckedAt,
  warnDigital,
  type NormalizeCompanyOptions,
  type PublicExportEligibilityContext,
} from "./normalizeCompany";

export type { NormalizeCompanyOptions };

export type BuildPublicCompaniesOptions = {
  /** Keep source sheet row order instead of catalog sort. */
  preserveOrder?: boolean;
  /** Stop after this many valid public rows (e.g. 100 for Phase 9). */
  maxCount?: number;
  /** Fail when duplicate `company_id` / `id` values appear among input rows. */
  enforceUniqueCompanyIds?: boolean;
  /** XLSX export: apply showcase + public_fit_status + company_id gate. */
  publicExportEligibility?: PublicExportEligibilityContext;
  /** Passed through to `normalizeCompany`. */
  normalizeOptions?: NormalizeCompanyOptions;
} & Pick<NormalizeCompanyOptions, "allowSourceUrlInference">;

export type BuildPublicCompaniesReport = {
  rawCount: number;
  publicCandidatesCount: number;
  eligibleCount: number;
  normalizedCount: number;
  skippedCount: number;
  skippedInvalidCompanyId: number;
  skippedPublicFitStatus: number;
  skippedShowcase: number;
  skippedOther: number;
  /** Rows not exported because `maxCount` was reached (not validation failures). */
  cappedCount: number;
  warnings: string[];
};

/** Whitelisted public JSON shape written to `companies.json`. */
export function toPublicCompanyJsonRecord(company: CompanyPublic): CompanyPublic {
  const recalculated = recalculateDerivedFields(company);

  return {
    id: recalculated.id,
    slug: recalculated.slug,
    name: recalculated.name,
    city: recalculated.city,
    companyType: recalculated.companyType,
    niche: recalculated.niche,
    size: recalculated.size,
    careerUrl: recalculated.careerUrl,
    vacanciesRange: recalculated.vacanciesRange,
    vacanciesWeight: recalculated.vacanciesWeight,
    hiringStatus: recalculated.hiringStatus,
    workFormat: recalculated.workFormat,
    hiringGeo: recalculated.hiringGeo,
    international: recalculated.international,
    hhRatingDisplay: recalculated.hhRatingDisplay,
    hhRatingValue: recalculated.hhRatingValue,
    habrRatingDisplay: recalculated.habrRatingDisplay,
    habrRatingValue: recalculated.habrRatingValue,
    awards2025: recalculated.awards2025,
    hasAwards2025: recalculated.hasAwards2025,
    presets: recalculated.presets,
    signals: recalculated.signals,
    historicalEmployerAwards: recalculated.historicalEmployerAwards ?? null,
    hasActiveHiring: recalculated.hasActiveHiring,
    hasRemote: recalculated.hasRemote,
    hasHighHrRating: recalculated.hasHighHrRating,
    lastCheckedAt: recalculated.lastCheckedAt,
    hhVacanciesCheckedAt: resolvePublicHhVacanciesCheckedAt(
      recalculated.vacanciesRange,
      recalculated.hhVacanciesCheckedAt ?? null,
    ),
    websiteUrl: recalculated.websiteUrl ?? null,
    hhCompanyUrl: recalculated.hhCompanyUrl ?? null,
    habrUrl: recalculated.habrUrl ?? null,
    linkedinUrl: recalculated.linkedinUrl ?? null,
    employerRankingBadges: recalculated.employerRankingBadges,
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

function isRowRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function assertUniqueCompanyIds(
  rows: unknown[],
  eligibility?: PublicExportEligibilityContext,
): void {
  const seen = new Map<string, number>();
  const duplicates: string[] = [];

  rows.forEach((row, index) => {
    if (!isRowRecord(row)) return;
    if (eligibility && !isPublicExportEligibleRow(row, eligibility)) return;

    const id = parseCompanyId(row);
    if (!id) return;

    if (seen.has(id)) {
      duplicates.push(
        `${id} (rows ${seen.get(id)! + 1} and ${index + 1})`,
      );
    } else {
      seen.set(id, index);
    }
  });

  if (duplicates.length > 0) {
    throw new Error(
      `[digital] Duplicate company_id among public export candidates:\n` +
        duplicates.map((line) => `  - ${line}`).join("\n"),
    );
  }
}

function countSkipReasons(
  rows: unknown[],
  eligibility: PublicExportEligibilityContext | undefined,
): Pick<
  BuildPublicCompaniesReport,
  | "skippedInvalidCompanyId"
  | "skippedPublicFitStatus"
  | "skippedShowcase"
  | "skippedOther"
  | "eligibleCount"
> {
  let skippedInvalidCompanyId = 0;
  let skippedPublicFitStatus = 0;
  let skippedShowcase = 0;
  let skippedOther = 0;
  let eligibleCount = 0;

  if (!eligibility) {
    return {
      skippedInvalidCompanyId: 0,
      skippedPublicFitStatus: 0,
      skippedShowcase: 0,
      skippedOther: 0,
      eligibleCount: rows.length,
    };
  }

  for (const row of rows) {
    if (!isRowRecord(row)) {
      skippedOther += 1;
      continue;
    }

    if (isPublicExportEligibleRow(row, eligibility)) {
      eligibleCount += 1;
      continue;
    }

    const reason = getPublicExportSkipReason(row, eligibility);
    if (reason === "invalid_company_id") skippedInvalidCompanyId += 1;
    else if (reason === "public_fit_status") skippedPublicFitStatus += 1;
    else if (reason === "showcase") skippedShowcase += 1;
    else skippedOther += 1;
  }

  return {
    skippedInvalidCompanyId,
    skippedPublicFitStatus,
    skippedShowcase,
    skippedOther,
    eligibleCount,
  };
}

export function buildPublicCompaniesFromRows(
  rawRows: unknown[],
  options: BuildPublicCompaniesOptions = {},
): { companies: CompanyPublic[]; report: BuildPublicCompaniesReport } {
  if (!Array.isArray(rawRows)) {
    throw new Error("[digital] Input must be a JSON array of company rows.");
  }

  const {
    preserveOrder = false,
    maxCount,
    allowSourceUrlInference = true,
    enforceUniqueCompanyIds = false,
    publicExportEligibility,
    normalizeOptions,
  } = options;

  if (enforceUniqueCompanyIds) {
    assertUniqueCompanyIds(rawRows, publicExportEligibility);
  }

  if (publicExportEligibility) {
    assertNoRegionalHeadHunterEmployerUrlsInRows(rawRows, {
      sheetName: publicExportEligibility.sheetName,
    });
  }

  const skipCounts = countSkipReasons(rawRows, publicExportEligibility);

  const allocateSlug = createSlugAllocator();
  const warnings: string[] = [];
  const normalized: CompanyPublic[] = [];
  let skippedCount = 0;

  const publicCandidatesCount = publicExportEligibility
    ? skipCounts.eligibleCount
    : rawRows.filter((row) => isRowRecord(row)).length;

  let stopIndex = rawRows.length;

  const normalizeOpts: NormalizeCompanyOptions = {
    allowSourceUrlInference,
    ...normalizeOptions,
  };

  for (let index = 0; index < rawRows.length; index += 1) {
    if (maxCount !== undefined && normalized.length >= maxCount) {
      stopIndex = index;
      break;
    }

    const row = rawRows[index];
    if (publicExportEligibility && isRowRecord(row)) {
      if (!isPublicExportEligibleRow(row, publicExportEligibility)) {
        skippedCount += 1;
        continue;
      }
    }

    const company = normalizeCompany(row, index, allocateSlug, warnings, normalizeOpts);
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
      eligibleCount: skipCounts.eligibleCount,
      normalizedCount: normalized.length,
      skippedCount,
      skippedInvalidCompanyId: skipCounts.skippedInvalidCompanyId,
      skippedPublicFitStatus: skipCounts.skippedPublicFitStatus,
      skippedShowcase: skipCounts.skippedShowcase,
      skippedOther: skipCounts.skippedOther,
      cappedCount,
      warnings,
    },
  };
}
