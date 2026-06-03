import type { EmployerRankingBadge } from "../../types/digital";
import hhIcon from "../../assets/digital/icons/hh.svg";
import habrCareerIcon from "../../assets/digital/icons/habr-career.svg";
import linkedinIcon from "../../assets/digital/icons/linkedin.svg";
import hhWhiteLogo from "../../assets/digital/min-hh-white.png";
import {
  asDrawerDisplayCompany,
  type DrawerCompanyData,
} from "./buildDigitalDrawerData";
import {
  buildDrawerHiringMeta,
  DRAWER_AWARDS_VISIBLE_COUNT,
  formatDrawerInternationalLine,
  formatRatingValueForUi,
  getDrawerAwards2025DisplayItems,
  getDrawerHeaderMetaParts,
  getDrawerHiringStatusValue,
  getDrawerSummaryChips,
  getEmployerRankingBadgeDescriptionText,
  getEmployerRankingBadgeDisplayLabel,
  shouldShowDrawerInternationalLine,
} from "./display";
import { safeUrl } from "./drawerSafeUrl";

const DRAWER_SOURCE_ICONS = {
  hh: hhIcon.src,
  habr: habrCareerIcon.src,
  linkedin: linkedinIcon.src,
  hhWhite: hhWhiteLogo.src,
} as const;

type DrawerSourceLink = {
  href: string;
  ariaLabel: string;
  iconSrc: string;
  iconClass: string;
  analyticsId: "hh" | "habr" | "linkedin";
};

function appendText(parent: Element, text: string): Text {
  const node = document.createTextNode(text);
  parent.appendChild(node);
  return node;
}

function setClassList(el: Element, classes: string[]): void {
  el.className = classes.filter(Boolean).join(" ");
}

function appendChildren(parent: Element, ...children: (Node | null | undefined | false)[]): void {
  for (const child of children) {
    if (child) parent.appendChild(child);
  }
}

function createEl<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  classNames?: string | string[],
  attrs?: Record<string, string | null | undefined>,
): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  if (classNames) {
    setClassList(el, Array.isArray(classNames) ? classNames : [classNames]);
  }
  if (attrs) {
    for (const [key, value] of Object.entries(attrs)) {
      if (value != null) el.setAttribute(key, value);
    }
  }
  return el;
}

function createExternalLinkIcon(): SVGSVGElement {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("class", "digital-external-icon");
  svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  svg.setAttribute("width", "12");
  svg.setAttribute("height", "12");
  svg.setAttribute("viewBox", "0 0 12 12");
  svg.setAttribute("fill", "none");
  svg.setAttribute("aria-hidden", "true");
  svg.setAttribute("focusable", "false");

  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute("d", "M4.25 2.5h5.25v5.25M9.5 2.5 2.5 9.5");
  path.setAttribute("stroke", "currentColor");
  path.setAttribute("stroke-width", "1.25");
  path.setAttribute("stroke-linecap", "round");
  path.setAttribute("stroke-linejoin", "round");
  svg.appendChild(path);
  return svg;
}

function createAnalyticsLink(
  classNames: string[],
  href: string,
  options: {
    ariaLabel: string;
    title: string;
    analyticsId: string;
    company: DrawerCompanyData;
    children: Node[];
  },
): HTMLAnchorElement {
  const link = createEl("a", classNames, {
    href,
    target: "_blank",
    rel: "noopener noreferrer",
    "aria-label": options.ariaLabel,
    title: options.title,
    "data-analytics-drawer-link": options.analyticsId,
    "data-company-id": options.company.id,
    "data-company-slug": options.company.slug,
    "data-company-name": options.company.name,
  });
  appendChildren(link, ...options.children);
  return link;
}

function ratingValueClass(value: string): string {
  return value === "нет отзывов" || value === "—" ? "digital-ratings__value--empty" : "";
}

