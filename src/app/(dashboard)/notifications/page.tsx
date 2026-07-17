"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/api/client";
import { useAsync } from "@/lib/use-async";
import { useLocale } from "@/stores/locale-store";
import { ErrorState, LoadingSkeleton } from "@/components/shared/states";
import { formatDateShort } from "@/lib/format";
import { cn } from "@/lib/cn";
import type { AppNotification, NotificationType } from "@/types";
import type { Locale, Dict } from "@/lib/i18n";
import {
  CheckCheck,
  BookOpen,
  CheckCircle2,
  XCircle,
  RefreshCw,
  AlertCircle,
  Bell,
} from "lucide-react";

/**
 * §8 v1.2 — the API sends exactly five types with ready Arabic strings.
 * Grouping (today/yesterday/earlier), time labels and the category rollup
 * below are frontend presentation derived from `type` + `createdAt`.
 */
type UiCategory = "booking" | "units" | "alert";
const CATS: (UiCategory | "all")[] = ["all", "booking", "units", "alert"];

const typeCategory: Record<NotificationType, UiCategory> = {
  new_booking: "booking",
  unit_approved: "units",
  unit_rejected: "units",
  sync_failed: "alert",
  host_cancellation: "alert",
};

const typeStyle: Record<NotificationType, { icon: typeof Bell; tone: string }> = {
  new_booking: { icon: BookOpen, tone: "bg-brand-soft text-brand" },
  unit_approved: { icon: CheckCircle2, tone: "bg-status-approved/15 text-status-approved" },
  unit_rejected: { icon: XCircle, tone: "bg-status-rejected/10 text-status-rejected" },
  sync_failed: { icon: RefreshCw, tone: "bg-status-pending/15 text-status-pending" },
  host_cancellation: { icon: AlertCircle, tone: "bg-status-rejected/10 text-status-rejected" },
};

/**
 * The backend sends types beyond the §8 five (staging: `partner_approved` on
 * first sign-in) — an unknown type must not crash the page. It renders with a
 * neutral bell style and belongs to no category, so it appears under "all".
 */
const fallbackStyle = { icon: Bell, tone: "bg-brand-soft text-brand" };

function styleOf(type: AppNotification["type"]) {
  return typeStyle[type as NotificationType] ?? fallbackStyle;
}

function categoryOf(type: AppNotification["type"]): UiCategory | undefined {
  return typeCategory[type as NotificationType];
}

type Group = "today" | "yesterday" | "earlier";
const GROUPS: Group[] = ["today", "yesterday", "earlier"];

/**
 * Notification `href` comes from the backend. This dashboard is served at the
 * domain root (`partner.mamsaa.com/units/...`), but the backend prefixes hrefs
 * with `/partner` (`/partner/units/19/edit`) — which matches no route here and
 * hard-404s. Normalize before navigating: drop an absolute origin, strip a
 * leading `/partner`, and send booking deep-links (rendered as a modal, not a
 * page) to the bookings list. Reported to backend to align the hrefs too.
 */
function normalizeHref(href: string): string {
  let path = href || "/overview";
  if (/^https?:\/\//i.test(path)) {
    try {
      path = new URL(path).pathname;
    } catch {
      /* keep as-is */
    }
  }
  path = path.replace(/^\/partner(?=\/|$)/, ""); // strip the /partner prefix
  path = path.replace(/^\/bookings\/[^/]+$/, "/bookings"); // detail is a modal, not a route
  path = path.replace(/^\/dashboard(?=\/|$)/, "/overview"); // backend "dashboard" home = our /overview
  return path || "/overview";
}

