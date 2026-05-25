#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import {
  FORBIDDEN_HISTORICAL_AWARDS_KEYS,
  FORBIDDEN_PUBLIC_EXACT_KEYS,
  isForbiddenGenericWebsiteUrl,
} from "./lib/forbiddenPublicKeys.mjs";

const args = process.argv.slice(2);
const filePath = args.find((arg) => !arg.startsWith("--"));

if (!filePath) {
  console.error(
    "[digital-contract] Usage: node scripts/validateCompaniesJson.mjs <path-to-companies.json> [--min-count=N] [--expected-count=N]",
  );
  process.exit(1);
}

const options = Object.fromEntries(
  args
    .filter((arg) => arg.startsWith("--"))
    .map((arg) => {
      const [key, value = "true"] = arg.replace(/^--/, "").split("=");
      return [key, value];
    }),
);

const expectedCount = options["expected-count"] ? Number(options["expected-count"]) : null;
const minCount = options["min-count"] ? Number(options["min-count"]) : null;

const allowedFields = [
  "id",
  "slug",
  "name",
  "city",
  "companyType",
  "niche",
  "size",
  "careerUrl",
  "vacanciesRange",
  "vacanciesWeight",
  "hiringStatus",
  "workFormat",
  "hiringGeo",
  "international",
  "hhRatingDisplay",
  "hhRatingValue",
  "habrRatingDisplay",
  "habrRatingValue",
  "awards2025",
  "hasAwards2025",
  "presets",
  "signals",
  "hasActiveHiring",
  "hasRemote",
  "hasHighHrRating",
  "lastCheckedAt",
  "hhVacanciesCheckedAt",
  "publicStatus",
  "websiteUrl",
  "hhCompanyUrl",
  "habrUrl",
  "linkedinUrl",
  "employerRankingBadges",
];

const allowedFieldSet = new Set(allowedFields);

const allowedVacanciesRange = new Set(["10+", "5–10", "1–4", "0", "Не проверено"]);
const allowedHiringStatus = new Set(["Активный", "Точечный", "На паузе", "Неясно", "Не проверено"]);
const allowedWorkFormat = new Set(["Удалёнка", "Гибрид", "Офис", "Смешанный", "Не указано"]);
const allowedInternational = new Set(["Да", "Нет", "Частично", "Неясно"]);
const allowedPresets = ["Активный найм", "Удалёнка", "Высокая HR-оценка", "Награды 2025", "Международные"];
const allowedPresetSet = new Set(allowedPresets);

const vacanciesWeightByRange = {
  "10+": 3,
  "5–10": 2,
  "1–4": 1,
  "0": 0,
  "Не проверено": -1,
};

const forbiddenKeyPatterns = [
  /hr.?email/i,
  /^email$/i,
  /qa/i,
  /internal/i,
  /comment/i,
  /source.?sheet/i,
  /^raw$/i,
  /xlsx/i,
  /csv/i,
  /download/i,
  /служеб/i,
  /внутрен/i,
  /size_source/i,
  /size_checked_at/i,
  /public_fit_status/i,
  /active_vacancies_source/i,
  /historical_employer_awards/i,
  /search_aliases/i,
];

function isCanonicalHeadHunterEmployerUrl(value) {
  if (value === null || value === undefined) return true;

  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase().replace(/^www\./, "");
    return (
      url.protocol === "https:" &&
      host === "hh.ru" &&
      /^\/employer\/\d+\/?$/.test(url.pathname)
    );
  } catch {
    return false;
  }
}

const errors = [];

function addError(index, message) {
  const prefix = Number.isInteger(index) ? `row ${index + 1}` : "file";
  errors.push(`[${prefix}] ${message}`);
}

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function isIsoDateOrNull(value) {
  return value === null || (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value));
}

const urlPlaceholderTokens = new Set(["-", "—", "нет", "n/a", "na"]);

function isUrlPlaceholder(value) {
  return urlPlaceholderTokens.has(String(value ?? "").trim().toLowerCase());
}

