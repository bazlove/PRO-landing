import type { CompanyPublic, CompanySignals, EmployerRankingBadge } from "../../types/digital";
import { isStaleDate } from "./normalizeCompany";
import { getTagColorClass } from "./tagColors";

/** Mobile cards: max visible signal badges before `+N`. */
export const DIGITAL_BADGE_MAX_VISIBLE_MOBILE = 3;

/** Mobile catalog card: max status chips on one row before `+N` (keeps +N fully visible). */
export const MOBILE_CARD_SIGNAL_MAX = 2;

/** Short labels for mobile card scanning (drawer keeps full copy). */
export const MOBILE_CARD_SIGNAL_HR = "HR 4.5+";
export const MOBILE_CARD_SIGNAL_AWARDS = "Награды";

/** Desktop table: fewer badges to reduce row noise. */
export const DIGITAL_BADGE_MAX_VISIBLE_TABLE = 2;

/** @deprecated Use DIGITAL_BADGE_MAX_VISIBLE_MOBILE or _TABLE */
export const DIGITAL_BADGE_MAX_VISIBLE = DIGITAL_BADGE_MAX_VISIBLE_MOBILE;

const SIZE_UNKNOWN = "Не указано";

import { getPresetDisplayLabel } from "./presetLabels";

export const BADGE_ACTIVE_HIRING = "Активный найм";
/** UI label for remote contract preset `Удалёнка` (not factual `workFormat`). */
export const REMOTE_SIGNAL_LABEL = getPresetDisplayLabel("Удалёнка");
export const BADGE_REMOTE = REMOTE_SIGNAL_LABEL;
export const BADGE_HIGH_RATING = "Высокая HR-оценка";
export const BADGE_AWARDS = "Награды 2025";
export const BADGE_INTERNATIONAL = "Международные";

const VACANCIES_RANGE_COPY: Record<CompanyPublic["vacanciesRange"], string> = {
  "10+": "10+ вакансий",
  "5–10": "5–10 вакансий",
  "1–4": "1–4 вакансии",
  "0": "нет активных вакансий",
  "Не проверено": "вакансии не проверены",
};

/** Catalog table/mobile preset chips from JSON `presets` only (not drawer signals). */
export function getCompanyBadges(company: CompanyPublic): string[] {
  return company.presets.map(getPresetDisplayLabel);
}

export const DRAWER_SIGNAL_CHIP_CLASS = "digital-badge digital-badge--signal";

function formatHiringSourceLabel(source: CompanySignals["hiringSource"]): string | null {
  switch (source) {
    case "HH":
      return "Источник найма: HH";
    case "Habr":
      return "Источник найма: Habr";
    case "Career site":
      return "Источник найма: сайт компании";
    case "Mixed":
      return "Источник найма: несколько источников";
    default:
      return null;
  }
}

/** Drawer-only factual metadata chips (not quick filters). */
export function getDrawerSignalChips(company: CompanyPublic): DrawerSummaryChip[] {
  const chips: DrawerSummaryChip[] = [];
  const { signals } = company;

  if (signals.hasDirectApply) {
    chips.push({ label: "Прямой отклик", variantClass: DRAWER_SIGNAL_CHIP_CLASS });
  }

  if (signals.hasCareerPage) {
    chips.push({ label: "Карьерная страница", variantClass: DRAWER_SIGNAL_CHIP_CLASS });
  }

  const hiringSourceLabel = formatHiringSourceLabel(signals.hiringSource);
  if (hiringSourceLabel) {
    chips.push({ label: hiringSourceLabel, variantClass: DRAWER_SIGNAL_CHIP_CLASS });
  }

  if (signals.dataFreshness === "fresh") {
    chips.push({ label: "Проверено недавно", variantClass: DRAWER_SIGNAL_CHIP_CLASS });
  } else if (signals.dataFreshness === "stale") {
    chips.push({ label: "Нужна перепроверка", variantClass: DRAWER_SIGNAL_CHIP_CLASS });
  }

  if (signals.remoteExplicitlyDenied) {
    chips.push({ label: "Удалёнка не рассматривается", variantClass: DRAWER_SIGNAL_CHIP_CLASS });
  }

  return chips;
}

