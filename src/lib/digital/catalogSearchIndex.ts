import type { CompanyPublic } from "../../types/digital";
import { getCatalogSearchVariants } from "./searchNormalize";

export const PLATFORM_DOMAIN_DENYLIST = ["hh.ru", "career.habr.com", "linkedin.com"] as const;

const HIRING_SUBDOMAINS = new Set([
  "career",
  "careers",
  "jobs",
  "job",
  "hr",
  "team",
  "work",
  "vacancy",
  "vacancies",
]);

function normalizeHost(hostname: string): string {
  return hostname.trim().toLowerCase().replace(/^www\./, "");
}

export function isDeniedPlatformDomain(hostname: string): boolean {
  const host = normalizeHost(hostname);
  return PLATFORM_DOMAIN_DENYLIST.some((domain) => host === domain || host.endsWith(`.${domain}`));
}

function parseDomainFromUrl(rawUrl: string | null): string | null {
  if (!rawUrl) return null;
  try {
    return normalizeHost(new URL(rawUrl).hostname);
  } catch {
    return null;
  }
}

function isHostLikeTerm(value: string): boolean {
  return /^[a-z0-9-]+(\.[a-z0-9-]+)+$/i.test(value.trim());
}

function maybeBaseDomain(host: string): string | null {
  const parts = host.split(".");
  if (parts.length < 3) return null;
  if (!HIRING_SUBDOMAINS.has(parts[0] ?? "")) return null;
  return parts.slice(1).join(".");
}

export function extractOwnCompanySearchDomains(company: CompanyPublic): string[] {
  const domains = new Set<string>();
  const candidates = [parseDomainFromUrl(company.websiteUrl), parseDomainFromUrl(company.careerUrl)];

  for (const host of candidates) {
    if (!host || isDeniedPlatformDomain(host)) continue;
    domains.add(host);
    const base = maybeBaseDomain(host);
    if (base && !isDeniedPlatformDomain(base)) {
      domains.add(base);
    }
  }

  return [...domains];
}

export function buildCatalogSearchText(company: CompanyPublic): string {
  const values = [
    company.name,
    company.slug,
    ...(company.searchAliases ?? []),
    company.city,
    company.companyType,
    company.niche,
    ...extractOwnCompanySearchDomains(company),
  ];

  const tokens = new Set<string>();
  for (const value of values) {
    const raw = String(value ?? "").trim();
    if (!raw) continue;
    if (isHostLikeTerm(raw) && isDeniedPlatformDomain(raw)) continue;

    for (const variant of getCatalogSearchVariants(value ?? "")) {
      tokens.add(variant);
    }
  }

  return [...tokens].join(" ");
}
