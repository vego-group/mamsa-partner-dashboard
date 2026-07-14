"use client";

import { useState } from "react";
import Image from "next/image";
import { api } from "@/lib/api/client";
import { useAsync } from "@/lib/use-async";
import { useLocale } from "@/stores/locale-store";
import { Card, Button } from "@/components/ui";
import { LoadingSkeleton, ErrorState } from "@/components/shared/states";
import { formatCurrency, formatCompactCurrency } from "@/lib/format";
import { SAUDI_CITIES } from "@/lib/constants";
import {
  deltaPct,
  monthLabel,
  enrichPerUnit,
  type EnrichedPerUnit,
} from "@/features/overview/lib/derive-metrics";
import type { Locale } from "@/lib/i18n";
import { Download, Star, TrendingUp, TrendingDown } from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

const GREEN = "#1F4A3C";
const GREY = "#8A968E";

type Range = "6m" | "1y" | "all";

/**
 * Range shortcuts are frontend-side (§7.1) — backend just takes from/to.
 * `to` = end of the current month so this month's confirmed (upcoming) bookings
 * are included, keeping Reports consistent with the Overview totals.
 */
function rangeToDates(range: Range): { from: string; to: string } {
  const now = new Date();
  const to = fmtDate(new Date(now.getFullYear(), now.getMonth() + 1, 0));
  if (range === "all") return { from: "2022-01-01", to };
  const back = range === "6m" ? 5 : 11;
  const from = fmtDate(new Date(now.getFullYear(), now.getMonth() - back, 1));
  return { from, to };
}

function fmtDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function ReportsPage() {
  const { t, locale } = useLocale();
  const [range, setRange] = useState<Range>("1y");
  const { from, to } = rangeToDates(range);

  const summary = useAsync(() => api.getReportsSummary(from, to), [range]);
  const units = useAsync(() => api.listUnits());

  if (summary.loading || units.loading) return <LoadingSkeleton rows={4} />;
  if (summary.error || !summary.data) return <ErrorState onRetry={summary.reload} />;

  const d = summary.data;
  const revenueAmounts = d.revenueByMonth.map((m) => m.amount);
  const bookingCounts = d.bookingsByMonth.map((m) => m.count);
  const revenueData = d.revenueByMonth.map((m) => ({ month: monthLabel(m.month, t.monthsShort), amount: m.amount }));
  const bookingsData = d.bookingsByMonth.map((m) => ({ month: monthLabel(m.month, t.monthsShort), count: m.count }));
  const perUnit = enrichPerUnit(d.perUnit, units.data ?? []);

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
          {/* GET /reports/export?from=&to=&format=pdf (§7.2) — wire when backend lands */}
          <Button className="rounded-full">
            <Download className="h-4 w-4" /> {t.reports.exportPdf}
          </Button>
        </div>
      </div>

      {/* KPI cards — deltas derived client-side from the monthly series */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label={t.overview.totalRevenue} value={formatCompactCurrency(d.grossRevenue, locale)} delta={deltaPct(revenueAmounts)} />
        <Kpi label={t.overview.totalBookings} value={String(d.bookingsCount)} delta={deltaPct(bookingCounts)} />
        <Kpi label={t.reports.commission} value={formatCompactCurrency(d.commission, locale)} />
        <Kpi label={t.reports.netProfit} value={formatCompactCurrency(d.netProfit, locale)} delta={deltaPct(revenueAmounts)} />
      </div>

      {/* Charts */}
      <div className="grid gap-5 lg:grid-cols-2">
        <Card className="p-6">
          <h3 className="font-bold text-ink">{t.reports.revenueTrend}</h3>
          <p className="text-sm text-ink-muted">{t.reports.monthlyBreakdown}</p>
          <div dir="ltr" className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
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
      </div>

      {/* Property performance — §7.1 perUnit enriched client-side from /units */}
      <Card className="p-6">
        <h3 className="font-bold text-ink">{t.reports.propertyPerformance}</h3>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="border-b border-line text-xs uppercase tracking-wide text-ink-faint">
                <th className="py-3 text-start font-semibold">{t.reports.colProperty}</th>
                <th className="py-3 text-start font-semibold">{t.reports.colRevenue}</th>
                <th className="py-3 text-start font-semibold">{t.reports.colBookings}</th>
                <th className="py-3 text-start font-semibold">{t.reports.colRating}</th>
              </tr>
            </thead>
            <tbody>
              {perUnit.map((p) => (
                <tr key={p.unitId} className="border-b border-line/60 last:border-0">
                  <td className="py-3">
                    <div className="flex items-center gap-3">
                      <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-cream-dark">
                        {p.thumb && <Image src={p.thumb} alt={p.unitName} fill className="object-cover" />}
                      </div>
                      <div className="min-w-0">
                        <div className="truncate font-semibold text-ink">{p.unitName}</div>
                        {p.district && (
                          <div className="truncate text-xs text-ink-muted">{location(p, locale)}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="py-3 font-bold text-ink">{formatCurrency(p.revenue, locale)}</td>
                  <td className="py-3 tabular-nums text-ink-muted">{p.bookings}</td>
                  <td className="py-3">
                    {p.rating != null ? (
                      <span className="inline-flex items-center gap-1 font-semibold text-ink">
                        <Star className="h-3.5 w-3.5 fill-status-pending text-status-pending" />
                        {p.rating.toFixed(1)}
                      </span>
                    ) : (
                      <span className="text-ink-faint">—</span>
                    )}
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

function Kpi({ label, value, delta }: { label: string; value: string; delta?: number }) {
  const up = (delta ?? 0) >= 0;
  return (
    <Card className="p-5">
      <div className="text-sm text-ink-muted">{label}</div>
      <div dir="ltr" className="mt-1 text-2xl font-bold tabular-nums text-ink text-start">{value}</div>
      {delta != null && (
        <span
          className={`mt-3 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
            up ? "bg-brand-soft text-brand" : "bg-status-rejected/10 text-status-rejected"
          }`}
        >
          {up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
          {up ? "+" : ""}
          {delta}%
        </span>
      )}
    </Card>
  );
}

const tooltipStyle = {
  borderRadius: 12,
  border: "1px solid #E2E6E1",
  fontSize: 12,
  boxShadow: "0 8px 24px rgba(22,33,28,0.08)",
} as const;

function location(p: EnrichedPerUnit, locale: Locale): string {
  const city = SAUDI_CITIES.find((c) => c.value === p.city);
  const cityLabel = city ? city[locale] : p.city ?? "";
  const sep = locale === "ar" ? "، " : ", ";
  return [p.district, cityLabel].filter(Boolean).join(sep);
}
