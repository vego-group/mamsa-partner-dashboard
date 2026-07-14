"use client";

import { useMemo, useState } from "react";
import { api } from "@/lib/api/client";
import { useAsync } from "@/lib/use-async";
import { useLocale } from "@/stores/locale-store";
import { EmptyState, ErrorState, LoadingSkeleton } from "@/components/shared/states";
import type { CalendarDay, DayStatus } from "@/types";
import { cn } from "@/lib/cn";
import { RefreshCw, AlertCircle, Check, ChevronLeft, ChevronRight } from "lucide-react";

const dayColors: Record<DayStatus, string> = {
  available: "bg-status-approved/15 text-status-approved hover:bg-status-approved/25",
  booked: "bg-brand-dark text-white",
  blocked: "bg-status-draft/15 text-ink-muted hover:bg-status-draft/25",
  external: "bg-[#ECE6F6] text-[#7C5CBF]",
};

const legend: { key: DayStatus; dot: string }[] = [
  { key: "available", dot: "bg-status-approved" },
  { key: "booked", dot: "bg-brand-dark" },
  { key: "blocked", dot: "bg-status-draft" },
  { key: "external", dot: "bg-[#8A5FB0]" },
];

export default function CalendarPage() {
  const { t, locale } = useLocale();
  const c = t.calendar;
  const units = useAsync(() => api.listUnits());
  const approved = (units.data ?? []).filter((u) => u.status === "approved");
  const active = approved[0]?.id;

  const cal = useAsync(() => (active ? api.getCalendar(active, "2026-07") : Promise.resolve([])), [active]);
  const feeds = useAsync(() => (active ? api.listFeeds(active) : Promise.resolve([])), [active]);

  const [viewDate, setViewDate] = useState(new Date(2026, 6, 1)); // July 2026 (mock month)
  const [overrides, setOverrides] = useState<Record<string, DayStatus>>({});
  const [selected, setSelected] = useState<string[]>([]);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const statusMap = useMemo(() => {
    const m: Record<string, DayStatus> = {};
    (cal.data ?? []).forEach((d: CalendarDay) => (m[d.date] = d.status));
    return m;
  }, [cal.data]);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstWeekday = new Date(year, month, 1).getDay();
  const monthLabel = new Intl.DateTimeFormat(locale === "ar" ? "ar" : "en-US", {
    month: "long",
    year: "numeric",
    calendar: "gregory",
    numberingSystem: "latn",
  }).format(viewDate);

  function statusOf(date: string): DayStatus {
    return overrides[date] ?? statusMap[date] ?? "available";
  }
  function dateStr(day: number) {
    return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }
  function toggleDay(date: string) {
    const s = statusOf(date);
    if (s === "booked" || s === "external") return;
    setSelected((prev) => (prev.includes(date) ? prev.filter((x) => x !== date) : [...prev, date]));
  }
  function apply(status: DayStatus) {
    setOverrides((o) => ({ ...o, ...Object.fromEntries(selected.map((d) => [d, status])) }));
    if (active) status === "blocked" ? api.blockDates(active, selected) : api.unblockDates(active, selected);
    setSelected([]);
  }
  function quickBlock() {
    if (!from || !to) return;
    const start = new Date(from);
    const end = new Date(to);
    const dates: string[] = [];
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      dates.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`);
    }
    setOverrides((o) => ({ ...o, ...Object.fromEntries(dates.map((d) => [d, "blocked" as DayStatus])) }));
    setFrom("");
    setTo("");
  }

  if (units.loading) return <LoadingSkeleton rows={3} />;
  if (approved.length === 0) return <EmptyState title={t.states.notFound} />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink">{c.title}</h1>
          <p className="mt-0.5 text-sm text-ink-muted">{c.subtitle}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 rounded-full bg-white p-1 shadow-card">
            <button onClick={() => setViewDate(new Date(year, month - 1, 1))} className="grid h-8 w-8 place-items-center rounded-full text-ink-muted hover:bg-cream">
              <ChevronLeft className="h-4 w-4 rtl:rotate-180" />
            </button>
            <span className="min-w-32 text-center text-sm font-semibold text-ink">{monthLabel}</span>
            <button onClick={() => setViewDate(new Date(year, month + 1, 1))} className="grid h-8 w-8 place-items-center rounded-full text-ink-muted hover:bg-cream">
              <ChevronRight className="h-4 w-4 rtl:rotate-180" />
            </button>
          </div>
          <button
            onClick={() => { cal.reload(); feeds.reload(); }}
            className="inline-flex items-center gap-2 rounded-full border border-line bg-white px-4 py-2 text-sm font-medium text-ink hover:bg-cream"
          >
            <RefreshCw className="h-4 w-4" /> {c.syncIcal}
          </button>
        </div>
      </div>

      {/* Calendar card */}
      <div className="rounded-3xl bg-white p-5 shadow-card sm:p-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-4 text-sm text-ink-muted">
            {legend.map((l) => (
              <span key={l.key} className="flex items-center gap-2">
                <span className={cn("h-2.5 w-2.5 rounded-full", l.dot)} />
                {t.dayStatus[l.key]}
              </span>
            ))}
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-status-approved/15 px-3 py-1 text-xs font-semibold text-status-approved">
            <Check className="h-3.5 w-3.5" /> {c.icalSynced}
          </span>
        </div>

        {cal.loading ? (
          <LoadingSkeleton rows={4} />
        ) : cal.error ? (
          <ErrorState onRetry={cal.reload} />
        ) : (
          <>
            <div className="grid grid-cols-7 gap-2 sm:gap-3">
              {c.weekdays.map((d) => (
                <div key={d} className="pb-1 text-center text-xs font-medium text-ink-faint">{d}</div>
              ))}
              {Array.from({ length: firstWeekday }).map((_, i) => (
                <div key={`pad-${i}`} />
              ))}
              {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
                const date = dateStr(day);
                const s = statusOf(date);
                const isSel = selected.includes(date);
                const clickable = s !== "booked" && s !== "external";
                return (
                  <button
                    key={date}
                    onClick={() => toggleDay(date)}
                    disabled={!clickable}
                    className={cn(
                      "grid aspect-square place-items-center rounded-2xl text-sm font-semibold transition",
                      isSel ? "bg-amber-500 text-white" : dayColors[s],
                      !clickable && "cursor-default",
                    )}
                  >
                    {day}
                  </button>
                );
              })}
            </div>

            {selected.length > 0 && (
              <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-cream px-4 py-3">
                <span className="text-sm font-semibold text-ink">{c.datesSelected(selected.length)}</span>
                <div className="flex items-center gap-2">
                  <button onClick={() => setSelected([])} className="rounded-full px-4 py-1.5 text-sm font-medium text-ink-muted hover:text-ink">
                    {c.clear}
                  </button>
                  <button onClick={() => apply("blocked")} className="rounded-full bg-status-rejected px-4 py-1.5 text-sm font-semibold text-white hover:brightness-95">
                    {c.block}
                  </button>
                  <button onClick={() => apply("available")} className="rounded-full bg-brand-dark px-4 py-1.5 text-sm font-semibold text-white hover:brightness-110">
                    {c.makeAvailable}
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Bottom cards */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl bg-white p-6 shadow-card">
          <h3 className="mb-4 text-lg font-bold text-ink">{c.icalIntegrations}</h3>
          <div className="space-y-3">
            {(feeds.data ?? []).map((f, i) => (
              <div key={f.id} className="flex items-center justify-between rounded-2xl bg-cream/50 px-4 py-3">
                <div>
                  <div className="font-semibold text-ink">{f.source}</div>
                  <div className="text-xs text-ink-faint">{c.lastSync(c.syncTimes[i] ?? c.syncTimes[0])}</div>
                </div>
                {f.status === "synced" ? (
                  <span className="rounded-full bg-status-approved/15 px-3 py-1 text-xs font-semibold text-status-approved">{c.synced}</span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-status-rejected/15 px-3 py-1 text-xs font-semibold text-status-rejected">
                    <AlertCircle className="h-3 w-3" /> {c.error}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-card">
          <h3 className="text-lg font-bold text-ink">{c.quickBlock}</h3>
          <p className="mt-1 text-sm text-ink-muted">{c.quickBlockSub}</p>
          <div className="mt-4 space-y-3">
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="w-full rounded-xl border border-line bg-cream/40 px-4 py-2.5 text-sm text-ink outline-none focus:border-brand focus:bg-white"
            />
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="w-full rounded-xl border border-line bg-cream/40 px-4 py-2.5 text-sm text-ink outline-none focus:border-brand focus:bg-white"
            />
            <button
              onClick={quickBlock}
              disabled={!from || !to}
              className="w-full rounded-xl bg-brand-dark py-2.5 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-50"
            >
              {c.blockSelectedDates}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
