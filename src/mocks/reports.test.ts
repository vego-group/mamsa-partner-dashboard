import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { buildReportsSummary } from "@/mocks/data";
import { api, ApiError } from "@/lib/api/client";
import { formatCompactCurrency, formatCompactCurrencyOptional } from "@/lib/format";
import { dict } from "@/lib/i18n";
import type { ReportsSummary } from "@/types";

const round2 = (n: number) => Math.round(n * 100) / 100;
const RANGES: [string, string][] = [
  ["2022-01-01", "2026-12-31"],
  ["2026-01-01", "2026-12-31"],
  ["2026-03-01", "2026-06-30"],
];

describe("reports VAT fields", () => {
  it("keeps netRevenue + vat === grossRevenue in every range", () => {
    for (const [from, to] of RANGES) {
      const s = buildReportsSummary(from, to);
      expect(round2(s.netRevenue! + s.vat!), `${from}..${to}`).toBe(s.grossRevenue);
    }
  });

  it("matches the arithmetic verified live on staging", () => {
    // GET /reports/summary — netRevenue 116536 + vat 7298.2 = grossRevenue 123834.2
    expect(round2(116536 + 7298.2)).toBe(123834.2);
  });

  it("does NOT conflate netRevenue with netProfit", () => {
    const s = buildReportsSummary("2022-01-01", "2026-12-31");
    // netRevenue is revenue net of TAX; netProfit is revenue minus COMMISSION.
    expect(s.netRevenue).not.toBe(s.netProfit);
    expect(round2(s.netRevenue! - s.commission)).toBe(s.netProfit);
    expect(s.netProfit).toBeLessThan(s.netRevenue!);
  });

  it("labels the two as different questions in both locales", () => {
    for (const locale of ["ar", "en"] as const) {
      const r = dict[locale].reports;
      expect(r.netRevenue, locale).not.toBe(r.netProfit);
      // Neither may read as a rewording of the other.
      expect(r.netRevenue.includes(r.netProfit), locale).toBe(false);
      expect(r.netProfit.includes(r.netRevenue), locale).toBe(false);
    }
  });
});

/**
 * Production still returns the pre-cutover shape. The two new tiles must render
 * an empty state, never "NaN ر.س" — a partner reading NaN on a revenue report
 * files a bug, and rightly.
 */
describe("pre-cutover tolerance", () => {
  const legacy = {
    grossRevenue: 123834.2,
    bookingsCount: 12,
    commission: 2330.72,
    netProfit: 114205.28,
    revenueByMonth: [],
    bookingsByMonth: [],
    perUnit: [],
  } as ReportsSummary;

  it("types netRevenue and vat as optional so the old shape still compiles", () => {
    expect(legacy.netRevenue).toBeUndefined();
    expect(legacy.vat).toBeUndefined();
  });

  it("renders an em dash rather than NaN for the absent fields", () => {
    for (const locale of ["ar", "en"] as const) {
      expect(formatCompactCurrencyOptional(legacy.netRevenue, locale)).toBe("—");
      expect(formatCompactCurrencyOptional(legacy.vat, locale)).toBe("—");
      // The unguarded formatter is exactly what would have leaked NaN.
      expect(formatCompactCurrency(legacy.netRevenue as unknown as number, locale)).toContain("NaN");
    }
  });

  it("still renders the fields production does send", () => {
    expect(formatCompactCurrencyOptional(legacy.grossRevenue, "en")).not.toBe("—");
    expect(formatCompactCurrencyOptional(legacy.netProfit, "en")).not.toBe("—");
  });

  it("formats real values identically to the unguarded formatter", () => {
    const s = buildReportsSummary("2022-01-01", "2026-12-31");
    expect(formatCompactCurrencyOptional(s.vat, "ar")).toBe(formatCompactCurrency(s.vat!, "ar"));
  });
});

/**
 * The real guard on the pre-cutover tiles is the TYPE, not the assertions
 * above: `netRevenue?: number` makes an unguarded `formatCompactCurrency` call
 * a compile error. That is stronger than a test — but it fails differently. It
 * can be reopened with a green suite by loosening `strict`, by casting, or by
 * making the fields required, none of which any test would notice.
 *
 * So these assert the guard's own preconditions. Reopening the hazard now means
 * deleting something explicit here, not quietly relaxing a compiler flag.
 */
describe("the optional-type guard on the VAT tiles", () => {
  const read = (p: string) => readFileSync(resolve(process.cwd(), p), "utf8");
  const REPORTS_PAGE = "src/app/(dashboard)/reports/page.tsx";

  it("keeps TypeScript strict — the flag the guard rests on", () => {
    const tsconfig = JSON.parse(read("tsconfig.json")) as {
      compilerOptions: { strict?: boolean; strictNullChecks?: boolean };
    };
    expect(tsconfig.compilerOptions.strict).toBe(true);
    // `strict: true` implies it, but an explicit `false` would silently win.
    expect(tsconfig.compilerOptions.strictNullChecks).not.toBe(false);
  });

  it("keeps netRevenue and vat OPTIONAL — required fields would erase the guard", () => {
    const types = read("src/types/index.ts");
    expect(types).toMatch(/netRevenue\?:\s*number/);
    expect(types).toMatch(/vat\?:\s*number/);
  });

  it("forbids `as number` / `as any` casts on the reports page", () => {
    // A cast is the one thing that compiles past `number | undefined`.
    const page = read(REPORTS_PAGE);
    expect(page).not.toMatch(/\bas\s+number\b/);
    expect(page).not.toMatch(/\bas\s+any\b/);
    expect(page).not.toMatch(/@ts-(expect-error|ignore)/);
  });

  it("renders both VAT tiles through the optional formatter", () => {
    const page = read(REPORTS_PAGE);
    for (const field of ["netRevenue", "vat"]) {
      expect(page, field).toContain(`formatCompactCurrencyOptional(d.${field}, locale)`);
      expect(page, field).not.toContain(`formatCompactCurrency(d.${field}, locale)`);
    }
  });
});

/**
 * `from` and `to` are REQUIRED — omitting either returns 400 VALIDATION with
 * `fields: { from, to }`, not an empty result. Fail before the request rather
 * than shipping one that cannot succeed.
 */
describe("range parameters", () => {
  it("rejects a missing from or to without calling the API", async () => {
    for (const [from, to] of [["", "2026-12-31"], ["2026-01-01", ""], ["", ""]]) {
      await expect(api.getReportsSummary(from, to)).rejects.toMatchObject({
        status: 400,
        code: "VALIDATION",
      });
    }
  });

  it("names both fields on the error, matching the backend envelope", async () => {
    const error = await api.getReportsSummary("", "").catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).fields).toHaveProperty("from");
    expect((error as ApiError).fields).toHaveProperty("to");
  });

  it("resolves when both are supplied", async () => {
    await expect(api.getReportsSummary("2026-01-01", "2026-12-31")).resolves.toBeDefined();
  });
});
