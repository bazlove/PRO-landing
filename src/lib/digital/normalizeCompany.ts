import type { CompanyPublic } from "../../types/digital";
import { PUBLIC_PRESET_VALUES, type PublicPresetValue } from "./presetLabels";

const FORBIDDEN_KEY_PATTERNS: RegExp[] = [
  /hrEmail/i,
  /hr_email/i,
  /hr[\s_-]?email/i,
  /\bemail\b/i,
  /\bqa\b/i,
  /\binternal\b/i,
  /\bservice\b/i,
  /служеб/i,
  /комментар/i,
  /\bcomment\b/i,
  /\bxlsx\b/i,
  /\bcsv\b/i,
  /\braw\b/i,
  /sourceSheet/i,
  /size_source/i,
  /size_checked_at/i,
];

const PUBLIC_FIT_ELIGIBLE = new Set(["P0", "P1", "P2"]);

export const SHOWCASE_COLUMN_KEYS = [
  "Показывать в публичной витрине",
  "showcase",
  "public_showcase",
] as const;

const PUBLIC_FIT_COLUMN_KEYS = ["public_fit_status", "publicFitStatus"] as const;

const COMPANY_ID_COLUMN_KEYS = ["company_id", "companyId", "id"] as const;

export const VACANCIES_WEIGHT_BY_RANGE: Record<CompanyPublic["vacanciesRange"], number> = {
  "10+": 3,
  "5–10": 2,
  "1–4": 1,
  "0": 0,
  "Не проверено": -1,
};

const PLACEHOLDER_TOKENS = new Set(["-", "—", "нет", "n/a", "na"]);

const HIRING_STATUSES = new Set<CompanyPublic["hiringStatus"]>([
  "Активный",
  "Точечный",
  "На паузе",
  "Неясно",
]);

const VACANCIES_RANGES = new Set<CompanyPublic["vacanciesRange"]>([
  "10+",
  "5–10",
  "1–4",
  "0",
  "Не проверено",
]);

/** Public HH vacancy check date is only meaningful when vacancies were checked. */
export function resolvePublicHhVacanciesCheckedAt(
  vacanciesRange: CompanyPublic["vacanciesRange"],
  hhVacanciesCheckedAt: string | null,
): string | null {
  if (vacanciesRange === "Не проверено") {
    return null;
  }
  return hhVacanciesCheckedAt;
}

const WORK_FORMATS = new Set<CompanyPublic["workFormat"]>([
  "Удалёнка",
  "Гибрид",
  "Офис",
  "Смешанный",
  "Не указано",
]);

const INTERNATIONAL_VALUES = new Set<CompanyPublic["international"]>([
  "Да",
  "Нет",
  "Частично",
  "Неясно",
]);

const PRESET_ACTIVE: PublicPresetValue = "Активный найм";
const PRESET_REMOTE: PublicPresetValue = "Удалёнка";
const PRESET_HIGH_RATING: PublicPresetValue = "Высокая HR-оценка";
const PRESET_AWARDS: PublicPresetValue = "Награды 2025";
const PRESET_INTERNATIONAL: PublicPresetValue = "Международные";

export const ALLOWED_PRESETS = PUBLIC_PRESET_VALUES;

const ALLOWED_PRESET_SET = new Set<string>(ALLOWED_PRESETS);

/** Map legacy/UI preset tokens to contract values before validation/output. */
export function normalizePresetValue(value: string): PublicPresetValue | null {
  const trimmed = value.trim();
  if (trimmed === "Есть удалёнка") return "Удалёнка";
  if (ALLOWED_PRESET_SET.has(trimmed)) return trimmed as PublicPresetValue;
  return null;
}

