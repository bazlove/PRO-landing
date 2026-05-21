export type DigitalFilterPreset = {
  id: string;
  label: string;
};

export const DIGITAL_FILTER_PRESETS: DigitalFilterPreset[] = [
  { id: "active-hiring", label: "Активный найм" },
  { id: "remote", label: "Удалёнка" },
  { id: "high-rating", label: "HR 4.5+" },
  { id: "awards-2025", label: "Награды" },
  { id: "international", label: "Международные" },
  { id: "digital-agencies", label: "Digital-агентства" },
  { id: "web-dev", label: "Веб-разработка" },
  { id: "performance-seo", label: "Performance / SEO" },
  { id: "moscow", label: "Москва" },
  { id: "spb", label: "СПб" },
];

/** Primary quick filters shown by default on mobile (order preserved). */
export const DIGITAL_PRIMARY_PRESET_IDS = new Set(["active-hiring", "remote"]);

export const DIGITAL_FILTER_PRESETS_PRIMARY = DIGITAL_FILTER_PRESETS.filter((preset) =>
  DIGITAL_PRIMARY_PRESET_IDS.has(preset.id),
);

export const DIGITAL_FILTER_PRESETS_SECONDARY = DIGITAL_FILTER_PRESETS.filter(
  (preset) => !DIGITAL_PRIMARY_PRESET_IDS.has(preset.id),
);
