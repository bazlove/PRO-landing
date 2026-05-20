import { defineConfig } from "astro/config";

const PLACEHOLDER_SITE = "https://example.com";
const configuredSite = process.env.PUBLIC_SITE_URL || process.env.SITE_URL;
const isBuild = process.argv.includes("build");

if (isBuild && (!configuredSite || configuredSite === PLACEHOLDER_SITE)) {
  throw new Error(
    "[digital-map] Production build requires PUBLIC_SITE_URL (or SITE_URL) set to your real origin.\n" +
      "Example: PUBLIC_SITE_URL=https://yourdomain.ru npm run build\n" +
      "See .env.example — do not ship canonical URLs with example.com.",
  );
}

const site = configuredSite || PLACEHOLDER_SITE;

// https://astro.build/config
export default defineConfig({
  site,
  compressHTML: true,
});
