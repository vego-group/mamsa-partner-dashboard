"use client";

import { useLocale } from "@/stores/locale-store";
import { cn } from "@/lib/cn";
import type { PartnerComplaintStatus } from "@/types";
import type { Dict } from "@/lib/i18n";

/**
 * Coloured from the PARTNER'S side of the dispute. `approved` is deliberately
 * neutral: Mamsa has decided an amount, nothing has left the wallet yet, and
 * painting it green (good news) or red (money gone) would both be wrong.
 * `resolved_rejected` is the green one — it went the partner's way.
 */
const classes: Record<PartnerComplaintStatus, string> = {
  submitted: "bg-status-draft/15 text-status-draft",
  under_review: "bg-status-pending/15 text-status-pending",
  approved: "bg-cream text-ink-muted",
  resolved_refunded: "bg-status-rejected/15 text-status-rejected",
  resolved_rejected: "bg-status-approved/15 text-status-approved",
};

export function complaintStatusLabel(c: Dict["complaints"], status: PartnerComplaintStatus): string {
  switch (status) {
    case "submitted":
      return c.status_submitted;
    case "under_review":
      return c.status_under_review;
    case "approved":
      return c.status_approved;
    case "resolved_refunded":
      return c.status_resolved_refunded;
    case "resolved_rejected":
      return c.status_resolved_rejected;
  }
}

export function ComplaintStatusBadge({ status, className }: { status: PartnerComplaintStatus; className?: string }) {
  const { t } = useLocale();
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
        classes[status] ?? classes.submitted,
        className,
      )}
    >
      {complaintStatusLabel(t.complaints, status)}
    </span>
  );
}