function createRatingsBlock(company: DrawerCompanyData): HTMLElement {
  const root = createEl("div", "digital-ratings");
  const hhRating = formatRatingValueForUi(company.hhRatingDisplay);
  const habrRating = formatRatingValueForUi(company.habrRatingDisplay);

  for (const [label, value] of [
    ["HeadHunter", hhRating],
    ["Habr Career", habrRating],
  ] as const) {
    const row = createEl("div", "digital-ratings__row");
    const labelEl = createEl("span", "digital-ratings__label");
    appendText(labelEl, label);
    const valueEl = createEl("span", ["digital-ratings__value", ratingValueClass(value)]);
    appendText(valueEl, value);
    appendChildren(row, labelEl, valueEl);
    root.appendChild(row);
  }

  return root;
}

function createEmployerRankingBadge(badge: EmployerRankingBadge): HTMLElement {
  const sourceConfig = {
    hh: {
      modifierClass: "digital-employer-ranking-badge--hh",
      iconSrc: DRAWER_SOURCE_ICONS.hhWhite,
    },
    habr: {
      modifierClass: "digital-employer-ranking-badge--habr",
      iconSrc: DRAWER_SOURCE_ICONS.habr,
    },
  } as const;

  const config = sourceConfig[badge.source];
  const root = createEl("div", ["digital-employer-ranking-badge", config.modifierClass]);

  const iconWrap = createEl("span", "digital-employer-ranking-badge__icon", {
    "aria-hidden": "true",
  });
  const img = createEl("img", undefined, {
    src: config.iconSrc,
    alt: "",
    width: "15",
    height: "15",
    loading: "lazy",
    decoding: "async",
  });
  iconWrap.appendChild(img);

  const body = createEl("span", "digital-employer-ranking-badge__body");
  const labelEl = createEl("span", "digital-employer-ranking-badge__label");
  appendText(labelEl, getEmployerRankingBadgeDisplayLabel(badge));
  const descEl = createEl("span", "digital-employer-ranking-badge__description");
  appendText(descEl, getEmployerRankingBadgeDescriptionText(badge));
  appendChildren(body, labelEl, descEl);
  appendChildren(root, iconWrap, body);

  return root;
}

function getDrawerSourceLinks(company: DrawerCompanyData): DrawerSourceLink[] {
  const links: DrawerSourceLink[] = [];
  const hhHref = safeUrl(company.hhCompanyUrl);
  if (hhHref) {
    links.push({
      href: hhHref,
      ariaLabel: "HeadHunter",
      iconSrc: DRAWER_SOURCE_ICONS.hh,
      iconClass: "digital-company-detail__source-icon--hh",
      analyticsId: "hh",
    });
  }
  const habrHref = safeUrl(company.habrUrl);
  if (habrHref) {
    links.push({
      href: habrHref,
      ariaLabel: "Habr Career",
      iconSrc: DRAWER_SOURCE_ICONS.habr,
      iconClass: "digital-company-detail__source-icon--habr",
      analyticsId: "habr",
    });
  }
  const linkedinHref = safeUrl(company.linkedinUrl);
  if (linkedinHref) {
    links.push({
      href: linkedinHref,
      ariaLabel: "LinkedIn",
      iconSrc: DRAWER_SOURCE_ICONS.linkedin,
      iconClass: "digital-company-detail__source-icon--linkedin",
      analyticsId: "linkedin",
    });
  }
  return links;
}