/** Priority-ordered status chips for the mobile catalog card (one row). */
export function getMobileCardStatusSignals(company: CompanyPublic): DrawerSummaryChip[] {
  const signals: DrawerSummaryChip[] = [];

  const hiringLabel = company.hasActiveHiring ? BADGE_ACTIVE_HIRING : company.hiringStatus;
  signals.push({
    label: hiringLabel,
    variantClass: company.hasActiveHiring
      ? getTagColorClass(BADGE_ACTIVE_HIRING)
      : getTagColorClass(hiringLabel),
  });

  appendWorkFormatStatusChip(signals, company);

  if (company.hasHighHrRating) {
    signals.push({
      label: MOBILE_CARD_SIGNAL_HR,
      variantClass: getBadgeVariantClass(BADGE_HIGH_RATING),
    });
  }

  if (company.hasAwards2025) {
    signals.push({
      label: MOBILE_CARD_SIGNAL_AWARDS,
      variantClass: getBadgeVariantClass(BADGE_AWARDS),
    });
  }

  if (company.international === "Да" || company.international === "Частично") {
    signals.push({
      label: BADGE_INTERNATIONAL,
      variantClass: getBadgeVariantClass(BADGE_INTERNATIONAL),
    });
  }

  return signals;
}

export type MobileCardStatusDisplay = {
  visible: DrawerSummaryChip[];
  hiddenCount: number;
};

function isMeaningfulMobileMetaValue(value: string | null | undefined): value is string {
  if (!value) return false;
  const normalized = value.trim();
  return (
    normalized !== "" &&
    normalized !== "-" &&
    normalized !== "—" &&
    normalized !== SIZE_UNKNOWN &&
    normalized !== "Не указано"
  );
}

/** Mobile card line 1: city · company type · size. */
export function getMobileCardPrimaryMeta(company: CompanyPublic): string {
  const size = formatCompanySize(company.size);
  return [company.city, company.companyType, size]
    .filter((part): part is string => Boolean(part && isMeaningfulMobileMetaValue(part)))
    .join(" · ");
}

/** Mobile card line 2: niche only. */
export function getMobileCardSecondaryMeta(company: CompanyPublic): string {
  const niche = company.niche?.trim() ?? "";
  return isMeaningfulMobileMetaValue(niche) ? niche : "";
}

/** Short rating token for compact mobile proof line (`—` when missing). */
export function formatMobileRatingValue(display: string | null | undefined): string {
  const value = display?.trim();
  if (
    !value ||
    value === "-" ||
    value === "—" ||
    value === "Нет" ||
    value === "Нет отзывов" ||
    value.toLowerCase() === "нет отзывов"
  ) {
    return "—";
  }
  return value;
}

/** Mobile listing proof: vacancies · HH rating · Habr rating (no freshness date). */
export function formatMobileCardProofLine(company: CompanyPublic): string {
  const vacancies = formatVacanciesRangeCopy(company.vacanciesRange);
  const hh = formatMobileRatingValue(company.hhRatingDisplay);
  const habr = formatMobileRatingValue(company.habrRatingDisplay);
  return `${vacancies} · HH ${hh} · Habr ${habr}`;
}

/** Split status chips for compact mobile row: reserve room for a full `+N` chip. */
export function getMobileCardStatusDisplay(
  company: CompanyPublic,
  maxVisible: number = MOBILE_CARD_SIGNAL_MAX,
): MobileCardStatusDisplay {
  const signals = getMobileCardStatusSignals(company);
  if (signals.length <= maxVisible) {
    return { visible: signals, hiddenCount: 0 };
  }
  return {
    visible: signals.slice(0, maxVisible),
    hiddenCount: signals.length - maxVisible,
  };
}

