const SIZE_SOURCE_PLACEHOLDERS = new Set(["-", "—", "нет", "n/a", "na"]);

function isSizeSourcePlaceholder(value: string): boolean {
  const normalized = value.trim().toLowerCase();
  return !normalized || SIZE_SOURCE_PLACEHOLDERS.has(normalized);
}

function isValidSizeSourceUrl(value: string): boolean {
  try {
    const url = new URL(value.trim());
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export type SizeSourceViolation = {
  rowNumber: number;
  companyId: string;
  value: string;
};

/**
 * `size_source` in `public_export` is internal QA-only: URL or empty placeholder.
 * Text comments must live in notes, not this column.
 */
export function collectInvalidPublicExportSizeSourceViolations(
  rows: Record<string, unknown>[],
): SizeSourceViolation[] {
  const violations: SizeSourceViolation[] = [];

  rows.forEach((row, index) => {
    if (!("size_source" in row)) return;

    const raw = row.size_source;
    if (raw === null || raw === undefined) return;

    const value = String(raw).trim();
    if (isSizeSourcePlaceholder(value)) return;
    if (isValidSizeSourceUrl(value)) return;

    const companyId = String(row.company_id ?? row.companyId ?? row.id ?? "").trim() || "—";

    violations.push({
      rowNumber: index + 2,
      companyId,
      value,
    });
  });

  return violations;
}

export function assertValidPublicExportSizeSource(rows: Record<string, unknown>[]): void {
  const violations = collectInvalidPublicExportSizeSourceViolations(rows);
  if (violations.length === 0) return;

  throw new Error(
    `[digital] public_export size_source must be http(s) URL or empty placeholder; text comments belong in notes:\n` +
      violations
        .map(
          (violation) =>
            `  row ${violation.rowNumber}, company_id="${violation.companyId}", size_source="${violation.value}"`,
        )
        .join("\n"),
  );
}
