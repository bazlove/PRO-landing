const LEAD_CARD_SELECTOR = "[data-digital-hero-lead]";
const TOGGLE_SELECTOR = "[data-digital-hero-lead-toggle]";

const LABEL_EXPANDED = "Свернуть ↑";
const LABEL_COLLAPSED = "Показать подробнее ↓";

export function initDigitalHeroLeadToggle(): void {
  document.documentElement.classList.add("js");

  const leadCard = document.querySelector<HTMLElement>(LEAD_CARD_SELECTOR);
  const toggle = document.querySelector<HTMLButtonElement>(TOGGLE_SELECTOR);
  if (!leadCard || !toggle) return;

  const card = leadCard;
  const button = toggle;

  const more = document.getElementById(button.getAttribute("aria-controls") ?? "");
  if (!more) return;

  const mobileQuery = window.matchMedia("(max-width: 640px)");

  function syncForViewport(): void {
    if (!mobileQuery.matches) {
      card.classList.remove("is-expanded");
      button.setAttribute("aria-expanded", "false");
      button.textContent = LABEL_COLLAPSED;
      return;
    }

    const isExpanded = card.classList.contains("is-expanded");
    button.setAttribute("aria-expanded", String(isExpanded));
    button.textContent = isExpanded ? LABEL_EXPANDED : LABEL_COLLAPSED;
  }

  button.addEventListener("click", () => {
    if (!mobileQuery.matches) return;

    const isExpanded = card.classList.toggle("is-expanded");
    button.setAttribute("aria-expanded", String(isExpanded));
    button.textContent = isExpanded ? LABEL_EXPANDED : LABEL_COLLAPSED;
  });

  mobileQuery.addEventListener("change", syncForViewport);
  syncForViewport();
}
