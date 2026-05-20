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
