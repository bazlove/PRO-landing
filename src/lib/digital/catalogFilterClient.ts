import { trackDigitalEvent } from "./analytics";
import {
  DIGITAL_DEFAULT_PAGE_SIZE,
  parsePageSize,
  readStoredPageSize,
  writeStoredPageSize,
} from "./displayLimits";
import {
  DIGITAL_FILTER_PRESETS,
  DIGITAL_PRIMARY_PRESET_IDS,
} from "./filterPresets";
import { normalizeCatalogSearch } from "./searchNormalize";

const SEARCH_ANALYTICS_DEBOUNCE_MS = 600;

const ADVANCED_FILTER_IDS = {
  city: "city",
  type: "company_type",
  niche: "niche",
  hiring: "hiring_status",
  format: "work_format",
  size: "company_size",
} as const;

const DESKTOP_MQ = "(min-width: 960px)";
const MOBILE_FILTERS_MQ = "(max-width: 640px)";
const VALID_PRESET_IDS = new Set(DIGITAL_FILTER_PRESETS.map((preset) => preset.id));
const ADVANCED_TOGGLE_LABEL_SHOW = "Показать расширенные фильтры ↓";
const ADVANCED_TOGGLE_LABEL_HIDE = "Свернуть расширенные фильтры ↑";
const PRESETS_MORE_LABEL_SHOW = "Показать дополнительные быстрые фильтры";
const PRESETS_MORE_LABEL_HIDE = "Скрыть дополнительные быстрые фильтры";

type CatalogSurface = {
  name: "desktop" | "mobile";
  root: Element;
};

