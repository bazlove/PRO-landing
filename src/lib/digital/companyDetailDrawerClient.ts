import { trackDigitalEvent } from "./analytics";
import type { DrawerCompanyData } from "./buildDigitalDrawerData";
import { renderDigitalCompanyDetailContent } from "./companyDetailDrawerRender";

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';

const DRAWER_LINK_EVENT_NAMES: Record<string, string> = {
  career: "career_click",
  hh: "hh_click",
  habr: "habr_click",
  linkedin: "linkedin_click",
};

const DRAWER_DATA_ELEMENT_ID = "digital-company-detail-data";

type DrawerOpenSource = "table" | "mobile" | "unknown";

type DrawerElements = {
  drawer: HTMLElement;
  overlay: HTMLElement;
  panel: HTMLElement;
  content: HTMLElement;
  closeBtn: HTMLButtonElement;
};

function isVisibleFocusable(el: HTMLElement): boolean {
  return !el.hasAttribute("disabled") && el.getClientRects().length > 0;
}

function initAwardsToggle(root: HTMLElement): void {
  const toggle = root.querySelector<HTMLButtonElement>("[data-company-detail-awards-toggle]");
  const extraItems = Array.from(root.querySelectorAll<HTMLElement>("[data-award-extra='true']"));

  if (!toggle || extraItems.length === 0) return;

  const awardsToggle = toggle;
  const collapsedLabel =
    awardsToggle.dataset.awardsCollapsedLabel || `Показать ещё ${extraItems.length}`;
  const expandedLabel = awardsToggle.dataset.awardsExpandedLabel || "Скрыть";

  function setExpanded(expanded: boolean): void {
    extraItems.forEach((item) => {
      item.hidden = !expanded;
    });
    awardsToggle.setAttribute("aria-expanded", String(expanded));
    awardsToggle.textContent = expanded ? expandedLabel : collapsedLabel;
  }

  setExpanded(false);

  awardsToggle.addEventListener("click", () => {
    setExpanded(awardsToggle.getAttribute("aria-expanded") !== "true");
  });
}

function queryDrawerElements(): DrawerElements | null {
  const drawer = document.querySelector<HTMLElement>("[data-company-detail-drawer]");
  if (!drawer) return null;

  const overlay = drawer.querySelector<HTMLElement>("[data-company-detail-overlay]");
  const panel = drawer.querySelector<HTMLElement>("[data-company-detail-panel]");
  const content = drawer.querySelector<HTMLElement>("[data-company-detail-content]");
  const closeBtn = drawer.querySelector<HTMLButtonElement>("[data-company-detail-close]");

  if (!overlay || !panel || !content || !closeBtn) return null;

  return { drawer, overlay, panel, content, closeBtn };
}

function loadDrawerCompanyMap(): Map<string, DrawerCompanyData> | null {
  const dataEl = document.getElementById(DRAWER_DATA_ELEMENT_ID);
  if (!dataEl?.textContent?.trim()) return null;

  try {
    const companies = JSON.parse(dataEl.textContent) as DrawerCompanyData[];
    if (!Array.isArray(companies)) return null;
    return new Map(companies.map((company) => [company.id, company]));
  } catch {
    return null;
  }
}

