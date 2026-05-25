/**
 * Re-normalize `src/data/digital/companies.json` and write explicit public fields
 * (including source URLs and `historicalEmployerAwards` as string | null on every row).
 *
 * Reads `historicalEmployerAwards` or `historical_employer_awards` from input rows;
 * never writes snake_case `historical_employer_awards` to output.
 *
 * Usage: npm run data:sync-companies
 */
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { buildPublicCompaniesFromRows } from "../src/lib/digital/buildPublicCompaniesJson.ts";
import { compareCompaniesByDefaultOrder } from "../src/lib/digital/normalizeCompany.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const jsonPath = join(root, "src/data/digital/companies.json");

console.warn(
  "[digital] public_fit_status eligibility is enforced during XLSX export, not JSON re-sync.",
);

const raw = JSON.parse(readFileSync(jsonPath, "utf8"));
if (!Array.isArray(raw)) {
  throw new Error("[digital] companies.json must be a JSON array.");
}

const { companies, report } = buildPublicCompaniesFromRows(raw, {
  enforceUniqueCompanyIds: true,
  normalizeOptions: {
    fromExistingPublicJson: true,
    allowSourceUrlInference: false,
  },
});

companies.sort(compareCompaniesByDefaultOrder);

writeFileSync(jsonPath, `${JSON.stringify(companies, null, 2)}\n`, "utf8");

console.log(
  `[digital] Wrote ${report.normalizedCount} companies to src/data/digital/companies.json` +
    (report.skippedCount > 0 ? ` (${report.skippedCount} skipped)` : ""),
);

if (report.warnings.length > 0) {
  console.warn(`[digital] ${report.warnings.length} warning(s) during sync.`);
}

const withWebsite = companies.filter((c) => c.websiteUrl).length;
const withHh = companies.filter((c) => c.hhCompanyUrl).length;
const withHabr = companies.filter((c) => c.habrUrl).length;
const withLinkedin = companies.filter((c) => c.linkedinUrl).length;

console.log(
  `[digital] Source URLs: website=${withWebsite}, hh=${withHh}, habr=${withHabr}, linkedin=${withLinkedin}`,
);

const withHistoricalAwards = companies.filter((c) => c.historicalEmployerAwards).length;
console.log(`[digital] historicalEmployerAwards: ${withHistoricalAwards} non-null`);

console.log("[digital] Next: npm run data:validate-companies");
