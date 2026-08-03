import type { ProductIconCategory } from "./types";

export interface ProductIconDefinition {
  sourceName: string;
  sourceKebabName: string;
  category: ProductIconCategory;
  description: string;
  defaultWeight: "regular";
  selectedWeight?: "fill";
  status: "approved" | "restricted" | "deprecated";
}

export const productIcons = {
  search: { sourceName: "MagnifyingGlass", sourceKebabName: "magnifying-glass", category: "actions", description: "Поиск", defaultWeight: "regular", status: "approved" },
  filter: { sourceName: "Funnel", sourceKebabName: "funnel", category: "actions", description: "Фильтры", defaultWeight: "regular", status: "approved" },
  close: { sourceName: "X", sourceKebabName: "x", category: "actions", description: "Закрыть", defaultWeight: "regular", status: "approved" },
  confirm: { sourceName: "Check", sourceKebabName: "check", category: "actions", description: "Подтвердить", defaultWeight: "regular", status: "approved" },
  add: { sourceName: "Plus", sourceKebabName: "plus", category: "actions", description: "Добавить", defaultWeight: "regular", status: "approved" },
  remove: { sourceName: "Minus", sourceKebabName: "minus", category: "actions", description: "Убрать", defaultWeight: "regular", status: "approved" },
  edit: { sourceName: "PencilSimple", sourceKebabName: "pencil-simple", category: "actions", description: "Редактировать", defaultWeight: "regular", status: "approved" },
  delete: { sourceName: "Trash", sourceKebabName: "trash", category: "actions", description: "Удалить", defaultWeight: "regular", status: "approved" },
  copy: { sourceName: "Copy", sourceKebabName: "copy", category: "actions", description: "Копировать", defaultWeight: "regular", status: "approved" },
  share: { sourceName: "ShareNetwork", sourceKebabName: "share-network", category: "actions", description: "Поделиться", defaultWeight: "regular", status: "approved" },
  "external-link": { sourceName: "ArrowSquareOut", sourceKebabName: "arrow-square-out", category: "actions", description: "Внешняя ссылка", defaultWeight: "regular", status: "approved" },
  "chevron-down": { sourceName: "CaretDown", sourceKebabName: "caret-down", category: "navigation", description: "Раскрыть", defaultWeight: "regular", status: "approved" },
  "chevron-up": { sourceName: "CaretUp", sourceKebabName: "caret-up", category: "navigation", description: "Свернуть", defaultWeight: "regular", status: "approved" },
  "chevron-left": { sourceName: "CaretLeft", sourceKebabName: "caret-left", category: "navigation", description: "Предыдущий", defaultWeight: "regular", status: "approved" },
  "chevron-right": { sourceName: "CaretRight", sourceKebabName: "caret-right", category: "navigation", description: "Следующий", defaultWeight: "regular", status: "approved" },
  back: { sourceName: "ArrowLeft", sourceKebabName: "arrow-left", category: "navigation", description: "Назад", defaultWeight: "regular", status: "approved" },
  forward: { sourceName: "ArrowRight", sourceKebabName: "arrow-right", category: "navigation", description: "Вперёд", defaultWeight: "regular", status: "approved" },
  home: { sourceName: "House", sourceKebabName: "house", category: "navigation", description: "Главная", defaultWeight: "regular", status: "approved" },
  menu: { sourceName: "List", sourceKebabName: "list", category: "navigation", description: "Меню", defaultWeight: "regular", status: "approved" },
  "grid-view": { sourceName: "SquaresFour", sourceKebabName: "squares-four", category: "navigation", description: "Карточки", defaultWeight: "regular", status: "approved" },
  "list-view": { sourceName: "ListBullets", sourceKebabName: "list-bullets", category: "navigation", description: "Список", defaultWeight: "regular", status: "approved" },
  favorite: { sourceName: "Heart", sourceKebabName: "heart", category: "catalog", description: "Избранное", defaultWeight: "regular", selectedWeight: "fill", status: "approved" },
  bookmark: { sourceName: "BookmarkSimple", sourceKebabName: "bookmark-simple", category: "catalog", description: "Сохранить", defaultWeight: "regular", selectedWeight: "fill", status: "approved" },
  "rating-star": { sourceName: "Star", sourceKebabName: "star", category: "catalog", description: "Выбранная оценка", defaultWeight: "regular", selectedWeight: "fill", status: "approved" },
  compare: { sourceName: "ArrowsLeftRight", sourceKebabName: "arrows-left-right", category: "catalog", description: "Сравнение", defaultWeight: "regular", status: "approved" },
  company: { sourceName: "Buildings", sourceKebabName: "buildings", category: "company", description: "Компания", defaultWeight: "regular", status: "approved" },
  vacancy: { sourceName: "Briefcase", sourceKebabName: "briefcase", category: "company", description: "Вакансии", defaultWeight: "regular", status: "approved" },
  location: { sourceName: "MapPin", sourceKebabName: "map-pin", category: "company", description: "География", defaultWeight: "regular", status: "approved" },
  world: { sourceName: "Globe", sourceKebabName: "globe", category: "company", description: "Международность", defaultWeight: "regular", status: "approved" },
  people: { sourceName: "Users", sourceKebabName: "users", category: "company", description: "Команда", defaultWeight: "regular", status: "approved" },
  link: { sourceName: "Link", sourceKebabName: "link", category: "company", description: "Ссылка", defaultWeight: "regular", status: "approved" },
  profile: { sourceName: "IdentificationCard", sourceKebabName: "identification-card", category: "company", description: "Профиль", defaultWeight: "regular", status: "approved" },
  verified: { sourceName: "CheckCircle", sourceKebabName: "check-circle", category: "trust", description: "Проверено", defaultWeight: "regular", status: "approved" },
  stale: { sourceName: "Clock", sourceKebabName: "clock", category: "trust", description: "Требует обновления", defaultWeight: "regular", status: "approved" },
  refresh: { sourceName: "ArrowsClockwise", sourceKebabName: "arrows-clockwise", category: "trust", description: "Обновить", defaultWeight: "regular", status: "approved" },
  conflict: { sourceName: "Warning", sourceKebabName: "warning", category: "trust", description: "Источники расходятся", defaultWeight: "regular", status: "approved" },
  information: { sourceName: "Info", sourceKebabName: "info", category: "trust", description: "Пояснение", defaultWeight: "regular", status: "approved" },
  unknown: { sourceName: "Question", sourceKebabName: "question", category: "trust", description: "Неизвестно", defaultWeight: "regular", status: "approved" },
  source: { sourceName: "FileText", sourceKebabName: "file-text", category: "trust", description: "Источник", defaultWeight: "regular", status: "approved" },
  methodology: { sourceName: "BookOpen", sourceKebabName: "book-open", category: "trust", description: "Методология", defaultWeight: "regular", status: "approved" },
  protected: { sourceName: "ShieldCheck", sourceKebabName: "shield-check", category: "trust", description: "Защищённый статус", defaultWeight: "regular", status: "approved" },
  certified: { sourceName: "SealCheck", sourceKebabName: "seal-check", category: "trust", description: "Подтверждение или аккредитация", defaultWeight: "regular", status: "approved" },
  "employer-claim": { sourceName: "Buildings", sourceKebabName: "buildings", category: "trust", description: "Данные компании", defaultWeight: "regular", status: "approved" },
  "platform-analysis": { sourceName: "ChartBar", sourceKebabName: "chart-bar", category: "trust", description: "Аналитика платформы", defaultWeight: "regular", status: "approved" },
  "user-content": { sourceName: "ChatCircleText", sourceKebabName: "chat-circle-text", category: "trust", description: "Пользовательский контент", defaultWeight: "regular", status: "approved" },
  premium: { sourceName: "Diamond", sourceKebabName: "diamond", category: "access", description: "Расширенный доступ", defaultWeight: "regular", status: "approved" },
  locked: { sourceName: "Lock", sourceKebabName: "lock", category: "access", description: "Доступ закрыт", defaultWeight: "regular", status: "approved" },
  unlocked: { sourceName: "LockOpen", sourceKebabName: "lock-open", category: "access", description: "Доступ открыт", defaultWeight: "regular", status: "approved" },
  insight: { sourceName: "Sparkle", sourceKebabName: "sparkle", category: "access", description: "Вывод платформы", defaultWeight: "regular", status: "approved" },
  notifications: { sourceName: "Bell", sourceKebabName: "bell", category: "system", description: "Уведомления", defaultWeight: "regular", selectedWeight: "fill", status: "approved" },
  settings: { sourceName: "Gear", sourceKebabName: "gear", category: "system", description: "Настройки", defaultWeight: "regular", status: "approved" },
  user: { sourceName: "User", sourceKebabName: "user", category: "system", description: "Пользователь", defaultWeight: "regular", status: "approved" },
  "sign-in": { sourceName: "SignIn", sourceKebabName: "sign-in", category: "system", description: "Вход", defaultWeight: "regular", status: "approved" },
} as const satisfies Record<string, ProductIconDefinition>;

export type ProductIconId = keyof typeof productIcons;