function isValidHttpUrlOrNull(value) {
  if (value === null) return true;
  if (typeof value !== "string" || value.trim() === "") return false;
  if (isUrlPlaceholder(value)) return false;
  if (/^mailto:/i.test(value.trim())) return false;

  try {
    const url = new URL(value);
    if (!["http:", "https:"].includes(url.protocol)) return false;
    if (/\.(csv|xlsx)(\?|#|$)/i.test(url.pathname)) return false;
    if (/download/i.test(url.pathname)) return false;
    return true;
  } catch {
    return false;
  }
}

function sameArray(a, b) {
  return Array.isArray(a) && Array.isArray(b) && a.length === b.length && a.every((item, index) => item === b[index]);
}

const SIZE_WEIGHT = {
  "1001+": 6,
  "500+": 5,
  "501–1000": 5,
  "201–500": 4,
  "51–200": 3,
  "1–50": 2,
  "11–50": 2,
  "1–10": 1,
  "Не указано": 0,
};

function normalizeSizeLabel(size) {
  return String(size ?? "")
    .trim()
    .replace(/\u00a0/g, " ")
    .replace(/-/g, "–");
}

function getCompanySizeWeight(size) {
  const raw = normalizeSizeLabel(size);
  if (!raw || raw === "-" || raw === "—") return 0;

  if (Object.prototype.hasOwnProperty.call(SIZE_WEIGHT, raw)) return SIZE_WEIGHT[raw];

  const lower = raw.toLowerCase();
  if (lower === "не указано") return 0;
  if (/1000\+|1001|1001\s+и\s+более/.test(lower)) return 6;
  if (/^500\+$|501.?1000/.test(lower)) return 5;
  if (/201.?500/.test(lower)) return 4;
  if (/51.?200/.test(lower)) return 3;
  if (/11.?50/.test(lower)) return 2;
  if (/1.?10/.test(lower)) return 1;

  return 0;
}

function compareCompanyNames(a, b) {
  return String(a?.name ?? "").localeCompare(String(b?.name ?? ""), "ru", {
    sensitivity: "base",
    numeric: true,
  });
}

function compareCompaniesByDefaultOrder(a, b) {
  const sizeDiff = getCompanySizeWeight(b?.size) - getCompanySizeWeight(a?.size);
  if (sizeDiff !== 0) return sizeDiff;
  return compareCompanyNames(a, b);
}

function validateDefaultPublicOrder(companies) {
  for (let index = 1; index < companies.length; index += 1) {
    const previous = companies[index - 1];
    const current = companies[index];
    if (compareCompaniesByDefaultOrder(previous, current) > 0) {
      addError(
        index,
        `companies.json must be sorted by size DESC, then name ASC. Previous: "${previous?.name}" (size: ${previous?.size}), current: "${current?.name}" (size: ${current?.size})`,
      );
      return;
    }
  }
}

function expectedPresetsFor(company) {
  const expected = [];

  if (company.hasActiveHiring) expected.push("Активный найм");
  if (company.hasRemote) expected.push("Удалёнка");
  if (company.hasHighHrRating) expected.push("Высокая HR-оценка");
  if (company.hasAwards2025) expected.push("Награды 2025");

  const isInternational =
    company.international === "Да" ||
    company.international === "Частично" ||
    /снг|мир|international|worldwide|global/i.test(company.hiringGeo || "");

  if (isInternational) expected.push("Международные");

  return expected.filter((preset) => allowedPresetSet.has(preset));
}

const allowedEmployerRankingBadgeSources = new Set(["hh", "habr"]);
const allowedEmployerRankingBadgeKeys = new Set([
  "source",
  "label",
  "description",
  "year",
  "sourceUrl",
]);

function validateEmployerRankingBadges(value, index) {
  if (!Array.isArray(value)) {
    addError(index, "employerRankingBadges must be an array");
    return;
  }

  value.forEach((badge, badgeIndex) => {
    const prefix = `employerRankingBadges[${badgeIndex}]`;

    if (!badge || typeof badge !== "object" || Array.isArray(badge)) {
      addError(index, `${prefix} must be an object`);
      return;
    }

    for (const key of Object.keys(badge)) {
      if (!allowedEmployerRankingBadgeKeys.has(key)) {
        addError(index, `${prefix} extra field is not allowed: ${key}`);
      }

      if (forbiddenKeyPatterns.some((pattern) => pattern.test(key))) {
        addError(index, `${prefix} forbidden/suspicious field key: ${key}`);
      }
    }

    if (!allowedEmployerRankingBadgeSources.has(badge.source)) {
      addError(index, `${prefix}.source must be "hh" or "habr"`);
    }

    if (!isNonEmptyString(badge.label)) {
      addError(index, `${prefix}.label must be a non-empty string`);
    }

    if (!isNonEmptyString(badge.description)) {
      addError(index, `${prefix}.description must be a non-empty string`);
    }

    if (
      !(
        badge.year === null ||
        (Number.isInteger(badge.year) && badge.year >= 2000 && badge.year <= 2100)
      )
    ) {
      addError(index, `${prefix}.year must be number between 2000 and 2100 or null`);
    }

    if (!isValidHttpUrlOrNull(badge.sourceUrl)) {
      addError(index, `${prefix}.sourceUrl must be a valid http(s) URL or null`);
    }
  });
}

const allowedHiringSources = new Set(["HH", "Habr", "Career site", "Mixed"]);
const allowedDataFreshness = new Set(["fresh", "stale", "unknown"]);
const forbiddenPresetValues = new Set(["Прямой отклик", "Есть удалёнка"]);

function validateSignals(value, index) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    addError(index, "signals must be an object");
    return;
  }

  const allowedSignalKeys = new Set([
    "hasDirectApply",
    "hasCareerPage",
    "hiringSource",
    "dataFreshness",
    "remoteExplicitlyDenied",
  ]);

  for (const key of Object.keys(value)) {
    if (!allowedSignalKeys.has(key)) {
      addError(index, `signals extra field is not allowed: ${key}`);
    }
  }

  if (typeof value.hasDirectApply !== "boolean") {
    addError(index, "signals.hasDirectApply must be boolean");
  }

  if (typeof value.hasCareerPage !== "boolean") {
    addError(index, "signals.hasCareerPage must be boolean");
  }

  if (!(value.hiringSource === null || allowedHiringSources.has(value.hiringSource))) {
    addError(index, 'signals.hiringSource must be "HH", "Habr", "Career site", "Mixed", or null');
  }

  if (!allowedDataFreshness.has(value.dataFreshness)) {
    addError(index, 'signals.dataFreshness must be "fresh", "stale", or "unknown"');
  }

  if (typeof value.remoteExplicitlyDenied !== "boolean") {
    addError(index, "signals.remoteExplicitlyDenied must be boolean");
  }
}

