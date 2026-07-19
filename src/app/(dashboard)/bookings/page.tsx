"use client";

import { useState } from "react";
import { api } from "@/lib/api/client";
import { useAsync } from "@/lib/use-async";
import { useLocale } from "@/stores/locale-store";
import { useSearch } from "@/stores/search-store";
import { matchesQuery } from "@/lib/search";
import { Avatar } from "@/components/shared/avatar";
import { BookingBadge } from "@/components/shared/status-badge";
import { MoneyText } from "@/components/shared/typed-text";
import { EmptyState, ErrorState, LoadingSkeleton } from "@/components/shared/states";
import { formatDateShort } from "@/lib/format";
import { cn } from "@/lib/cn";
import type { Booking, BookingStatus } from "@/types";
import { BookingDetail } from "@/features/bookings/components/booking-detail";
import {
  Filter,
  LayoutGrid,
  List,
  ArrowRight,
  CheckCircle2,
  XCircle,
} from "lucide-react";

const TABS: (BookingStatus | "all")[] = ["all", "confirmed", "completed", "cancelled"];

export default function BookingsPage() {
  const { t, locale } = useLocale();
  const { data, loading, error, reload } = useAsync(() => api.listBookings());
  const [tab, setTab] = useState<(typeof TABS)[number]>("all");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [selected, setSelected] = useState<Booking | null>(null);
  const { query } = useSearch();

  const all = data ?? [];
  const list = all
    .filter((b) => tab === "all" || b.status === tab)
    .filter((b) => matchesQuery(query, b.guestName, b.code, b.unitName));
  const count = (s: (typeof TABS)[number]) => (s === "all" ? all.length : all.filter((b) => b.status === s).length);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink">{t.nav.bookings}</h1>
          <p className="mt-0.5 text-sm text-ink-muted">
            {t.bookings.reservationsTotal(all.length, list.length)}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* TODO backend: there is no /bookings/export endpoint in the contract —
              the old Export button was removed. Filters map to GET /bookings query params. */}
          <button className="inline-flex items-center gap-2 rounded-full border border-line bg-white px-4 py-2 text-sm font-medium text-ink hover:bg-cream">
            <Filter className="h-4 w-4" /> {t.bookings.filters}
          </button>
          <div className="flex rounded-full border border-line bg-white p-1">
            <button
              onClick={() => setView("grid")}
              className={cn("grid h-8 w-8 place-items-center rounded-full", view === "grid" ? "bg-brand text-white" : "text-ink-muted")}
              aria-label="grid"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setView("list")}
              className={cn("grid h-8 w-8 place-items-center rounded-full", view === "list" ? "bg-brand text-white" : "text-ink-muted")}
              aria-label="list"
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex flex-wrap items-center gap-1 rounded-full bg-white p-1 shadow-card sm:w-fit">
        {TABS.map((tb) => (
          <button
            key={tb}
            onClick={() => setTab(tb)}
            className={cn(
              "rounded-full px-4 py-1.5 text-sm font-medium transition",
              tab === tb ? "bg-brand text-white shadow-sm" : "text-ink-muted hover:text-ink",
            )}
          >
            {tb === "all" ? t.common.all : t.bookingStatus[tb]}{" "}
            <span className={cn("tabular-nums", tab === tb ? "text-white/80" : "text-ink-faint")}>({count(tb)})</span>
          </button>
        ))}
      </div>

      {loading ? (
        <LoadingSkeleton />
      ) : error ? (
        <ErrorState onRetry={reload} />
      ) : list.length === 0 ? (
        query.trim() ? (
          <EmptyState title={t.wiz.noResults} />
        ) : (
          <EmptyState title={t.bookings.emptyTitle} body={t.bookings.emptyBody} />
        )
      ) : view === "grid" ? (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {list.map((b) => (
            <BookingCard key={b.id} booking={b} locale={locale} onSelect={() => setSelected(b)} />
          ))}
        </div>
      ) : (
        <BookingTable list={list} locale={locale} onSelect={setSelected} />
      )}

      {selected && (
        <BookingDetail
          booking={selected}
          onClose={() => setSelected(null)}
          onCancelled={(updated) => {
            setSelected(updated);
            reload();
          }}
        />
      )}
    </div>
  );
}

const fill: Record<BookingStatus, number> = { confirmed: 100, completed: 100, cancelled: 12 };

