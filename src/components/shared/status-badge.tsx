"use client";

import { cn } from "@/lib/cn";
import { useLocale } from "@/stores/locale-store";
import type { UnitStatus, BookingStatus, DayStatus } from "@/types";

/**
 * ONE badge system, dashboard-wide.
 * Draft=grey · Pending=orange · Approved=green · Rejected=red (units)
 * Confirmed=green · Completed=blue · Cancelled=red (bookings)
 */

const unitClasses: Record<UnitStatus, string> = {
  draft: "bg-status-draft/15 text-status-draft",
  pending: "bg-status-pending/15 text-status-pending",
  approved: "bg-status-approved/15 text-status-approved",
  rejected: "bg-status-rejected/15 text-status-rejected",
};

const bookingClasses: Record<BookingStatus, string> = {
  confirmed: "bg-status-approved/15 text-status-approved",
  completed: "bg-blue-500/15 text-blue-700",
  cancelled: "bg-status-rejected/15 text-status-rejected",
};

const dayClasses: Record<DayStatus, string> = {
  available: "bg-status-approved/15 text-status-approved",
  booked: "bg-brand/15 text-brand",
  blocked: "bg-status-draft/15 text-status-draft",
  external: "bg-status-pending/15 text-status-pending",
};

export function UnitBadge({ status }: { status: UnitStatus }) {
  const { t } = useLocale();
  return <Badge className={unitClasses[status]}>{t.unitStatus[status]}</Badge>;
}

export function BookingBadge({ status }: { status: BookingStatus }) {
  const { t } = useLocale();
  return <Badge className={bookingClasses[status]}>{t.bookingStatus[status]}</Badge>;
}

export function DayBadge({ status }: { status: DayStatus }) {
  const { t } = useLocale();
  return <Badge className={dayClasses[status]}>{t.dayStatus[status]}</Badge>;
}

function Badge({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
        className,
      )}
    >
      {children}
    </span>
  );
}