const REMOTE_WORK_FORMATS = new Set<CompanyPublic["workFormat"]>(["Удалёнка", "Гибрид", "Смешанный"]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasForbiddenKey(key: string): boolean {
  return FORBIDDEN_KEY_PATTERNS.some((pattern) => pattern.test(key));
}

export function collectForbiddenKeys(raw: Record<string, unknown>): string[] {
  return Object.keys(raw).filter(hasForbiddenKey);
}

function pickValue(raw: Record<string, unknown>, keys: string[]): unknown {
  for (const key of keys) {
    if (key in raw && raw[key] !== undefined && raw[key] !== "") {
      return raw[key];
    }
  }
  return undefined;
}

function pickString(raw: Record<string, unknown>, keys: string[], fallback = ""): string {
  const value = pickValue(raw, keys);
  if (value === undefined || value === null) return fallback;
  return String(value).trim();
}

function pickOptionalString(raw: Record<string, unknown>, keys: string[]): string | null {
  const value = pickString(raw, keys, "");
  return value || null;
}

function isPlaceholderToken(value: string): boolean {
  const normalized = value.trim().toLowerCase();
  return !normalized || PLACEHOLDER_TOKENS.has(normalized);
}

function isValidHttpUrlString(value: string): boolean {
  if (!value || /^mailto:/i.test(value) || isPlaceholderToken(value)) return false;
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

function pickFirstDefined(raw: Record<string, unknown>, keys: string[]): unknown {
  for (const key of keys) {
    if (raw[key] !== undefined && raw[key] !== null) return raw[key];
  }

  return undefined;
}

function normalizeOptionalHttpUrl(raw: unknown): string | null {
  if (raw === null || raw === undefined) return null;

  const value = String(raw).trim();
  if (!isValidHttpUrlString(value)) return null;

  try {
    return new URL(value).href;
  } catch {
    return null;
  }
}

type EmployerRankingBadge = CompanyPublic["employerRankingBadges"][number];

function parseEmployerRankYear(raw: unknown): number | null {
  if (raw === null || raw === undefined) return null;

  const text = String(raw).trim();
  if (!text) return null;

  const year = Number(text);
  return Number.isInteger(year) && year >= 2000 && year <= 2100 ? year : null;
}

function normalizeExistingEmployerRankingBadges(raw: unknown): EmployerRankingBadge[] | null {
  if (!Array.isArray(raw)) return null;

  const badges = raw
    .filter((badge): badge is Record<string, unknown> => {
      return Boolean(badge) && typeof badge === "object" && !Array.isArray(badge);
    })
    .map((badge) => {
      const source = badge.source === "hh" || badge.source === "habr" ? badge.source : null;
      const label = typeof badge.label === "string" ? badge.label.trim() : "";
      const description = typeof badge.description === "string" ? badge.description.trim() : "";

      if (!source || !label || !description) return null;

      return {
        source,
        label,
        description,
        year: parseEmployerRankYear(badge.year),
        sourceUrl: normalizeOptionalHttpUrl(badge.sourceUrl),
      } satisfies EmployerRankingBadge;
    })
    .filter((badge): badge is EmployerRankingBadge => badge !== null);

  return badges.length > 0 ? badges : null;
}

function normalizeEmployerRankingBadges(raw: Record<string, unknown>): EmployerRankingBadge[] {
  const existing = normalizeExistingEmployerRankingBadges(raw.employerRankingBadges);
  if (existing) return existing;

  const badges: EmployerRankingBadge[] = [];

  const hhLabel = pickOptionalString(raw, ["hh_employer_rank_label", "hhEmployerRankLabel"]);
  if (hhLabel) {
    badges.push({
      source: "hh",
      label: hhLabel,
      description: "Рейтинг работодателей hh.ru",
      year: parseEmployerRankYear(
        pickFirstDefined(raw, ["hh_employer_rank_year", "hhEmployerRankYear"]),
      ),
      sourceUrl: normalizeOptionalHttpUrl(
        pickFirstDefined(raw, ["hh_employer_rank_source_url", "hhEmployerRankSourceUrl"]),
      ),
    });
  }

  const habrLabel = pickOptionalString(raw, ["habr_employer_rank_label", "habrEmployerRankLabel"]);
  if (habrLabel) {
    badges.push({
      source: "habr",
      label: habrLabel,
      description: "Рейтинг Habr Career",
      year: parseEmployerRankYear(
        pickFirstDefined(raw, ["habr_employer_rank_year", "habrEmployerRankYear"]),
      ),
      sourceUrl: normalizeOptionalHttpUrl(
        pickFirstDefined(raw, ["habr_employer_rank_source_url", "habrEmployerRankSourceUrl"]),
      ),
    });
  }

  return badges;
}

/** Normalize vacancy range tokens (`5-10` → `5–10`). */
function normalizeVacanciesRangeToken(value: string): string {
  return value.trim().replace(/5-10/g, "5–10").replace(/1-4/g, "1–4");
}

function isInternationalHiringGeo(hiringGeo: string): boolean {
  return /снг|мир|international|worldwide|global/i.test(hiringGeo || "");
}

function pickOptionalHttpUrl(raw: Record<string, unknown>, keys: string[]): string | null {
  const value = pickOptionalString(raw, keys);
  if (!value || !isValidHttpUrlString(value)) return null;
  try {
    return new URL(value).href;
  } catch {
    return null;
  }
}

function urlsEqual(a: string, b: string): boolean {
  try {
    return new URL(a).href === new URL(b).href;
  } catch {
    return a.trim() === b.trim();
  }
}

function isHhEmployerUrl(href: string): boolean {
  try {
    const url = new URL(href);
    return /(^|\.)hh\.ru$/i.test(url.hostname) && /\/employer\//i.test(url.pathname);
  } catch {
    return false;
  }
}

function isHabrCompanyUrl(href: string): boolean {
  try {
    const url = new URL(href);
    if (/career\.habr\.com$/i.test(url.hostname)) {
      return /\/companies\//i.test(url.pathname);
    }
    return /(^|\.)habr\.com$/i.test(url.hostname) && /\/companies\//i.test(url.pathname);
  } catch {
    return false;
  }
}

function isLinkedInCompanyUrl(href: string): boolean {
  try {
    const url = new URL(href);
    return /(^|\.)linkedin\.com$/i.test(url.hostname) && /\/company\//i.test(url.pathname);
  } catch {
    return false;
  }
}

const CAREER_SUBPATH_PATTERN =
  /\/(career|careers|hr|jobs|job|vacanc|vakans|team|about\/work|hiring|company\/vacanc)/i;

function inferWebsiteFromCareerUrl(careerUrl: string): string | null {
  try {
    const url = new URL(careerUrl);
    if (isHhEmployerUrl(careerUrl) || isHabrCompanyUrl(careerUrl) || isLinkedInCompanyUrl(careerUrl)) {
      return null;
    }
    if (!CAREER_SUBPATH_PATTERN.test(url.pathname)) return null;

    const origin = `${url.protocol}//${url.host}/`;
    if (urlsEqual(origin, careerUrl)) return null;
    return origin;
  } catch {
    return null;
  }
}

const WEBSITE_URL_KEYS = [
  "website_url",
  "websiteUrl",
  "website",
  "site",
  "Сайт",
  "сайт",
  "URL",
  "Веб-сайт",
  "Официальный сайт",
];

const HH_COMPANY_URL_KEYS = [
  "hh_company_url",
  "hhCompanyUrl",
  "hhUrl",
  "hhEmployerUrl",
  "HH company URL",
  "HeadHunter",
  "HeadHunter URL",
  "Страница HeadHunter",
  "Страница HH",
  "HH",
  "hh.ru",
  "Ссылка HeadHunter",
  "Ссылка HH",
  "Ссылка на HH",
];

const HABR_URL_KEYS = [
  "habr_url",
  "habrUrl",
  "habr_company_url",
  "habrEmployerUrl",
  "habrCompanyUrl",
  "habrCareerUrl",
  "Habr Career",
  "Habr Career URL",
  "Страница Habr Career",
  "Страница Habr",
  "Хабр Карьера",
  "Ссылка Habr",
  "Ссылка Habr Career",
  "Ссылка на Habr",
];

const LINKEDIN_URL_KEYS = [
  "linkedin_url",
  "linkedinUrl",
  "linkedin_company_url",
  "linkedInUrl",
  "LinkedIn",
  "LinkedIn URL",
  "Страница LinkedIn",
  "Ссылка LinkedIn",
  "Ссылка на LinkedIn",
];

const SOURCE_CANDIDATE_KEY_PATTERN =
  /(website|сайт|site|hh|headhunter|habr|хабр|linkedin|linkedin)/i;
const SOURCE_CANDIDATE_EXCLUDE_KEY_PATTERN =
  /(rating|display|value|status|preset|vacanc|weight|comment|email|qa|internal|служеб)/i;

function rawMayHaveUnmappedSourceLinks(raw: Record<string, unknown>): boolean {
  return Object.entries(raw).some(([key, value]) => {
    if (SOURCE_CANDIDATE_EXCLUDE_KEY_PATTERN.test(key)) return false;
    if (!SOURCE_CANDIDATE_KEY_PATTERN.test(key)) return false;
    return typeof value === "string" && isValidHttpUrl(value);
  });
}

type ResolvedSourceUrls = {
  hhCompanyUrl: string | null;
  habrUrl: string | null;
  websiteUrl: string | null;
  linkedinUrl: string | null;
};

function resolvePublicSourceUrls(
  raw: Record<string, unknown>,
  careerUrl: string,
  allowSourceUrlInference = true,
): ResolvedSourceUrls {
  let hhCompanyUrl = pickOptionalHttpUrl(raw, HH_COMPANY_URL_KEYS);
  let habrUrl = pickOptionalHttpUrl(raw, HABR_URL_KEYS);
  let websiteUrl = pickOptionalHttpUrl(raw, WEBSITE_URL_KEYS);
  const linkedinUrl = pickOptionalHttpUrl(raw, LINKEDIN_URL_KEYS);

  if (allowSourceUrlInference) {
    if (!hhCompanyUrl && isHhEmployerUrl(careerUrl)) {
      hhCompanyUrl = careerUrl;
    }

    if (!habrUrl && isHabrCompanyUrl(careerUrl)) {
      habrUrl = careerUrl;
    }

    if (!websiteUrl) {
      const inferredWebsite = inferWebsiteFromCareerUrl(careerUrl);
      if (inferredWebsite) websiteUrl = inferredWebsite;
    }
  }

  if (websiteUrl && urlsEqual(websiteUrl, careerUrl)) {
    websiteUrl = null;
  }

  if (habrUrl && urlsEqual(habrUrl, careerUrl) && !isHabrCompanyUrl(careerUrl)) {
    habrUrl = null;
  }

  return { hhCompanyUrl, habrUrl, websiteUrl, linkedinUrl };
}

function warnMissingNormalizedSourceLinks(
  name: string,
  raw: Record<string, unknown>,
  urls: ResolvedSourceUrls,
  warnings?: string[],
): void {
  if (!import.meta.env?.DEV) return;

  const hasAny = Boolean(urls.hhCompanyUrl || urls.habrUrl || urls.websiteUrl || urls.linkedinUrl);
  if (hasAny || !rawMayHaveUnmappedSourceLinks(raw)) return;

  warnDigital(`[digital] No source links normalized for company: ${name}`, warnings);
}

function stableHash(input: string): string {
  let hash = 5381;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash * 33) ^ input.charCodeAt(i);
  }
  return (hash >>> 0).toString(36);
}

