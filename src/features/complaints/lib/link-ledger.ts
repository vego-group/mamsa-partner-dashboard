import type { PartnerComplaintRow, PartnerLedgerEntry } from "@/types";

/**
 * Where a `refund_reversal` ledger row should link.
 *
 * The row's `refId` is a `refunds.id`, not a complaint id — it must never be
 * turned into `/complaints/{refId}`. The only bridge the partner surface has
 * is the booking code: the row carries it as `refCode`, every complaint
 * carries it as `bookingCode`, and there is one complaint per booking. So the
 * match is local, over the full `/me/complaints` list, with no extra call
 * and no guessed id.
 *
 * Returns null when nothing matches — the caller renders plain text. This
 * relies on `/me/complaints` being unpaginated; if pagination lands, revisit.
 */
export function complaintHrefForLedgerRow(
  row: Pick<PartnerLedgerEntry, "type" | "refCode">,
  complaints: readonly PartnerComplaintRow[] | undefined,
): string | null {
  if (row.type !== "refund_reversal" || !row.refCode || !complaints?.length) return null;
  const match = complaints.find((c) => c.bookingCode === row.refCode);
  return match ? `/complaints/${match.id}` : null;
}
