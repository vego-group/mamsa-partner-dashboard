import { ApiError } from "@/lib/api/client";
import type { Dict } from "@/lib/i18n";
import type { BuildingExpansion, Unit } from "@/types";
import { licenseErrorMessage } from "@/features/units/lib/license";

/** `groupSize` is `1` for a standalone unit, and treated as `1` when absent or malformed. */
export function groupSizeOf(u: Pick<Unit, "groupSize">): number {
  const n = u.groupSize;
  return typeof n === "number" && Number.isInteger(n) && n > 1 ? n : 1;
}

/** Only a tourist facility licence may hold more than one unit; anything else is refused server-side. */
export function canExpandBuilding(u: Pick<Unit, "licenseType">): boolean {
  return u.licenseType === "tourist_facility";
}

/**
 * What the number the partner typed would do. `count` on the wire is the
 * building's TOTAL afterwards, not an increment, so the plan is always a
 * comparison against the current size:
 *
 * - `grow`   — the only plan that sends a request; `added` is what it adds.
 * - `same`   — the server would answer `added: 0`; refused here instead.
 * - `shrink` — nobody has said whether a smaller total deletes apartments
 *              (maybe ones with bookings), so it is never sent.
 * - `exceeds_license` — the server would answer QUANTITY_EXCEEDS_LICENSED_UNITS.
 * - `empty` / `invalid` — nothing typed yet, or not a whole number above zero.
 */
export type ExpansionPlan =
  | { kind: "empty" }
  | { kind: "invalid" }
  | { kind: "shrink" }
  | { kind: "same" }
  | { kind: "exceeds_license"; licensed: number }
  | { kind: "grow"; added: number };

export function planExpansion({
  current,
  target,
  licensed,
}: {
  current: number;
  target: string | number | null;
  licensed: number | null | undefined;
}): ExpansionPlan {
  if (target === null || target === "" || (typeof target === "string" && target.trim() === "")) return { kind: "empty" };
  const n = typeof target === "number" ? target : Number(target);
  if (!Number.isInteger(n) || n < 1) return { kind: "invalid" };
  if (n < current) return { kind: "shrink" };
  if (n === current) return { kind: "same" };
  if (licensed != null && n > licensed) return { kind: "exceeds_license", licensed };
  return { kind: "grow", added: n - current };
}

/** The live line under the field, one sentence per plan. */
export function expansionPlanLine(plan: ExpansionPlan, current: number, target: number, b: Dict["building"]): string {
  switch (plan.kind) {
    case "empty":
      return b.currentLine(current);
    case "invalid":
      return b.invalidCount;
    case "shrink":
      return b.shrinkBlocked;
    case "same":
      return b.noChange;
    case "exceeds_license":
      return b.exceedsLicense(plan.licensed);
    case "grow":
      return b.deltaLine(current, target, plan.added);
  }
}

/**
 * Where a rejection lands and what it says. Two envelopes come back from this
 * route and they mean different things: a 400 `VALIDATION` is about the body,
 * a 422 licence code is about the partner's permit (so it belongs on the
 * form). Branches on `code` and on the `fields` keys only — the server's
 * Arabic `message` is never surfaced, and neither is the code itself.
 *
 * A 400 has two readings. `fields.count` (or no `fields` at all) is the number
 * typed and belongs on the field. Any other key is the submit validation
 * refusing the copied apartments because the SOURCE unit is missing something
 * — seen on staging with `tourismLicenseNumber` and `tourismLicenseFileId` —
 * and that belongs on the form, naming what to complete on the unit.
 */
export type ExpansionError = { scope: "field" | "form"; text: string };

export function expansionErrorMessage(e: unknown, t: Dict): ExpansionError {
  const b = t.building;
  if (e instanceof ApiError) {
    if (e.code === "VALIDATION") {
      const keys = Object.keys(e.fields ?? {});
      if (keys.length === 0 || keys.includes("count")) return { scope: "field", text: b.invalidCount };
      const labels = keys.map((k) => b.fieldLabel[k]).filter((l): l is string => !!l);
      return { scope: "form", text: b.sourceIncomplete(labels) };
    }
    const licence = licenseErrorMessage(e, t.wiz);
    if (licence) return { scope: "form", text: licence };
    if (e.code === "NOT_FOUND" || e.status === 404) return { scope: "form", text: b.errNotFound };
    if (e.code === "NETWORK_ERROR") return { scope: "form", text: t.states.offline };
  }
  return { scope: "form", text: b.errGeneric };
}

/**
 * Success copy. `added: 0` is a "nothing changed", not a success. The review
 * sentence appears only when the response itself says the new rows are
 * pending — a deployment that hands back approved rows gets the plain line.
 */
export function expansionResultMessage(result: BuildingExpansion, b: Dict["building"]): string {
  if (result.added === 0) return b.successNone(result.groupSize);
  if (result.pendingReview > 0) return b.successPending(result.added);
  return b.successAdded(result.added, result.groupSize);
}
