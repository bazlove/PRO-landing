import { DIGITAL_FILTER_PRESETS } from "./filterPresets";

/** Semantic tag color modifiers (shared by badges and filter chips). */
export const TAG_COLOR_CLASS = {
  green: "digital-tag--green",
  blue: "digital-tag--blue",
  yellow: "digital-tag--yellow",
  purple: "digital-tag--purple",
  indigo: "digital-tag--indigo",
  violet: "digital-tag--violet",
  cyan: "digital-tag--cyan",
  orange: "digital-tag--orange",
  slate: "digital-tag--slate",
  teal: "digital-tag--teal",
} as const;

const PRESET_ID_TO_COLOR: Record<string, string> = {
  "active-hiring": TAG_COLOR_CLASS.green,
  remote: TAG_COLOR_CLASS.blue,
  "high-rating": TAG_COLOR_CLASS.yellow,
  "awards-2025": TAG_COLOR_CLASS.purple,
  international: TAG_COLOR_CLASS.indigo,
  "digital-agencies": TAG_COLOR_CLASS.violet,
  "web-dev": TAG_COLOR_CLASS.cyan,
  "it-accreditation": TAG_COLOR_CLASS.orange,
  moscow: TAG_COLOR_CLASS.slate,
  spb: TAG_COLOR_CLASS.teal,
};

const LABEL_TO_COLOR: Record<string, string> = {
  "Активный найм": TAG_COLOR_CLASS.green,
  Удалёнка: TAG_COLOR_CLASS.blue,
  "Есть удалёнка": TAG_COLOR_CLASS.blue,
  "Высокая HR-оценка": TAG_COLOR_CLASS.yellow,
  "HR 4.5+": TAG_COLOR_CLASS.yellow,
  "Награды 2025": TAG_COLOR_CLASS.purple,
  Награды: TAG_COLOR_CLASS.purple,
  Международные: TAG_COLOR_CLASS.indigo,
  "Digital-агентства": TAG_COLOR_CLASS.violet,
  "Веб-разработка": TAG_COLOR_CLASS.cyan,
  "IT-аккредитация": TAG_COLOR_CLASS.orange,
  Москва: TAG_COLOR_CLASS.slate,
  СПб: TAG_COLOR_CLASS.teal,
};

for (const preset of DIGITAL_FILTER_PRESETS) {
  LABEL_TO_COLOR[preset.label] = PRESET_ID_TO_COLOR[preset.id] ?? "";
}

/** Map preset id, filter label, or badge label → shared color class. */
export function getTagColorClass(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";

  return PRESET_ID_TO_COLOR[trimmed] ?? LABEL_TO_COLOR[trimmed] ?? "";
}
