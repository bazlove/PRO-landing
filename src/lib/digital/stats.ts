import type { CompanyPublic } from "../../types/digital";

const FLEXIBLE_WORK_FORMATS: CompanyPublic["workFormat"][] = [
  "Удалёнка",
  "Гибрид",
  "Смешанный",
];

export type DigitalPageStats = {
  totalCompanies: number;
  activeHiringCompanies: number;
  remoteHybridDistributedCompanies: number;
  highHrRatingCompanies: number;
  awards2025Companies: number;
  latestUpdateDateIso: string | null;
};

/**
 * Aggregates proof-block metrics from the public company list.
 * Remote/hybrid/distributed: work formats that typically include remote or hybrid work.
 */
export function getDigitalPageStats(companies: CompanyPublic[]): DigitalPageStats {
  const totalCompanies = companies.length;

  const activeHiringCompanies = companies.filter((c) => c.hasActiveHiring).length;

  const remoteHybridDistributedCompanies = companies.filter((c) =>
    FLEXIBLE_WORK_FORMATS.includes(c.workFormat),
  ).length;

  const highHrRatingCompanies = companies.filter((c) => c.hasHighHrRating).length;

  const awards2025Companies = companies.filter((c) => c.hasAwards2025).length;

  const parsed = companies
    .map((c) => {
      const ms = Date.parse(c.lastCheckedAt);
      return Number.isNaN(ms) ? null : { iso: c.lastCheckedAt, ms };
    })
    .filter((x): x is { iso: string; ms: number } => x !== null);

  const latest = parsed.length ? parsed.reduce((a, b) => (b.ms > a.ms ? b : a)) : null;

  return {
    totalCompanies,
    activeHiringCompanies,
    remoteHybridDistributedCompanies,
    highHrRatingCompanies,
    awards2025Companies,
    latestUpdateDateIso: latest?.iso ?? null,
  };
}
