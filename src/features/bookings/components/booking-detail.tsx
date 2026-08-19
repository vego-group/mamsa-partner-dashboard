"use client";

import { useMemo, useState } from "react";
import { api, ApiError } from "@/lib/api/client";
import { Modal, Button, Field } from "@/components/ui";
import { Avatar } from "@/components/shared/avatar";
import { BookingBadge } from "@/components/shared/status-badge";
import { MoneyText, PhoneText } from "@/components/shared/typed-text";
import { useLocale } from "@/stores/locale-store";
import { formatCurrency, formatDateShort } from "@/lib/format";
import { cn } from "@/lib/cn";
import type { Booking } from "@/types";
import {
  AlertTriangle,
  Loader2,
  UserX,
  TrendingDown,
  AlertCircle,
  Info,
  XCircle,
  BookOpen,
  ChevronRight,
  Check,
  CheckCircle2,
} from "lucide-react";

type View = "details" | "reason" | "confirm" | "processing" | "cancelled";

/**
 * The reason is REQUIRED and reaches the guest — the API stores it verbatim and
 * shows it to them, so it is guest-facing copy, not an internal note. Three
 * characters is a client-side floor on top of the API's minimum of one: a
 * two-letter reason passes validation and tells the guest nothing.
 */
const MIN_REASON = 3;

/**
 * Refusals that mean the booking on screen is stale. Retrying cannot help — the
 * status changed under us, or check-in passed while the modal sat open — so the
 * list is refetched and the retry button goes away (§5).
 */
const STALE_CODES = new Set(["BOOKING_NOT_CANCELLABLE", "CHECKIN_PASSED", "NOT_FOUND"]);

interface CancelError {
  /** The API's own Arabic message — rendered verbatim, never replaced. */
  message: string;
  retryable: boolean;
  hint?: string;
}