function slugifyBase(name: string): string {
  const ascii = name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  if (ascii.length >= 2) return ascii;
  return `company-${stableHash(name)}`;
}

export function createSlugAllocator() {
  const used = new Map<string, number>();

  return (name: string, preferred?: string): string => {
    const base = (preferred?.trim() || slugifyBase(name)).toLowerCase().replace(/[^a-z0-9-]+/g, "-");
    const safeBase = base || `company-${stableHash(name)}`;
    const count = used.get(safeBase) ?? 0;
    used.set(safeBase, count + 1);
    if (count === 0) return safeBase;
    return `${safeBase}-${count + 1}`;
  };
}

function isTruthyPublicFlag(value: unknown): boolean {
  if (value === true) return true;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    return normalized === "да" || normalized === "true" || normalized === "public" || normalized === "yes";
  }
  return false;
}

export function isPublicRow(raw: Record<string, unknown>): boolean {
  const publicStatus = pickString(raw, ["publicStatus", "public_status"]);
  if (publicStatus === "public") return true;

  const publicFlag = pickValue(raw, ["public"]);
  if (publicFlag === true || publicFlag === "public") return true;

  const showcase = pickValue(raw, [...SHOWCASE_COLUMN_KEYS]);
  return isTruthyPublicFlag(showcase);
}

