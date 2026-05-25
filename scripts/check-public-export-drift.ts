/**
 * Drift check: `Сводка` ↔ `public_export` by `company_id`.
 *
 * Usage:
 *   npm run data:drift-check -- master.xlsx
 *   DIGITAL_MASTER_XLSX=master.xlsx npm run data:drift-check
 */
import { readFileSync, existsSync } from "node:fs";
import * as XLSX from "xlsx";
import { toCanonicalHeadHunterEmployerUrl } from "../src/lib/digital/normalizeCompany.ts";
import { isForbiddenGenericWebsiteUrl } from "../src/lib/digital/websiteUrlDenylist.ts";

const SVODKA_SHEET = "Сводка";
const PUBLIC_EXPORT_SHEET = "public_export";

const PUBLIC_FIT_ELIGIBLE = new Set(["P0", "P1", "P2"]);

type DriftSeverity = "critical" | "warning";

type DriftIssue = {
  severity: DriftSeverity;
  companyId: string;
  field: string;
  message: string;
  svodkaValue?: string;
  publicValue?: string;
};

const URL_PLACEHOLDERS = new Set(["-", "—", "нет", "n/a", "na"]);

function pickString(row: Record<string, unknown>, keys: string[]): string {
  for (const key of keys) {
    const value = row[key];
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      return String(value).trim();
    }
  }
  return "";
}

function isPlaceholder(value: string): boolean {
  return !value.trim() || URL_PLACEHOLDERS.has(value.trim().toLowerCase());
}

function canonicalizeUrl(value: string): string {
  if (!value || isPlaceholder(value)) return "";
  try {
    const hh = toCanonicalHeadHunterEmployerUrl(value);
    if (hh) return hh;
    return new URL(value).href;
  } catch {
    return value.trim();
  }
}

function urlsEquivalent(a: string, b: string): boolean {
  const left = canonicalizeUrl(a);
  const right = canonicalizeUrl(b);
  if (!left && !right) return true;
  if (!left || !right) return false;
  return left === right;
}

function normalizeVacanciesRangeToken(value: string): string {
  return value.trim().replace(/5-10/g, "5–10").replace(/1-4/g, "1–4");
}

type FieldSpec = {
  label: string;
  keys: string[];
  compare?: "url" | "vacanciesRange" | "optionalText";
  optional?: boolean;
};

function normalizeOptionalTextValue(value: string): string {
  if (isPlaceholder(value)) return "";
  return value.trim();
}

const DRIFT_FIELDS: FieldSpec[] = [
  { label: "company name", keys: ["name", "company", "companyName", "Название компании", "Компания"] },
  {
    label: "career URL",
    keys: ["careerUrl", "career_url", "Карьерная страница", "Карьерная ссылка"],
    compare: "url",
  },
  {
    label: "vacancies range",
    keys: ["vacanciesRange", "vacancies_range", "Активные вакансии", "Диапазон вакансий"],
    compare: "vacanciesRange",
  },
  { label: "hiring status", keys: ["hiringStatus", "hiring_status", "Статус найма"] },
  { label: "work format", keys: ["workFormat", "work_format", "Формат работы"] },
  { label: "hiring geography", keys: ["hiringGeo", "hiring_geo", "География найма"] },
  { label: "HH rating display", keys: ["hhRatingDisplay", "hh_rating_display", "Рейтинг HH (display)"] },
  { label: "HH rating value", keys: ["hhRatingValue", "hh_rating_value", "Рейтинг HH"] },
  { label: "Habr rating display", keys: ["habrRatingDisplay", "habr_rating_display"] },
  { label: "Habr rating value", keys: ["habrRatingValue", "habr_rating_value", "Рейтинг Habr"] },
  {
    label: "awards text",
    keys: ["awards2025", "awards_2025", "Ключевые награды 2025", "Награды 2025"],
    optional: true,
  },
  {
    label: "has awards flag",
    keys: ["hasAwards2025", "has_awards_2025"],
    optional: true,
  },
  { label: "public_fit_status", keys: ["public_fit_status", "publicFitStatus"] },
  { label: "active_vacancies_source", keys: ["active_vacancies_source", "activeVacanciesSource"] },
  { label: "website_url", keys: ["website_url", "websiteUrl", "website"], compare: "url", optional: true },
  { label: "hh_company_url", keys: ["hh_company_url", "hhCompanyUrl"], compare: "url", optional: true },
  { label: "habr_url", keys: ["habr_url", "habrUrl"], compare: "url", optional: true },
  { label: "linkedin_url", keys: ["linkedin_url", "linkedinUrl"], compare: "url", optional: true },
  {
    label: "hh_vacancies_checked_at",
    keys: ["hh_vacancies_checked_at", "hhVacanciesCheckedAt", "Дата проверки вакансий"],
    optional: true,
  },
  { label: "hh_employer_rank_label", keys: ["hh_employer_rank_label", "hhEmployerRankLabel"], optional: true },
  { label: "hh_employer_rank_year", keys: ["hh_employer_rank_year", "hhEmployerRankYear"], optional: true },
  {
    label: "hh_employer_rank_source_url",
    keys: ["hh_employer_rank_source_url", "hhEmployerRankSourceUrl"],
    compare: "url",
    optional: true,
  },
  { label: "habr_employer_rank_label", keys: ["habr_employer_rank_label", "habrEmployerRankLabel"], optional: true },
  { label: "habr_employer_rank_year", keys: ["habr_employer_rank_year", "habrEmployerRankYear"], optional: true },
  {
    label: "habr_employer_rank_source_url",
    keys: ["habr_employer_rank_source_url", "habrEmployerRankSourceUrl"],
    compare: "url",
    optional: true,
  },
];

