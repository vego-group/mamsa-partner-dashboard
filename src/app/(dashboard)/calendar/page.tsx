"use client";

import { useMemo, useState } from "react";
import { api, ApiError } from "@/lib/api/client";
import { useAsync } from "@/lib/use-async";
import { useLocale } from "@/stores/locale-store";
import { EmptyState, ErrorState, LoadingSkeleton } from "@/components/shared/states";
import { icalFeedSchema } from "@/lib/schema";
import type { CalendarDay, DayStatus, ICalFeed } from "@/types";
import type { Locale } from "@/lib/i18n";
import { cn } from "@/lib/cn";
import {
  RefreshCw,
  AlertCircle,
  Check,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  Link2,
  Copy,
} from "lucide-react";

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

const inputCls =
  "w-full rounded-xl border border-line bg-cream/40 px-4 py-2.5 text-sm text-ink outline-none placeholder:text-ink-faint focus:border-brand focus:bg-white";

function formatSync(iso: string, locale: Locale): string {
  return new Intl.DateTimeFormat(locale === "ar" ? "ar" : "en-US", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
    calendar: "gregory",
    numberingSystem: "latn",
  }).format(new Date(iso));
}

export default function CalendarPage() {
  const { t, locale } = useLocale();
  const c = t.calendar;
  const units = useAsync(() => api.listUnits());
  const approved = (units.data ?? []).filter((u) => u.status === "approved");
  const active = approved[0]?.id;

  // The visible month drives the backend query. Defaults to the current month
  // (the backend also defaults to it), and the grid refetches whenever it changes.
  const [viewDate, setViewDate] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const monthKey = `${year}-${String(month + 1).padStart(2, "0")}`; // YYYY-MM

  const cal = useAsync(
    () => (active ? api.getCalendar(active, monthKey) : Promise.resolve([])),
    [active, monthKey],
  );
  const feeds = useAsync(() => (active ? api.listFeeds(active) : Promise.resolve([])), [active]);
  const icalExport = useAsync(
    () => (active ? api.getIcalExport(active) : Promise.resolve({ url: "" })),
    [active],
  );

  const [overrides, setOverrides] = useState<Record<string, DayStatus>>({});
  const [selected, setSelected] = useState<string[]>([]);
  const [actionError, setActionError] = useState<string>();
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [blockReason, setBlockReason] = useState("");

  // Switching months clears the stale selection + optimistic overrides; the grid
  // itself refetches from the backend through the monthKey dependency above.
  function goToMonth(next: Date) {
    setViewDate(next);
    setSelected([]);
    setOverrides({});
    setActionError(undefined);
  }

  const statusMap = useMemo(() => {
    const m: Record<string, DayStatus> = {};
    (cal.data ?? []).forEach((d: CalendarDay) => (m[d.date] = d.status));
    return m;
  }, [cal.data]);
  const dayMeta = useMemo(() => {
    const m: Record<string, CalendarDay> = {};
    (cal.data ?? []).forEach((d: CalendarDay) => (m[d.date] = d));
    return m;
  }, [cal.data]);

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

  /** Block/unblock the selection — handles the backend 409 DATE_UNAVAILABLE. */
  async function apply(status: Extract<DayStatus, "blocked" | "available">) {
    if (!active) return;
    setActionError(undefined);
    try {
      if (status === "blocked") await api.blockDates(active, selected);
      else await api.unblockDates(active, selected);
      setOverrides((o) => ({ ...o, ...Object.fromEntries(selected.map((d) => [d, status])) }));
      setSelected([]);
      cal.reload(); // reconcile with the server's authoritative grid
    } catch (e) {
      setActionError(e instanceof ApiError ? e.message : t.states.errorBody);
    }
  }

  async function quickBlock() {
    if (!from || !to || !active) return;
    const start = new Date(from);
    const end = new Date(to);
    const dates: string[] = [];
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      dates.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`);
    }
    setActionError(undefined);
    try {
      await api.blockDates(active, dates, blockReason.trim() || undefined);
      setOverrides((o) => ({ ...o, ...Object.fromEntries(dates.map((d) => [d, "blocked" as DayStatus])) }));
      setFrom("");
      setTo("");
      setBlockReason("");
      cal.reload(); // reconcile with the server's authoritative grid
    } catch (e) {
      setActionError(e instanceof ApiError ? e.message : t.states.errorBody);
    }
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
            <button onClick={() => goToMonth(new Date(year, month - 1, 1))} className="grid h-8 w-8 place-items-center rounded-full text-ink-muted hover:bg-cream">
              <ChevronLeft className="h-4 w-4 rtl:rotate-180" />
            </button>
            <span className="min-w-32 text-center text-sm font-semibold text-ink">{monthLabel}</span>
            <button onClick={() => goToMonth(new Date(year, month + 1, 1))} className="grid h-8 w-8 place-items-center rounded-full text-ink-muted hover:bg-cream">
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
                const meta = dayMeta[date];
                const isSel = selected.includes(date);
                const clickable = s !== "booked" && s !== "external";
                const title =
                  s === "booked" ? meta?.bookingCode :
                  s === "external" ? meta?.source :
                  s === "blocked" ? meta?.reason ?? undefined : undefined;
                return (
                  <button
                    key={date}
                    onClick={() => toggleDay(date)}
                    disabled={!clickable}
                    title={title}
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

            {actionError && (
              <div className="mt-4 flex items-center gap-2 rounded-2xl bg-status-rejected/10 px-4 py-3 text-sm text-status-rejected">
                <AlertCircle className="h-4 w-4 shrink-0" /> {actionError}
              </div>
            )}

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
        <FeedsCard
          unitId={active!}
          feeds={feeds.data ?? []}
          locale={locale}
          onChanged={() => { feeds.reload(); cal.reload(); }}
        />

        <div className="space-y-6">
          {/* iCal export — URL is server-minted (§5.5), never built client-side */}
          <div className="rounded-3xl bg-white p-6 shadow-card">
            <h3 className="text-lg font-bold text-ink">{c.exportTitle}</h3>
            <p className="mt-1 text-sm text-ink-muted">{c.exportSub}</p>
            <ExportUrl url={icalExport.data?.url ?? ""} copiedLabel={t.common.copied} copyLabel={t.common.copyLink} />
          </div>

          <div className="rounded-3xl bg-white p-6 shadow-card">
            <h3 className="text-lg font-bold text-ink">{c.quickBlock}</h3>
            <p className="mt-1 text-sm text-ink-muted">{c.quickBlockSub}</p>
            <div className="mt-4 space-y-3">
              <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className={inputCls} />
              <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className={inputCls} />
              <input
                value={blockReason}
                onChange={(e) => setBlockReason(e.target.value.slice(0, 255))}
                placeholder={c.blockReasonPh}
                className={inputCls}
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
    </div>
  );
}

/* ---------------- iCal feeds (per-feed sync/delete + add form, §5.4) ---------------- */
function FeedsCard({
  unitId,
  feeds,
  locale,
  onChanged,
}: {
  unitId: string;
  feeds: ICalFeed[];
  locale: Locale;
  onChanged: () => void;
}) {
  const { t } = useLocale();
  const c = t.calendar;
  const [source, setSource] = useState("");
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState<string>(); // feedId being synced/deleted, or "add"
  const [error, setError] = useState<string>();

  async function run(key: string, fn: () => Promise<unknown>) {
    setBusy(key);
    setError(undefined);
    try {
      await fn();
      onChanged();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : t.states.errorBody);
    } finally {
      setBusy(undefined);
    }
  }

  function addFeed() {
    const parsed = icalFeedSchema.safeParse({ source: source.trim(), url: url.trim() });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message);
      return;
    }
    void run("add", async () => {
      await api.addFeed(unitId, parsed.data.source, parsed.data.url);
      setSource("");
      setUrl("");
    });
  }

  return (
    <div className="rounded-3xl bg-white p-6 shadow-card">
      <h3 className="mb-4 text-lg font-bold text-ink">{c.icalIntegrations}</h3>
      <div className="space-y-3">
        {feeds.map((f) => (
          <div key={f.id} className="flex items-center justify-between gap-3 rounded-2xl bg-cream/50 px-4 py-3">
            <div className="min-w-0">
              <div className="truncate font-semibold text-ink">{f.source}</div>
              <div className="text-xs text-ink-faint">
                {f.lastSync ? c.lastSync(formatSync(f.lastSync, locale)) : c.lastSyncNever}
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {f.status === "synced" ? (
                <span className="rounded-full bg-status-approved/15 px-3 py-1 text-xs font-semibold text-status-approved">{c.synced}</span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-status-rejected/15 px-3 py-1 text-xs font-semibold text-status-rejected">
                  <AlertCircle className="h-3 w-3" /> {c.error}
                </span>
              )}
              <button
                onClick={() => run(f.id, () => api.syncFeed(unitId, f.id))}
                title={c.syncNow}
                className="grid h-8 w-8 place-items-center rounded-full text-ink-muted transition hover:bg-cream hover:text-brand"
              >
                <RefreshCw className={cn("h-4 w-4", busy === f.id && "animate-spin")} />
              </button>
              <button
                onClick={() => run(`del-${f.id}`, () => api.deleteFeed(unitId, f.id))}
                title={t.common.delete}
                className="grid h-8 w-8 place-items-center rounded-full text-ink-muted transition hover:bg-status-rejected/10 hover:text-status-rejected"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add feed — backend validates the URL is a real .ics (400 INVALID_ICAL) */}
      <div className="mt-4 border-t border-line pt-4">
        <div className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-ink">
          <Plus className="h-4 w-4 text-brand" /> {c.addFeed}
        </div>
        <div className="space-y-2">
          <input value={source} onChange={(e) => setSource(e.target.value)} placeholder={c.feedSourcePh} className={inputCls} />
          <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder={c.feedUrlPh} dir="ltr" className={inputCls} />
          {error && <p className="text-xs text-status-rejected">{error}</p>}
          <button
            onClick={addFeed}
            disabled={busy === "add" || !source.trim() || !url.trim()}
            className="w-full rounded-xl border-2 border-brand py-2 text-sm font-semibold text-brand transition hover:bg-brand-soft disabled:opacity-50"
          >
            {busy === "add" ? "…" : c.add}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Export URL with copy ---------------- */
function ExportUrl({ url, copyLabel, copiedLabel }: { url: string; copyLabel: string; copiedLabel: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="mt-4 flex items-center gap-2 rounded-xl border border-line bg-cream/40 px-3 py-2.5">
      <Link2 className="h-4 w-4 shrink-0 text-ink-faint" />
      <span dir="ltr" className="flex-1 truncate text-sm text-ink-muted">{url || "…"}</span>
      <button
        onClick={() => {
          navigator.clipboard?.writeText(url);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        }}
        title={copied ? copiedLabel : copyLabel}
        className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-ink-muted transition hover:bg-cream hover:text-brand"
      >
        {copied ? <Check className="h-4 w-4 text-status-approved" /> : <Copy className="h-4 w-4" />}
      </button>
    </div>
  );
}
