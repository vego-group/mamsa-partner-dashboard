import { describe, it, expect } from "vitest";
import { isValidIban, maskIban, normalizeIban } from "@/lib/iban";
import * as iban from "@/lib/iban";

/**
 * Checksum-valid Saudi IBANs. The point of the mod-97 check is that a typo
 * inside the 22 digits is caught here rather than at the bank, so the mutation
 * cases below matter more than the happy path.
 */
const VALID = [
  "SA0380000000608010167519",
  "SA1620000004512345678901",
  "SA8510000012345678901234",
  "SA5565000000000000000001",
];

/** Bump one digit at `index`, leaving length and prefix intact. */
function mutate(iban: string, index: number): string {
  const digit = Number(iban[index]);
  return iban.slice(0, index) + ((digit + 1) % 10) + iban.slice(index + 1);
}

describe("isValidIban", () => {
  it("accepts known-good Saudi IBANs", () => {
    for (const iban of VALID) expect(isValidIban(iban), iban).toBe(true);
  });

  it("rejects every single-digit mutation — the case a regex misses", () => {
    for (const iban of VALID) {
      // Every digit position, check digits included.
      for (let i = 2; i < iban.length; i++) {
        expect(isValidIban(mutate(iban, i)), `${iban} @${i}`).toBe(false);
      }
    }
  });

  it("rejects wrong lengths", () => {
    const [iban] = VALID;
    expect(isValidIban(iban.slice(0, 23))).toBe(false);
    expect(isValidIban(iban + "0")).toBe(false);
    expect(isValidIban("SA")).toBe(false);
    expect(isValidIban("")).toBe(false);
  });

  it("rejects non-Saudi and malformed input", () => {
    expect(isValidIban("GB82WEST12345698765432")).toBe(false); // valid IBAN, wrong country
    expect(isValidIban("SA038000000060801016751X")).toBe(false);
    expect(isValidIban("XX0380000000608010167519")).toBe(false);
  });

  it("normalizes lowercase and spaced input before validating", () => {
    const [iban] = VALID;
    expect(isValidIban(iban.toLowerCase())).toBe(true);
    expect(isValidIban("SA03 8000 0000 6080 1016 7519")).toBe(true);
    expect(isValidIban(`  ${iban}  `)).toBe(true);
  });
});

describe("normalizeIban", () => {
  it("uppercases and strips all whitespace", () => {
    expect(normalizeIban(" sa03 8000\t0000 6080 1016 7519 ")).toBe("SA0380000000608010167519");
  });
});

describe("bank name resolution", () => {
  it("exposes no client-side IBAN→bank lookup at all", () => {
    // `bankName` is server-derived. A local SAMA table here would be a second
    // source of truth that silently disagrees with what the API returns.
    expect(Object.keys(iban)).not.toContain("bankNameFromIban");
  });
});

describe("maskIban", () => {
  it("exposes only the last 4 digits", () => {
    expect(maskIban("SA0380000000608010167519")).toBe("••••7519");
    expect(maskIban("sa03 8000 0000 6080 1016 7519")).toBe("••••7519");
  });

  it("returns an empty string when there is nothing to mask", () => {
    expect(maskIban("")).toBe("");
  });
});
