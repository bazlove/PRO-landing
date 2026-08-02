export type SemanticLabelId =
  | "active_hiring"
  | "remote"
  | "moscow"
  | "comparison"
  | "product_studio"
  | "b2b"
  | "backend"
  | "international"
  | "direct_application"
  | "it_accredited"
  | "tag_overflow"
  | "verified"
  | "stale"
  | "conflicting"
  | "insufficient_data"
  | "unchecked"
  | "employer_claim"
  | "external_source"
  | "platform_analysis"
  | "user_generated"
  | "premium"
  | "beta"
  | "coming_soon"
  | "unavailable";

export type SemanticLabelFamily = "chip" | "tag" | "badge";
export type SemanticLabelIcon = "check" | "refresh" | "alert" | "diamond" | "spark";

export interface SemanticLabelDefinition {
  family: SemanticLabelFamily;
  variant: string;
  label: string;
  icon?: SemanticLabelIcon;
  interactive: boolean;
}

export const semanticLabels: Record<SemanticLabelId, SemanticLabelDefinition> = {
  active_hiring: { family: "chip", variant: "default", label: "Активный найм", interactive: true },
  remote: { family: "chip", variant: "default", label: "Удалённо", interactive: true },
  moscow: { family: "chip", variant: "removable", label: "Москва", interactive: true },
  comparison: { family: "chip", variant: "selected", label: "В сравнении", icon: "check", interactive: true },
  product_studio: { family: "tag", variant: "neutral", label: "Product studio", interactive: false },
  b2b: { family: "tag", variant: "neutral", label: "B2B", interactive: false },
  backend: { family: "tag", variant: "neutral", label: "Backend", interactive: false },
  international: { family: "tag", variant: "neutral", label: "Международная", interactive: false },
  direct_application: { family: "tag", variant: "feature", label: "Прямой отклик", interactive: false },
  it_accredited: { family: "tag", variant: "verified", label: "IT-аккредитация", interactive: false },
  tag_overflow: { family: "tag", variant: "overflow", label: "+3", interactive: false },
  verified: { family: "badge", variant: "verified", label: "Проверено", icon: "check", interactive: false },
  stale: { family: "badge", variant: "stale", label: "Требует перепроверки", icon: "refresh", interactive: false },
  conflicting: { family: "badge", variant: "conflict", label: "Источники расходятся", icon: "alert", interactive: false },
  insufficient_data: { family: "badge", variant: "unknown", label: "Данных недостаточно", interactive: false },
  unchecked: { family: "badge", variant: "unknown", label: "Не проверено", interactive: false },
  employer_claim: { family: "badge", variant: "employer-claim", label: "По данным компании", interactive: false },
  external_source: { family: "badge", variant: "external-source", label: "Внешний источник", interactive: false },
  platform_analysis: { family: "badge", variant: "platform-analysis", label: "Аналитика платформы", icon: "spark", interactive: false },
  user_generated: { family: "badge", variant: "user-generated", label: "Пользовательский отзыв", interactive: false },
  premium: { family: "badge", variant: "premium", label: "Premium", icon: "diamond", interactive: false },
  beta: { family: "badge", variant: "beta", label: "Beta", interactive: false },
  coming_soon: { family: "badge", variant: "lifecycle", label: "Скоро", interactive: false },
  unavailable: { family: "badge", variant: "unavailable", label: "Недоступно", interactive: false },
};
