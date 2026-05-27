export type EmployerRankingBadgeSource = "hh" | "habr";

export type EmployerRankingBadge = {
  source: EmployerRankingBadgeSource;
  label: string;
  description: string;
  year: number | null;
  sourceUrl: string | null;
};

export type CompanyHiringSource = "HH" | "Habr" | "Career site" | "Mixed" | null;

export type CompanyDataFreshness = "fresh" | "stale" | "unknown";

export type CompanyPreset =
  | "Активный найм"
  | "Удалёнка"
  | "Высокая HR-оценка"
  | "Награды 2025"
  | "Международные";

export type ItAccreditationStatus =
  | "confirmed_official"
  | "confirmed_open_registry_mention"
  | "hh_accreditation_signal"
  | "manual_check_required"
  | "not_confirmed"
  | "not_applicable_foreign_entity";

export type CompanyItAccreditation = {
  status: ItAccreditationStatus;
  checkedAt: string | null;
  sourceUrl: string | null;
};

export type CompanySignals = {
  hasDirectApply: boolean;
  hasCareerPage: boolean;
  hiringSource: CompanyHiringSource;
  dataFreshness: CompanyDataFreshness;
  remoteExplicitlyDenied: boolean;
};

export type CompanyPublic = {
  id: string;
  slug: string;
  name: string;
  city: string;
  companyType: string;
  niche: string;
  size: string | null;
  careerUrl: string;

  vacanciesRange: "10+" | "5–10" | "1–4" | "0" | "Не проверено";
  vacanciesWeight: number;

  hiringStatus: "Активный" | "Точечный" | "На паузе" | "Неясно" | "Не проверено";
  workFormat: "Удалёнка" | "Гибрид" | "Офис" | "Смешанный" | "Не указано";
  hiringGeo: string;
  international: "Да" | "Нет" | "Частично" | "Неясно";

  hhRatingDisplay: string;
  hhRatingValue: number | null;

  habrRatingDisplay: string;
  habrRatingValue: number | null;

  awards2025: string | null;
  hasAwards2025: boolean;

  presets: CompanyPreset[];
  signals: CompanySignals;

  hasActiveHiring: boolean;
  hasRemote: boolean;
  hasHighHrRating: boolean;

  lastCheckedAt: string;
  hhVacanciesCheckedAt: string | null;
  websiteUrl: string | null;
  hhCompanyUrl: string | null;
  habrUrl: string | null;
  linkedinUrl: string | null;

  employerRankingBadges: EmployerRankingBadge[];

  itAccreditation?: CompanyItAccreditation | null;

  publicStatus: "public";
};