export function isValidCompanyId(value: string): boolean {
  const id = value.trim();
  return id.length > 0 && !isPlaceholderToken(id);
}

/** Canonical immutable key: XLSX `company_id` → JSON `id`. */
export function parseCompanyId(raw: Record<string, unknown>): string | null {
  for (const key of COMPANY_ID_COLUMN_KEYS) {
    const candidate = pickString(raw, [key], "");
    if (candidate && isValidCompanyId(candidate)) {
      return candidate;
    }
  }
  return null;
}

export function pickPublicFitStatus(raw: Record<string, unknown>): string {
  return pickString(raw, [...PUBLIC_FIT_COLUMN_KEYS]);
}

export function sheetHasColumn(headers: Set<string>, keys: readonly string[]): boolean {
  return keys.some((key) => headers.has(key));
}

export type PublicExportEligibilityContext = {
  sheetName?: string;
  sheetHeaders?: Set<string>;
};

/**
 * Strict XLSX → public JSON gate:
 * showcase = "Да" AND public_fit_status in [P0,P1,P2] AND valid company_id.
 */
export function isPublicExportEligibleRow(
  raw: Record<string, unknown>,
  context: PublicExportEligibilityContext = {},
): boolean {
  const headers = context.sheetHeaders ?? new Set(Object.keys(raw));
  const sheetIsPublicExport = context.sheetName === "public_export";

  const hasShowcaseColumn = sheetHasColumn(headers, SHOWCASE_COLUMN_KEYS);
  if (hasShowcaseColumn) {
    const showcase = pickValue(raw, [...SHOWCASE_COLUMN_KEYS]);
    if (!isTruthyPublicFlag(showcase)) return false;
  } else if (!sheetIsPublicExport && !isPublicRow(raw)) {
    return false;
  }

  const hasFitColumn = sheetHasColumn(headers, PUBLIC_FIT_COLUMN_KEYS);
  if (hasFitColumn) {
    const fit = pickPublicFitStatus(raw);
    if (!PUBLIC_FIT_ELIGIBLE.has(fit)) return false;
  } else if (!sheetIsPublicExport) {
    return false;
  }

  return parseCompanyId(raw) !== null;
}