function readSheetRows(workbook: XLSX.WorkBook, sheetName: string): Record<string, unknown>[] {
  const sheet = workbook.Sheets[sheetName];
  if (!sheet) {
    throw new Error(`[digital-drift] Missing sheet "${sheetName}"`);
  }
  return XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "", raw: false });
}

function indexByCompanyId(rows: Record<string, unknown>[]): {
  map: Map<string, Record<string, unknown>>;
  duplicates: string[];
  missing: number;
} {
  const map = new Map<string, Record<string, unknown>>();
  const duplicates: string[] = [];
  let missing = 0;

  for (const row of rows) {
    const companyId = pickString(row, ["company_id", "companyId", "id"]);
    if (!companyId || isPlaceholder(companyId)) {
      missing += 1;
      continue;
    }

    if (map.has(companyId)) {
      duplicates.push(companyId);
    } else {
      map.set(companyId, row);
    }
  }

  return { map, duplicates, missing };
}

function isTruthyShowcase(value: unknown): boolean {
  if (value === true) return true;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    return normalized === "да" || normalized === "true" || normalized === "yes" || normalized === "public";
  }
  return false;
}

function isActiveHiringRange(range: string): boolean {
  return range === "5–10" || range === "10+";
}

function hiringFieldsDisagree(publicRow: Record<string, unknown>): string | null {
  const range = normalizeVacanciesRangeToken(
    pickString(publicRow, ["vacanciesRange", "vacancies_range", "Активные вакансии", "Диапазон вакансий"]),
  );
  if (!isActiveHiringRange(range)) return null;

  const hiringStatus = pickString(publicRow, ["hiringStatus", "hiring_status", "Статус найма"]);
  const presets = pickString(publicRow, ["Пресеты", "presets", "presets_source"]);
  const hasActiveFlag = pickString(publicRow, ["hasActiveHiring", "has_active_hiring"]);

  const statusActive = hiringStatus === "Активный";
  const presetActive = /активный найм/i.test(presets);
  const flagActive =
    hasActiveFlag === "true" ||
    hasActiveFlag === "TRUE" ||
    hasActiveFlag === "Да" ||
    hasActiveFlag === "1";

  if (statusActive || presetActive || flagActive) return null;

  return `vacanciesRange=${range} but hiring status/preset/active flag are not active`;
}

