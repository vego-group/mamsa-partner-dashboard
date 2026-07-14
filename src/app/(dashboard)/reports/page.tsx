"use client";

import { useState } from "react";
import Image from "next/image";
import { api } from "@/lib/api/client";
import { useAsync } from "@/lib/use-async";
import { useLocale } from "@/stores/locale-store";
import { Card, Button } from "@/components/ui";
import { LoadingSkeleton, ErrorState } from "@/components/shared/states";
import { formatCurrency, formatCompactCurrency, PARTNER_SHARE_RATE } from "@/lib/format";
import { SAUDI_CITIES } from "@/lib/constants";
import type { Locale } from "@/lib/i18n";
import type { OverviewMetrics } from "@/types";
import { Download, Star, TrendingUp } from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

const GREEN = "#1F4A3C";
const GREEN_LIGHT = "#2E6A54";
const GREY = "#8A968E";

type Range = "6m" | "1y" | "all";

export default function ReportsPage() {
  const { t, locale } = useLocale();
  const { data, loading, error, reload } = useAsync(() => api.getOverview());
  const [range, setRange] = useState<Range>("1y");

  if (loading) return <LoadingSkeleton rows={4} />;
  if (error || !data) return <ErrorState onRetry={reload} />;

  const d = data;
  const months = t.monthsShort;
  const netProfit = Math.round(d.totalRevenue * PARTNER_SHARE_RATE);
  const revenueData = d.revenueSeries.map((v, i) => ({ month: months[i], amount: v }));
  const occData = d.occupancySeries.map((v, i) => ({ month: months[i], value: v }));
  const slice = <T,>(arr: T[]) => (range === "6m" ? arr.slice(-6) : arr);

  const ranges: { key: Range; label: string }[] = [
    { key: "6m", label: t.overview.range6m },
    { key: "1y", label: t.overview.range1y },
    { key: "all", label: t.overview.rangeAll },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink">{t.reports.title}</h1>
          <p className="mt-0.5 text-sm text-ink-muted">{t.reports.subtitle}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex rounded-full bg-white p-1 shadow-card">
            {ranges.map((r) => (
              <button
                key={r.key}
                onClick={() => setRange(r.key)}
                className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
                  range === r.key ? "bg-brand text-white shadow-sm" : "text-ink-muted hover:text-ink"
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
          <Button className="rounded-full">
            <Download className="h-4 w-4" /> {t.reports.exportPdf}
          </Button>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label={t.overview.totalRevenue} value={formatCompactCurrency(d.totalRevenue, locale)} delta={d.revenueDeltaPct} />
        <Kpi label={t.overview.totalBookings} value={String(d.totalBookings)} delta={d.bookingsDeltaPct} />
        <Kpi label={t.reports.avgOccupancy} value={`${d.occupancyRate}%`} delta={d.occupancyDeltaPct} />
        <Kpi label={t.reports.netProfit} value={formatCompactCurrency(netProfit, locale)} delta={d.netProfitDeltaPct} />
      </div>

      {/* Charts */}
      <div className="grid gap-5 lg:grid-cols-2">
        <Card className="p-6">
          <h3 className="font-bold text-ink">{t.reports.revenueTrend}</h3>
          <p className="text-sm text-ink-muted">{t.reports.monthlyBreakdown}</p>
          <div dir="ltr" className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={slice(revenueData)} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                <defs>
                  <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={GREEN} stopOpacity={0.2} />
                    <stop offset="100%" stopColor={GREEN} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#E2E6E1" />
                <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: GREY }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: GREY }} tickFormatter={(v: number) => `${v / 1000}K`} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => `${v / 1000}K`} />
                <Area type="monotone" dataKey="amount" stroke={GREEN} strokeWidth={2.5} fill="url(#rev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="font-bold text-ink">{t.reports.occupancyTitle}</h3>
          <p className="text-sm text-ink-muted">{t.reports.monthlyAvgPct}</p>
          <div dir="ltr" className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={slice(occData)} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#E2E6E1" />
                <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: GREY }} />
                <YAxis
                  domain={[50, 100]}
                  ticks={[50, 65, 80, 100]}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11, fill: GREY }}
                  tickFormatter={(v: number) => `${v}%`}
                />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => `${v}%`} />
                <Line type="monotone" dataKey="value" stroke={GREEN_LIGHT} strokeWidth={2.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Property performance */}
      <Card className="p-6">
        <h3 className="font-bold text-ink">{t.reports.propertyPerformance}</h3>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-line text-xs uppercase tracking-wide text-ink-faint">
                <th className="py-3 text-start font-semibold">{t.reports.colProperty}</th>
                <th className="py-3 text-start font-semibold">{t.reports.colRevenue}</th>
                <th className="py-3 text-start font-semibold">{t.reports.colBookings}</th>
                <th className="py-3 text-start font-semibold">{t.reports.colOccupancy}</th>
                <th className="py-3 text-start font-semibold">{t.reports.colRating}</th>
                <th className="py-3 text-start font-semibold">{t.reports.colGrowth}</th>
              </tr>
            </thead>
            <tbody>
              {d.propertyPerformance.map((p) => (
                <tr key={p.name} className="border-b border-line/60 last:border-0">
                  <td className="py-3">
                    <div className="flex items-center gap-3">
                      <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-cream-dark">
                        {p.thumb && <Image src={p.thumb} alt={p.name} fill className="object-cover" />}
                      </div>
                      <div className="min-w-0">
                        <div className="truncate font-semibold text-ink">{p.name}</div>
                        <div className="truncate text-xs text-ink-muted">{location(p, locale)}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 font-bold text-ink">{formatCurrency(p.revenue, locale)}</td>
                  <td className="py-3 tabular-nums text-ink-muted">{p.bookings}</td>
                  <td className="py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-20 overflow-hidden rounded-full bg-cream">
                        <div className="h-full rounded-full bg-brand" style={{ width: `${p.occupancy}%` }} />
                      </div>
                      <span className="tabular-nums text-ink-muted">{p.occupancy}%</span>
                    </div>
                  </td>
                  <td className="py-3">
                    <span className="inline-flex items-center gap-1 font-semibold text-ink">
                      <Star className="h-3.5 w-3.5 fill-status-pending text-status-pending" />
                      {p.rating.toFixed(1)}
                    </span>
                  </td>
                  <td className="py-3">
                    <span className="inline-flex items-center gap-1 rounded-full bg-brand-soft px-2 py-0.5 text-xs font-semibold text-brand">
                      <TrendingUp className="h-3 w-3" />+{p.growth}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function Kpi({ label, value, delta }: { label: string; value: string; delta: number }) {
  const up = delta >= 0;
  return (
    <Card className="p-5">
      <div className="text-sm text-ink-muted">{label}</div>
      <div dir="ltr" className="mt-1 text-2xl font-bold tabular-nums text-ink text-start">{value}</div>
      <span
        className={`mt-3 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
          up ? "bg-brand-soft text-brand" : "bg-status-rejected/10 text-status-rejected"
        }`}
      >
        <TrendingUp className="h-3 w-3" />
        {up ? "+" : ""}
        {delta}%
      </span>
    </Card>
  );
}

const tooltipStyle = {
  borderRadius: 12,
  border: "1px solid #E2E6E1",
  fontSize: 12,
  boxShadow: "0 8px 24px rgba(22,33,28,0.08)",
} as const;

function location(p: OverviewMetrics["propertyPerformance"][number], locale: Locale): string {
  const city = SAUDI_CITIES.find((c) => c.value === p.city);
  const cityLabel = city ? city[locale] : p.city;
  const sep = locale === "ar" ? "، " : ", ";
  return [p.district, cityLabel].filter(Boolean).join(sep);
}