export type PublicExportSkipReason =
  | "invalid_company_id"
  | "public_fit_status"
  | "showcase"
  | "other";

export function getPublicExportSkipReason(
  raw: Record<string, unknown>,
  context: PublicExportEligibilityContext = {},
): PublicExportSkipReason | null {
  if (isPublicExportEligibleRow(raw, context)) return null;

  if (parseCompanyId(raw) === null) return "invalid_company_id";

  const headers = context.sheetHeaders ?? new Set(Object.keys(raw));
  const sheetIsPublicExport = context.sheetName === "public_export";
  const hasFitColumn = sheetHasColumn(headers, PUBLIC_FIT_COLUMN_KEYS);

  if (hasFitColumn || !sheetIsPublicExport) {
    const fit = pickPublicFitStatus(raw);
    if (!PUBLIC_FIT_ELIGIBLE.has(fit)) return "public_fit_status";
  }

  const hasShowcaseColumn = sheetHasColumn(headers, SHOWCASE_COLUMN_KEYS);
  if (hasShowcaseColumn) {
    const showcase = pickValue(raw, [...SHOWCASE_COLUMN_KEYS]);
    if (!isTruthyPublicFlag(showcase)) return "showcase";
  } else if (!sheetIsPublicExport && !isPublicRow(raw)) {
    return "showcase";
  }

  return "other";
}

export function normalizeAwards2025(raw: unknown): string | null {
  if (raw === null || raw === undefined) return null;
  const text = String(raw).trim();
  if (!text || isPlaceholderToken(text)) return null;
  if (/^не проверено$/i.test(text)) return null;
  return text;
}

function parseRatingValue(raw: unknown): number | null {
  if (raw === null || raw === undefined) return null;
  if (typeof raw === "number") {
    return Number.isFinite(raw) ? raw : null;
  }

  const text = String(raw).trim();
  if (!text || text === "-" || text === "—" || /^нет отзывов$/i.test(text)) {
    return null;
  }

  const normalized = text.replace(",", ".");
  const match = normalized.match(/-?\d+(?:\.\d+)?/);
  if (!match) return null;

  const value = Number.parseFloat(match[0]);
  return Number.isFinite(value) ? value : null;
}

function formatRatingDisplay(value: number | null, sourceDisplay?: string): string {
  if (value !== null) {
    return value.toFixed(1).replace(".", ",");
  }

  const display = sourceDisplay?.trim();
  if (display && display !== "-" && display !== "—") {
    return display;
  }

  return "Нет отзывов";
}

function parseVacancyCount(raw: Record<string, unknown>): number | null {
  const value = pickValue(raw, [
    "vacancyCount",
    "vacanciesCount",
    "vacancies",
    "activeVacancies",
    "Количество вакансий",
    "Активные вакансии (число)",
  ]);

  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.max(0, Math.floor(value));
  }

  if (typeof value === "string" && /^\d+$/.test(value.trim())) {
    return Number.parseInt(value.trim(), 10);
  }

  return null;
}

function normalizeVacancies(
  raw: Record<string, unknown>,
): Pick<CompanyPublic, "vacanciesRange" | "vacanciesWeight"> {
  const count = parseVacancyCount(raw);
  if (count !== null) {
    if (count >= 10) return { vacanciesRange: "10+", vacanciesWeight: 3 };
    if (count >= 5) return { vacanciesRange: "5–10", vacanciesWeight: 2 };
    if (count >= 1) return { vacanciesRange: "1–4", vacanciesWeight: 1 };
    return { vacanciesRange: "0", vacanciesWeight: 0 };
  }

  const rangeRaw = normalizeVacanciesRangeToken(
    pickString(raw, [
      "vacanciesRange",
      "vacancies_range",
      "Активные вакансии",
      "Диапазон вакансий",
    ]),
  );
  if (VACANCIES_RANGES.has(rangeRaw as CompanyPublic["vacanciesRange"])) {
    const range = rangeRaw as CompanyPublic["vacanciesRange"];
    const weightMap: Record<CompanyPublic["vacanciesRange"], number> = {
      "10+": 3,
      "5–10": 2,
      "1–4": 1,
      "0": 0,
      "Не проверено": -1,
    };
    return { vacanciesRange: range, vacanciesWeight: weightMap[range] };
  }

  return { vacanciesRange: "Не проверено", vacanciesWeight: -1 };
}

