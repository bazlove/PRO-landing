export type DigitalAnalyticsPayload = Record<
  string,
  string | number | boolean | null | undefined
>;

const DIGITAL_EVENT_PREFIX = "digital_";
const MAX_STRING_PAYLOAD_LENGTH = 120;
const YANDEX_METRICA_ID = 109083928;

declare global {
  interface Window {
    ym?: YmFunction;
    gtag?: GtagFunction;
  }
}

type YmFunction = ((...args: unknown[]) => void) & { a?: unknown[][] };
type GtagFunction = (...args: unknown[]) => void;

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function shouldLogDev(): boolean {
  try {
    return import.meta.env.DEV;
  } catch {
    return false;
  }
}

function resolveEventName(eventName: string): string {
  if (eventName.startsWith(DIGITAL_EVENT_PREFIX)) return eventName;
  return `${DIGITAL_EVENT_PREFIX}${eventName}`;
}

function sanitizePayload(
  payload?: DigitalAnalyticsPayload,
): Record<string, string | number | boolean> {
  if (!payload) return {};

  const out: Record<string, string | number | boolean> = {};

  for (const [key, value] of Object.entries(payload)) {
    if (value === null || value === undefined) continue;

    if (typeof value === "boolean" || typeof value === "number") {
      out[key] = value;
      continue;
    }

    if (typeof value === "string") {
      out[key] = value.length > MAX_STRING_PAYLOAD_LENGTH
        ? value.slice(0, MAX_STRING_PAYLOAD_LENGTH)
        : value;
    }
  }

  return out;
}

function sendToYandexMetrica(
  eventName: string,
  params: Record<string, string | number | boolean>,
): void {
  const ym = window.ym;
  if (typeof ym !== "function") return;

  ym(YANDEX_METRICA_ID, "reachGoal", eventName, params);
}

function sendToGoogleAnalytics(eventName: string, params: Record<string, string | number | boolean>): void {
  const gtag = window.gtag;
  if (typeof gtag !== "function") return;
  gtag("event", eventName, params);
}

/**
 * Provider-agnostic analytics for the /digital page.
 * Safe no-op during SSR, when no provider is installed, or when tracking throws.
 */
export function trackDigitalEvent(
  eventName: string,
  payload?: DigitalAnalyticsPayload,
): void {
  if (!isBrowser()) return;

  try {
    const fullName = resolveEventName(eventName);
    const params = sanitizePayload(payload);

    sendToYandexMetrica(fullName, params);
    sendToGoogleAnalytics(fullName, params);

    if (shouldLogDev()) {
      console.debug("[digital analytics]", fullName, params);
    }
  } catch {
    // Never block UX on analytics failures.
  }
}
