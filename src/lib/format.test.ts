import { describe, it, expect } from "vitest";
import { formatCurrency, formatDate, formatDateShort, formatPhone, computeFinancials, splitPrice } from "@/lib/format";

describe("formatCurrency", () => {
  it("renders SAR in Arabic, never AED", () => {
    expect(formatCurrency(1600, "ar")).toBe("1,600 ر.س");
    expect(formatCurrency(1600, "ar")).not.toContain("AED");
  });
  it("renders SAR in English", () => {
    expect(formatCurrency(320, "en")).toBe("SAR 320");
  });
});

describe("formatDate", () => {
  it("is Gregorian DD/MM/YYYY", () => {
    expect(formatDate("2026-07-13T00:00:00Z")).toMatch(/^\d{2}\/\d{2}\/\d{4}$/);
  });
});

describe("formatDateShort", () => {
  it("isolates the Arabic month name with bidi control marks so two dates joined by an arrow don't scramble", () => {
    const result = formatDateShort("2026-08-27T00:00:00Z", "ar");
    expect(result.startsWith("⁨")).toBe(true);
    expect(result.endsWith("⁩")).toBe(true);
    expect(result).toContain("أغسطس");
    expect(result).toContain("27");
    expect(result).toContain("2026");
  });
});

describe("formatPhone", () => {
  it("normalizes to +966 without a leading zero", () => {
    expect(formatPhone("0512345678")).toBe("+966 51 234 5678");
    expect(formatPhone("+966512345678")).toBe("+966 51 234 5678");
    expect(formatPhone("512345678")).toBe("+966 51 234 5678");
  });
});

/**
 * The price the partner enters is GROSS — VAT-inclusive, what the guest pays.
 * The whole point of computing `partnerShare` by subtraction is that nothing
 * evaporates in rounding, so the invariant is the test.
 */
const GROSS_VALUES = [0.01, 1, 10, 33.33, 100, 320, 500, 999.99, 1000, 1234.56, 7777.77, 100000];

describe("splitPrice", () => {
  it("keeps commission + partnerShare + vat === gross at every value", () => {
    for (const gross of GROSS_VALUES) {
      const s = splitPrice(gross);
      const sum = Math.round((s.commission + s.partnerShare + s.vat) * 100) / 100;
      expect(sum, `gross ${gross}`).toBe(s.gross);
    }
  });

  it("decomposes 500 the way the partner is shown it", () => {
    expect(splitPrice(500)).toEqual({
      gross: 500,
      netBase: 434.78,
      vat: 65.22,
      commission: 8.7,
      partnerShare: 426.08,
    });
  });

  it("never lets partnerShare drift from netBase - commission", () => {
    for (const gross of GROSS_VALUES) {
      const s = splitPrice(gross);
      expect(Math.round((s.netBase - s.commission) * 100) / 100, `gross ${gross}`).toBe(s.partnerShare);
      // VAT is carved out of gross, so the two halves put it back together.
      expect(Math.round((s.netBase + s.vat) * 100) / 100, `gross ${gross}`).toBe(s.gross);
    }
  });

  it("settles everything at 2 decimals", () => {
    for (const gross of GROSS_VALUES) {
      for (const [key, value] of Object.entries(splitPrice(gross))) {
        expect(Math.round(value * 100) / 100, `${key} @ ${gross}`).toBe(value);
      }
    }
  });

  it("handles zero without producing NaN", () => {
    expect(splitPrice(0)).toEqual({ gross: 0, netBase: 0, vat: 0, commission: 0, partnerShare: 0 });
  });
});

describe("computeFinancials", () => {
  it("treats the booking total as gross and returns the full split", () => {
    const f = computeFinancials(1600);
    expect(f.total).toBe(1600);
    expect(f.netBase).toBe(1391.3);
    expect(f.vat).toBe(208.7);
    expect(f.commission).toBe(27.83);
    expect(f.partnerShare).toBe(1363.47);
  });

  it("still exposes its original keys", () => {
    const f = computeFinancials(320);
    expect(Object.keys(f).sort()).toEqual(["commission", "netBase", "partnerShare", "total", "vat"]);
  });

  it("reconciles back to the total", () => {
    for (const total of [320, 540, 1200, 999]) {
      const f = computeFinancials(total);
      const sum = Math.round((f.commission + f.partnerShare + f.vat) * 100) / 100;
      expect(sum).toBe(f.total);
    }
  });
});