function normalizeHiringStatus(raw: Record<string, unknown>): CompanyPublic["hiringStatus"] {
  const value = pickString(raw, ["hiringStatus", "hiring_status", "Статус найма"]);
  if (HIRING_STATUSES.has(value as CompanyPublic["hiringStatus"])) {
    return value as CompanyPublic["hiringStatus"];
  }
  return "Неясно";
}

function normalizeWorkFormat(raw: Record<string, unknown>): CompanyPublic["workFormat"] {
  const value = pickString(raw, ["workFormat", "work_format", "Формат работы"]);
  if (WORK_FORMATS.has(value as CompanyPublic["workFormat"])) {
    return value as CompanyPublic["workFormat"];
  }

  const lower = value.toLowerCase();
  if (/(remote|удален|удалён)/.test(lower)) return "Удалёнка";
  if (/(hybrid|гибрид)/.test(lower)) return "Гибрид";
  if (/(office|офис)/.test(lower)) return "Офис";
  if (/(mixed|смеш|distributed|remote\+office)/.test(lower)) return "Смешанный";

  return "Не указано";
}

function normalizeInternational(raw: Record<string, unknown>): CompanyPublic["international"] {
  const value = pickString(raw, ["international", "Международность"]);
  if (INTERNATIONAL_VALUES.has(value as CompanyPublic["international"])) {
    return value as CompanyPublic["international"];
  }
  return "Неясно";
}

function computeHasRemote(workFormat: CompanyPublic["workFormat"]): boolean {
  return REMOTE_WORK_FORMATS.has(workFormat);
}

function computeHasActiveHiring(
  hiringStatus: CompanyPublic["hiringStatus"],
  vacanciesRange: CompanyPublic["vacanciesRange"],
): boolean {
  return (
    hiringStatus === "Активный" ||
    vacanciesRange === "5–10" ||
    vacanciesRange === "10+"
  );
}

function computeHasHighHrRating(hh: number | null, habr: number | null): boolean {
  return (hh !== null && hh >= 4.5) || (habr !== null && habr >= 4.5);
}

/** Presets in canonical order; never auto-add «Прямой отклик». */
export function buildPresets(
  company: Pick<
    CompanyPublic,
    | "hasActiveHiring"
    | "hasRemote"
    | "hasHighHrRating"
    | "hasAwards2025"
    | "international"
    | "hiringGeo"
  >,
): CompanyPublic["presets"] {
  const presets: CompanyPublic["presets"] = [];
  if (company.hasActiveHiring) presets.push(PRESET_ACTIVE);
  if (company.hasRemote) presets.push(PRESET_REMOTE);
  if (company.hasHighHrRating) presets.push(PRESET_HIGH_RATING);
  if (company.hasAwards2025) presets.push(PRESET_AWARDS);
  if (
    company.international === "Да" ||
    company.international === "Частично" ||
    isInternationalHiringGeo(company.hiringGeo)
  ) {
    presets.push(PRESET_INTERNATIONAL);
  }
  return presets;
}

/** Recompute derived public fields immediately before JSON write. */
export function recalculateDerivedFields(company: CompanyPublic): CompanyPublic {
  const vacanciesRange = normalizeVacanciesRangeToken(company.vacanciesRange) as CompanyPublic["vacanciesRange"];
  const vacanciesWeight = VACANCIES_WEIGHT_BY_RANGE[vacanciesRange] ?? -1;
  const awards2025 = normalizeAwards2025(company.awards2025);
  const hasAwards2025 = awards2025 !== null && awards2025.length > 0;
  const hasRemote = computeHasRemote(company.workFormat);
  const hasHighHrRating = computeHasHighHrRating(company.hhRatingValue, company.habrRatingValue);
  const hasActiveHiring = computeHasActiveHiring(company.hiringStatus, vacanciesRange);
  const hhVacanciesCheckedAt = resolvePublicHhVacanciesCheckedAt(
    vacanciesRange,
    company.hhVacanciesCheckedAt,
  );

  const withDerived: CompanyPublic = {
    ...company,
    vacanciesRange,
    vacanciesWeight,
    awards2025,
    hasAwards2025,
    hasRemote,
    hasHighHrRating,
    hasActiveHiring,
    hhVacanciesCheckedAt,
  };

  return {
    ...withDerived,
    presets: buildPresets(withDerived),
  };
}

function isValidHttpUrl(value: string): boolean {
  return isValidHttpUrlString(value);
}

function resolveCareerUrl(raw: Record<string, unknown>): string | null {
  const career = pickString(raw, [
    "careerUrl",
    "career_url",
    "Карьерная страница",
    "Карьерная ссылка",
  ]);
  if (isValidHttpUrl(career)) return career;

  const website = pickString(raw, [
    "website",
    "websiteUrl",
    "website_url",
    "site",
    "Сайт",
    "сайт",
    "URL",
  ]);
  if (isValidHttpUrl(website)) return website;

  return null;
}

