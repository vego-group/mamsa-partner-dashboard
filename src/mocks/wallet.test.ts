import { describe, it, expect } from "vitest";
import {
  buildWallet,
  mockLedger,
  readMockLedger,
  mockBookings,
  mockPayouts,
  readMockPayout,
  readMockPayouts,
} from "@/mocks/data";
import { PAYOUT_MIN_BALANCE } from "@/lib/constants";
import { formatCurrency } from "@/lib/format";

const round2 = (n: number) => Math.round(n * 100) / 100;

/**
 * The wallet summary is read OFF the ledger rather than stated beside it, so
 * these assertions are what prove the two can't drift. A partner who sees a
 * balance that doesn't equal the sum of the rows above it stops trusting every
 * other number on the page.
 */
describe("mock wallet reconciles with its ledger", () => {
  it("sums every ledger amount to the available balance", () => {
    const total = round2(mockLedger.reduce((s, r) => s + r.amount, 0));
    expect(total).toBe(buildWallet().availableBalance);
  });

  it("carries a running balanceAfter on every row", () => {
    let running = 0;
    for (const row of mockLedger) {
      running = round2(running + row.amount);
      expect(row.balanceAfter, row.id).toBe(running);
    }
  });

  it("is ordered chronologically", () => {
    const dates = mockLedger.map((r) => r.createdAt);
    expect([...dates].sort()).toEqual(dates);
  });

  it("derives lifetime figures from the same rows", () => {
    const wallet = buildWallet();
    const earnings = round2(
      mockLedger.filter((r) => r.type === "earning").reduce((s, r) => s + r.amount, 0),
    );
    // Only transfers that stuck. A reversed payout is debited and credited back,
    // so it nets to zero in the ledger and must not inflate "paid out" either.
    const paidOut = round2(
      mockPayouts.filter((p) => p.status === "paid").reduce((s, p) => s + p.amount, 0),
    );

    expect(wallet.lifetimeEarnings).toBe(earnings);
    expect(wallet.lifetimePaidOut).toBe(paidOut);
    expect(wallet.availableBalance).toBe(round2(earnings - paidOut - 250)); // one refund reversal
  });

  it("contains the entry types the wallet has to render", () => {
    const types = new Set(mockLedger.map((r) => r.type));
    expect(types.has("earning")).toBe(true);
    expect(types.has("payout")).toBe(true);
    expect(types.has("refund_reversal")).toBe(true);
  });

  it("credits exactly the completed bookings, at their partner share", () => {
    const completed = mockBookings.filter((b) => b.status === "completed");
    const earnings = mockLedger.filter((r) => r.type === "earning");

    expect(earnings).toHaveLength(completed.length);
    for (const booking of completed) {
      const row = earnings.find((r) => r.refId === booking.id);
      expect(row, booking.code).toBeDefined();
      expect(row!.amount).toBe(booking.financials.partnerShare);
    }
  });

  it("counts only unfinished stays as pending — never completed ones", () => {
    const expected = round2(
      mockBookings
        .filter((b) => b.status === "pending_payment" || b.status === "confirmed")
        .reduce((s, b) => s + b.financials.partnerShare, 0),
    );
    const wallet = buildWallet();

    expect(wallet.pendingBalance).toBe(expected);
    expect(wallet.pendingBalance).toBeGreaterThan(0);
    expect(wallet.availableBalance).not.toBe(wallet.pendingBalance);
  });

  it("seeds the happy path — verified and over the threshold", () => {
    const wallet = buildWallet();
    expect(wallet.availableBalance).toBeGreaterThan(PAYOUT_MIN_BALANCE);
    expect(wallet.payoutEligible).toBe(true);
    expect(wallet.ineligibleReason).toBeNull();
    expect(wallet.bankVerified).toBe(true);
    expect(wallet.currency).toBe("SAR");
  });

  it("never promises a payout date — only a last-payout record", () => {
    const wallet = buildWallet();
    expect(Object.keys(wallet)).not.toContain("nextPayoutDate");
    expect(wallet.lastPayoutAt).not.toBeNull();
    expect(wallet.lastPayoutAmount).toBeGreaterThan(0);
  });
});

/**
 * The numeric tests above prove the data reconciles. These prove the RENDERED
 * STRINGS do — which is the only version the partner ever sees. Whole-riyal
 * rounding would leave a column that visibly fails to add up, and a partner who
 * does that arithmetic themselves concludes money is missing. That is worse
 * than being quietly wrong, because it destroys trust in every other figure.
 */
