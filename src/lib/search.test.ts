import { describe, it, expect } from "vitest";
import { matchesQuery } from "@/lib/search";

describe("matchesQuery", () => {
  it("matches everything when the query is empty or whitespace", () => {
    expect(matchesQuery("", "استوديو مرسى العليا", "MRN2401")).toBe(true);
    expect(matchesQuery("   ", "استوديو مرسى العليا", "MRN2401")).toBe(true);
  });

  it("matches a substring in any field, case-insensitively", () => {
    expect(matchesQuery("mrn", "استوديو مرسى العليا", "MRN2401")).toBe(true);
    expect(matchesQuery("العليا", "استوديو مرسى العليا", "MRN2401")).toBe(true);
    expect(matchesQuery("2401", "استوديو مرسى العليا", "MRN2401")).toBe(true);
  });

  it("returns false when no field contains the query", () => {
    expect(matchesQuery("جدة", "استوديو مرسى العليا", "MRN2401")).toBe(false);
  });

  it("skips undefined fields without throwing", () => {
    expect(matchesQuery("test", undefined, "a test value")).toBe(true);
    expect(matchesQuery("missing", undefined, undefined)).toBe(false);
  });
});