function parseIsoDate(raw: unknown): string | null {
  if (raw === null || raw === undefined) return null;
  const text = String(raw).trim();
  if (!text) return null;

  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    const ms = Date.parse(`${text}T00:00:00Z`);
    return Number.isNaN(ms) ? null : text;
  }

  const dotted = text.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
  if (dotted) {
    const [, day, month, year] = dotted;
    const iso = `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
    const ms = Date.parse(`${iso}T00:00:00Z`);
    return Number.isNaN(ms) ? null : iso;
  }

  const parsed = Date.parse(text);
  if (Number.isNaN(parsed)) return null;

  return new Date(parsed).toISOString().slice(0, 10);
}

export function isStaleDate(date: string | null | undefined, days = 30): boolean {
  if (!date) return true;
  const ms = Date.parse(`${date}T00:00:00Z`);
  if (Number.isNaN(ms)) return true;
  const ageMs = Date.now() - ms;
  return ageMs > days * 24 * 60 * 60 * 1000;
}

/** Logs to console and appends to the loader report when `warnings` is provided. */
export function warnDigital(message: string, warnings?: string[]): void {
  console.warn(message);
  warnings?.push(message);
}

/** Appends to the loader report only (no console). */
function noteDigital(message: string, warnings?: string[]): void {
  warnings?.push(message);
}

export type NormalizeCompanyOptions = {
  /** When false, source URLs come only from explicit columns (public_export contract). */
  allowSourceUrlInference?: boolean;
  /** XLSX export: require valid `company_id` (maps to JSON `id`). */
  requireCompanyId?: boolean;
  /** JSON re-sync: rows are already public artifacts; skip showcase/fit gate. */
  fromExistingPublicJson?: boolean;
};

export function normalizeCompany(
  rawInput: unknown,
  index: number,
  allocateSlug: (name: string, preferred?: string) => string,
  warnings?: string[],
  options: NormalizeCompanyOptions = {},
): CompanyPublic | null {
  const {
    allowSourceUrlInference = true,
    requireCompanyId = false,
    fromExistingPublicJson = false,
  } = options;
  if (!isRecord(rawInput)) {
    warnDigital(`[digital] Row #${index}: skipped — expected object, got ${typeof rawInput}`, warnings);
    return null;
  }

  const forbiddenKeys = collectForbiddenKeys(rawInput);
  if (forbiddenKeys.length > 0) {
    warnDigital(
      `[digital] Row #${index}: ignored forbidden keys (${forbiddenKeys.join(", ")})`,
      warnings,
    );
  }

  if (!fromExistingPublicJson && !isPublicRow(rawInput)) {
    noteDigital(`[digital] Row #${index}: skipped — not public`, warnings);
    return null;
  }

  const name = pickString(rawInput, ["name", "company", "companyName", "Название компании", "Компания"]);
  if (!name) {
    warnDigital(`[digital] Row #${index}: skipped — missing company name`, warnings);
    return null;
  }

  const careerUrl = resolveCareerUrl(rawInput);
  if (!careerUrl) {
    warnDigital(
      `[digital] Row #${index} (“${name}”): skipped — missing valid career/website URL`,
      warnings,
    );
    return null;
  }

  const lastCheckedAt = parseIsoDate(
    pickValue(rawInput, [
      "lastCheckedAt",
      "last_checked_at",
      "Дата проверки",
      "Дата последней проверки",
    ]),
  );
  if (!lastCheckedAt) {
    warnDigital(
      `[digital] Row #${index} (“${name}”): skipped — missing or invalid lastCheckedAt`,
      warnings,
    );
    return null;
  }

  const preferredSlug = pickString(rawInput, ["slug"]);
  const slug = allocateSlug(name, preferredSlug || undefined);

  const id = parseCompanyId(rawInput);
  if (!id) {
    if (requireCompanyId) {
      warnDigital(
        `[digital] Row #${index} (“${name}”): skipped — missing or invalid company_id`,
        warnings,
      );
      return null;
    }
    warnDigital(
      `[digital] Row #${index} (“${name}”): skipped — missing canonical id (company_id / id)`,
      warnings,
    );
    return null;
  }

  const { vacanciesRange } = normalizeVacancies(rawInput);
  const hiringStatus = normalizeHiringStatus(rawInput);
  const workFormat = normalizeWorkFormat(rawInput);
  const international = normalizeInternational(rawInput);

  const hhRatingValue = parseRatingValue(
    pickValue(rawInput, [
      "hhRatingValue",
      "hh_rating_value",
      "HH rating",
      "HH",
      "Рейтинг HH",
    ]),
  );
  const habrRatingValue = parseRatingValue(
    pickValue(rawInput, [
      "habrRatingValue",
      "habr_rating_value",
      "Habr rating",
      "Habr Career rating",
      "Рейтинг Habr",
    ]),
  );

  const hhRatingDisplay = formatRatingDisplay(
    hhRatingValue,
    pickString(rawInput, ["hhRatingDisplay", "hh_rating_display"]),
  );
  const habrRatingDisplay = formatRatingDisplay(
    habrRatingValue,
    pickString(rawInput, ["habrRatingDisplay", "habr_rating_display"]),
  );

  const awards2025 = normalizeAwards2025(
    pickValue(rawInput, [
      "awards2025",
      "awards_2025",
      "Ключевые награды 2025",
      "Награды 2025",
    ]),
  );

  const hhVacanciesCheckedAt = resolvePublicHhVacanciesCheckedAt(
    vacanciesRange,
    parseIsoDate(
      pickValue(rawInput, [
        "hh_vacancies_checked_at",
        "hhVacanciesCheckedAt",
        "Дата проверки вакансий",
        "Дата проверки HH",
      ]),
    ),
  );

  const sourceUrls = resolvePublicSourceUrls(rawInput, careerUrl, allowSourceUrlInference);
  const { hhCompanyUrl, habrUrl, websiteUrl, linkedinUrl } = sourceUrls;

  warnMissingNormalizedSourceLinks(name, rawInput, sourceUrls, warnings);

  const partial: CompanyPublic = {
    id,
    slug,
    name,
    city: pickString(rawInput, ["city", "Город", "HQ", "Город / HQ"], "Не указано"),
    companyType: pickString(
      rawInput,
      ["companyType", "company_type", "Тип компании"],
      "Не указано",
    ),
    niche: pickString(rawInput, ["niche", "Ключевая ниша"], "Не указано"),
    size: pickString(rawInput, ["size", "Размер компании"], "Не указано"),
    careerUrl,
    vacanciesRange,
    vacanciesWeight: 0,
    hiringStatus,
    workFormat,
    hiringGeo: pickString(rawInput, ["hiringGeo", "hiring_geo", "География найма"], "Не указано"),
    international,
    hhRatingDisplay,
    hhRatingValue,
    habrRatingDisplay,
    habrRatingValue,
    awards2025,
    hasAwards2025: false,
    presets: [],
    hasActiveHiring: false,
    hasRemote: false,
    hasHighHrRating: false,
    lastCheckedAt,
    hhVacanciesCheckedAt,
    hhCompanyUrl,
    habrUrl,
    websiteUrl,
    linkedinUrl,
    employerRankingBadges: normalizeEmployerRankingBadges(rawInput),
    publicStatus: "public",
  };

  return recalculateDerivedFields(partial);
}