export function renderDigitalCompanyDetailContent(company: DrawerCompanyData): HTMLElement {
  const displayCompany = asDrawerDisplayCompany(company);
  const summaryChips = getDrawerSummaryChips(displayCompany);
  const hiringStatusValue = getDrawerHiringStatusValue(displayCompany);
  const showRemoteDeniedNote = company.signals.remoteExplicitlyDenied;
  const hiringMeta = buildDrawerHiringMeta(displayCompany);
  const showHiringSecondaryLine = Boolean(
    hiringMeta.sourceName || hiringMeta.checkedDate || hiringMeta.staleWarning,
  );
  const titleId = `digital-company-detail-title-${company.id}`;
  const careerHref = safeUrl(company.careerUrl?.trim());
  const hasCareerUrl = Boolean(careerHref);
  const sourceLinks = getDrawerSourceLinks(company);
  const showActions = hasCareerUrl || sourceLinks.length > 0;
  const hasSourceLinks = sourceLinks.length > 0;
  const headerMetaParts = getDrawerHeaderMetaParts(displayCompany);
  const awardItems = getDrawerAwards2025DisplayItems(displayCompany);

  const article = createEl("article", "digital-company-detail");
  const header = createEl("header", "digital-company-detail__header");

  const title = createEl("h2", "digital-company-detail__title", {
    id: titleId,
    "data-company-detail-title": "",
  });
  appendText(title, company.name);
  header.appendChild(title);

  if (headerMetaParts.length > 0) {
    const meta = createEl("p", "digital-company-detail__meta");
    appendText(meta, headerMetaParts.join(" · "));
    header.appendChild(meta);
  }

  if (summaryChips.length > 0) {
    const chipsWrap = createEl("div", "digital-company-detail__chips", {
      "aria-label": "Краткая сводка",
    });
    for (const chip of summaryChips) {
      const chipEl = createEl("span", [
        "digital-badge",
        "digital-company-detail__chip",
        chip.variantClass,
      ]);
      appendText(chipEl, chip.label);
      chipsWrap.appendChild(chipEl);
    }
    header.appendChild(chipsWrap);
  }

  if (showActions) {
    const actions = createEl("div", [
      "digital-company-detail__actions",
      ...(hasSourceLinks ? ["has-source-links"] : []),
    ]);

    if (hasCareerUrl && careerHref) {
      const careerLink = createAnalyticsLink(["digital-company-detail__primary-link"], careerHref, {
        ariaLabel: "Карьерная страница",
        title: "Карьерная страница",
        analyticsId: "career",
        company,
        children: [],
      });

      const fullLabel = createEl("span", [
        "digital-company-detail__primary-link-label",
        "digital-company-detail__primary-link-label--full",
      ]);
      appendText(fullLabel, "Карьерная страница");

      const shortLabel = createEl("span", [
        "digital-company-detail__primary-link-label",
        "digital-company-detail__primary-link-label--short",
      ], { "aria-hidden": "true" });
      appendText(shortLabel, "Карьера");

      appendChildren(careerLink, fullLabel, shortLabel, createExternalLinkIcon());
      actions.appendChild(careerLink);
    }

    if (hasSourceLinks) {
      const sourceWrap = createEl("div", "digital-company-detail__source-links");
      for (const link of sourceLinks) {
        const sourceLink = createAnalyticsLink(
          ["digital-company-detail__source-link"],
          link.href,
          {
            ariaLabel: link.ariaLabel,
            title: link.ariaLabel,
            analyticsId: link.analyticsId,
            company,
            children: [],
          },
        );
        const img = createEl("img", ["digital-company-detail__source-icon", link.iconClass], {
          src: link.iconSrc,
          alt: "",
          "aria-hidden": "true",
          width: "18",
          height: "18",
          loading: "lazy",
          decoding: "async",
        });
        sourceLink.appendChild(img);
        sourceWrap.appendChild(sourceLink);
      }
      actions.appendChild(sourceWrap);
    }

    header.appendChild(actions);
  }

  article.appendChild(header);

  const hiringSection = createEl("section", [
    "digital-company-detail__section",
    "digital-company-detail__section--first",
  ], { "aria-labelledby": `${company.id}-hiring` });
  const hiringHeading = createEl("h3", "digital-company-detail__heading", {
    id: `${company.id}-hiring`,
  });
  appendText(hiringHeading, "Статус найма");
  hiringSection.appendChild(hiringHeading);

  const hiringPrimaryLine = createEl("p", "digital-company-detail__line");
  const hiringPrimary = createEl("span", "digital-company-detail__primary");
  appendText(hiringPrimary, hiringStatusValue);
  hiringPrimaryLine.appendChild(hiringPrimary);
  hiringSection.appendChild(hiringPrimaryLine);

  const hiringMetaLine = createEl("p", [
    "digital-company-detail__meta-line",
    "digital-company-detail__meta-line--hiring-primary",
  ]);
  const vacanciesSpan = createEl("span");
  appendText(vacanciesSpan, hiringMeta.vacanciesLabel);
  hiringMetaLine.appendChild(vacanciesSpan);

  if (hiringMeta.hasDirectApply || hiringMeta.showItAccreditation) {
    const sep = createEl("span", "digital-company-detail__hiring-chip-separator", {
      "aria-hidden": "true",
    });
    appendText(sep, "·");
    hiringMetaLine.appendChild(sep);

    if (hiringMeta.hasDirectApply) {
      const directChip = createEl("span", [
        "digital-badge",
        "digital-tag--slate",
        "digital-company-detail__chip",
        "digital-company-detail__inline-signal",
      ]);
      appendText(directChip, "Прямой отклик");
      hiringMetaLine.appendChild(directChip);
    }

    if (hiringMeta.hasDirectApply && hiringMeta.showItAccreditation) {
      const sep2 = createEl("span", "digital-company-detail__hiring-chip-separator", {
        "aria-hidden": "true",
      });
      appendText(sep2, "·");
      hiringMetaLine.appendChild(sep2);
    }

    if (hiringMeta.showItAccreditation) {
      const accChip = createEl("span", [
        "digital-badge",
        "digital-tag--cyan",
        "digital-company-detail__chip",
        "digital-company-detail__inline-signal",
        "digital-company-detail__inline-signal--it-accreditation",
      ], {
        title: "Есть сигнал IT-аккредитации",
        "aria-label": "Есть сигнал IT-аккредитации",
      });
      appendText(accChip, "IT-аккредитация");
      hiringMetaLine.appendChild(accChip);
    }
  }

  hiringSection.appendChild(hiringMetaLine);

  if (showHiringSecondaryLine) {
    const secondary = createEl("p", [
      "digital-company-detail__meta-line",
      "digital-company-detail__meta-line--hiring-secondary",
    ]);
    if (hiringMeta.sourceName) {
      const sourceSpan = createEl("span");
      appendText(sourceSpan, `Источник: ${hiringMeta.sourceName}`);
      secondary.appendChild(sourceSpan);
    }
    if (hiringMeta.sourceName && hiringMeta.checkedDate) {
      const dot = createEl("span", undefined, { "aria-hidden": "true" });
      appendText(dot, " · ");
      secondary.appendChild(dot);
    }
    if (hiringMeta.checkedDate) {
      const checked = createEl("span", "digital-company-detail__checked-date");
      appendText(checked, `Проверено: ${hiringMeta.checkedDate}`);
      secondary.appendChild(checked);
    }
    if ((hiringMeta.sourceName || hiringMeta.checkedDate) && hiringMeta.staleWarning) {
      const dot2 = createEl("span", undefined, { "aria-hidden": "true" });
      appendText(dot2, " · ");
      secondary.appendChild(dot2);
    }
    if (hiringMeta.staleWarning) {
      const stale = createEl("span", "digital-stale-label");
      appendText(stale, hiringMeta.staleWarning);
      secondary.appendChild(stale);
    }
    hiringSection.appendChild(secondary);
  }

  article.appendChild(hiringSection);

  const formatSection = createEl("section", "digital-company-detail__section", {
    "aria-labelledby": `${company.id}-format`,
  });
  const formatHeading = createEl("h3", "digital-company-detail__heading", {
    id: `${company.id}-format`,
  });
  appendText(formatHeading, "Формат работы");
  formatSection.appendChild(formatHeading);

  const formatPrimary = createEl("p", "digital-company-detail__line");
  const formatValue = createEl("span", "digital-company-detail__primary");
  appendText(formatValue, company.workFormat);
  formatPrimary.appendChild(formatValue);
  formatSection.appendChild(formatPrimary);

  const geoLine = createEl("p", [
    "digital-company-detail__line",
    "digital-company-detail__line--muted",
  ]);
  appendText(geoLine, `География найма: ${company.hiringGeo}`);
  formatSection.appendChild(geoLine);

  if (showRemoteDeniedNote) {
    const remoteDenied = createEl("p", [
      "digital-company-detail__line",
      "digital-company-detail__line--muted",
    ]);
    appendText(remoteDenied, "Удалёнка не рассматривается");
    formatSection.appendChild(remoteDenied);
  }

  if (shouldShowDrawerInternationalLine(displayCompany)) {
    const intlLine = createEl("p", [
      "digital-company-detail__line",
      "digital-company-detail__line--muted",
    ]);
    appendText(intlLine, formatDrawerInternationalLine(displayCompany));
    formatSection.appendChild(intlLine);
  }

  article.appendChild(formatSection);

  const ratingsSection = createEl("section", "digital-company-detail__section", {
    "aria-labelledby": `${company.id}-ratings`,
  });
  const ratingsHeading = createEl("h3", "digital-company-detail__heading", {
    id: `${company.id}-ratings`,
  });
  appendText(ratingsHeading, "HR-рейтинги");
  ratingsSection.appendChild(ratingsHeading);
  ratingsSection.appendChild(createRatingsBlock(company));

  if (company.employerRankingBadges.length > 0) {
    const rankings = createEl("div", "digital-employer-rankings", {
      "aria-label": "Рейтинги работодателей",
    });
    for (const badge of company.employerRankingBadges) {
      rankings.appendChild(createEmployerRankingBadge(badge));
    }
    ratingsSection.appendChild(rankings);
  }

  article.appendChild(ratingsSection);

  if (awardItems.length > 0) {
    const awardsSection = createEl("section", "digital-company-detail__section", {
      "aria-labelledby": `${company.id}-awards`,
    });
    const awardsHeading = createEl("h3", "digital-company-detail__heading", {
      id: `${company.id}-awards`,
    });
    appendText(awardsHeading, "Награды / внешние рейтинги");
    awardsSection.appendChild(awardsHeading);

    const list = createEl("ul", "digital-company-detail__awards-list", {
      "data-company-detail-awards-list": "",
    });
    awardItems.forEach((item, index) => {
      const li = createEl("li", [
        "digital-company-detail__awards-item",
        ...(index >= DRAWER_AWARDS_VISIBLE_COUNT
          ? ["digital-company-detail__awards-item--extra"]
          : []),
      ]);
      if (index >= DRAWER_AWARDS_VISIBLE_COUNT) {
        li.setAttribute("data-award-extra", "true");
      }
      appendText(li, item);
      list.appendChild(li);
    });
    awardsSection.appendChild(list);

    if (awardItems.length > DRAWER_AWARDS_VISIBLE_COUNT) {
      const extraCount = awardItems.length - DRAWER_AWARDS_VISIBLE_COUNT;
      const toggle = createEl("button", "digital-company-detail__awards-toggle", {
        type: "button",
        "data-company-detail-awards-toggle": "",
        "data-awards-collapsed-label": `Показать ещё ${extraCount}`,
        "data-awards-expanded-label": "Скрыть",
        "aria-expanded": "false",
      });
      appendText(toggle, `Показать ещё ${extraCount}`);
      awardsSection.appendChild(toggle);
    }

    article.appendChild(awardsSection);
  }

  const disclaimer = createEl("p", "digital-company-detail__disclaimer");
  appendText(
    disclaimer,
    "Данные собраны из открытых источников и нормализованы вручную. Карта не является официальным рейтингом работодателей.",
  );
  article.appendChild(disclaimer);

  return article;
}
