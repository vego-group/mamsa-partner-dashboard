import type { PartnerComplaintDetail, PartnerComplaintStatus } from "@/types";

/**
 * What the complaint has done to the partner's balance — the ONE place that
 * decides whether an amount may appear on screen.
 *
 * `approved` is not `deducted`. Between Mamsa approving an amount and the
 * gateway settling it (an hour or more, and it can fail) the status reads
 * `approved` while `deductedHalalas` stays null. Showing a figure then sends
 * the partner to a statement that doesn't have it, and then to support.
 */
export type ComplaintImpact =
  /** Open, nothing decided — no financial effect. */
  | { kind: "open" }
  /** An amount was approved but has NOT left the wallet yet. Never a number. */
  | { kind: "approved_pending" }
  /** Decided against the guest — nothing deducted. */
  | { kind: "rejected" }
  /** The deduction landed. `amountSar` is the partner's share, from the API only. */
  | { kind: "deducted"; amountSar: number };

/** The API speaks halalas; the screen speaks riyals. Display-only conversion. */
export function halalasToSar(halalas: number): number {
  return halalas / 100;
}

export function complaintImpact(c: Pick<PartnerComplaintDetail, "status" | "deductedHalalas">): ComplaintImpact {
  // A number is the API telling us the deduction happened — status is secondary.
  if (typeof c.deductedHalalas === "number" && Number.isFinite(c.deductedHalalas)) {
    return { kind: "deducted", amountSar: halalasToSar(c.deductedHalalas) };
  }
  return { kind: impactWithoutAmount(c.status) };
}

function impactWithoutAmount(status: PartnerComplaintStatus): Exclude<ComplaintImpact["kind"], "deducted"> {
  switch (status) {
    case "resolved_rejected":
      return "rejected";
    // `resolved_refunded` with a null amount is a settlement we can't see yet —
    // the same "approved, not deducted" wording is the honest one.
    case "approved":
    case "resolved_refunded":
      return "approved_pending";
    case "submitted":
    case "under_review":
      return "open";
  }
}
