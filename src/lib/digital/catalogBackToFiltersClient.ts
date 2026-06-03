/**
 * Back-to-filters visibility via IntersectionObserver (no scroll-time layout reads).
 *
 * rootMargin approximates prior getBoundingClientRect thresholds:
 * - catalog: bottom -45% → catalog still relevant while its box intersects top 55% of viewport
 * - methodology: top -85% → methodology "entered" when it intersects bottom 15% of viewport
 */
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

  let filtersVisible = true;
  let catalogVisible = false;
  let methodologyVisible = false;

  const updateVisibility = (): void => {
    const drawerOpen = document.body.classList.contains("digital-drawer-open");
    const shouldShow =
      !drawerOpen && !filtersVisible && catalogVisible && !methodologyVisible;
    button.hidden = !shouldShow;
  };

  const onIntersection: IntersectionObserverCallback = (entries) => {
    for (const entry of entries) {
      if (entry.target === filters) {
        filtersVisible = entry.isIntersecting;
      } else if (entry.target === catalog) {
        catalogVisible = entry.isIntersecting;
      } else if (methodology && entry.target === methodology) {
        methodologyVisible = entry.isIntersecting;
      }
    }
    updateVisibility();
  };

  const observerOptions = { root: null, threshold: 0 } as const;

  const filtersObserver = new IntersectionObserver(onIntersection, observerOptions);
  const catalogObserver = new IntersectionObserver(onIntersection, {
    ...observerOptions,
    rootMargin: "0px 0px -45% 0px",
  });

  filtersObserver.observe(filters);
  catalogObserver.observe(catalog);

  if (methodology) {
    const methodologyObserver = new IntersectionObserver(onIntersection, {
      ...observerOptions,
      rootMargin: "-85% 0px 0px 0px",
    });
    methodologyObserver.observe(methodology);
  }

  const drawerObserver = new MutationObserver(updateVisibility);
  drawerObserver.observe(document.body, {
    attributes: true,
    attributeFilter: ["class"],
  });

  button.addEventListener("click", (event) => {
    event.preventDefault();
    filters.scrollIntoView({
      behavior: prefersReducedMotion ? "auto" : "smooth",
      block: "start",
    });
    searchInput?.focus({ preventScroll: true });
  });

  updateVisibility();
}
