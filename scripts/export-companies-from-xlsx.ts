/**
 * Export master XLSX → `src/data/digital/companies.json`.
 *
 * Usage:
 *   npm run data:export-companies -- path/to/master.xlsx
 *   DIGITAL_MASTER_XLSX=path/to/master.xlsx npm run data:export-companies
 *
 * Optional env:
 *   DIGITAL_XLSX_SHEET=public_export
 *   DIGITAL_EXPORT_MAX=100        (default: 100 for public_export expansion)
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import * as XLSX from "xlsx";
import {
  buildPublicCompaniesFromRows,
  type BuildPublicCompaniesReport,
} from "../src/lib/digital/buildPublicCompaniesJson.ts";
import {
  assertNoRegionalHeadHunterEmployerUrlsInRows,
  collectForbiddenKeys,
  compareCompaniesByDefaultOrder,
  sheetHasColumn,
  SHOWCASE_COLUMN_KEYS,
} from "../src/lib/digital/normalizeCompany.ts";
import { assertValidPublicExportSizeSource } from "../src/lib/digital/publicExportSourceQa.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const jsonPath = join(root, "src/data/digital/companies.json");

const PUBLIC_SHOWCASE_COLUMN = "Показывать в публичной витрине";

const REQUIRED_PUBLIC_EXPORT_COLUMNS = [
  "company_id",
  "public_fit_status",
  "Показывать в публичной витрине",
  "active_vacancies_source",
  "website_url",
  "hh_company_url",
  "habr_url",
  "linkedin_url",
  "hh_vacancies_checked_at",
  "hh_employer_rank_label",
  "hh_employer_rank_year",
  "hh_employer_rank_source_url",
  "habr_employer_rank_label",
  "habr_employer_rank_year",
  "habr_employer_rank_source_url",
] as const;

function getHeaderKeys(rows: Record<string, unknown>[]): Set<string> {
  return new Set(Object.keys(rows[0] ?? {}));
}

function assertPublicExportContract(rows: Record<string, unknown>[]): void {
  const headers = getHeaderKeys(rows);
  const missing = REQUIRED_PUBLIC_EXPORT_COLUMNS.filter((column) => {
    if (column === PUBLIC_SHOWCASE_COLUMN) {
      return !sheetHasColumn(headers, SHOWCASE_COLUMN_KEYS);
    }
    return !headers.has(column);
  });

  if (missing.length > 0) {
    console.error(
      `[digital] public_export contract mismatch: missing required column(s): ${missing.join(", ")}`,
    );
    process.exit(1);
  }
}

const xlsxPath = process.argv[2] ?? process.env.DIGITAL_MASTER_XLSX;

if (!xlsxPath) {
  console.error(
    "Usage: npm run data:export-companies -- <path-to-master.xlsx>\n" +
      "Or set DIGITAL_MASTER_XLSX.",
  );
  process.exit(1);
}

if (!existsSync(xlsxPath)) {
  console.error(`[digital] XLSX not found: ${xlsxPath}`);
  process.exit(1);
}

const exportMax = process.env.DIGITAL_EXPORT_MAX
  ? Number(process.env.DIGITAL_EXPORT_MAX)
  : 100;

const workbook = XLSX.read(readFileSync(xlsxPath), { type: "buffer" });

function sheetHasPublicShowcaseColumn(sheet: XLSX.WorkSheet): boolean {
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: "",
    raw: false,
    range: 0,
  });
  const first = rows[0];
  return Boolean(first && sheetHasColumn(new Set(Object.keys(first)), SHOWCASE_COLUMN_KEYS));
}

function resolveExportSheet(): { sheet: XLSX.WorkSheet; sheetName: string } {
  const preferred = process.env.DIGITAL_XLSX_SHEET ?? "public_export";
  if (workbook.Sheets[preferred]) {
    return { sheet: workbook.Sheets[preferred], sheetName: preferred };
  }

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    if (sheet && sheetHasPublicShowcaseColumn(sheet)) {
      console.warn(
        `[digital] Sheet "${preferred}" not found; using "${sheetName}" (${PUBLIC_SHOWCASE_COLUMN}).`,
      );
      return { sheet, sheetName };
    }
  }

  const fallbackName = workbook.SheetNames[0] ?? "";
  const fallback = workbook.Sheets[fallbackName];
  if (!fallback) {
    console.error("[digital] No sheets found in workbook.");
    process.exit(1);
  }

  console.warn(`[digital] Sheet "${preferred}" not found; using "${fallbackName}".`);
  return { sheet: fallback, sheetName: fallbackName };
}

const { sheet: targetSheet, sheetName } = resolveExportSheet();

const allRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(targetSheet, {
  defval: "",
  raw: false,
});

if (sheetName === "public_export") {
  assertPublicExportContract(allRows);
  assertValidPublicExportSizeSource(allRows);
}

const svodkaSheet = workbook.Sheets["Сводка"];
if (svodkaSheet) {
  const svodkaRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(svodkaSheet, {
    defval: "",
    raw: false,
  });
  assertNoRegionalHeadHunterEmployerUrlsInRows(svodkaRows, { sheetName: "Сводка" });
}

const sheetHeaders = getHeaderKeys(allRows);
const eligibilityContext = { sheetName, sheetHeaders };

const forbiddenInExport = new Set<string>();
allRows.forEach((row) => {
  collectForbiddenKeys(row).forEach((key) => forbiddenInExport.add(key));
});

if (forbiddenInExport.size > 0) {
  console.warn(
    `[digital] Ignored forbidden column(s) in XLSX: ${[...forbiddenInExport].sort().join(", ")}`,
  );
}

const { companies, report } = buildPublicCompaniesFromRows(allRows, {
  preserveOrder: true,
  maxCount: Number.isFinite(exportMax) && exportMax > 0 ? exportMax : undefined,
  allowSourceUrlInference: sheetName !== "public_export",
  enforceUniqueCompanyIds: true,
  publicExportEligibility: eligibilityContext,
  normalizeOptions: {
    requireCompanyId: true,
    allowSourceUrlInference: sheetName !== "public_export",
  },
});

companies.sort(compareCompaniesByDefaultOrder);

writeFileSync(jsonPath, `${JSON.stringify(companies, null, 2)}\n`, "utf8");

logExportSummary(xlsxPath, sheetName, allRows.length, report.eligibleCount, report, companies);

if (report.warnings.length > 0) {
  console.warn(`[digital] ${report.warnings.length} normalization warning(s).`);
}

console.log(
  "[digital] Next: npm run data:validate-companies:min100",
);

function logExportSummary(
  sourcePath: string,
  sourceSheet: string,
  sheetRowCount: number,
  eligibleRowCount: number,
  exportReport: BuildPublicCompaniesReport,
  companies: ReturnType<typeof buildPublicCompaniesFromRows>["companies"],
): void {
  console.log(
    `[digital] Exported ${exportReport.normalizedCount} companies from ${sourcePath} (sheet: ${sourceSheet}) → src/data/digital/companies.json`,
  );
  console.log(
    `[digital] Rows: sheet=${sheetRowCount}, eligible public=${eligibleRowCount}, normalized=${exportReport.normalizedCount}, skipped=${exportReport.skippedCount}, capped=${exportReport.cappedCount}`,
  );
  console.log(
    `[digital] Skipped (pre-filter): invalid company_id=${exportReport.skippedInvalidCompanyId}, public_fit_status∉[P0,P1,P2]=${exportReport.skippedPublicFitStatus}, showcase≠Да=${exportReport.skippedShowcase}, other=${exportReport.skippedOther}`,
  );

  const withWebsite = companies.filter((c) => c.websiteUrl).length;
  const withHh = companies.filter((c) => c.hhCompanyUrl).length;
  const withHabr = companies.filter((c) => c.habrUrl).length;
  const withLinkedin = companies.filter((c) => c.linkedinUrl).length;

  console.log(
    `[digital] Source URLs: website=${withWebsite}, hh=${withHh}, habr=${withHabr}, linkedin=${withLinkedin}`,
  );
}