function validateCompany(company, index) {
  if (!company || typeof company !== "object" || Array.isArray(company)) {
    addError(index, "must be an object");
    return;
  }

  const keys = Object.keys(company);

  for (const key of keys) {
    if (!allowedFieldSet.has(key)) {
      addError(index, `extra field is not allowed: ${key}`);
    }

    if (FORBIDDEN_PUBLIC_EXACT_KEYS.has(key)) {
      addError(index, `forbidden internal field key: ${key}`);
    }

    if (FORBIDDEN_HISTORICAL_AWARDS_KEYS.has(key)) {
      const label =
        typeof company.name === "string" && company.name.trim()
          ? `${company.name} (id: ${company.id ?? "—"})`
          : `id: ${company.id ?? "—"}`;
      addError(
        index,
        `Forbidden field ${key} found in row ${label}. Historical awards are removed from the public contract.`,
      );
    }

    if (forbiddenKeyPatterns.some((pattern) => pattern.test(key))) {
      addError(index, `forbidden/suspicious field key: ${key}`);
    }
  }

  for (const field of allowedFields) {
    if (!Object.prototype.hasOwnProperty.call(company, field)) {
      addError(index, `missing required field: ${field}`);
    }
  }

  for (const field of ["id", "slug", "name", "city", "companyType", "niche", "hiringGeo"]) {
    if (!isNonEmptyString(company[field])) addError(index, `${field} must be a non-empty string`);
  }

  if (!(typeof company.size === "string" || company.size === null)) {
    addError(index, "size must be string | null");
  }

  for (const field of ["careerUrl", "websiteUrl", "hhCompanyUrl", "habrUrl", "linkedinUrl"]) {
    if (!isValidHttpUrlOrNull(company[field])) {
      addError(index, `${field} must be a valid http(s) URL or null`);
    }
  }

  if (!isCanonicalHeadHunterEmployerUrl(company.hhCompanyUrl)) {
    addError(
      index,
      `hhCompanyUrl must use canonical HeadHunter employer URL: https://hh.ru/employer/<id>, got: ${company.hhCompanyUrl}`,
    );
  }

  if (isForbiddenGenericWebsiteUrl(company.websiteUrl)) {
    addError(index, `websiteUrl must not be a generic aggregator root: ${company.websiteUrl}`);
  }

  if (company.careerUrl === null) {
    addError(index, "careerUrl must be a valid http(s) URL for public rows");
  }

  if (!allowedVacanciesRange.has(company.vacanciesRange)) {
    addError(index, `invalid vacanciesRange: ${company.vacanciesRange}`);
  }

  if (!allowedHiringStatus.has(company.hiringStatus)) {
    addError(index, `invalid hiringStatus: ${company.hiringStatus}`);
  }

  if (!allowedWorkFormat.has(company.workFormat)) {
    addError(index, `invalid workFormat: ${company.workFormat}`);
  }

  if (!allowedInternational.has(company.international)) {
    addError(index, `invalid international: ${company.international}`);
  }

  if (company.publicStatus !== "public") {
    addError(index, 'publicStatus must be "public"');
  }

  for (const field of ["hhRatingDisplay", "habrRatingDisplay"]) {
    if (typeof company[field] !== "string") addError(index, `${field} must be a string`);
  }

  for (const field of ["hhRatingValue", "habrRatingValue"]) {
    const value = company[field];
    if (!(value === null || (typeof value === "number" && value >= 0 && value <= 5))) {
      addError(index, `${field} must be number between 0 and 5 or null`);
    }
  }

  if (!(company.awards2025 === null || typeof company.awards2025 === "string")) {
    addError(index, "awards2025 must be string | null");
  }

  if (company.awards2025 === "Не проверено") {
    addError(index, 'awards2025 must be null, not "Не проверено"');
  }

  if (typeof company.awards2025 === "string" && /^не проверено$/i.test(company.awards2025.trim())) {
    addError(index, "awards2025 must be null when unchecked in source");
  }

  for (const field of ["hasAwards2025", "hasActiveHiring", "hasRemote", "hasHighHrRating"]) {
    if (typeof company[field] !== "boolean") addError(index, `${field} must be boolean`);
  }

  for (const field of ["lastCheckedAt", "hhVacanciesCheckedAt"]) {
    if (!isIsoDateOrNull(company[field])) {
      addError(index, `${field} must be ISO YYYY-MM-DD or null`);
    }
  }

  if (company.vacanciesRange === "Не проверено" && company.hhVacanciesCheckedAt !== null) {
    addError(index, 'hhVacanciesCheckedAt must be null when vacanciesRange is "Не проверено"');
  }

  const expectedWeight = vacanciesWeightByRange[company.vacanciesRange];
  if (company.vacanciesWeight !== expectedWeight) {
    addError(index, `vacanciesWeight must be ${expectedWeight} for vacanciesRange ${company.vacanciesRange}`);
  }

  const expectedHasActiveHiring =
    company.hiringStatus === "Активный" || company.vacanciesRange === "5–10" || company.vacanciesRange === "10+";
  if (company.hasActiveHiring !== expectedHasActiveHiring) {
    addError(index, `hasActiveHiring must be ${expectedHasActiveHiring}`);
  }

  const expectedHasRemote = ["Удалёнка", "Гибрид", "Смешанный"].includes(company.workFormat);
  if (company.hasRemote !== expectedHasRemote) {
    addError(index, `hasRemote must be ${expectedHasRemote}`);
  }

  const expectedHasHighHrRating =
    (company.hhRatingValue !== null && company.hhRatingValue >= 4.5) ||
    (company.habrRatingValue !== null && company.habrRatingValue >= 4.5);
  if (company.hasHighHrRating !== expectedHasHighHrRating) {
    addError(index, `hasHighHrRating must be ${expectedHasHighHrRating}`);
  }

  const expectedHasAwards2025 = company.awards2025 !== null && company.awards2025.trim().length > 0;
  if (company.hasAwards2025 !== expectedHasAwards2025) {
    addError(index, `hasAwards2025 must be ${expectedHasAwards2025}`);
  }

  validateSignals(company.signals, index);

  if (!Array.isArray(company.presets)) {
    addError(index, "presets must be an array");
  } else {
    const seen = new Set();
    for (const preset of company.presets) {
      if (forbiddenPresetValues.has(preset)) {
        addError(index, `preset "${preset}" is not allowed in public JSON`);
      }
      if (!allowedPresetSet.has(preset)) addError(index, `invalid preset: ${preset}`);
      if (seen.has(preset)) addError(index, `duplicate preset: ${preset}`);
      seen.add(preset);
    }

    const sorted = [...company.presets].sort((a, b) => allowedPresets.indexOf(a) - allowedPresets.indexOf(b));
    if (!sameArray(company.presets, sorted)) {
      addError(index, "presets must follow allowed preset order");
    }

    const expected = expectedPresetsFor(company);
    if (!sameArray(company.presets, expected)) {
      addError(index, `presets mismatch. Expected: [${expected.join(", ")}], got: [${company.presets.join(", ")}]`);
    }
  }

  validateEmployerRankingBadges(company.employerRankingBadges, index);
}

