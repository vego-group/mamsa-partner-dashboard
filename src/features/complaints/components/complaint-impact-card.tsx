"use client";

import { useLocale } from "@/stores/locale-store";
import { Card } from "@/components/ui";
import { MoneyText } from "@/components/shared/typed-text";
import { ComplaintStatusBadge } from "./complaint-status-badge";
import { complaintImpact } from "../lib/impact";
import type { PartnerComplaintDetail } from "@/types";
import { CheckCircle2, Clock, MinusCircle, Hourglass } from "lucide-react";

/**
 * Area C of the detail screen — what this complaint did to the balance.
 *
 * An amount is rendered ONLY when the API sent one (`deductedHalalas` is a
 * number). While a complaint is `approved` and unsettled there is no figure
 * to show, and nothing here derives one from any other number: the rate was
 * frozen on the booking and the partner's share excludes VAT and commission.
 */
export function ComplaintImpactCard({ complaint }: { complaint: Pick<PartnerComplaintDetail, "status" | "deductedHalalas"> }) {
  const { t } = useLocale();
  const c = t.complaints;
  const impact = complaintImpact(complaint);

  return (
    <Card className="p-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="font-semibold text-ink">{c.sectionImpact}</h3>
        <ComplaintStatusBadge status={complaint.status} />
      </div>

      {impact.kind === "deducted" ? (
        <div>
          <div className="flex items-center gap-2 text-sm text-ink-muted">
            <MinusCircle className="h-4 w-4 text-status-rejected" />
            {c.impactDeducted}
          </div>
          <MoneyText amount={impact.amountSar} precise className="mt-1.5 block text-2xl font-bold text-status-rejected" />
          <p className="mt-2 text-xs leading-relaxed text-ink-muted">{c.impactDeductedHint}</p>
        </div>
      ) : impact.kind === "approved_pending" ? (
        // Neutral on purpose — see the type-level note on `approved`.
        <div className="rounded-2xl bg-cream/70 px-4 py-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-ink">
            <Hourglass className="h-4 w-4 text-ink-muted" />
            {c.impactApproved}
          </div>
          <p className="mt-1 text-xs leading-relaxed text-ink-muted">{c.impactApprovedHint}</p>
        </div>
      ) : impact.kind === "rejected" ? (
        <div className="flex items-center gap-2 text-sm text-ink">
          <CheckCircle2 className="h-4 w-4 text-status-approved" />
          {c.impactRejected}
        </div>
      ) : (
        <div className="flex items-center gap-2 text-sm text-ink-muted">
          <Clock className="h-4 w-4 text-status-pending" />
          {c.impactOpen}
        </div>
      )}
    </Card>
  );
}
