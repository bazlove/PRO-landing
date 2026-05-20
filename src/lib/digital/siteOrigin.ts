/** Local/dev placeholder only — production builds must override via `PUBLIC_SITE_URL`. */
export const DIGITAL_PLACEHOLDER_SITE = "https://example.com";

export function resolveCanonicalOrigin(site: URL | string | undefined): string {
  const origin = site?.toString().replace(/\/$/, "") ?? "";

  if (import.meta.env.PROD) {
    if (!origin || origin === DIGITAL_PLACEHOLDER_SITE) {
      throw new Error(
        "Production build requires a real Astro `site` origin. Set PUBLIC_SITE_URL " +
          "(see .env.example) before `npm run build`.",
      );
    }
    return origin;
  }

  return origin || DIGITAL_PLACEHOLDER_SITE;
}