function compareField(
  spec: FieldSpec,
  svodkaRow: Record<string, unknown>,
  publicRow: Record<string, unknown>,
): DriftIssue | null {
  const svodkaValue = pickString(svodkaRow, spec.keys);
  const publicValue = pickString(publicRow, spec.keys);

  if (!svodkaValue && !publicValue) return null;

  if (spec.compare === "url") {
    if (spec.optional && (!svodkaValue || !publicValue)) {
      if (!svodkaValue && !publicValue) return null;
      if (!svodkaValue || !publicValue) {
        return {
          severity: "warning",
          companyId: pickString(publicRow, ["company_id"]),
          field: spec.label,
          message: "optional URL missing on one side",
          svodkaValue: svodkaValue || "(empty)",
          publicValue: publicValue || "(empty)",
        };
      }
    }

    if (urlsEquivalent(svodkaValue, publicValue)) return null;

    if (spec.optional && (isPlaceholder(svodkaValue) || isPlaceholder(publicValue))) {
      return {
        severity: "warning",
        companyId: pickString(publicRow, ["company_id"]),
        field: spec.label,
        message: "optional URL differs after canonicalization",
        svodkaValue: svodkaValue || "(empty)",
        publicValue: publicValue || "(empty)",
      };
    }

    return {
      severity: "critical",
      companyId: pickString(publicRow, ["company_id"]),
      field: spec.label,
      message: "source URL differs between sheets",
      svodkaValue: svodkaValue || "(empty)",
      publicValue: publicValue || "(empty)",
    };
  }

  if (spec.compare === "vacanciesRange") {
    const left = normalizeVacanciesRangeToken(svodkaValue);
    const right = normalizeVacanciesRangeToken(publicValue);
    if (left === right) return null;
    return {
      severity: "critical",
      companyId: pickString(publicRow, ["company_id"]),
      field: spec.label,
      message: "vacancies range mismatch",
      svodkaValue: left || "(empty)",
      publicValue: right || "(empty)",
    };
  }

  if (spec.compare === "optionalText") {
    const left = normalizeOptionalTextValue(svodkaValue);
    const right = normalizeOptionalTextValue(publicValue);
    if (left === right) return null;

    return {
      severity: "warning",
      companyId: pickString(publicRow, ["company_id"]),
      field: spec.label,
      message: "optional text field mismatch between sheets",
      svodkaValue: left || "(empty)",
      publicValue: right || "(empty)",
    };
  }

  if (svodkaValue === publicValue) return null;

  if (spec.optional && (!svodkaValue || !publicValue)) {
    return {
      severity: "warning",
      companyId: pickString(publicRow, ["company_id"]),
      field: spec.label,
      message: "optional field missing on one side",
      svodkaValue: svodkaValue || "(empty)",
      publicValue: publicValue || "(empty)",
    };
  }

  return {
    severity: "critical",
    companyId: pickString(publicRow, ["company_id"]),
    field: spec.label,
    message: "field mismatch",
    svodkaValue: svodkaValue || "(empty)",
    publicValue: publicValue || "(empty)",
  };
}