export function BookingDetail({
  booking,
  onClose,
  onCancelled,
  onStale,
}: {
  booking: Booking;
  onClose: () => void;
  onCancelled: (b: Booking) => void;
  /** The booking changed elsewhere — refetch the list; nothing was cancelled. */
  onStale?: () => void;
}) {
  const { t, locale } = useLocale();
  const b = t.bookings;
  /**
   * host-cancel returns the FULL updated booking, so the cancelled view renders
   * from the response rather than a refetch (§1). Held locally so the screen is
   * correct even if the parent never feeds the update back through props.
   */
  const [cancelled, setCancelled] = useState<Booking>();
  const shown = cancelled ?? booking;
  const [view, setView] = useState<View>(booking.status === "cancelled" ? "cancelled" : "details");
  const [reason, setReason] = useState("");
  const [reasonError, setReasonError] = useState<string>();
  const [cancelError, setCancelError] = useState<CancelError>();

  const QUICK_REASONS = [
    b.reasonBookedElsewhere,
    b.reasonUnavailable,
    b.reasonMaintenance,
    b.reasonEmergency,
  ];

  const notStarted = new Date(booking.checkIn) > new Date();
  // §2 — anything else is refused server-side, and discovering a correct
  // refusal as an error is worse than never seeing the control.
  const canCancel = booking.status === "confirmed" && notStarted;
  const f = booking.financials;
  const reasonReady = reason.trim().length >= MIN_REASON;

  // One key per opened cancel flow — a double-click or a retry after a network
  // failure carries the same key, and the server returns the already-cancelled
  // booking instead of issuing a second refund (§1.1).
  const idempotencyKey = useMemo(
    () => (typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${booking.id}-${Date.now()}`),
    [booking.id],
  );

  async function confirmCancel() {
    setCancelError(undefined);
    setView("processing");
    try {
      const updated = await api.hostCancel(booking.id, reason.trim(), idempotencyKey);
      setCancelled(updated);
      onCancelled(updated);
      setView("cancelled");
    } catch (e) {
      setView(handleCancelError(e));
    }
  }

  /**
   * The API names the cause precisely, in Arabic, for the partner. Rendering a
   * generic "try again" over the top of it throws that away — so every branch
   * here shows `error.message` and only decides what happens next (§5).
   */
  function handleCancelError(e: unknown): View {
    if (!(e instanceof ApiError)) {
      setCancelError({ message: t.states.errorBody, retryable: true });
      return "confirm";
    }
    if (e.code === "VALIDATION") {
      setReasonError(e.fields?.reason ?? e.message);
      return "reason";
    }
    if (STALE_CODES.has(e.code)) {
      onStale?.();
      setCancelError({ message: e.message, retryable: false });
      return "confirm";
    }
    // REFUND_FAILED: the gateway declined, so nothing happened — the booking is
    // still confirmed and no money moved. Retry later is the only offer; a
    // "cancel anyway" would strand a guest without their money, which is the
    // one outcome this whole flow exists to prevent (§5.1).
    setCancelError({
      message: e.message,
      retryable: true,
      hint: e.code === "REFUND_FAILED" ? b.refundFailedHint : undefined,
    });
    return "confirm";
  }

  /**
   * The three facts the partner cannot recover from, shown BEFORE they type
   * anything: the exact amount (straight off the API — no arithmetic here),
   * that they receive nothing, and that there is no un-cancel (§3).
   */
  const refundNotice = (
    <div className="rounded-2xl border border-status-rejected/25 bg-status-rejected/5 p-4">
      <div className="flex items-start gap-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-status-rejected/10 text-status-rejected">
          <AlertTriangle className="h-5 w-5" />
        </span>
        <div className="text-sm">
          <p className="font-bold text-ink">{b.refundFullNotice(formatCurrency(f.total, locale))}</p>
          <p className="mt-1 text-ink-muted">{b.partnerGetsNothing}</p>
          <p className="mt-0.5 font-medium text-status-rejected">{b.irreversible}</p>
        </div>
      </div>
    </div>
  );

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
            <Button className="flex-1" onClick={() => setView("confirm")} disabled={!reasonReady}>
              {b.continue}
            </Button>
          </>
        }
      >
        {refundNotice}

        <div className="my-5 flex items-center gap-3 rounded-2xl bg-brand-soft px-4 py-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-white text-brand">
            <BookOpen className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="font-bold text-ink">{booking.code}</div>
            <div className="truncate text-sm text-ink-muted">{booking.guestName}</div>
          </div>
          <MoneyText amount={f.total} className="font-bold text-ink" />
        </div>

        <p className="mb-3 text-sm text-ink-muted">{b.selectReason}</p>

        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-ink-faint">
            {b.reasonQuickFill}
          </span>
          {QUICK_REASONS.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => {
                setReason(r);
                setReasonError(undefined);
              }}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs font-medium transition",
                reason === r ? "border-brand bg-brand-soft text-ink" : "border-line text-ink-muted hover:bg-cream",
              )}
            >
              {r}
            </button>
          ))}
        </div>

        {/* Free text, not a fixed list: whatever lands here is what the guest
            reads, so the partner has to be able to say the actual thing. */}
        <Field label={b.reasonFieldLabel} required error={reasonError}>
          <textarea
            value={reason}
            onChange={(e) => {
              setReason(e.target.value);
              setReasonError(undefined);
            }}
            placeholder={b.reasonPlaceholder}
            rows={3}
            maxLength={500}
            className="w-full rounded-2xl border border-line bg-cream/40 px-4 py-3 text-sm outline-none focus:border-brand focus:bg-white"
          />
        </Field>
        {!reasonError && reason.trim().length > 0 && !reasonReady && (
          <p className="mt-1 text-xs text-status-rejected">{b.reasonTooShort}</p>
        )}
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
            {/* A non-retryable refusal means the booking moved on — offering the
                button again would only reproduce the same 409. */}
            {cancelError && !cancelError.retryable ? (
              <Button className="flex-1" onClick={onClose}>
                {t.common.close}
              </Button>
            ) : (
              <Button variant="danger" className="flex-1" onClick={confirmCancel}>
                {cancelError ? t.common.retry : b.confirmCancellation}
              </Button>
            )}
          </>
        }
      >
        {refundNotice}

        <div className="mt-4 rounded-2xl bg-cream px-4 py-3 text-sm">
          {/* Both figures come from the API. The partner's side is a flat zero —
              not "a fee applies": Mamsa forfeits its commission too, and the
              partner earns nothing at all from this booking. */}
          <Row label={b.guestRefundAmount} value={<MoneyText amount={f.total} className="font-bold text-status-rejected" />} />
          <Row label={b.yourEarnings} value={<MoneyText amount={0} className="font-bold text-status-rejected" />} />
        </div>

        <ul className="mt-4 space-y-3 text-sm text-ink">
          <Consequence icon={<UserX className="h-4 w-4 text-[#8A5FB0]" />} tone="bg-[#8A5FB0]/10">
            {b.consequenceRecord}
          </Consequence>
          <Consequence icon={<TrendingDown className="h-4 w-4 text-status-pending" />} tone="bg-status-pending/15">
            {b.consequenceRanking}
          </Consequence>
        </ul>

        <div className="mt-4 flex items-start gap-2 rounded-2xl bg-brand-soft/60 px-4 py-3 text-sm">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-ink-faint" />
          <span>
            <span className="text-ink-muted">{b.selectedReason}: </span>
            <span className="font-semibold text-ink">{reason.trim()}</span>
          </span>
        </div>

        {cancelError && (
          <div className="mt-4 rounded-2xl bg-status-rejected/10 px-4 py-3 text-sm text-status-rejected">
            <div className="flex items-start gap-2">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span className="font-medium">{cancelError.message}</span>
            </div>
            {cancelError.hint && <p className="mt-1 ps-6 text-ink-muted">{cancelError.hint}</p>}
          </div>
        )}
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
  if (view === "cancelled" && shown.cancellation) {
    const c = shown.cancellation;
    const settled = c.refundStatus === "completed";
    const byHost = c.type === "host";
    return (
      <Modal
        open
        onClose={onClose}
        size="lg"
        title={b.bookingTitle(shown.code)}
        footer={
          <>
            <Button variant="outline" className="flex-1" onClick={onClose}>{t.common.close}</Button>
            <Button className="flex-1">{b.messageGuest}</Button>
          </>
        }
      >
        {/*
          `processing` is the NORMAL first state — the gateway accepts the refund
          immediately and settles asynchronously — so this reads as reassurance,
          not a warning (§4). The money is already committed; there is nothing
          here to retry and nothing to block on.
        */}
        <div className="rounded-2xl border border-status-approved/30 bg-status-approved/10 p-4">
          <div className="flex items-start gap-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-status-approved/20 text-status-approved">
              <CheckCircle2 className="h-5 w-5" />
            </span>
            <div className="text-sm">
              <p className="font-bold text-ink">{b.cancelledTitle}</p>
              <p className="mt-1 text-ink">
                {settled
                  ? b.refundCompletedNotice(formatCurrency(c.refundAmount, locale))
                  : b.refundProcessingNotice(formatCurrency(c.refundAmount, locale))}
              </p>
              <p className="mt-1 text-xs text-ink-muted">{b.refundBankTiming}</p>
            </div>
          </div>
        </div>

        <div className="mt-5">
          <GuestHeader booking={shown} />
        </div>
        <DetailGrid booking={shown} locale={locale} only={["duration", "total"]} />

        <div className="my-4 flex flex-wrap gap-2">
          <Chip tone="bg-status-rejected/10 text-status-rejected">{b.cancelled}</Chip>
          <Chip tone="bg-status-pending/15 text-status-pending">
            {byHost ? b.hostCancellation : b.guestCancellation}
          </Chip>
          {settled && <Chip tone="bg-status-approved/15 text-status-approved">{b.refunded}</Chip>}
        </div>

        <div className="rounded-2xl border border-line bg-cream/40 p-4 text-sm">
          <div className="mb-3 flex items-center gap-2 font-bold text-ink">
            <Info className="h-4 w-4 text-ink-faint" /> {b.cancellationDetails}
          </div>
          <Row label={b.cancellationType} value={byHost ? b.hostCancellation : b.guestCancellation} />
          <Row label={b.cancellationReason} value={c.reason} />
          <Row label={b.cancellationDate} value={formatDateShort(c.date, locale)} />
          <Row label={b.refundAmount} value={<MoneyText amount={c.refundAmount} />} />
          <Row
            label={b.refundStatusLabel}
            value={
              <span className={settled ? "text-status-approved" : "text-ink"}>
                {settled ? b.completedStatus : b.processing}
              </span>
            }
          />

          <div className="mt-4 border-t border-line pt-3">
            <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-faint">{b.timeline}</div>
            <TimelineItem done label={b.tlBookingReceived} />
            {byHost && <TimelineItem done amber label={b.tlHostReported} />}
            <TimelineItem done label={b.tlRefundInitiated} />
            <TimelineItem done={settled} label={b.tlRefundCompleted} />
          </div>
        </div>

        {shown.notes && <NotesCard label={b.notes} text={shown.notes} />}
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

      <div className="my-4 flex flex-wrap items-center gap-2">
        {/* Tone comes from the one badge system — a hardcoded green here would
            paint an unpaid booking as if it were confirmed. */}
        <BookingBadge status={booking.status} />
        {booking.status === "pending_payment" ? (
          <Chip tone="bg-status-pending/15 text-status-pending">{b.awaitingPayment}</Chip>
        ) : booking.status !== "cancelled" ? (
          <Chip tone="bg-status-approved/15 text-status-approved">{b.paid}</Chip>
        ) : null}
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
  only?: ("duration" | "total" | "netBase" | "vat" | "share")[];
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
    // The total is VAT-inclusive, so the base and the tax are shown next to it
    // rather than leaving the partner to work out why their share is smaller.
    { key: "netBase", label: t.pricing.netBase, value: <MoneyText amount={booking.financials.netBase} precise /> },
    { key: "vat", label: t.pricing.vat, value: <MoneyText amount={booking.financials.vat} precise /> },
    { key: "share", label: b.yourShare, value: <MoneyText amount={booking.financials.partnerShare} precise /> },
  ];
  const rows = only ? all.filter((r) => only.includes(r.key as NonNullable<typeof only>[number])) : all;
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
