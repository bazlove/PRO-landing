import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { CompanyPublic } from "../../types/digital";
import { showsPublicItAccreditationChip } from "./itAccreditationPublic.ts";
import { normalizeItAccreditation } from "./normalizeCompany.ts";

function baseCompany(
  overrides: Partial<CompanyPublic> & Pick<CompanyPublic, "id" | "name" | "slug" | "careerUrl">,
): CompanyPublic {
  const { id, slug, name, careerUrl, signals: signalOverrides, ...rest } = overrides;

  return {
    id,
    slug,
    name,
    city: "Москва",
    companyType: "Digital",
    niche: "QA",
    size: "51–200",
    careerUrl,
    vacanciesRange: "5–10",
    vacanciesWeight: 2,
    hiringStatus: "Активный",
    workFormat: "Гибрид",
    hiringGeo: "РФ",
    international: "Нет",
    hhRatingDisplay: "4,5",
    hhRatingValue: 4.5,
    habrRatingDisplay: "—",
    habrRatingValue: null,
    awards2025: null,
    hasAwards2025: false,
    presets: ["Активный найм"],
    signals: {
      hasDirectApply: false,
      hasCareerPage: true,
      hiringSource: "HH",
      dataFreshness: "fresh",
      remoteExplicitlyDenied: false,
      ...signalOverrides,
    },
    hasActiveHiring: true,
    hasRemote: true,
    hasHighHrRating: false,
    lastCheckedAt: "2026-05-19",
    hhVacanciesCheckedAt: "2026-05-19",
    websiteUrl: null,
    hhCompanyUrl: null,
    habrUrl: null,
    linkedinUrl: null,
    employerRankingBadges: [],
    publicStatus: "public",
    ...rest,
  };
}

describe("normalizeItAccreditation", () => {
  it("maps snake_case workbook fields to camelCase object", () => {
    const result = normalizeItAccreditation({
      it_accreditation_status: "confirmed_official",
      it_accreditation_checked_at: "2026-05-19",
      it_accreditation_source_url: "https://example.com/registry",
    });

    assert.deepEqual(result, {
      status: "confirmed_official",
      checkedAt: "2026-05-19",
      sourceUrl: "https://example.com/registry",
    });
  });

  it("returns null for missing or invalid status", () => {
    assert.equal(normalizeItAccreditation({}), null);
    assert.equal(
      normalizeItAccreditation({ it_accreditation_status: "hh_accreditation_signal" })?.status,
      "hh_accreditation_signal",
    );
    assert.equal(normalizeItAccreditation({ it_accreditation_status: "invalid" }), null);
  });
});

describe("showsPublicItAccreditationChip", () => {
  it("shows only confirmed public statuses", () => {
    assert.equal(
      showsPublicItAccreditationChip(
        baseCompany({
          id: "1",
          slug: "a",
          name: "A",
          careerUrl: "https://example.com/a",
          itAccreditation: {
            status: "confirmed_official",
            checkedAt: null,
            sourceUrl: null,
          },
        }),
      ),
      true,
    );
    assert.equal(
      showsPublicItAccreditationChip(
        baseCompany({
          id: "2",
          slug: "b",
          name: "B",
          careerUrl: "https://example.com/b",
          itAccreditation: {
            status: "hh_accreditation_signal",
            checkedAt: null,
            sourceUrl: null,
          },
        }),
      ),
      false,
    );
  });
});

function hiringInlineSignals(company: CompanyPublic): {
  hasDirectApply: boolean;
  showItAccreditation: boolean;
} {
  return {
    hasDirectApply: company.signals.hasDirectApply,
    showItAccreditation: showsPublicItAccreditationChip(company),
  };
}

describe("drawer hiring inline chips regression", () => {
  it("confirmed_official + direct apply", () => {
    const meta = hiringInlineSignals(
      baseCompany({
        id: "1",
        slug: "a",
        name: "A",
        careerUrl: "https://example.com/a",
        signals: {
          hasDirectApply: true,
          hasCareerPage: true,
          hiringSource: "HH",
          dataFreshness: "fresh",
          remoteExplicitlyDenied: false,
        },
        itAccreditation: {
          status: "confirmed_official",
          checkedAt: "2026-05-19",
          sourceUrl: "https://example.com/registry",
        },
      }),
    );

    assert.equal(meta.hasDirectApply, true);
    assert.equal(meta.showItAccreditation, true);
  });

  it("confirmed_open_registry_mention without direct apply", () => {
    const meta = hiringInlineSignals(
      baseCompany({
        id: "2",
        slug: "b",
        name: "B",
        careerUrl: "https://example.com/b",
        itAccreditation: {
          status: "confirmed_open_registry_mention",
          checkedAt: null,
          sourceUrl: null,
        },
      }),
    );

    assert.equal(meta.hasDirectApply, false);
    assert.equal(meta.showItAccreditation, true);
  });

  it("hh signal only shows direct apply chip", () => {
    const meta = hiringInlineSignals(
      baseCompany({
        id: "3",
        slug: "c",
        name: "C",
        careerUrl: "https://example.com/c",
        signals: {
          hasDirectApply: true,
          hasCareerPage: true,
          hiringSource: "HH",
          dataFreshness: "fresh",
          remoteExplicitlyDenied: false,
        },
        itAccreditation: {
          status: "hh_accreditation_signal",
          checkedAt: null,
          sourceUrl: null,
        },
      }),
    );

    assert.equal(meta.hasDirectApply, true);
    assert.equal(meta.showItAccreditation, false);
  });

  it("missing accreditation shows no chips", () => {
    const meta = hiringInlineSignals(
      baseCompany({
        id: "4",
        slug: "d",
        name: "D",
        careerUrl: "https://example.com/d",
      }),
    );

    assert.equal(meta.hasDirectApply, false);
    assert.equal(meta.showItAccreditation, false);
  });
});
