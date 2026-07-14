import type { Booking, ReportsSummary, Unit } from "@/types";

/**
 * Frontend-derived presentation metrics (v1.2 contract note: deltas, sparklines
 * and per-property aggregates are NOT part of the API — they are computed here
 * from the contract series and from GET /units + GET /bookings).
 */

/** Month-over-month % change from the last two points of a 12-month series. */
export function deltaPct(series: number[]): number | undefined {
  if (series.length < 2) return undefined;
  const prev = series[series.length - 2];
  const last = series[series.length - 1];
  if (prev === 0) return undefined; // no meaningful % against a zero month
  return Math.round(((last - prev) / prev) * 1000) / 10;
}

/** Sparkline = the last N points of a series (default 6). */
export function sparkline(series: number[], points = 6): number[] {
  return series.slice(-points);
}

/** "YYYY-MM" → localized short month label. */
export function monthLabel(month: string, monthsShort: string[]): string {
  const m = Number(month.slice(5, 7));
  return monthsShort[m - 1] ?? month;
}

/**
 * Reports §7.1 returns ONLY months with data — zero-fill the [from, to] window
 * (capped to the last 12 months of the range) so charts and deltas stay stable.
 */
export function zeroFillMonths<K extends string>(
  entries: ({ month: string } & Record<K, number>)[],
  from: string,
  to: string,
  key: K,
): { month: string; value: number }[] {
  const byMonth = new Map(entries.map((e) => [e.month, e[key]]));
  const end = new Date(Number(to.slice(0, 4)), Number(to.slice(5, 7)) - 1, 1);
  const first = new Date(Number(from.slice(0, 4)), Number(from.slice(5, 7)) - 1, 1);
  const months: string[] = [];
  const cursor = new Date(end);
  for (let i = 0; i < 12 && cursor >= first; i++) {
    months.unshift(`${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}`);
    cursor.setMonth(cursor.getMonth() - 1);
  }
  return months.map((month) => ({ month, value: byMonth.get(month) ?? 0 }));
}

/** Average nightly rate across approved units (undefined when none). */
export function avgNightlyRate(units: Unit[]): number | undefined {
  const priced = units.filter((u) => u.status === "approved" && u.pricePerNight > 0);
  if (priced.length === 0) return undefined;
  return Math.round(priced.reduce((s, u) => s + u.pricePerNight, 0) / priced.length);
}

/** Average guest rating across units that have reviews (undefined when none). */
export function avgRating(units: Unit[]): number | undefined {
  const rated = units.filter((u) => u.rating != null);
  if (rated.length === 0) return undefined;
  return Math.round((rated.reduce((s, u) => s + (u.rating ?? 0), 0) / rated.length) * 10) / 10;
}

export interface TopProperty {
  unitId: string;
  name: string;
  revenue: number; // SAR — partner share
  bookings: number;
  rating?: number;
}

/** Top properties by partner-share revenue, built from /units + /bookings. */
export function deriveTopProperties(units: Unit[], bookings: Booking[], max = 5): TopProperty[] {
  const byUnit = new Map<string, TopProperty>();
  for (const b of bookings) {
    if (b.status === "cancelled") continue;
    const unit = units.find((u) => u.id === b.unitId);
    const row = byUnit.get(b.unitId) ?? {
      unitId: b.unitId,
      name: unit?.name ?? b.unitName,
      revenue: 0,
      bookings: 0,
      rating: unit?.rating,
    };
    row.revenue += b.financials.partnerShare;
    row.bookings += 1;
    byUnit.set(b.unitId, row);
  }
  return [...byUnit.values()].sort((a, b) => b.revenue - a.revenue).slice(0, max);
}

export type EnrichedPerUnit = ReportsSummary["perUnit"][number] & {
  thumb?: string;
  district?: string;
  city?: string;
  rating?: number;
};

/** Reports table enrichment — merges /units display data into §7.1 `perUnit`. */
export function enrichPerUnit(
  perUnit: ReportsSummary["perUnit"],
  units: Unit[],
): EnrichedPerUnit[] {
  return perUnit.map((row) => {
    const unit = units.find((u) => u.id === row.unitId);
    return {
      ...row,
      thumb: unit?.photos[0]?.url,
      district: unit?.district,
      city: unit?.city,
      rating: unit?.rating,
    };
  });
}
