import type { CompanyPublic, ItAccreditationStatus } from "../../types/digital";

export const PUBLIC_IT_ACCREDITATION_STATUSES: ReadonlySet<ItAccreditationStatus> = new Set([
  "confirmed_official",
  "confirmed_open_registry_mention",
]);

/** Whether the drawer may show the public `IT-аккредитация` inline chip. */
export function showsPublicItAccreditationChip(company: CompanyPublic): boolean {
  const accreditation = company.itAccreditation;
  if (!accreditation) return false;
  return PUBLIC_IT_ACCREDITATION_STATUSES.has(accreditation.status);
}