export function initDigitalCatalogFilters(): void {
  const root = document.querySelector("[data-digital-catalog-root]");
  if (!root) return;

  const searchInput = root.querySelector<HTMLInputElement>("[data-digital-filter-search]");
  const citySelect = root.querySelector<HTMLSelectElement>("[data-digital-filter-city]");
  const typeSelect = root.querySelector<HTMLSelectElement>("[data-digital-filter-type]");
  const nicheSelect = root.querySelector<HTMLSelectElement>("[data-digital-filter-niche]");
  const hiringSelect = root.querySelector<HTMLSelectElement>("[data-digital-filter-hiring]");
  const formatSelect = root.querySelector<HTMLSelectElement>("[data-digital-filter-format]");
  const sizeSelect = root.querySelector<HTMLSelectElement>("[data-digital-filter-size]");
  const clearBtns = root.querySelectorAll<HTMLButtonElement>("[data-digital-filter-clear]");
  const emptyEl = root.querySelector<HTMLElement>("[data-digital-catalog-empty]");
  const presetButtons = root.querySelectorAll<HTMLButtonElement>("[data-digital-preset]");
  const advancedToggle = root.querySelector<HTMLButtonElement>("[data-digital-filter-advanced-toggle]");
  const advancedPanel = root.querySelector<HTMLElement>("[data-digital-filter-advanced]");
  const advancedToggleLabel = root.querySelector<HTMLElement>(
    "[data-digital-filter-advanced-toggle-label]",
  );
  const presetsMoreToggle = root.querySelector<HTMLButtonElement>(
    "[data-digital-presets-more-toggle]",
  );
  const presetsSecondary = root.querySelector<HTMLElement>("[data-digital-presets-secondary]");
  const presetsMoreIcon = root.querySelector<HTMLElement>("[data-digital-presets-more-icon]");
  const pageSizeSelect = root.querySelector<HTMLSelectElement>("[data-digital-page-size]");

  const surfaces: CatalogSurface[] = [];
  const desktopRoot = root.querySelector('[data-digital-catalog-surface="desktop"]');
  const mobileRoot = root.querySelector('[data-digital-catalog-surface="mobile"]');
  if (desktopRoot) {
    surfaces.push({ name: "desktop", root: desktopRoot });
  }
  if (mobileRoot) {
    surfaces.push({ name: "mobile", root: mobileRoot });
  }

  const activePresets = new Set<string>();
  const visibleBySurface: Record<string, number> = {};

  function getPageSize(): number {
    if (pageSizeSelect) return parsePageSize(pageSizeSelect.value);
    return DIGITAL_DEFAULT_PAGE_SIZE;
  }

  function initPageSizeFromStorage(): void {
    const stored = readStoredPageSize();
    if (pageSizeSelect) pageSizeSelect.value = String(stored);
    surfaces.forEach((surface) => {
      visibleBySurface[surface.name] = stored;
    });
  }
  let filtersActive = false;
  let searchAnalyticsTimer: ReturnType<typeof setTimeout> | undefined;

  function hasAdvancedSelectValues(): boolean {
    return Boolean(
      citySelect?.value ||
        typeSelect?.value ||
        nicheSelect?.value ||
        hiringSelect?.value ||
        formatSelect?.value ||
        sizeSelect?.value,
    );
  }

  function setAdvancedExpanded(expanded: boolean): void {
    if (!advancedPanel || !advancedToggle) return;
    advancedPanel.hidden = !expanded;
    advancedToggle.setAttribute("aria-expanded", expanded ? "true" : "false");
    if (advancedToggleLabel) {
      advancedToggleLabel.textContent = expanded
        ? ADVANCED_TOGGLE_LABEL_HIDE
        : ADVANCED_TOGGLE_LABEL_SHOW;
    }
  }

  function syncAdvancedPanelVisibility(): void {
    if (hasAdvancedSelectValues()) {
      setAdvancedExpanded(true);
    }
  }

  function isMobileFiltersViewport(): boolean {
    return window.matchMedia(MOBILE_FILTERS_MQ).matches;
  }

  function hasActiveSecondaryPreset(): boolean {
    for (const id of activePresets) {
      if (!DIGITAL_PRIMARY_PRESET_IDS.has(id)) return true;
    }
    return false;
  }

  function setPresetsMoreExpanded(expanded: boolean): void {
    if (!presetsSecondary || !presetsMoreToggle) return;
    presetsSecondary.hidden = !expanded;
    presetsMoreToggle.setAttribute("aria-expanded", expanded ? "true" : "false");
    presetsMoreToggle.classList.toggle("is-expanded", expanded);
    presetsMoreToggle.setAttribute(
      "aria-label",
      expanded ? PRESETS_MORE_LABEL_HIDE : PRESETS_MORE_LABEL_SHOW,
    );
    if (presetsMoreIcon) {
      presetsMoreIcon.textContent = expanded ? "−" : "+";
    }
  }

  function syncPresetsSecondaryVisibility(): void {
    if (!isMobileFiltersViewport()) return;
    if (hasActiveSecondaryPreset()) {
      setPresetsMoreExpanded(true);
    }
  }

  function syncClearButtons(): void {
    const isMobile = isMobileFiltersViewport();
    clearBtns.forEach((btn) => {
      const isUtility = btn.hasAttribute("data-digital-filter-clear-utility");
      if (isMobile && isUtility) {
        btn.hidden = false;
        btn.classList.toggle("is-active", filtersActive);
        return;
      }
      if (isMobile && !isUtility) {
        btn.hidden = true;
        btn.classList.remove("is-active");
        return;
      }
      if (!isMobile && isUtility) {
        btn.hidden = true;
        btn.classList.remove("is-active");
        return;
      }
      btn.hidden = !filtersActive;
      btn.classList.toggle("is-active", filtersActive);
    });
  }

  function getItemPresetIds(el: Element): string[] {
    return (el.getAttribute("data-preset-ids") || "")
      .split("|")
      .map((id) => id.trim())
      .filter(Boolean);
  }

  function itemMatchesPresets(el: Element): boolean {
    if (activePresets.size === 0) return true;
    const ids = getItemPresetIds(el);
    for (const presetId of activePresets) {
      if (!ids.includes(presetId)) return false;
    }
    return true;
  }

  function itemMatchesFilters(el: Element): boolean {
    const search = normalizeCatalogSearch(searchInput?.value ?? "");
    if (search) {
      const hay = el.getAttribute("data-search-text") || "";
      if (!hay.includes(search)) return false;
    }

    if (citySelect?.value && el.getAttribute("data-city") !== citySelect.value) return false;
    if (typeSelect?.value && el.getAttribute("data-company-type") !== typeSelect.value) {
      return false;
    }
    if (nicheSelect?.value && el.getAttribute("data-niche") !== nicheSelect.value) return false;
    if (hiringSelect?.value && el.getAttribute("data-hiring-status") !== hiringSelect.value) {
      return false;
    }
    if (formatSelect?.value && el.getAttribute("data-work-format") !== formatSelect.value) {
      return false;
    }
    if (sizeSelect?.value && el.getAttribute("data-size") !== sizeSelect.value) {
      return false;
    }

    if (!itemMatchesPresets(el)) return false;

    return true;
  }

  function computeFiltersActive(): boolean {
    if (normalizeCatalogSearch(searchInput?.value ?? "")) return true;
    if (citySelect?.value) return true;
    if (typeSelect?.value) return true;
    if (nicheSelect?.value) return true;
    if (hiringSelect?.value) return true;
    if (formatSelect?.value) return true;
    if (sizeSelect?.value) return true;
    if (activePresets.size > 0) return true;
    return false;
  }

  function formatCount(shown: number, total: number, filtered: boolean): string {
    if (filtered) {
      return `Показано ${shown} из ${total} найденных компаний`;
    }
    return `Показано ${shown} из ${total} компаний`;
  }

  function getFilteredCount(): number {
    const desktopSurface = surfaces.find((surface) => surface.name === "desktop");
    if (!desktopSurface) return 0;
    return Array.from(
      desktopSurface.root.querySelectorAll("[data-digital-catalog-item]"),
    ).filter(itemMatchesFilters).length;
  }

  function countActiveAdvancedFilters(): number {
    let count = 0;
    if (citySelect?.value) count += 1;
    if (typeSelect?.value) count += 1;
    if (nicheSelect?.value) count += 1;
    if (hiringSelect?.value) count += 1;
    if (formatSelect?.value) count += 1;
    if (sizeSelect?.value) count += 1;
    return count;
  }

  function scheduleSearchAnalytics(): void {
    if (searchAnalyticsTimer) clearTimeout(searchAnalyticsTimer);
    searchAnalyticsTimer = setTimeout(() => {
      const normalized = normalizeCatalogSearch(searchInput?.value ?? "");
      trackDigitalEvent("search", {
        query_length: normalized.length,
        has_query: normalized.length > 0,
        results_count: getFilteredCount(),
      });
    }, SEARCH_ANALYTICS_DEBOUNCE_MS);
  }

  function trackAdvancedFilterApply(
    filterId: (typeof ADVANCED_FILTER_IDS)[keyof typeof ADVANCED_FILTER_IDS],
    value: string,
  ): void {
    trackDigitalEvent("filter_apply", {
      filter: filterId,
      value,
      results_count: getFilteredCount(),
    });
  }

  function syncSurface(surface: CatalogSurface): void {
    const items = Array.from(surface.root.querySelectorAll("[data-digital-catalog-item]"));
    const matching = items.filter(itemMatchesFilters);
    const pageSize = getPageSize();
    const visibleLimit = visibleBySurface[surface.name] ?? pageSize;
    let shown = 0;

    items.forEach((el) => {
      el.classList.add("digital-catalog-item--hidden");
    });

    matching.forEach((el, index) => {
      if (index < visibleLimit) {
        el.classList.remove("digital-catalog-item--hidden");
        shown += 1;
      }
    });

    const footer = surface.root.querySelector("[data-digital-catalog-footer]");
    if (!footer) return;

    const countEl = footer.querySelector("[data-digital-catalog-count]");
    const btn = footer.querySelector<HTMLButtonElement>("[data-digital-load-more]");
    const filteredTotal = matching.length;

    if (countEl) {
      countEl.textContent = formatCount(
        Math.min(shown, filteredTotal),
        filteredTotal,
        filtersActive,
      );
    }
    if (btn) {
      const hasMoreToShow = filteredTotal > shown;
      btn.hidden = !hasMoreToShow;
      btn.textContent = `Показать ещё ${pageSize}`;
    }
  }

  function applyCatalog(): void {
    filtersActive = computeFiltersActive();

    syncClearButtons();

    presetButtons.forEach((btn) => {
      const id = btn.getAttribute("data-digital-preset");
      const pressed = Boolean(id && activePresets.has(id));
      btn.setAttribute("aria-pressed", pressed ? "true" : "false");
    });

    const filteredCount = getFilteredCount();

    surfaces.forEach(syncSurface);

    if (emptyEl) emptyEl.hidden = filteredCount > 0;

    surfaces.forEach((surface) => {
      const wrap = surface.root.closest(".digital-table-wrap, .digital-mobile-cards");
      if (wrap instanceof HTMLElement) wrap.hidden = filteredCount === 0;
    });

    syncUrl();
  }

  function resetVisibleCounts(): void {
    const pageSize = getPageSize();
    surfaces.forEach((surface) => {
      visibleBySurface[surface.name] = pageSize;
    });
  }

  function readUrl(): void {
    const params = new URLSearchParams(window.location.search);
    if (searchInput) searchInput.value = params.get("q") || "";
    if (citySelect) citySelect.value = params.get("city") || "";
    if (typeSelect) typeSelect.value = params.get("type") || "";
    if (nicheSelect) nicheSelect.value = params.get("niche") || "";
    if (hiringSelect) hiringSelect.value = params.get("hiring") || "";
    if (formatSelect) formatSelect.value = params.get("format") || "";
    if (sizeSelect) sizeSelect.value = params.get("size") || "";

    activePresets.clear();
    const presetParam = params.get("preset");
    if (presetParam) {
      presetParam.split(",").forEach((id) => {
        const trimmed = id.trim();
        if (trimmed && VALID_PRESET_IDS.has(trimmed)) activePresets.add(trimmed);
      });
    }
    // Legacy query params → preset chips (removed duplicate checkboxes)
    if (params.get("highRating") === "1") activePresets.add("high-rating");
    if (params.get("awards") === "1") activePresets.add("awards-2025");
    if (params.get("international") === "1") activePresets.add("international");
  }

  function syncUrl(): void {
    const params = new URLSearchParams();
    const search = normalizeCatalogSearch(searchInput?.value ?? "");
    if (search) params.set("q", search);
    if (citySelect?.value) params.set("city", citySelect.value);
    if (typeSelect?.value) params.set("type", typeSelect.value);
    if (nicheSelect?.value) params.set("niche", nicheSelect.value);
    if (hiringSelect?.value) params.set("hiring", hiringSelect.value);
    if (formatSelect?.value) params.set("format", formatSelect.value);
    if (sizeSelect?.value) params.set("size", sizeSelect.value);
    if (activePresets.size > 0) {
      params.set("preset", Array.from(activePresets).join(","));
    }

    const query = params.toString();
    const next = query ? `${window.location.pathname}?${query}` : window.location.pathname;
    const currentUrl = window.location.pathname + window.location.search;
    if (next !== currentUrl) {
      window.history.replaceState(null, "", next);
    }
  }

  function onFilterChange(): void {
    resetVisibleCounts();
    applyCatalog();
  }

  function clearFilters(): void {
    trackDigitalEvent("filters_reset", {
      had_search: Boolean(normalizeCatalogSearch(searchInput?.value ?? "")),
      active_presets_count: activePresets.size,
      active_advanced_filters_count: countActiveAdvancedFilters(),
    });

    if (searchInput) searchInput.value = "";
    if (citySelect) citySelect.value = "";
    if (typeSelect) typeSelect.value = "";
    if (nicheSelect) nicheSelect.value = "";
    if (hiringSelect) hiringSelect.value = "";
    if (formatSelect) formatSelect.value = "";
    if (sizeSelect) sizeSelect.value = "";
    activePresets.clear();
    setAdvancedExpanded(false);
    if (isMobileFiltersViewport()) {
      setPresetsMoreExpanded(false);
    }
    resetVisibleCounts();
    applyCatalog();
  }

  advancedToggle?.addEventListener("click", () => {
    const expanded = advancedPanel ? !advancedPanel.hidden : false;
    setAdvancedExpanded(!expanded);
  });

  presetsMoreToggle?.addEventListener("click", () => {
    const expanded = presetsSecondary ? !presetsSecondary.hidden : false;
    setPresetsMoreExpanded(!expanded);
  });

  searchInput?.addEventListener("input", () => {
    scheduleSearchAnalytics();
    onFilterChange();
  });
  searchInput?.addEventListener("search", () => {
    scheduleSearchAnalytics();
    onFilterChange();
  });
  searchInput?.addEventListener("keydown", (event) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    searchInput.blur();
  });

  citySelect?.addEventListener("change", () => {
    trackAdvancedFilterApply(ADVANCED_FILTER_IDS.city, citySelect.value);
    onFilterChange();
  });
  typeSelect?.addEventListener("change", () => {
    trackAdvancedFilterApply(ADVANCED_FILTER_IDS.type, typeSelect.value);
    onFilterChange();
  });
  nicheSelect?.addEventListener("change", () => {
    trackAdvancedFilterApply(ADVANCED_FILTER_IDS.niche, nicheSelect.value);
    onFilterChange();
  });
  hiringSelect?.addEventListener("change", () => {
    trackAdvancedFilterApply(ADVANCED_FILTER_IDS.hiring, hiringSelect.value);
    onFilterChange();
  });
  formatSelect?.addEventListener("change", () => {
    trackAdvancedFilterApply(ADVANCED_FILTER_IDS.format, formatSelect.value);
    onFilterChange();
  });
  sizeSelect?.addEventListener("change", () => {
    trackAdvancedFilterApply(ADVANCED_FILTER_IDS.size, sizeSelect.value);
    onFilterChange();
  });

  clearBtns.forEach((btn) => {
    btn.addEventListener("click", clearFilters);
  });

  presetButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-digital-preset");
      if (!id) return;
      const wasActive = activePresets.has(id);
      if (wasActive) activePresets.delete(id);
      else {
        activePresets.add(id);
        if (!DIGITAL_PRIMARY_PRESET_IDS.has(id)) {
          setPresetsMoreExpanded(true);
        }
      }

      trackDigitalEvent("preset_click", {
        preset: id,
        active: !wasActive,
        results_count: getFilteredCount(),
      });

      onFilterChange();
    });
  });

  surfaces.forEach((surface) => {
    const footer = surface.root.querySelector("[data-digital-catalog-footer]");
    const btn = footer?.querySelector<HTMLButtonElement>("[data-digital-load-more]");
    btn?.addEventListener("click", () => {
      const pageSize = getPageSize();
      const current = visibleBySurface[surface.name] ?? pageSize;
      const matchCount = Array.from(
        surface.root.querySelectorAll("[data-digital-catalog-item]"),
      ).filter(itemMatchesFilters).length;
      const visibleBefore = Math.min(current, matchCount);
      const visibleAfter = Math.min(current + pageSize, matchCount);

      trackDigitalEvent("load_more", {
        visible_count_before: visibleBefore,
        visible_count_after: visibleAfter,
        total_filtered_count: matchCount,
      });

      visibleBySurface[surface.name] = visibleAfter;
      applyCatalog();
    });
  });

  const mq = window.matchMedia(DESKTOP_MQ);
  const onMqChange = () => {
    resetVisibleCounts();
    syncPresetsSecondaryVisibility();
    applyCatalog();
  };
  if (typeof mq.addEventListener === "function") {
    mq.addEventListener("change", onMqChange);
  } else if (typeof mq.addListener === "function") {
    // Legacy MediaQueryList API (Safari < 14, older Chromium)
    mq.addListener(onMqChange);
  }

  pageSizeSelect?.addEventListener("change", () => {
    writeStoredPageSize(parsePageSize(pageSizeSelect.value));
    resetVisibleCounts();
    applyCatalog();
  });

  readUrl();
  initPageSizeFromStorage();
  syncAdvancedPanelVisibility();
  syncPresetsSecondaryVisibility();
  applyCatalog();
}
