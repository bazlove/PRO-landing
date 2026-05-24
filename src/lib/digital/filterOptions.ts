import type { CompanyPublic } from "../../types/digital";

export const DIGITAL_HIRING_STATUS_OPTIONS = [
  "Активный",
  "Точечный",
  "На паузе",
  "Неясно",
] as const;

export const DIGITAL_WORK_FORMAT_OPTIONS = [
  "Удалёнка",
  "Гибрид",
  "Офис",
  "Смешанный",
  "Не указано",
] as const;

export type DigitalFilterOptions = {
  cities: string[];
  companyTypes: string[];
  niches: string[];
  sizes: string[];
  hiringStatuses: readonly string[];
  workFormats: readonly string[];
};

const SIZE_SORT_ORDER = ["1–50", "51–200", "201–500", "500+"];

const EXCLUDED_OPTION_VALUES = new Set(["", "Не указано"]);

function uniqueSorted(values: string[]): string[] {
  const seen = new Set<string>();
  for (const value of values) {
    const trimmed = value.trim();
    if (!trimmed || EXCLUDED_OPTION_VALUES.has(trimmed)) continue;
    seen.add(trimmed);
  }
  return [...seen].sort((a, b) => a.localeCompare(b, "ru"));
}

function sortSizes(values: string[]): string[] {
  const unique = uniqueSorted(values);
  return unique.sort((a, b) => {
    const indexA = SIZE_SORT_ORDER.indexOf(a);
    const indexB = SIZE_SORT_ORDER.indexOf(b);
    if (indexA !== -1 && indexB !== -1) return indexA - indexB;
    if (indexA !== -1) return -1;
    if (indexB !== -1) return 1;
    return a.localeCompare(b, "ru");
  });
}

export function getDigitalFilterOptions(companies: CompanyPublic[]): DigitalFilterOptions {
  return {
    cities: uniqueSorted(companies.map((c) => c.city)),
    companyTypes: uniqueSorted(companies.map((c) => c.companyType)),
    niches: uniqueSorted(companies.map((c) => c.niche)),
    sizes: sortSizes(companies.map((c) => c.size).filter((size): size is string => size !== null)),
    hiringStatuses: DIGITAL_HIRING_STATUS_OPTIONS,
    workFormats: DIGITAL_WORK_FORMAT_OPTIONS,
  };
}