/** Human-readable vacancy count line for table and mobile cards. */
export function formatVacanciesRangeCopy(range: CompanyPublic["vacanciesRange"]): string {
  return VACANCIES_RANGE_COPY[range];
}

/** CSS modifier for semantic tag color (badges, drawer chips, filters). */
export function getBadgeVariantClass(label: string): string {
  return getTagColorClass(label);
}

/** Rating value for UI: no bare «Нет», lowercase «нет отзывов» when applicable. */
export function formatRatingValueForUi(display: string): string {
  const trimmed = display.trim();
  if (trimmed === "Нет" || trimmed === "Нет отзывов") return "нет отзывов";
  if (trimmed === "-" || trimmed === "—") return "—";
  return display;
}

/** ISO `YYYY-MM-DD` → `DD.MM.YYYY`. */
export function formatDateRu(isoDate: string): string {
  const match = isoDate.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return isoDate;
  const [, year, month, day] = match;
  return `${day}.${month}.${year}`;
}

/** Public company size for profile meta; omits unknown placeholder. */
export function formatCompanySize(size: string): string | null {
  const trimmed = size.trim();
  if (!trimmed || trimmed === SIZE_UNKNOWN) return null;
  return trimmed;
}

export type HiringFreshnessDisplay = {
  /** `Проверено на HH: DD.MM.YYYY` or `HH: не проверено`. */
  hhLine: string;
  /** Muted warning when HH vacancies check is stale. */
  staleWarning: string | null;
  isMissing: boolean;
};

/** Hiring block copy from `hhVacanciesCheckedAt` only. */
export function getHiringFreshnessDisplay(
  hhVacanciesCheckedAt: string | null | undefined,
): HiringFreshnessDisplay {
  if (!hhVacanciesCheckedAt) {
    return { hhLine: "HH: не проверено", staleWarning: null, isMissing: true };
  }

  return {
    hhLine: `Проверено на HH: ${formatDateRu(hhVacanciesCheckedAt)}`,
    staleWarning: isStaleDate(hhVacanciesCheckedAt) ? "Требует повторной проверки" : null,
    isMissing: false,
  };
}

export type DrawerSummaryChip = {
  label: string;
  variantClass: string;
};

const DRAWER_SUMMARY_CHIP_MAX = 5;

/** Status chip for catalog mobile card or drawer header (signal, not factual work format). */
function appendWorkFormatStatusChip(chips: DrawerSummaryChip[], company: CompanyPublic): void {
  if (company.hasRemote) {
    chips.push({
      label: REMOTE_SIGNAL_LABEL,
      variantClass: getBadgeVariantClass(REMOTE_SIGNAL_LABEL),
    });
    return;
  }

  if (company.workFormat === "Не указано") return;

  chips.push({
    label: company.workFormat,
    variantClass: getTagColorClass(company.workFormat),
  });
}

/** Hiring geo strings that already imply international scope. */
export function isExplicitInternationalHiringGeo(hiringGeo: string): boolean {
  const geo = hiringGeo.trim().toLowerCase();
  if (!geo || geo === "не указано") return false;

  return (
    geo.includes("весь мир") ||
    geo.includes("рф и снг") ||
    geo === "снг" ||
    /\bснг\b/.test(geo) ||
    geo.includes("международ") ||
    geo.includes("global") ||
    geo.includes("worldwide")
  );
}

/** Whether the format section should show a separate international line. */
export function shouldShowDrawerInternationalLine(company: CompanyPublic): boolean {
  if (company.international === "Неясно" || company.international === "Нет") return false;
  if (isExplicitInternationalHiringGeo(company.hiringGeo)) return false;
  if (getCompanyBadges(company).includes(BADGE_INTERNATIONAL)) return false;
  return true;
}

/** Softer international copy when geo does not already convey it. */
export function formatDrawerInternationalLine(company: CompanyPublic): string {
  if (company.international === "Частично") return "Международный фокус: частично";
  return "Международный фокус: да";
}

