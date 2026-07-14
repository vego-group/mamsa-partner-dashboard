"use client";

import { useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api/client";
import { useAsync } from "@/lib/use-async";
import { useLocale } from "@/stores/locale-store";
import { Card } from "@/components/ui";
import { ErrorState, LoadingSkeleton } from "@/components/shared/states";
import { BRAND } from "@/lib/constants";
import { formatCompactCurrency } from "@/lib/format";
import type { Locale } from "@/lib/i18n";
import {
  deltaPct,
  sparkline,
  monthLabel,
  avgNightlyRate,
  avgRating,
  deriveTopProperties,
} from "@/features/overview/lib/derive-metrics";
import { AlertTriangle, BarChart3, Star, TrendingDown, TrendingUp } from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

const GREEN = "#1F4A3C";
const GREEN_LIGHT = "#2E6A54";
const INK = "#16211C";
const GOLD = "#C9862B";
const GREY = "#8A968E";

export default function OverviewPage() {
  const { t, locale } = useLocale();
  const overview = useAsync(() => api.getOverview());
  const units = useAsync(() => api.listUnits());
  const bookings = useAsync(() => api.listBookings());
  const partner = useAsync(() => api.getPartner());

  if (overview.loading || units.loading || bookings.loading) return <LoadingSkeleton rows={4} />;
  if (overview.error || !overview.data) return <ErrorState onRetry={overview.reload} />;

  const d = overview.data;
  const allUnits = units.data ?? [];
  const allBookings = bookings.data ?? [];

  // ---- Frontend-derived metrics (contract v1.2: never part of the API) ----
  const approvedCount = allUnits.filter((u) => u.status === "approved").length;
  const pendingCount = allUnits.filter((u) => u.status === "pending").length;
  const pendingActions = pendingCount + allUnits.filter((u) => u.status === "rejected").length;

  const bookingCounts = d.bookingsByMonth.map((m) => m.count);
  const revenueAmounts = d.revenueByMonth.map((m) => m.amount);
  const nightly = avgNightlyRate(allUnits);
  const rating = avgRating(allUnits);
  const topProperties = deriveTopProperties(allUnits, allBookings);

  const revenueData = d.revenueByMonth.map((m) => ({
    month: monthLabel(m.month, t.monthsShort),
    amount: m.amount,
  }));
  const bookingsData = d.bookingsByMonth.map((m) => ({
    month: monthLabel(m.month, t.monthsShort),
    count: m.count,
  }));

  return (
    <div className="space-y-6">
      {/* Welcome hero */}
      <section className="relative overflow-hidden rounded-card bg-brand-dark p-7 text-white sm:p-8">
        <div className="pointer-events-none absolute -top-24 -end-16 h-72 w-72 rounded-full bg-brand-light/25 blur-3xl" />
        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm text-white/70">{t.overview.welcomeBack}</p>
            <h1 className="mt-1 text-3xl font-bold">{partner.data?.name ?? t.brand}</h1>
            <p className="mt-1 text-sm text-white/70">{heroDate(locale)} · {BRAND.headerLocation[locale]}</p>
          </div>
          <Link
            href="/reports"
            className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold backdrop-blur transition hover:bg-white/20"
          >
            <BarChart3 className="h-4 w-4" />
            {t.overview.viewReports}
          </Link>
        </div>

        <div className="relative mt-6 grid max-w-2xl grid-cols-2 gap-3 sm:grid-cols-3">
          <MiniStat label={t.overview.thisMonth} value={formatCompactCurrency(d.thisMonthRevenue, locale)} />
          <MiniStat label={t.overview.occupancyRate} value={`${d.occupancyRate}%`} />
          <MiniStat label={t.overview.pendingActions} value={String(pendingActions)} />
        </div>
      </section>

      {/* Rejected-unit banner */}
      {d.hasRejectedUnit && (
        <Link href="/units?status=rejected">
          <div className="flex items-center gap-3 rounded-card border border-status-rejected/30 bg-status-rejected/5 px-4 py-3 text-sm text-status-rejected">
            <AlertTriangle className="h-5 w-5" />
            {t.overview.rejectedBanner}
          </div>
        </Link>
      )}

      {/* KPI cards */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <KpiCard
          label={t.overview.totalProperties}
          value={String(d.unitsCount)}
          sub={t.overview.propsBreakdown(approvedCount, pendingCount)}
        />
        <KpiCard
          label={t.overview.totalBookings}
          value={String(d.bookingsCount)}
          sub={t.overview.thisYear}
          spark={sparkline(bookingCounts)}
          sparkColor={GREEN_LIGHT}
          delta={deltaPct(bookingCounts)}
          percent
        />
        <KpiCard
          label={t.overview.totalRevenue}
          value={formatCompactCurrency(d.totalRevenue, locale)}
          sub={t.overview.thisYear}
          spark={sparkline(revenueAmounts)}
          sparkColor={GREEN_LIGHT}
          delta={deltaPct(revenueAmounts)}
          percent
        />
        {nightly != null && (
          <KpiCard
            label={t.overview.avgNightlyRate}
            value={formatCompactCurrency(nightly, locale)}
            sub={t.overview.perProperty}
          />
        )}
        {rating != null && (
          <KpiCard
            label={t.overview.guestRating}
            value={rating.toFixed(1)}
            sub={t.overview.acrossAll}
            spark={undefined}
            sparkColor={GOLD}
          />
        )}
      </div>

      {/* Revenue + Occupancy */}
      <div className="grid gap-5 lg:grid-cols-3">
        <RevenueCard data={revenueData} />
        <OccupancyCard occupancyRate={d.occupancyRate} />
      </div>

      {/* Monthly bookings + Top properties */}
      <div className="grid gap-5 lg:grid-cols-2">
        <Card className="p-6">
          <h3 className="font-bold text-ink">{t.overview.monthlyBookings}</h3>
          <p className="text-sm text-ink-muted">{t.overview.reservationsPerMonth}</p>
          <div dir="ltr" className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={bookingsData} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#E2E6E1" />
                <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: GREY }} />
                <YAxis tickLine={false} axisLine={false} allowDecimals={false} tick={{ fontSize: 11, fill: GREY }} />
                <Tooltip cursor={{ fill: "rgba(31,74,60,0.06)" }} contentStyle={tooltipStyle} />
                <Bar dataKey="count" fill={GREEN} radius={[4, 4, 0, 0]} maxBarSize={22} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <TopProperties items={topProperties} locale={locale} />
      </div>
    </div>
  );
}

