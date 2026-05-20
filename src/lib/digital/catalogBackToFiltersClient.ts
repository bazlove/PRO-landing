export function initDigitalBackToFilters(): void {
  const button = document.querySelector<HTMLAnchorElement>("[data-digital-back-to-filters]");
  const filters = document.querySelector<HTMLElement>("#digital-catalog-filters");
  const catalog = document.querySelector<HTMLElement>("#digital-catalog");
  const methodology = document.querySelector<HTMLElement>("#methodology");

  if (!button || !filters || !catalog) {
    return;
  }

  const searchInput = document.querySelector<HTMLInputElement>("[data-digital-filter-search]");
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const updateBackToFiltersVisibility = () => {
    const filtersRect = filters.getBoundingClientRect();
    const catalogRect = catalog.getBoundingClientRect();
    const methodologyRect = methodology?.getBoundingClientRect();

    const filtersAboveViewport = filtersRect.bottom < 0;
    const catalogStillRelevant = catalogRect.bottom > window.innerHeight * 0.45;
    const methodologyNotEntered = methodologyRect
      ? methodologyRect.top > window.innerHeight * 0.85
      : true;

    button.hidden = !(
      filtersAboveViewport &&
      catalogStillRelevant &&
      methodologyNotEntered
    );
  };

  button.addEventListener("click", (event) => {
    event.preventDefault();
    filters.scrollIntoView({
      behavior: prefersReducedMotion ? "auto" : "smooth",
      block: "start",
    });
    searchInput?.focus({ preventScroll: true });
  });

  window.addEventListener("scroll", updateBackToFiltersVisibility, { passive: true });
  window.addEventListener("resize", updateBackToFiltersVisibility);
  updateBackToFiltersVisibility();
}
