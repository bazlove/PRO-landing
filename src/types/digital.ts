export type EmployerRankingBadgeSource = "hh" | "habr";

export type EmployerRankingBadge = {
  source: EmployerRankingBadgeSource;
  label: string;
  description: string;
  year: number | null;
  sourceUrl: string | null;
};

export type CompanyPublic = {
  id: string;
  slug: string;
  name: string;
  city: string;
  companyType: string;
  niche: string;
  size: string;
  careerUrl: string;

  vacanciesRange: "10+" | "5–10" | "1–4" | "0" | "Не проверено";
  vacanciesWeight: number;

  hiringStatus: "Активный" | "Точечный" | "На паузе" | "Неясно";
  workFormat: "Удалёнка" | "Гибрид" | "Офис" | "Смешанный" | "Не указано";
  hiringGeo: string;
  international: "Да" | "Нет" | "Частично" | "Неясно";

  hhRatingDisplay: string;
  hhRatingValue: number | null;

  habrRatingDisplay: string;
  habrRatingValue: number | null;

  awards2025: string | null;
  hasAwards2025: boolean;

  presets: string[];

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

  publicStatus: "public";
};