function startOfDay(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

function groupOf(createdAt: string): Group {
  const diffDays = Math.floor((startOfDay(new Date()) - startOfDay(new Date(createdAt))) / 86_400_000);
  if (diffDays <= 0) return "today";
  if (diffDays === 1) return "yesterday";
  return "earlier";
}

function timeLabel(createdAt: string, locale: Locale, t: Dict): string {
  const time = new Intl.DateTimeFormat(locale === "ar" ? "ar" : "en-US", {
    hour: "numeric",
    minute: "2-digit",
    numberingSystem: "latn",
  }).format(new Date(createdAt));
  const g = groupOf(createdAt);
  if (g === "today") return `${t.notif.groupToday}، ${time}`;
  if (g === "yesterday") return `${t.notif.groupYesterday}، ${time}`;
  return `${formatDateShort(createdAt, locale)}، ${time}`;
}

export default function NotificationsPage() {
  const { t, locale } = useLocale();
  const n = t.notif;
  const router = useRouter();
  const { data, loading, error, reload, setData } = useAsync(() => api.listNotifications());
  const [tab, setTab] = useState<(typeof CATS)[number]>("all");
  const [markError, setMarkError] = useState<string>();

  const all = data ?? [];
  const unread = all.filter((x) => !x.read).length;
  const catCount = (c: (typeof CATS)[number]) =>
    c === "all" ? all.length : all.filter((x) => categoryOf(x.type) === c).length;
  const shown = all.filter((x) => tab === "all" || categoryOf(x.type) === tab);

  async function markAll() {
    setMarkError(undefined);
    try {
      await api.markAllRead();
      setData(all.map((x) => ({ ...x, read: true })));
    } catch (e) {
      setMarkError(e instanceof ApiError ? e.message : t.states.errorBody);
    }
  }

  const catLabel: Record<(typeof CATS)[number], string> = {
    all: t.common.all,
    booking: n.catBooking,
    units: n.catUnits,
    alert: n.catAlerts,
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-ink">{t.nav.notifications}</h1>
          <p className="mt-0.5 text-sm text-ink-muted">{n.unreadTotal(unread, all.length)}</p>
        </div>
        {unread > 0 && (
          <button
            onClick={markAll}
            className="inline-flex items-center gap-2 rounded-full border border-line bg-white px-4 py-2 text-sm font-semibold text-ink hover:bg-cream"
          >
            <CheckCheck className="h-4 w-4" /> {n.markAllRead}
          </button>
        )}
      </div>

      {markError && <p className="text-sm text-status-rejected">{markError}</p>}

      {loading ? (
        <LoadingSkeleton />
      ) : error ? (
        <ErrorState onRetry={reload} />
      ) : (
        <>
          {/* Summary cards — category rollup derived from `type` */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <SummaryCard label={n.cardUnread} count={unread} tone="bg-brand-soft text-brand" highlight />
            <SummaryCard label={n.cardBookings} count={catCount("booking")} tone="bg-status-approved/15 text-status-approved" />
            <SummaryCard label={n.cardUnits} count={catCount("units")} tone="bg-status-approved/15 text-status-approved" />
            <SummaryCard label={n.cardAlerts} count={catCount("alert")} tone="bg-status-rejected/10 text-status-rejected" />
          </div>

          {/* Filter tabs */}
          <div className="flex flex-wrap items-center gap-1 rounded-full bg-white p-1 shadow-card sm:w-fit">
            {CATS.map((c) => (
              <button
                key={c}
                onClick={() => setTab(c)}
                className={cn(
                  "rounded-full px-4 py-1.5 text-sm font-medium transition",
                  tab === c ? "bg-brand text-white shadow-sm" : "text-ink-muted hover:text-ink",
                )}
              >
                {catLabel[c]}{" "}
                <span className={cn("tabular-nums", tab === c ? "text-white/80" : "text-ink-faint")}>({catCount(c)})</span>
              </button>
            ))}
          </div>

          {/* Grouped list — grouping computed from createdAt */}
          <div className="space-y-6">
            {GROUPS.map((g) => {
              const items = shown.filter((x) => groupOf(x.createdAt) === g);
              if (items.length === 0) return null;
              const groupHeading = { today: n.groupToday, yesterday: n.groupYesterday, earlier: n.groupEarlier }[g];
              return (
                <div key={g} className="space-y-3">
                  <div className="text-xs font-semibold uppercase tracking-wide text-ink-faint">{groupHeading}</div>
                  {items.map((item) => (
                    <NotificationRow
                      key={item.id}
                      item={item}
                      label={timeLabel(item.createdAt, locale, t)}
                      onOpen={() => {
                        // Mark read optimistically + fire-and-forget to the API;
                        // navigation must not wait on (or fail with) this call.
                        if (!item.read) {
                          setData(all.map((x) => (x.id === item.id ? { ...x, read: true } : x)));
                          api.markRead(item.id).catch(() => {});
                        }
                        router.push(normalizeHref(item.href));
                      }}
                    />
                  ))}
                </div>
              );
            })}
            {shown.length === 0 && (
              <div className="grid place-items-center gap-2 rounded-2xl bg-white py-16 text-center shadow-card">
                <Bell className="h-6 w-6 text-ink-faint" />
                <p className="text-sm text-ink-muted">{n.empty}</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function SummaryCard({ label, count, tone, highlight }: { label: string; count: number; tone: string; highlight?: boolean }) {
  return (
    <div className={cn("flex items-center gap-3 rounded-2xl bg-white p-4 shadow-card", highlight && "ring-2 ring-brand/40")}>
      <span className={cn("grid h-10 w-10 place-items-center rounded-full text-sm font-bold tabular-nums", tone)}>{count}</span>
      <span className="font-semibold text-ink">{label}</span>
    </div>
  );
}

function NotificationRow({
  item,
  label,
  onOpen,
}: {
  item: AppNotification;
  label: string;
  onOpen: () => void;
}) {
  const cfg = styleOf(item.type);
  const Icon = cfg.icon;
  return (
    <div
      onClick={onOpen}
      className={cn(
        "flex cursor-pointer gap-4 rounded-2xl border border-line bg-white p-4 shadow-card transition hover:shadow-modal",
        !item.read && "bg-brand-soft/20",
      )}
    >
      <span className={cn("grid h-11 w-11 shrink-0 place-items-center rounded-full", cfg.tone)}>
        <Icon className="h-5 w-5" />
      </span>

      <div className="min-w-0 flex-1">
        {/* title/body are ready Arabic strings from the backend — rendered as-is */}
        <div className="font-bold text-ink">{item.title}</div>
        <p className="mt-0.5 text-sm text-ink-muted">{item.body}</p>
        <div className="mt-1.5 text-xs text-ink-faint">{label}</div>
      </div>

      {!item.read && <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-brand" />}
    </div>
  );
}