/* ---------------- Hero mini stat ---------------- */
function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 backdrop-blur">
      <div className="text-xs text-white/70">{label}</div>
      <div dir="ltr" className="mt-1 text-xl font-bold tabular-nums text-start">{value}</div>
    </div>
  );
}

/* ---------------- KPI card (spark/delta optional — hidden when underived) ---------------- */
function KpiCard({
  label,
  value,
  sub,
  spark,
  sparkColor = GREEN_LIGHT,
  delta,
  percent,
}: {
  label: string;
  value: string;
  sub?: string;
  spark?: number[];
  sparkColor?: string;
  delta?: number;
  percent?: boolean;
}) {
  const up = (delta ?? 0) >= 0;
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm text-ink-muted">{label}</div>
          <div dir="ltr" className="mt-1 text-3xl font-bold tabular-nums text-ink text-start">{value}</div>
        </div>
        {spark && spark.length > 1 && <Sparkline data={spark} color={sparkColor} />}
      </div>
      {(sub || delta != null) && (
        <div className="mt-3 flex items-center justify-between gap-2">
          <span className="text-xs text-ink-faint">{sub}</span>
          {delta != null && (
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
                up ? "bg-brand-soft text-brand" : "bg-status-rejected/10 text-status-rejected"
              }`}
            >
              {up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {up ? "+" : ""}
              {delta}
              {percent ? "%" : ""}
            </span>
          )}
        </div>
      )}
    </Card>
  );
}

/* ---------------- Sparkline (inline SVG) ---------------- */
function Sparkline({ data, color }: { data: number[]; color: string }) {
  const w = 84;
  const h = 34;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / span) * (h - 4) - 2;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const id = `sl-${color.replace("#", "")}`;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="shrink-0" aria-hidden>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.18} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <polygon points={`0,${h} ${pts.join(" ")} ${w},${h}`} fill={`url(#${id})`} />
      <polyline points={pts.join(" ")} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ---------------- Revenue card ---------------- */
function RevenueCard({ data }: { data: { month: string; amount: number }[] }) {
  const { t } = useLocale();
  const [range, setRange] = useState<"6m" | "1y">("1y");
  const view = range === "6m" ? data.slice(-6) : data;
  const ranges = [
    { key: "6m" as const, label: t.overview.range6m },
    { key: "1y" as const, label: t.overview.range1y },
  ];
  const year = new Date().getFullYear();

  return (
    <Card className="p-6 lg:col-span-2">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-bold text-ink">{t.overview.revenueOverview}</h3>
          <p className="text-sm text-ink-muted">{t.overview.monthlyRevenueTrend} · {year}</p>
        </div>
        <div className="flex rounded-full bg-cream p-0.5">
          {ranges.map((r) => (
            <button
              key={r.key}
              onClick={() => setRange(r.key)}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                range === r.key ? "bg-white text-ink shadow-sm" : "text-ink-muted"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>
      <div dir="ltr" className="mt-4 h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={view} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
            <defs>
              <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={GREEN} stopOpacity={0.2} />
                <stop offset="100%" stopColor={GREEN} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#E2E6E1" />
            <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: GREY }} />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11, fill: GREY }}
              tickFormatter={(v: number) => (v >= 1000 ? `${v / 1000}K` : String(v))}
            />
            <Tooltip contentStyle={tooltipStyle} />
            <Area type="monotone" dataKey="amount" stroke={GREEN} strokeWidth={2.5} fill="url(#rev)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

/* ---------------- Occupancy donut — booked vs available from the v1.2 scalar ---------------- */
function OccupancyCard({ occupancyRate }: { occupancyRate: number }) {
  const { t } = useLocale();
  const rows = [
    { key: "booked" as const, value: occupancyRate, color: INK },
    { key: "available" as const, value: 100 - occupancyRate, color: GREEN_LIGHT },
  ];

  return (
    <Card className="p-6">
      <h3 className="font-bold text-ink">{t.overview.occupancySplit}</h3>
      <p className="text-sm text-ink-muted">{t.overview.currentMonthAll}</p>
      <div dir="ltr" className="mx-auto mt-2 h-48 w-48">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={rows as unknown as { key: string; value: number }[]}
              dataKey="value"
              nameKey="key"
              innerRadius={54}
              outerRadius={80}
              paddingAngle={2}
              stroke="none"
            >
              {rows.map((r) => (
                <Cell key={r.key} fill={r.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-2 space-y-2">
        {rows.map((r) => (
          <div key={r.key} className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2 text-ink-muted">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: r.color }} />
              {t.dayStatus[r.key]}
            </span>
            <span className="font-semibold tabular-nums text-ink">{r.value}%</span>
          </div>
        ))}
      </div>
    </Card>
  );
}

/* ---------------- Top properties (derived from /units + /bookings) ---------------- */
function TopProperties({
  items,
  locale,
}: {
  items: { unitId: string; name: string; revenue: number; rating?: number }[];
  locale: Locale;
}) {
  const { t } = useLocale();
  const max = Math.max(1, ...items.map((i) => i.revenue));
  return (
    <Card className="p-6">
      <h3 className="font-bold text-ink">{t.overview.topProperties}</h3>
      <p className="text-sm text-ink-muted">{t.overview.byRevenue}</p>
      <div className="mt-4 space-y-4">
        {items.map((it, i) => (
          <div key={it.unitId} className="flex items-center gap-3">
            <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand-soft text-xs font-bold text-brand tabular-nums">
              {i + 1}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-3">
                <span className="truncate text-sm font-medium text-ink">{it.name}</span>
                <span className="shrink-0 text-sm font-bold tabular-nums text-ink">
                  {formatCompactCurrency(it.revenue, locale)}
                </span>
              </div>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-cream">
                <div className="h-full rounded-full bg-brand" style={{ width: `${(it.revenue / max) * 100}%` }} />
              </div>
            </div>
            {it.rating != null && (
              <span className="flex shrink-0 items-center gap-1 text-xs font-semibold text-ink-muted tabular-nums">
                <Star className="h-3.5 w-3.5 fill-status-pending text-status-pending" />
                {it.rating.toFixed(1)}
              </span>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}

const tooltipStyle = {
  borderRadius: 12,
  border: "1px solid #E2E6E1",
  fontSize: 12,
  boxShadow: "0 8px 24px rgba(22,33,28,0.08)",
} as const;

function heroDate(locale: Locale): string {
  const opts: Intl.DateTimeFormatOptions = {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    calendar: "gregory",
    numberingSystem: "latn",
  };
  return new Intl.DateTimeFormat(locale === "ar" ? "ar" : "en-US", opts).format(new Date());
}