const SIZE_WEIGHT: Record<string, number> = {
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

function normalizeSizeLabel(size: string | null | undefined): string {
  return String(size ?? "")
    .trim()
    .replace(/\u00a0/g, " ")
    .replace(/-/g, "–");
}

/** Maps public `size` labels to a stable sort weight (larger companies first). */
export function getCompanySizeWeight(size: string | null | undefined): number {
  const raw = normalizeSizeLabel(size);
  if (!raw || raw === "-" || raw === "—") return 0;

  if (raw in SIZE_WEIGHT) return SIZE_WEIGHT[raw]!;

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

export function compareCompaniesByName(a: Pick<CompanyPublic, "name">, b: Pick<CompanyPublic, "name">): number {
  return a.name.localeCompare(b.name, "ru", {
    sensitivity: "base",
    numeric: true,
  });
}

/**
 * Canonical public display order for generated `companies.json`.
 *
 * Size DESC → name ASC (Russian locale). This is a neutral UX ordering, not an employer ranking.
 * Hiring status, ratings, awards, remote format, and other signals are filters/presets only.
 * The master XLSX / `Сводка` row order must not be used as the website display order.
 */
export function compareCompaniesByDefaultOrder(a: CompanyPublic, b: CompanyPublic): number {
  const sizeDiff = getCompanySizeWeight(b.size) - getCompanySizeWeight(a.size);
  if (sizeDiff !== 0) return sizeDiff;

  return compareCompaniesByName(a, b);
}

/** Alias for `compareCompaniesByDefaultOrder`. */
export function compareCompanies(a: CompanyPublic, b: CompanyPublic): number {
  return compareCompaniesByDefaultOrder(a, b);
}
