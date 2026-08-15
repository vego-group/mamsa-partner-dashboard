"use client";

import { useLocale } from "@/stores/locale-store";
import { cn } from "@/lib/cn";
import type { PayoutStatus } from "@/types";

/**
 * Two states only — a payout is recorded after the transfer already happened,
 * so there is no pending or failed to render.
 */
const classes: Record<PayoutStatus, string> = {
  paid: "bg-status-approved/15 text-status-approved",
  reversed: "bg-status-pending/15 text-status-pending",
};

export function PayoutStatusBadge({ status }: { status: PayoutStatus }) {
  const { t } = useLocale();
  const label = status === "paid" ? t.payouts.statusPaid : t.payouts.statusReversed;
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold", classes[status])}>
      {label}
    </span>
  );
}
