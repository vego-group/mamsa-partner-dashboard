"use client";

import { useState } from "react";
import { api } from "@/lib/api/client";
import { Modal, Button } from "@/components/ui";
import { Avatar } from "@/components/shared/avatar";
import { BookingBadge } from "@/components/shared/status-badge";
import { MoneyText, PhoneText } from "@/components/shared/typed-text";
import { useLocale } from "@/stores/locale-store";
import { formatDateShort } from "@/lib/format";
import { cn } from "@/lib/cn";
import type { Booking } from "@/types";
import {
  AlertTriangle,
  Loader2,
  DollarSign,
  UserX,
  TrendingDown,
  AlertCircle,
  Info,
  XCircle,
  BookOpen,
  ChevronRight,
  Check,
} from "lucide-react";

type View = "details" | "reason" | "confirm" | "processing" | "cancelled";

export function BookingDetail({
  booking,
  onClose,
  onCancelled,
}: {
  booking: Booking;
  onClose: () => void;
  onCancelled: (b: Booking) => void;
}) {
  const { t, locale } = useLocale();
  const b = t.bookings;
  const [view, setView] = useState<View>(booking.status === "cancelled" ? "cancelled" : "details");
  const [reason, setReason] = useState<string>();
  const [otherText, setOtherText] = useState("");

  const REASONS = [
    { value: "booked_elsewhere", label: b.reasonBookedElsewhere },
    { value: "unavailable", label: b.reasonUnavailable },
    { value: "maintenance", label: b.reasonMaintenance },
    { value: "emergency", label: b.reasonEmergency },
    { value: "other", label: b.reasonOther },
  ];

  const notStarted = new Date(booking.checkIn) > new Date();
  const canCancel = booking.status === "confirmed" && notStarted;
  const reasonLabel = reason === "other" ? otherText : REASONS.find((r) => r.value === reason)?.label ?? "";
  const f = booking.financials;

  async function confirmCancel() {
    setView("processing");
    const updated = await api.hostCancel(booking.id, reasonLabel);
    onCancelled(updated);
    setView("cancelled");
  }

  /* ---- reason ---- */
  if (view === "reason") {
    return (
      <Modal
        open
        onClose={onClose}
        size="lg"
        title={b.unableToHost}
        subtitle={b.step1of2}
        footer={
          <>
            <Button variant="outline" className="flex-1" onClick={() => setView("details")}>
              {t.common.cancel}
            </Button>
            <Button
              className="flex-1"
              onClick={() => setView("confirm")}
              disabled={!reason || (reason === "other" && !otherText.trim())}
            >
              {b.continue}
            </Button>
          </>
        }
      >
        <p className="mb-4 text-ink-muted">{b.selectReason}</p>

        <div className="mb-5 flex items-center gap-3 rounded-2xl bg-brand-soft px-4 py-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-white text-brand">
            <BookOpen className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="font-bold text-ink">{booking.code}</div>
            <div className="truncate text-sm text-ink-muted">{booking.guestName}</div>
          </div>
          <MoneyText amount={f.total} className="font-bold text-ink" />
        </div>

        <div className="space-y-2.5">
          {REASONS.map((r) => (
            <button
              key={r.value}
              type="button"
              onClick={() => setReason(r.value)}
              className={cn(
                "flex w-full items-center gap-3 rounded-2xl border-2 px-4 py-3.5 text-start text-sm font-medium transition",
                reason === r.value ? "border-brand bg-brand-soft text-ink" : "border-line text-ink-muted hover:border-line",
              )}
            >
              <span
                className={cn(
                  "grid h-5 w-5 shrink-0 place-items-center rounded-full border-2",
                  reason === r.value ? "border-brand" : "border-line",
                )}
              >
                {reason === r.value && <span className="h-2.5 w-2.5 rounded-full bg-brand" />}
              </span>
              {r.label}
            </button>
          ))}
          {reason === "other" && (
            <textarea
              value={otherText}
              onChange={(e) => setOtherText(e.target.value)}
              placeholder="…"
              rows={3}
              className="w-full rounded-2xl border border-line bg-cream/40 px-4 py-3 text-sm outline-none focus:border-brand focus:bg-white"
            />
          )}
        </div>
      </Modal>
    );
  }

  /* ---- confirm ---- */
  if (view === "confirm") {
    return (
      <Modal
        open
        onClose={onClose}
        size="lg"
        title={b.unableToHost}
        subtitle={b.step2of2}
        footer={
          <>
            <Button variant="outline" className="flex-1" onClick={() => setView("reason")}>
              {t.common.back}
            </Button>
            <Button variant="danger" className="flex-1" onClick={confirmCancel}>
              {b.confirmCancellation}
            </Button>
          </>
        }
      >
        <div className="rounded-2xl border border-status-pending/40 bg-status-pending/10 p-5">
          <div className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-status-pending/20 text-status-pending">
              <AlertTriangle className="h-5 w-5" />
            </span>
            <div>
              <div className="font-bold text-ink">{b.confirmCancellation}</div>
              <div className="text-sm text-ink-muted">{b.confirmReviewSub}</div>
            </div>
          </div>
          <ul className="mt-4 space-y-3 text-sm text-ink">
            <Consequence icon={<DollarSign className="h-4 w-4 text-status-rejected" />} tone="bg-status-rejected/10">
              {b.consequenceRefund}
            </Consequence>
            <Consequence icon={<UserX className="h-4 w-4 text-[#8A5FB0]" />} tone="bg-[#8A5FB0]/10">
              {b.consequenceRecord}
            </Consequence>
            <Consequence icon={<TrendingDown className="h-4 w-4 text-status-pending" />} tone="bg-status-pending/15">
              {b.consequenceRanking}
            </Consequence>
            <Consequence icon={<AlertCircle className="h-4 w-4 text-status-rejected" />} tone="bg-status-rejected/10">
              {b.consequencePenalty}
            </Consequence>
          </ul>
        </div>

        <div className="mt-4 flex items-center gap-2 rounded-2xl bg-cream px-4 py-3 text-sm">
          <Info className="h-4 w-4 text-ink-faint" />
          <span className="text-ink-muted">{b.selectedReason}:</span>
          <span className="font-semibold text-ink">{reasonLabel}</span>
        </div>

        <div className="mt-4 rounded-2xl bg-status-rejected/5 p-4 text-sm">
          <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-status-rejected">{b.financialImpact}</div>
          <Row label={b.guestRefundAmount} value={<MoneyText amount={f.total} className="font-bold text-status-rejected" />} />
          <Row label={b.platformCommission} value={<MoneyText amount={f.commission} className="font-bold text-status-rejected" />} />
          <div className="my-2 h-px bg-status-rejected/15" />
          <Row label={<span className="font-bold text-ink">{b.netLoss}</span>} value={<MoneyText amount={f.partnerShare} className="font-bold text-status-rejected" />} />
        </div>
      </Modal>
    );
  }

  /* ---- processing ---- */
  if (view === "processing") {
    return (
      <Modal open onClose={() => {}} size="md">
        <div className="flex flex-col items-center py-6 text-center">
          <span className="grid h-20 w-20 place-items-center rounded-full border-2 border-dashed border-status-pending/40 bg-status-pending/15">
            <Loader2 className="h-8 w-8 animate-spin text-status-pending" />
          </span>
          <h3 className="mt-5 text-xl font-bold text-ink">{b.cancellingBooking}</h3>
          <p className="mt-1 text-sm text-ink-muted">{b.pleaseWait}</p>
          <ul className="mt-6 space-y-3 text-start">
            <li className="flex items-center gap-3 text-sm font-medium text-ink">
              <span className="grid h-6 w-6 place-items-center rounded-full bg-brand-dark text-white"><Check className="h-3.5 w-3.5" /></span>
              {b.notifyingGuest}
            </li>
            <li className="flex items-center gap-3 text-sm font-medium text-status-pending">
              <span className="grid h-6 w-6 place-items-center rounded-full bg-status-pending/15"><Loader2 className="h-3.5 w-3.5 animate-spin" /></span>
              {b.initiatingRefund}
            </li>
            <li className="flex items-center gap-3 text-sm font-medium text-ink-faint">
              <span className="grid h-6 w-6 place-items-center rounded-full bg-line"><span className="h-2 w-2 rounded-full bg-ink-faint/50" /></span>
              {b.recordingCancellation}
            </li>
          </ul>
        </div>
      </Modal>
    );
  }

  /* ---- cancelled ---- */
  if (view === "cancelled" && booking.cancellation) {
    const c = booking.cancellation;
    return (
      <Modal
        open
        onClose={onClose}
        size="lg"
        title={b.bookingTitle(booking.code)}
        footer={
          <>
            <Button variant="outline" className="flex-1" onClick={onClose}>{t.common.close}</Button>
            <Button className="flex-1">{b.messageGuest}</Button>
          </>
        }
      >
        <GuestHeader booking={booking} />
        <DetailGrid booking={booking} locale={locale} only={["duration", "total"]} />

        <div className="my-4 flex flex-wrap gap-2">
          <Chip tone="bg-status-rejected/10 text-status-rejected">{b.cancelled}</Chip>
          <Chip tone="bg-status-rejected/10 text-status-rejected">{b.refunded}</Chip>
          <Chip tone="bg-status-pending/15 text-status-pending">{b.hostCancellation}</Chip>
        </div>

        <div className="rounded-2xl border border-status-pending/30 bg-status-pending/5 p-4 text-sm">
          <div className="mb-3 flex items-center gap-2 font-bold text-ink">
            <AlertTriangle className="h-4 w-4 text-status-pending" /> {b.cancellationDetails}
          </div>
          <Row label={b.cancellationType} value={b.hostCancellation} />
          <Row label={b.cancellationReason} value={c.reason} />
          <Row label={b.cancellationDate} value={formatDateShort(c.date, locale)} />
          <Row label={b.refundAmount} value={<MoneyText amount={c.refundAmount} />} />
          <Row label={b.refundStatusLabel} value={c.refundStatus === "processing" ? b.processing : b.completedStatus} />

          <div className="mt-4 border-t border-status-pending/20 pt-3">
            <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-faint">{b.timeline}</div>
            <TimelineItem done label={b.tlBookingReceived} />
            <TimelineItem done amber label={b.tlHostReported} />
            <TimelineItem done label={b.tlRefundInitiated} />
            <TimelineItem label={b.tlRefundCompleted} />
          </div>
        </div>

        {booking.notes && <NotesCard label={b.notes} text={booking.notes} />}
      </Modal>
    );
  }

  /* ---- details ---- */
  return (
    <Modal
      open
      onClose={onClose}
      size="lg"
      title={b.bookingTitle(booking.code)}
      footer={
        <>
          <Button variant="outline" className="flex-1" onClick={onClose}>{t.common.close}</Button>
          <Button className="flex-1">{b.messageGuest}</Button>
        </>
      }
    >
      <GuestHeader booking={booking} />
      <DetailGrid booking={booking} locale={locale} />

      <div className="my-4 flex flex-wrap gap-2">
        <Chip tone="bg-status-approved/15 text-status-approved">{t.bookingStatus[booking.status]}</Chip>
        {booking.status !== "cancelled" && <Chip tone="bg-status-approved/15 text-status-approved">{b.paid}</Chip>}
      </div>

      {booking.notes && <NotesCard label={b.notes} text={booking.notes} />}

      {canCancel && (
        <div className="mt-4 rounded-2xl border border-status-rejected/20 bg-status-rejected/5 p-3">
          <div className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-status-rejected">{b.bookingActions}</div>
          <button
            onClick={() => setView("reason")}
            className="flex w-full items-center gap-3 rounded-xl bg-white px-4 py-3 text-start shadow-card transition hover:bg-cream/40"
          >
            <XCircle className="h-5 w-5 text-status-rejected" />
            <span className="flex-1">
              <span className="block font-bold text-status-rejected">{b.unableToHost}</span>
              <span className="block text-xs text-ink-muted">{b.unableToHostSub}</span>
            </span>
            <ChevronRight className="h-4 w-4 text-status-rejected rtl:rotate-180" />
          </button>
        </div>
      )}
    </Modal>
  );
}