const absolutePath = path.resolve(process.cwd(), filePath);
let rowCount = 0;

if (!fs.existsSync(absolutePath)) {
  addError(null, `file does not exist: ${absolutePath}`);
} else {
  let json;
  try {
    json = JSON.parse(fs.readFileSync(absolutePath, "utf8"));
  } catch (error) {
    addError(null, `invalid JSON: ${error.message}`);
  }

  if (json !== undefined) {
    if (!Array.isArray(json)) {
      addError(null, "JSON root must be an array");
    } else {
      rowCount = json.length;
      if (json.length === 0) addError(null, "JSON array must not be empty");
      if (expectedCount !== null && json.length !== expectedCount) {
        addError(null, `expected exactly ${expectedCount} rows, got ${json.length}`);
      }
      if (minCount !== null && json.length < minCount) {
        addError(null, `expected at least ${minCount} rows, got ${json.length}`);
      }

      const ids = new Map();
      const slugs = new Map();

      json.forEach((company, index) => {
        validateCompany(company, index);

        if (company && typeof company === "object") {
          if (typeof company.id === "string") {
            if (!company.id.trim()) {
              addError(index, "id (company_id) must be a non-empty string");
            }
            if (ids.has(company.id)) {
              addError(index, `duplicate id also used in row ${ids.get(company.id) + 1}: ${company.id}`);
            }
            ids.set(company.id, index);
          } else {
            addError(index, "id (company_id) must be present");
          }
          if (typeof company.slug === "string") {
            if (slugs.has(company.slug)) {
              addError(index, `duplicate slug also used in row ${slugs.get(company.slug) + 1}: ${company.slug}`);
            }
            slugs.set(company.slug, index);
          }
        }
      });

      validateDefaultPublicOrder(json);
    }
  }
}

if (errors.length > 0) {
  console.error(`[digital-contract] FAILED with ${errors.length} error(s):`);
  for (const error of errors.slice(0, 100)) console.error(`- ${error}`);
  if (errors.length > 100) console.error(`...and ${errors.length - 100} more error(s)`);
  process.exit(1);
}

console.log(`[digital-contract] OK: validated all ${rowCount} companies in ${absolutePath}.`);
