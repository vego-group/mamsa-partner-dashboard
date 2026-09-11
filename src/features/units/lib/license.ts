import { ApiError } from "@/lib/api/client";
import type { Dict } from "@/lib/i18n";
import type { LicenseType } from "@/types";

/** Select order in the form. */
export const LICENSE_TYPES: readonly LicenseType[] = ["tourist_facility", "private_hospitality"];

/**
 * The two licence rules the form can check on its own, before any request:
 * a tourist facility licence needs its unit count, and a private one cannot
 * carry a count above one. Everything else (group size, downgrades, the
 * feature flag) is only knowable server-side and arrives as a 422 code.
 */
export type LicenseIssue = "count_required" | "count_not_applicable";

export function validateLicenseFields({
  licenseType,
  licensedUnitsCount,
}: {
  licenseType: LicenseType | null;
  licensedUnitsCount: number | null;
}): LicenseIssue | null {
  if (licenseType === "tourist_facility") {
    const ok = licensedUnitsCount !== null && Number.isInteger(licensedUnitsCount) && licensedUnitsCount >= 1;
    return ok ? null : "count_required";
  }
  if (licenseType === "private_hospitality" && licensedUnitsCount !== null && licensedUnitsCount > 1) {
    return "count_not_applicable";
  }
  return null;
}

export function licenseIssueMessage(issue: LicenseIssue, w: Dict["wiz"]): string {
  return issue === "count_required" ? w.licenseErrCountRequired : w.licenseErrCountNotApplicable;
}

/** The six 422 codes the licence rules can answer with. */
export const LICENSE_ERROR_CODES = [
  "LICENSED_UNITS_COUNT_REQUIRED",
  "LICENSED_UNITS_COUNT_NOT_APPLICABLE",
  "MULTI_UNIT_REQUIRES_FACILITY_LICENSE",
  "QUANTITY_EXCEEDS_LICENSED_UNITS",
  "LICENSE_DOWNGRADE_BLOCKED_BY_QUANTITY",
  "MULTI_UNIT_DISABLED",
] as const;

/**
 * Dictionary text for a licence rejection, or `null` when the error is not
 * one of the six — the caller then falls back to whatever it showed before.
 * Branches on `code` only: the Arabic `message` can change at any time and
 * the English code is never something to put in front of a partner.
 */
export function licenseErrorMessage(e: unknown, w: Dict["wiz"]): string | null {
  if (!(e instanceof ApiError)) return null;
  switch (e.code) {
    case "LICENSED_UNITS_COUNT_REQUIRED":
      return w.licenseErrCountRequired;
    case "LICENSED_UNITS_COUNT_NOT_APPLICABLE":
      return w.licenseErrCountNotApplicable;
    case "MULTI_UNIT_REQUIRES_FACILITY_LICENSE":
      return w.licenseErrMultiUnitRequiresFacility;
    case "QUANTITY_EXCEEDS_LICENSED_UNITS":
      // "Your licence covers 8 units" beats "too many" — the number is in meta.
      return w.licenseErrQuantityExceeds(licensedUnitsCountFromMeta(e.meta));
    case "LICENSE_DOWNGRADE_BLOCKED_BY_QUANTITY":
      return w.licenseErrDowngradeBlocked;
    case "MULTI_UNIT_DISABLED":
      return w.licenseErrMultiUnitDisabled;
    default:
      return null;
  }
}

/** The ticket spells the key `licensed_units_count`; the camelCase twin is accepted in case the envelope follows the unit fields. */
function licensedUnitsCountFromMeta(meta: Record<string, unknown> | undefined): number | null {
  const raw = meta?.licensed_units_count ?? meta?.licensedUnitsCount;
  if (typeof raw === "number" && Number.isFinite(raw)) return raw;
  if (typeof raw === "string" && raw.trim() !== "" && Number.isFinite(Number(raw))) return Number(raw);
  return null;
}
