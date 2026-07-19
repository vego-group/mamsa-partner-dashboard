import { describe, it, expect } from "vitest";
import { formatCurrency, formatDate, formatDateShort, formatPhone, computeFinancials } from "@/lib/format";

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

describe("computeFinancials", () => {
  it("splits 2% commission / 98% partner share", () => {
    const f = computeFinancials(1600);
    expect(f.commission).toBe(32); // 2%
    expect(f.partnerShare).toBe(1568); // 98%
    expect(f.total).toBe(1600);
  });
  it("partner share + commission always equals total", () => {
    for (const total of [320, 540, 1200, 999]) {
      const f = computeFinancials(total);
      expect(f.commission + f.partnerShare).toBe(total);
    }
  });
});
