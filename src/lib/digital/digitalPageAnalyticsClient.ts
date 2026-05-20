import { trackDigitalEvent } from "./analytics";

const FAQ_OPEN_EVENT = "faq_open";
const METHODOLOGY_CLICK_EVENT = "methodology_click";
const FOOTER_LINK_CLICK_EVENT = "footer_link_click";
const PAGE_VIEW_EVENT = "page_view";

type PageViewStats = {
  companiesCount: number;
  activeHiringCount: number;
  remoteCount: number;
  highHrRatingCount: number;
};

function parsePageViewStats(root: Element): PageViewStats | null {
  const raw = root.getAttribute("data-digital-page-stats");
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as Partial<PageViewStats>;
    if (
      typeof parsed.companiesCount !== "number" ||
      typeof parsed.activeHiringCount !== "number" ||
      typeof parsed.remoteCount !== "number" ||
      typeof parsed.highHrRatingCount !== "number"
    ) {
      return null;
    }
    return parsed as PageViewStats;
  } catch {
    return null;
  }
}

function hashAnchorTarget(href: string): string | null {
  const hashIndex = href.indexOf("#");
  if (hashIndex === -1) return null;
  const target = href.slice(hashIndex + 1).trim();
  return target || null;
}

function trackMethodologyAnchor(href: string, source: "trust" | "footer"): void {
  const target = hashAnchorTarget(href);
  if (target !== "methodology") return;

  trackDigitalEvent(METHODOLOGY_CLICK_EVENT, {
    target: "methodology",
    source,
  });
}

function trackFooterAnchor(href: string): void {
  const target = hashAnchorTarget(href);
  if (!target) return;

  if (target === "methodology") {
    trackDigitalEvent(METHODOLOGY_CLICK_EVENT, { target: "methodology", source: "footer" });
    return;
  }

  if (target === "faq") {
    trackDigitalEvent(FOOTER_LINK_CLICK_EVENT, { target: "faq" });
    return;
  }

  if (target === "digital-catalog") {
    trackDigitalEvent(FOOTER_LINK_CLICK_EVENT, { target: "catalog" });
  }
}

function initFaqAnalytics(faqRoot: HTMLElement): void {
  const items = faqRoot.querySelectorAll<HTMLDetailsElement>(".digital-faq-item");
  items.forEach((details, index) => {
    const question =
      details.querySelector<HTMLElement>(".digital-faq-item__heading")?.textContent?.trim() ||
      `faq-${index}`;

    details.addEventListener("toggle", () => {
      if (!details.open) return;

      trackDigitalEvent(FAQ_OPEN_EVENT, {
        question,
        index,
      });
    });
  });
}

function initTrustLinksAnalytics(): void {
  const trustLinks = document.querySelector(".digital-catalog-trust-links");
  if (!trustLinks) return;

  trustLinks.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;

    const link = target.closest<HTMLAnchorElement>("a[href]");
    if (!link?.href) return;

    trackMethodologyAnchor(link.getAttribute("href") || link.href, "trust");
  });
}

function initFooterAnalytics(): void {
  const footer = document.querySelector(".digital-footer");
  if (!footer) return;

  footer.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;

    const link = target.closest<HTMLAnchorElement>("a[href]");
    if (!link) return;

    const href = link.getAttribute("href") || "";
    trackFooterAnchor(href);
  });
}

function initPageView(root: Element): void {
  const stats = parsePageViewStats(root);
  if (!stats) return;

  trackDigitalEvent(PAGE_VIEW_EVENT, {
    companies_count: stats.companiesCount,
    active_hiring_count: stats.activeHiringCount,
    remote_count: stats.remoteCount,
    high_hr_rating_count: stats.highHrRatingCount,
  });
}

export function initDigitalPageAnalytics(): void {
  const root = document.querySelector("[data-digital-page-root]");
  if (!root) return;

  initPageView(root);

  const faqSection = document.getElementById("faq");
  if (faqSection) initFaqAnalytics(faqSection);

  initTrustLinksAnalytics();
  initFooterAnalytics();
}