export function initDigitalCompanyDetailDrawer(): void {
  const elements = queryDrawerElements();
  if (!elements) return;

  const { drawer, panel, content, closeBtn } = elements;

  let lastTrigger: HTMLElement | null = null;
  let isOpen = false;
  let companyMap: Map<string, DrawerCompanyData> | null = null;

  function getCompanyMap(): Map<string, DrawerCompanyData> | null {
    if (!companyMap) {
      companyMap = loadDrawerCompanyMap();
    }
    return companyMap;
  }

  function getFocusableElements(): HTMLElement[] {
    return Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
      isVisibleFocusable,
    );
  }

  function trapFocus(event: KeyboardEvent): void {
    if (!isOpen || event.key !== "Tab") return;

    const focusable = getFocusableElements();
    if (focusable.length === 0) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const active = document.activeElement;

    if (event.shiftKey && active === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
  }

  function getDrawerOpenSource(trigger: HTMLElement): DrawerOpenSource {
    const surface = trigger.closest("[data-digital-catalog-surface]");
    const surfaceName = surface?.getAttribute("data-digital-catalog-surface");
    if (surfaceName === "desktop") return "table";
    if (surfaceName === "mobile") return "mobile";
    return "unknown";
  }

  function getCatalogItemPosition(catalogItem: Element): number | null {
    const surface = catalogItem.closest("[data-digital-catalog-surface]");
    if (!surface) return null;

    const visibleItems = Array.from(
      surface.querySelectorAll("[data-digital-catalog-item]"),
    ).filter((item) => !item.classList.contains("digital-catalog-item--hidden"));

    const index = visibleItems.indexOf(catalogItem);
    return index >= 0 ? index + 1 : null;
  }

  function trackDrawerOpen(companyId: string, trigger: HTMLElement, catalogItem: Element): void {
    trackDigitalEvent("drawer_open", {
      company_id: companyId,
      company_slug: catalogItem.getAttribute("data-company-slug") || "",
      company_name: catalogItem.getAttribute("data-company-name") || "",
      position: getCatalogItemPosition(catalogItem),
      source: getDrawerOpenSource(trigger),
    });
  }

  function trackDrawerExternalClick(link: HTMLElement): void {
    const analyticsId = link.getAttribute("data-analytics-drawer-link");
    if (!analyticsId) return;

    const eventName = DRAWER_LINK_EVENT_NAMES[analyticsId];
    if (!eventName) return;

    trackDigitalEvent(eventName, {
      company_id: link.getAttribute("data-company-id") || "",
      company_slug: link.getAttribute("data-company-slug") || "",
      company_name: link.getAttribute("data-company-name") || "",
    });
  }

  function openDrawer(companyId: string, trigger: HTMLElement): void {
    const map = getCompanyMap();
    const company = map?.get(companyId);
    if (!company) return;

    const catalogItem = trigger.closest("[data-digital-catalog-item]");
    if (!catalogItem || catalogItem.classList.contains("digital-catalog-item--hidden")) {
      return;
    }

    trackDrawerOpen(companyId, trigger, catalogItem);

    lastTrigger = trigger;

    content.replaceChildren(renderDigitalCompanyDetailContent(company));
    initAwardsToggle(content);

    const titleEl = content.querySelector<HTMLElement>("[data-company-detail-title]");
    if (titleEl?.id) {
      panel.setAttribute("aria-labelledby", titleEl.id);
    } else {
      panel.removeAttribute("aria-labelledby");
    }

    drawer.hidden = false;
    drawer.setAttribute("aria-hidden", "false");
    document.body.classList.add("digital-drawer-open");
    isOpen = true;

    closeBtn.focus();
  }

  function closeDrawer(): void {
    if (!isOpen) return;

    drawer.hidden = true;
    drawer.setAttribute("aria-hidden", "true");
    document.body.classList.remove("digital-drawer-open");
    content.replaceChildren();
    panel.removeAttribute("aria-labelledby");
    isOpen = false;

    lastTrigger?.focus();
    lastTrigger = null;
  }

  function handleDrawerTrigger(trigger: HTMLElement, event?: Event): void {
    event?.preventDefault();
    const companyId = trigger.getAttribute("data-company-id");
    if (companyId) openDrawer(companyId, trigger);
  }

  document.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;

    if (isOpen) {
      const drawerLink = target.closest<HTMLElement>("[data-analytics-drawer-link]");
      if (drawerLink && drawer.contains(drawerLink)) {
        trackDrawerExternalClick(drawerLink);
      }
    }

    const trigger = target.closest<HTMLElement>("[data-company-detail-trigger]");
    if (trigger) {
      handleDrawerTrigger(trigger, event);
      return;
    }

    if (isOpen && target.closest("[data-company-detail-overlay]")) {
      closeDrawer();
    }
  });

  closeBtn.addEventListener("click", () => {
    closeDrawer();
  });

  document.addEventListener("keydown", (event) => {
    if (!isOpen) {
      if (event.key !== "Enter" && event.key !== " ") return;
      const target = event.target;
      if (!(target instanceof Element)) return;
      const trigger = target.closest<HTMLElement>("[data-company-detail-trigger]");
      if (!trigger || trigger.tagName !== "BUTTON") return;
      if (event.key === " ") event.preventDefault();
      handleDrawerTrigger(trigger, event);
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      closeDrawer();
      return;
    }
    trapFocus(event);
  });
}