describe("ledger display reconciles as rendered", () => {
  /**
   * Read a formatted string back the way a partner reads it off the screen.
   * Matches the numeric token specifically — the Arabic suffix "ر.س" contains a
   * dot, so stripping by character class yields a trailing "." and NaN.
   */
  const parse = (formatted: string) => {
    const match = formatted.match(/-?[\d,]+(?:\.\d+)?/);
    if (!match) throw new Error(`no number in ${formatted}`);
    return Number(match[0].replace(/,/g, ""));
  };

  it("parses its own fixtures — guards these assertions against NaN", () => {
    expect(parse(formatCurrency(2300.87, "ar", true))).toBe(2300.87);
    expect(parse(formatCurrency(2300.87, "en", true))).toBe(2300.87);
    expect(parse(formatCurrency(-5368.69, "ar", true))).toBe(-5368.69);
  });

  it("shows 2 decimals on every amount and balance, in both locales", () => {
    for (const locale of ["ar", "en"] as const) {
      for (const row of mockLedger) {
        expect(formatCurrency(row.amount, locale, true), row.id).toMatch(/\d\.\d{2}(\s|$)/);
        expect(formatCurrency(row.balanceAfter, locale, true), row.id).toMatch(/\d\.\d{2}(\s|$)/);
      }
    }
  });

  it("adds the displayed amounts up to the displayed final balance", () => {
    const displayedAmounts = mockLedger.map((r) => parse(formatCurrency(r.amount, "ar", true)));
    const sum = round2(displayedAmounts.reduce((s, n) => s + n, 0));
    const displayedFinal = parse(
      formatCurrency(mockLedger[mockLedger.length - 1].balanceAfter, "ar", true),
    );

    expect(sum).toBe(displayedFinal);
  });

  it("keeps each displayed balance equal to the previous one plus the displayed amount", () => {
    let running = 0;
    for (const row of mockLedger) {
      running = round2(running + parse(formatCurrency(row.amount, "ar", true)));
      expect(running, `${row.id} — column does not add up on screen`).toBe(
        parse(formatCurrency(row.balanceAfter, "ar", true)),
      );
    }
  });

  it("renders every figure at full fidelity — nothing is lost to rounding", () => {
    for (const row of mockLedger) {
      expect(parse(formatCurrency(row.amount, "ar", true)), row.id).toBe(row.amount);
      expect(parse(formatCurrency(row.balanceAfter, "ar", true)), row.id).toBe(row.balanceAfter);
    }
  });

  it("loses halalas without `precise` — which is why the flag exists", () => {
    // Not that the column stops adding up (roundings can cancel), but that the
    // partner is shown a number that is not their balance.
    const lossy = mockLedger.filter((r) => parse(formatCurrency(r.amount, "ar")) !== r.amount);
    expect(lossy.length).toBeGreaterThan(0);
    expect(parse(formatCurrency(buildWallet().availableBalance, "ar"))).not.toBe(
      buildWallet().availableBalance,
    );
  });

  it("matches the header balance to the ledger's last displayed balance", () => {
    const header = formatCurrency(buildWallet().availableBalance, "ar", true);
    const lastRow = formatCurrency(mockLedger[mockLedger.length - 1].balanceAfter, "ar", true);
    expect(header).toBe(lastRow);
  });
});

/**
 * A partner who opens a payout will add the rows up. They have to equal the
 * amount they were told was transferred, or the record is worthless.
 */
describe("payouts", () => {
  it("composes every payout from bookings that sum exactly to its amount", () => {
    for (const payout of mockPayouts) {
      const detail = readMockPayout(payout.id);
      expect(detail, payout.reference).not.toBeNull();
      const sum = round2(detail!.bookings.reduce((s, b) => s + b.partnerShare, 0));
      expect(sum, payout.reference).toBe(payout.amount);
      expect(detail!.bookings).toHaveLength(payout.bookingsCount);
    }
  });

  it("splits each composing booking consistently with its own financials", () => {
    for (const payout of mockPayouts) {
      for (const row of readMockPayout(payout.id)!.bookings) {
        const booking = mockBookings.find((b) => b.id === row.bookingId)!;
        expect(row.gross).toBe(booking.financials.total);
        expect(row.netBase).toBe(booking.financials.netBase);
        expect(row.commission).toBe(booking.financials.commission);
        expect(row.partnerShare).toBe(booking.financials.partnerShare);
        expect(round2(row.commission + row.partnerShare + booking.financials.vat)).toBe(row.gross);
      }
    }
  });

  it("keeps a reversed payout visible, with its reason and a compensating credit", () => {
    const reversed = mockPayouts.find((p) => p.status === "reversed");
    expect(reversed, "seed must include a reversed payout").toBeDefined();
    expect(reversed!.reversalReason).toBeTruthy();
    expect(reversed!.reversedAt).toBeTruthy();
    // Still listed — never hidden.
    expect(readMockPayouts().some((p) => p.id === reversed!.id)).toBe(true);

    // Debited then credited back: net zero, history intact.
    const rows = mockLedger.filter((r) => r.refId === reversed!.id);
    expect(round2(rows.reduce((s, r) => s + r.amount, 0))).toBe(0);
  });

  it("excludes reversed transfers from lifetimePaidOut", () => {
    const paid = round2(
      mockPayouts.filter((p) => p.status === "paid").reduce((s, p) => s + p.amount, 0),
    );
    const all = round2(mockPayouts.reduce((s, p) => s + p.amount, 0));

    expect(buildWallet().lifetimePaidOut).toBe(paid);
    expect(all).toBeGreaterThan(paid); // the reversed one is genuinely excluded
  });

  it("never exposes a full IBAN back to the partner", () => {
    for (const payout of mockPayouts) {
      expect(payout.ibanMasked).toMatch(/^••••\d{4}$/);
      expect(payout.ibanMasked).not.toContain("SA");
    }
  });
});

describe("ledger cursor pagination", () => {
  it("returns newest first", () => {
    const page = readMockLedger({ limit: 50 });
    const dates = page.map((r) => r.createdAt);
    expect([...dates].sort().reverse()).toEqual(dates);
  });

  it("respects the limit", () => {
    expect(readMockLedger({ limit: 2 })).toHaveLength(2);
  });

  it("walks the whole ledger without repeating or skipping a row", () => {
    const seen: string[] = [];
    let before: string | undefined;
    for (;;) {
      const page = readMockLedger({ limit: 2, before });
      if (page.length === 0) break;
      seen.push(...page.map((r) => r.id));
      before = page[page.length - 1].createdAt;
    }

    expect(new Set(seen).size).toBe(seen.length); // no duplicates
    expect(seen).toHaveLength(mockLedger.length); // no gaps
  });
});
