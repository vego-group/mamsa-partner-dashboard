"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api/client";
import { useAsync } from "@/lib/use-async";
import { useLocale } from "@/stores/locale-store";
import { Avatar } from "@/components/shared/avatar";
import { ErrorState, LoadingSkeleton } from "@/components/shared/states";
import { cn } from "@/lib/cn";
import type { AppNotification, NotificationCategory, NotificationGroup } from "@/types";
import {
  CheckCheck,
  BookOpen,
  Star,
  DollarSign,
  AlertCircle,
  RefreshCw,
  Bell,
  X,
} from "lucide-react";

const CATS: (NotificationCategory | "all")[] = ["all", "booking", "review", "payment", "alert", "system"];
const GROUPS: NotificationGroup[] = ["today", "yesterday", "earlier"];

const catConfig: Record<NotificationCategory, { icon: typeof Bell; tone: string }> = {
  booking: { icon: BookOpen, tone: "bg-brand-soft text-brand" },
  review: { icon: Star, tone: "bg-status-pending/15 text-status-pending" },
  payment: { icon: DollarSign, tone: "bg-status-approved/15 text-status-approved" },
  alert: { icon: AlertCircle, tone: "bg-status-rejected/10 text-status-rejected" },
  system: { icon: RefreshCw, tone: "bg-[#8A5FB0]/12 text-[#8A5FB0]" },
};

const metaClass = { green: "text-status-approved", red: "text-status-rejected", muted: "text-ink-faint" };

export default function NotificationsPage() {
  const { t, locale } = useLocale();
  const n = t.notif;
  const router = useRouter();
  const { data, loading, error, reload, setData } = useAsync(() => api.listNotifications());
  const [tab, setTab] = useState<(typeof CATS)[number]>("all");

  const all = data ?? [];
  const unread = all.filter((x) => !x.read).length;
  const catCount = (c: (typeof CATS)[number]) => (c === "all" ? all.length : all.filter((x) => x.category === c).length);
  const shown = all.filter((x) => tab === "all" || x.category === tab);

  async function markAll() {
    await api.markAllRead();
    setData(all.map((x) => ({ ...x, read: true })));
  }
  function dismiss(id: string) {
    setData(all.filter((x) => x.id !== id));
  }

  const catLabel: Record<NotificationCategory | "all", string> = {
    all: t.common.all,
    booking: n.catBooking,
    review: n.catReview,
    payment: n.catPayment,
    alert: n.catAlert,
    system: n.catSystem,
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

      {loading ? (
        <LoadingSkeleton />
      ) : error ? (
        <ErrorState onRetry={reload} />
      ) : (
        <>
          {/* Summary cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <SummaryCard label={n.cardUnread} count={unread} tone="bg-brand-soft text-brand" highlight />
            <SummaryCard label={n.cardBookings} count={catCount("booking")} tone="bg-status-approved/15 text-status-approved" />
            <SummaryCard label={n.cardPayments} count={catCount("payment")} tone="bg-status-approved/15 text-status-approved" />
            <SummaryCard label={n.cardAlerts} count={catCount("alert")} tone="bg-status-rejected/10 text-status-rejected" />
          </div>

          {/* Filter tabs */}
          <div className="flex flex-wrap items-center gap-1 rounded-full bg-white p-1 shadow-card sm:w-fit">
            {CATS.map((c) => {
              const Icon = c === "all" ? null : catConfig[c].icon;
              return (
                <button
                  key={c}
                  onClick={() => setTab(c)}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition",
                    tab === c ? "bg-brand text-white shadow-sm" : "text-ink-muted hover:text-ink",
                  )}
                >
                  {Icon && <Icon className="h-3.5 w-3.5" />}
                  {catLabel[c]}{" "}
                  <span className={cn("tabular-nums", tab === c ? "text-white/80" : "text-ink-faint")}>({catCount(c)})</span>
                </button>
              );
            })}
          </div>

          {/* Grouped list */}
          <div className="space-y-6">
            {GROUPS.map((g) => {
              const items = shown.filter((x) => x.group === g);
              if (items.length === 0) return null;
              const groupLabel = { today: n.groupToday, yesterday: n.groupYesterday, earlier: n.groupEarlier }[g];
              return (
                <div key={g} className="space-y-3">
                  <div className="text-xs font-semibold uppercase tracking-wide text-ink-faint">{groupLabel}</div>
                  {items.map((item) => (
                    <NotificationRow
                      key={item.id}
                      item={item}
                      locale={locale}
                      onOpen={() => router.push(item.href)}
                      onDismiss={() => dismiss(item.id)}
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
  locale,
  onOpen,
  onDismiss,
}: {
  item: AppNotification;
  locale: "ar" | "en";
  onOpen: () => void;
  onDismiss: () => void;
}) {
  const cfg = catConfig[item.category];
  const CatIcon = cfg.icon;
  return (
    <div
      onClick={onOpen}
      className={cn(
        "group flex cursor-pointer gap-4 rounded-2xl border border-line bg-white p-4 shadow-card transition hover:shadow-modal",
        !item.read && "bg-brand-soft/20",
      )}
    >
      {/* icon / avatar */}
      <div className="relative shrink-0">
        {item.guestName ? (
          <Avatar name={item.guestName} className="h-11 w-11 text-sm" />
        ) : (
          <span className={cn("grid h-11 w-11 place-items-center rounded-full", cfg.tone)}>
            <CatIcon className="h-5 w-5" />
          </span>
        )}
        {item.guestName && (
          <span className={cn("absolute -bottom-1 -end-1 grid h-5 w-5 place-items-center rounded-full ring-2 ring-white", cfg.tone)}>
            <CatIcon className="h-3 w-3" />
          </span>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="font-bold text-ink">{item.title[locale]}</div>
        <p className="mt-0.5 text-sm text-ink-muted">{item.body[locale]}</p>

        {item.rating != null && (
          <div className="mt-1 flex items-center gap-1.5 text-sm text-status-pending">
            <span className="tracking-tight">{"★".repeat(item.rating)}</span>
            {item.quote && <span>· &ldquo;{item.quote[locale]}&rdquo;</span>}
          </div>
        )}
        {item.meta && (
          <div className={cn("mt-1 text-sm font-medium", metaClass[item.metaTone ?? "muted"])}>
            {item.meta[locale]}
          </div>
        )}

        <div className="mt-1.5 text-xs text-ink-faint">{item.timeLabel[locale]}</div>
      </div>

      {/* right controls */}
      <div className="flex shrink-0 flex-col items-end gap-3">
        {!item.read && <span className="mt-1 h-2.5 w-2.5 rounded-full bg-brand" />}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDismiss();
          }}
          className="text-ink-faint opacity-0 transition hover:text-ink group-hover:opacity-100"
          aria-label="dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