function runDriftCheck(xlsxPath: string): number {
  const workbook = XLSX.read(readFileSync(xlsxPath), { type: "buffer" });
  const svodkaRows = readSheetRows(workbook, SVODKA_SHEET);
  const publicRows = readSheetRows(workbook, PUBLIC_EXPORT_SHEET);

  const svodkaIndex = indexByCompanyId(svodkaRows);
  const publicIndex = indexByCompanyId(publicRows);

  const issues: DriftIssue[] = [];

  if (svodkaIndex.missing > 0) {
    issues.push({
      severity: "critical",
      companyId: "—",
      field: "company_id",
      message: `${svodkaIndex.missing} row(s) in ${SVODKA_SHEET} missing company_id`,
    });
  }

  if (publicIndex.missing > 0) {
    issues.push({
      severity: "critical",
      companyId: "—",
      field: "company_id",
      message: `${publicIndex.missing} row(s) in ${PUBLIC_EXPORT_SHEET} missing company_id`,
    });
  }

  for (const companyId of [...new Set([...svodkaIndex.duplicates, ...publicIndex.duplicates])]) {
    issues.push({
      severity: "critical",
      companyId,
      field: "company_id",
      message: "duplicate company_id in sheet",
    });
  }

  const publicIds = [...publicIndex.map.keys()].sort((a, b) => a.localeCompare(b, "ru"));

  for (const companyId of publicIds) {
    const publicRow = publicIndex.map.get(companyId)!;
    const svodkaRow = svodkaIndex.map.get(companyId);

    const fit = pickString(publicRow, ["public_fit_status", "publicFitStatus"]);
    if (fit && !PUBLIC_FIT_ELIGIBLE.has(fit)) {
      issues.push({
        severity: "critical",
        companyId,
        field: "public_fit_status",
        message: `public_fit_status must be P0/P1/P2, got "${fit}"`,
        publicValue: fit,
      });
    }

    const showcaseRaw =
      publicRow["Показывать в публичной витрине"] ?? publicRow.showcase ?? publicRow.public_showcase;
    if (showcaseRaw !== undefined && showcaseRaw !== "") {
      if (!isTruthyShowcase(showcaseRaw)) {
        issues.push({
          severity: "critical",
          companyId,
          field: "Показывать в публичной витрине",
          message: 'public row must have showcase = "Да"',
          publicValue: String(showcaseRaw),
        });
      }
    }

    const websiteUrl = pickString(publicRow, ["website_url", "websiteUrl", "website"]);
    if (websiteUrl && isForbiddenGenericWebsiteUrl(websiteUrl)) {
      issues.push({
        severity: "critical",
        companyId,
        field: "website_url",
        message: "website_url must not be a generic aggregator root",
        publicValue: websiteUrl,
      });
    }

    const hiringMismatch = hiringFieldsDisagree(publicRow);
    if (hiringMismatch) {
      issues.push({
        severity: "critical",
        companyId,
        field: "hiring consistency",
        message: hiringMismatch,
      });
    }

    if (!svodkaRow) {
      issues.push({
        severity: "warning",
        companyId,
        field: "company_id",
        message: `present in ${PUBLIC_EXPORT_SHEET} but missing in ${SVODKA_SHEET}`,
      });
      continue;
    }

    for (const spec of DRIFT_FIELDS) {
      const issue = compareField(spec, svodkaRow, publicRow);
      if (issue) issues.push(issue);
    }
  }

  const critical = issues.filter((issue) => issue.severity === "critical");
  const warnings = issues.filter((issue) => issue.severity === "warning");

  console.log(`[digital-drift] ${xlsxPath}`);
  console.log(`[digital-drift] ${SVODKA_SHEET} rows: ${svodkaRows.length}, indexed: ${svodkaIndex.map.size}`);
  console.log(
    `[digital-drift] ${PUBLIC_EXPORT_SHEET} rows: ${publicRows.length}, indexed: ${publicIndex.map.size}`,
  );
  console.log(`[digital-drift] Compared ${publicIds.length} public_export company_id value(s)`);
  console.log(`[digital-drift] Critical: ${critical.length}, warnings: ${warnings.length}`);

  for (const issue of issues) {
    const prefix = issue.severity === "critical" ? "CRITICAL" : "WARN";
    const detail =
      issue.svodkaValue !== undefined || issue.publicValue !== undefined
        ? ` | svodka="${issue.svodkaValue ?? ""}" public="${issue.publicValue ?? ""}"`
        : "";
    console.log(`[digital-drift] ${prefix} ${issue.companyId} · ${issue.field}: ${issue.message}${detail}`);
  }

  if (critical.length > 0) {
    console.error(`[digital-drift] FAILED with ${critical.length} critical issue(s).`);
    return 1;
  }

  console.log("[digital-drift] OK — no critical drift.");
  if (warnings.length > 0) {
    console.warn(`[digital-drift] ${warnings.length} warning(s) require manual review.`);
  }
  return 0;
}

const xlsxPath = process.argv[2] ?? process.env.DIGITAL_MASTER_XLSX;

if (!xlsxPath) {
  console.error(
    "Usage: npm run data:drift-check -- <path-to-master.xlsx>\nOr set DIGITAL_MASTER_XLSX.",
  );
  process.exit(1);
}

if (!existsSync(xlsxPath)) {
  console.error(`[digital-drift] XLSX not found: ${xlsxPath}`);
  process.exit(1);
}

process.exit(runDriftCheck(xlsxPath));