function BookingCard({ booking: b, locale, onSelect }: { booking: Booking; locale: "ar" | "en"; onSelect: () => void }) {
  const { t } = useLocale();
  return (
    <div className="flex flex-col rounded-3xl bg-white p-5 shadow-card transition hover:shadow-modal">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          <Avatar name={b.guestName} className="h-11 w-11 text-sm" />
          <div>
            <div className="font-bold text-ink">{b.guestName}</div>
            <div className="text-xs text-ink-faint">{b.code}</div>
          </div>
        </div>
        <BookingBadge status={b.status} />
      </div>

      <div className="mt-4">
        <div className="text-xs text-ink-faint">{t.bookings.property}</div>
        <div className="font-semibold text-ink">{b.unitName}</div>
      </div>

      <div className="mt-4 flex items-center justify-between text-sm">
        <div>
          <div className="text-xs text-ink-faint">{t.bookings.checkIn}</div>
          <div className="font-medium text-ink">{formatDateShort(b.checkIn, locale)}</div>
        </div>
        <ArrowRight className="h-4 w-4 text-ink-faint" />
        <div className="text-end">
          <div className="text-xs text-ink-faint">{t.bookings.checkOut}</div>
          <div className="font-medium text-ink">{formatDateShort(b.checkOut, locale)}</div>
        </div>
      </div>

      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-cream">
        <div className="h-full rounded-full bg-brand" style={{ width: `${fill[b.status]}%` }} />
      </div>

      <div className="mt-4 flex items-end justify-between">
        <div>
          <div className="text-xs text-ink-muted">{t.bookings.nights(b.nights)}</div>
          <MoneyText amount={b.financials.total} className="text-xl font-bold text-ink" />
        </div>
        <button
          onClick={onSelect}
          className="rounded-full bg-brand px-5 py-2 text-sm font-semibold text-white transition hover:bg-brand-dark"
        >
          {t.common.view}
        </button>
      </div>
    </div>
  );
}

const statusIcon: Record<BookingStatus, React.ReactNode> = {
  confirmed: <CheckCircle2 className="h-4 w-4 text-status-approved" />,
  completed: <CheckCircle2 className="h-4 w-4 text-blue-600" />,
  cancelled: <XCircle className="h-4 w-4 text-status-rejected" />,
};

function BookingTable({ list, locale, onSelect }: { list: Booking[]; locale: "ar" | "en"; onSelect: (b: Booking) => void }) {
  const { t } = useLocale();
  return (
    <div className="overflow-hidden rounded-3xl bg-white shadow-card">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[820px] text-sm">
          <thead>
            <tr className="border-b border-line text-xs uppercase tracking-wide text-ink-faint">
              <th className="py-3 ps-5 text-start font-semibold">{t.bookings.colGuest}</th>
              <th className="py-3 text-start font-semibold">{t.bookings.colBookingId}</th>
              <th className="py-3 text-start font-semibold">{t.bookings.colProperty}</th>
              <th className="py-3 text-start font-semibold">{t.bookings.colDates}</th>
              <th className="py-3 text-start font-semibold">{t.bookings.colNights}</th>
              <th className="py-3 text-start font-semibold">{t.bookings.colTotal}</th>
              <th className="py-3 pe-5 text-start font-semibold">{t.bookings.colStatus}</th>
            </tr>
          </thead>
          <tbody>
            {list.map((b) => (
              <tr
                key={b.id}
                onClick={() => onSelect(b)}
                className="cursor-pointer border-b border-line/60 last:border-0 hover:bg-cream/40"
              >
                <td className="py-3 ps-5">
                  <div className="flex items-center gap-3">
                    <Avatar name={b.guestName} className="h-9 w-9 text-xs" />
                    <span className="font-semibold text-ink">{b.guestName}</span>
                  </div>
                </td>
                <td className="py-3 text-ink-faint">{b.code}</td>
                <td className="py-3 font-medium text-ink">{b.unitName}</td>
                <td className="py-3 text-ink-muted" dir="ltr">
                  {formatDateShort(b.checkIn, locale)} → {formatDateShort(b.checkOut, locale)}
                </td>
                <td className="py-3 tabular-nums text-ink-muted">{b.nights}</td>
                <td className="py-3">
                  <MoneyText amount={b.financials.total} className="font-bold text-ink" />
                </td>
                <td className="py-3 pe-5">
                  <span className="inline-flex items-center gap-1.5">
                    {statusIcon[b.status]}
                    <BookingBadge status={b.status} />
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
