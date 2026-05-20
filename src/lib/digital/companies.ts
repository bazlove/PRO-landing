import type { CompanyPublic } from "../../types/digital";
import rawCompaniesJson from "../../data/digital/companies.json";
import {
  compareCompaniesByDefaultOrder,
  createSlugAllocator,
  normalizeCompany,
  warnDigital,
} from "./normalizeCompany";

export type { CompanyPublic };
export {
  isStaleDate,
  normalizeCompany,
  type NormalizeCompanyOptions,
} from "./normalizeCompany";

export type DigitalCompaniesLoadReport = {
  rawCount: number;
  normalizedCount: number;
  skippedCount: number;
  warnings: string[];
};

let cachedCompanies: CompanyPublic[] | null = null;
let cachedReport: DigitalCompaniesLoadReport | null = null;

function loadRawRows(): unknown[] {
  if (!Array.isArray(rawCompaniesJson)) {
    throw new Error(
      "[digital] src/data/digital/companies.json must be a JSON array of company rows.",
    );
  }
  return rawCompaniesJson;
}

function buildCompanies(): { companies: CompanyPublic[]; report: DigitalCompaniesLoadReport } {
  const rawRows = loadRawRows();
  const allocateSlug = createSlugAllocator();
  const warnings: string[] = [];

  const normalized: CompanyPublic[] = [];

  rawRows.forEach((row, index) => {
    const company = normalizeCompany(row, index, allocateSlug, warnings);
    if (company) {
      normalized.push(company);
    }
  });

  normalized.sort(compareCompaniesByDefaultOrder);

  const skippedCount = rawRows.length - normalized.length;
  if (skippedCount > 0) {
    warnDigital(
      `[digital] Loaded ${normalized.length}/${rawRows.length} public companies (${skippedCount} skipped).`,
      warnings,
    );
  }

  const report: DigitalCompaniesLoadReport = {
    rawCount: rawRows.length,
    normalizedCount: normalized.length,
    skippedCount,
    warnings,
  };

  if (normalized.length === 0) {
    throw new Error(
      `[digital] companies.json has ${rawRows.length} raw row(s) but 0 public companies after normalization. ` +
        "Ensure rows are marked public and include name, valid career URL, and lastCheckedAt (YYYY-MM-DD).",
    );
  }

  return { companies: normalized, report };
}

export function getDigitalCompaniesLoadReport(): DigitalCompaniesLoadReport {
  if (!cachedReport) {
    getDigitalCompanies();
  }
  return cachedReport!;
}

export function getDigitalCompanies(): CompanyPublic[] {
  if (cachedCompanies) {
    return cachedCompanies;
  }

  const { companies, report } = buildCompanies();
  cachedCompanies = companies;
  cachedReport = report;

  return companies;
}