/* ---------------- sub-components ---------------- */
function GuestHeader({ booking }: { booking: Booking }) {
  return (
    <div className="flex items-center gap-4">
      <Avatar name={booking.guestName} className="h-16 w-16 text-lg" />
      <div className="min-w-0">
        <h3 className="text-xl font-bold text-ink">{booking.guestName}</h3>
        {/* Contract §6: guest contact = phone only (SMS comms) — no email field */}
        <PhoneText phone={booking.guestPhone} className="text-sm text-ink-muted" />
      </div>
    </div>
  );
}

function DetailGrid({
  booking,
  locale,
  only,
}: {
  booking: Booking;
  locale: "ar" | "en";
  only?: ("duration" | "total")[];
}) {
  const { t } = useLocale();
  const b = t.bookings;
  const all = [
    { key: "property", label: b.property, value: booking.unitName },
    { key: "bookingId", label: b.bookingId, value: booking.code },
    { key: "checkin", label: b.checkIn, value: formatDateShort(booking.checkIn, locale) },
    { key: "checkout", label: b.checkOut, value: formatDateShort(booking.checkOut, locale) },
    { key: "duration", label: b.duration, value: b.nights(booking.nights) },
    { key: "total", label: b.total, value: <MoneyText amount={booking.financials.total} /> },
  ];
  const rows = only ? all.filter((r) => only.includes(r.key as "duration" | "total")) : all;
  return (
    <div className="mt-5 grid grid-cols-2 gap-3">
      {rows.map((r) => (
        <div key={r.key} className="rounded-2xl bg-brand-soft/60 px-4 py-3">
          <div className="text-xs text-ink-muted">{r.label}</div>
          <div className="mt-0.5 font-bold text-ink">{r.value}</div>
        </div>
      ))}
    </div>
  );
}

