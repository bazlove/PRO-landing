const COUNTER_SELECTOR = "[data-counter]";

function formatCounterValue(value: number): string {
  return new Intl.NumberFormat("ru-RU").format(value);
}

function animateCounter(element: HTMLElement): void {
  if (element.dataset.counterAnimated === "true") return;

  const target = Number(element.dataset.counterValue);
  if (!Number.isFinite(target)) return;

  element.dataset.counterAnimated = "true";

  const duration = Number(element.dataset.counterDuration || 900);
  const start = performance.now();

  element.textContent = formatCounterValue(0);

  function tick(now: number): void {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const value = Math.round(target * eased);

    element.textContent = formatCounterValue(value);

    if (progress < 1) {
      requestAnimationFrame(tick);
    } else {
      element.textContent = formatCounterValue(target);
    }
  }

  requestAnimationFrame(tick);
}

function runHeroSummaryCounters(): void {
  const counters = document.querySelectorAll<HTMLElement>(COUNTER_SELECTOR);
  if (!counters.length) return;

  counters.forEach((counter, index) => {
    window.setTimeout(() => animateCounter(counter), index * 80);
  });
}

export function initDigitalHeroSummaryCounters(): void {
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (prefersReducedMotion) return;

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", runHeroSummaryCounters, { once: true });
    return;
  }

  runHeroSummaryCounters();
}
