export const DIGITAL_DEFAULT_PAGE_SIZE = 50;

/** Default catalog page size on mobile viewports (fresh load, no stored preference). */
export const DIGITAL_MOBILE_DEFAULT_PAGE_SIZE = 10;

export const DIGITAL_PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const;

export type DigitalPageSize = (typeof DIGITAL_PAGE_SIZE_OPTIONS)[number];

export const DIGITAL_PAGE_SIZE_STORAGE_KEY = "digital_page_size";

export const DIGITAL_DESKTOP_INITIAL_VISIBLE = DIGITAL_DEFAULT_PAGE_SIZE;
export const DIGITAL_DESKTOP_LOAD_STEP = DIGITAL_DEFAULT_PAGE_SIZE;

export const DIGITAL_MOBILE_INITIAL_VISIBLE = DIGITAL_MOBILE_DEFAULT_PAGE_SIZE;
export const DIGITAL_MOBILE_LOAD_STEP = DIGITAL_MOBILE_DEFAULT_PAGE_SIZE;

export function isValidPageSize(value: number): value is DigitalPageSize {
  return (DIGITAL_PAGE_SIZE_OPTIONS as readonly number[]).includes(value);
}

export function parsePageSize(value: string | number | null | undefined): DigitalPageSize {
  const n = typeof value === "number" ? value : Number(value);
  return isValidPageSize(n) ? n : DIGITAL_DEFAULT_PAGE_SIZE;
}

export function hasStoredPageSize(): boolean {
  if (typeof localStorage === "undefined") return false;
  try {
    return localStorage.getItem(DIGITAL_PAGE_SIZE_STORAGE_KEY) != null;
  } catch {
    return false;
  }
}

export function readStoredPageSize(): DigitalPageSize {
  if (typeof localStorage === "undefined") return DIGITAL_DEFAULT_PAGE_SIZE;
  try {
    return parsePageSize(localStorage.getItem(DIGITAL_PAGE_SIZE_STORAGE_KEY));
  } catch {
    return DIGITAL_DEFAULT_PAGE_SIZE;
  }
}

export function writeStoredPageSize(size: DigitalPageSize): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(DIGITAL_PAGE_SIZE_STORAGE_KEY, String(size));
  } catch {
    // ignore quota / private mode
  }
}

export type DigitalCatalogSurface = "desktop" | "mobile";

export function getCatalogLimitConfig(surface: DigitalCatalogSurface): {
  initial: number;
  step: number;
} {
  if (surface === "desktop") {
    return {
      initial: DIGITAL_DESKTOP_INITIAL_VISIBLE,
      step: DIGITAL_DESKTOP_LOAD_STEP,
    };
  }
  return {
    initial: DIGITAL_MOBILE_INITIAL_VISIBLE,
    step: DIGITAL_MOBILE_LOAD_STEP,
  };
}

export function getInitiallyVisibleCount(total: number, initialLimit: number): number {
  return Math.min(initialLimit, total);
}

export function shouldShowLoadMore(total: number, visibleCount: number): boolean {
  return visibleCount < total;
}

export function formatCatalogCountText(shown: number, total: number): string {
  return `Показано ${shown} из ${total} компаний`;
}

export function formatFilteredCatalogCountText(shown: number, filteredTotal: number): string {
  return `Показано ${shown} из ${filteredTotal} найденных компаний`;
}

export const DIGITAL_CATALOG_EMPTY_TEXT =
  "Ничего не найдено. Попробуйте изменить фильтры.";

export function getLoadMoreLabel(step: number): string {
  return `Показать ещё ${step}`;
}

export function isCatalogItemInitiallyHidden(index: number, initialVisible: number): boolean {
  return index >= initialVisible;
}