function Chip({ tone, children }: { tone: string; children: React.ReactNode }) {
  return <span className={cn("inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold", tone)}>{children}</span>;
}

function NotesCard({ label, text }: { label: string; text: string }) {
  return (
    <div className="mt-4 rounded-2xl border border-status-pending/20 bg-status-pending/8 px-4 py-3">
      <div className="text-xs font-semibold uppercase tracking-wide text-ink-muted">{label}</div>
      <p className="mt-0.5 text-sm text-ink">{text}</p>
    </div>
  );
}

function Consequence({ icon, tone, children }: { icon: React.ReactNode; tone: string; children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-3">
      <span className={cn("mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full", tone)}>{icon}</span>
      <span>{children}</span>
    </li>
  );
}

function Row({ label, value }: { label: React.ReactNode; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-1">
      <span className="text-ink-muted">{label}</span>
      <span className="text-end text-ink">{value}</span>
    </div>
  );
}

function TimelineItem({ label, done, amber }: { label: string; done?: boolean; amber?: boolean }) {
  return (
    <div className="flex items-center gap-2.5 py-1 text-sm">
      {done ? (
        <span className={cn("grid h-5 w-5 place-items-center rounded-full text-white", amber ? "bg-status-pending" : "bg-status-approved")}>
          <Check className="h-3 w-3" />
        </span>
      ) : (
        <span className="grid h-5 w-5 place-items-center rounded-full bg-line">
          <span className="h-1.5 w-1.5 rounded-full bg-ink-faint/50" />
        </span>
      )}
      <span className={cn(done ? "text-ink" : "text-ink-faint", amber && "text-status-pending")}>{label}</span>
    </div>
  );
}
