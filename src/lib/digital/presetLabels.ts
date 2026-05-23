import type { CompanyPreset } from "../../types/digital";

/** Contract preset values stored in `companies.json` (machine keys). */
export const PUBLIC_PRESET_VALUES = [
  "Активный найм",
  "Удалёнка",
  "Высокая HR-оценка",
  "Награды 2025",
  "Международные",
] as const satisfies readonly CompanyPreset[];

export type PublicPresetValue = CompanyPreset;

/** UI labels for contract presets (render-time only). */
export const PRESET_LABELS: Record<PublicPresetValue, string> = {
  "Активный найм": "Активный найм",
  "Удалёнка": "Есть удалёнка",
  "Высокая HR-оценка": "Высокая HR-оценка",
  "Награды 2025": "Награды 2025",
  "Международные": "Международные",
};

export function getPresetDisplayLabel(preset: string): string {
  if (preset in PRESET_LABELS) {
    return PRESET_LABELS[preset as PublicPresetValue];
  }
  return preset;
}