/** Compact drawer header chips derived from public normalized fields. */
export function getDrawerSummaryChips(company: CompanyPublic): DrawerSummaryChip[] {
  const chips: DrawerSummaryChip[] = [];

  const hiringLabel = company.hasActiveHiring ? BADGE_ACTIVE_HIRING : company.hiringStatus;
  chips.push({
    label: hiringLabel,
    variantClass: company.hasActiveHiring
      ? getTagColorClass(BADGE_ACTIVE_HIRING)
      : getTagColorClass(hiringLabel),
  });

  appendWorkFormatStatusChip(chips, company);

  if (company.hasHighHrRating) {
    chips.push({
      label: BADGE_HIGH_RATING,
      variantClass: getBadgeVariantClass(BADGE_HIGH_RATING),
    });
  }

  if (
    chips.length < DRAWER_SUMMARY_CHIP_MAX &&
    (company.international === "Да" || company.international === "Частично") &&
    !isExplicitInternationalHiringGeo(company.hiringGeo)
  ) {
    chips.push({
      label: BADGE_INTERNATIONAL,
      variantClass: getBadgeVariantClass(BADGE_INTERNATIONAL),
    });
  }

  return chips.slice(0, DRAWER_SUMMARY_CHIP_MAX);
}

/** Drawer header meta-line: city · type · niche · size (factual attributes only). */
export function getDrawerHeaderMetaParts(company: CompanyPublic): string[] {
  const parts: (string | null)[] = [
    company.city?.trim() || null,
    company.companyType?.trim() || null,
    company.niche?.trim() || null,
    formatCompanySize(company.size),
  ];

  return parts.filter((part): part is string => Boolean(part));
}

/** Short hiring status for drawer body (section heading is already «Статус найма»). */
export function getDrawerHiringStatusValue(company: CompanyPublic): string {
  switch (company.hiringStatus) {
    case "Активный":
      return "Активный";
    case "Точечный":
      return "Точечный";
    case "На паузе":
      return "На паузе";
    case "Неясно":
      return "Неясно";
    default:
      return company.hiringStatus;
  }
}

const RUSSIAN_MONTHS_GENITIVE = [
  "января",
  "февраля",
  "марта",
  "апреля",
  "мая",
  "июня",
  "июля",
  "августа",
  "сентября",
  "октября",
  "ноября",
  "декабря",
] as const;

/** Drawer-only: ISO or parseable date → `13 мая`. */
export function formatRussianDayMonth(dateValue: string | null | undefined): string | null {
  if (!dateValue) return null;

  const iso = dateValue.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (iso) {
    const day = Number.parseInt(iso[3], 10);
    const monthIndex = Number.parseInt(iso[2], 10) - 1;
    if (monthIndex < 0 || monthIndex > 11 || day < 1 || day > 31) return null;
    return `${day} ${RUSSIAN_MONTHS_GENITIVE[monthIndex]}`;
  }

  const ms = Date.parse(dateValue);
  if (Number.isNaN(ms)) return null;

  const date = new Date(ms);
  return `${date.getDate()} ${RUSSIAN_MONTHS_GENITIVE[date.getMonth()]}`;
}

/** Drawer hiring detail line parts (vacancies + optional HH check). */
export function buildDrawerHiringDetailParts(company: CompanyPublic): string[] {
  if (company.vacanciesRange === "Не проверено") {
    return ["Вакансии не проверены"];
  }

  const parts: string[] = [];

  if (company.vacanciesRange === "0") {
    parts.push("Нет активных вакансий");
  } else {
    parts.push(formatVacanciesRangeCopy(company.vacanciesRange));
  }

  if (company.hhVacanciesCheckedAt) {
    const dayMonth = formatRussianDayMonth(company.hhVacanciesCheckedAt);
    if (dayMonth) {
      parts.push(`Проверено на HH: ${dayMonth}`);
      if (isStaleDate(company.hhVacanciesCheckedAt)) {
        parts.push("Требует повторной проверки");
      }
    }
  }

  return parts;
}

/** Hiring freshness copy for drawer (`Проверено на HH: 13 мая`). */
export function getDrawerHiringFreshnessDisplay(
  hhVacanciesCheckedAt: string | null | undefined,
): HiringFreshnessDisplay {
  if (!hhVacanciesCheckedAt) {
    return { hhLine: "HH: не проверено", staleWarning: null, isMissing: true };
  }

  const dayMonth = formatRussianDayMonth(hhVacanciesCheckedAt);
  if (!dayMonth) {
    return { hhLine: "HH: не проверено", staleWarning: null, isMissing: true };
  }

  return {
    hhLine: `Проверено на HH: ${dayMonth}`,
    staleWarning: isStaleDate(hhVacanciesCheckedAt) ? "Требует повторной проверки" : null,
    isMissing: false,
  };
}

/** Display-only label for employer ranking trust badges in the drawer. */
export function formatEmployerRankingBadgeLabel(
  source: EmployerRankingBadge["source"],
  label: string,
): string {
  const trimmed = label.trim();

  if (source === "habr") {
    const match = trimmed.match(/^средняя\s+оценка\s+#?(\d+)$/i);
    if (match) return `#${match[1]} по средней оценке`;
  }

  return trimmed;
}

/** Split awards/rankings string into list items for drawer. */
export function splitAwards(value: string | null | undefined): string[] {
  if (!value) return [];

  const rawItems = value
    .split(/;|\n/)
    .map((item) => item.trim())
    .filter(Boolean);

  const result: string[] = [];
  let lastSource: string | null = null;

  for (const item of rawItems) {
    if (item.includes("—")) {
      const [source] = item.split("—");
      lastSource = source.trim();
      result.push(item);
      continue;
    }

    if (lastSource) {
      result.push(`${lastSource} — ${item}`);
    } else {
      result.push(item);
    }
  }

  return result;
}

function normalizeRankingText(value: string): string {
  return value
    .toLowerCase()
    .replace(/ё/g, "е")
    .replace(/#\s*/g, "#")
    .replace(/[.,;:()]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractRank(value: string): string | null {
  const match = normalizeRankingText(value).match(/(?:топ|top|#)\s*-?\s*(\d+)/);
  return match ? match[1] : null;
}

function isAwardDuplicatedByEmployerBadge(award: string, badge: EmployerRankingBadge): boolean {
  const normalizedAward = normalizeRankingText(award);
  const normalizedLabel = normalizeRankingText(badge.label);
  const year = badge.year ? String(badge.year) : "";

  if (badge.source === "habr") {
    const isHabr = normalizedAward.includes("habr career");
    if (!isHabr) return false;

    const sameYear = !year || normalizedAward.includes(year);
    if (!sameYear) return false;

    if (normalizedAward.includes(normalizedLabel)) return true;

    const labelRank = extractRank(badge.label);
    const awardRank = extractRank(award);
    if (
      labelRank &&
      awardRank &&
      labelRank === awardRank &&
      normalizedLabel.includes("средняя оценка") &&
      normalizedAward.includes("средняя оценка")
    ) {
      return true;
    }

    return false;
  }

  if (badge.source === "hh") {
    const isHh = normalizedAward.includes("hh") || normalizedAward.includes("headhunter");
    if (!isHh) return false;

    const sameYear = !year || normalizedAward.includes(year);
    if (!sameYear) return false;

    if (normalizedAward.includes(normalizedLabel)) return true;

    const labelRank = extractRank(badge.label);
    const awardRank = extractRank(award);
    if (labelRank && awardRank && labelRank === awardRank) return true;

    return false;
  }

  return false;
}

/** Hide award lines already shown as employer ranking trust badges in the drawer. */
export function filterDrawerAwardsByEmployerRankingBadges(
  awardItems: string[],
  badges: EmployerRankingBadge[],
): string[] {
  if (badges.length === 0) return awardItems;

  return awardItems.filter(
    (award) => !badges.some((badge) => isAwardDuplicatedByEmployerBadge(award, badge)),
  );
}
