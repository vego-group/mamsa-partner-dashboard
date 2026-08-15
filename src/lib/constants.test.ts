import { describe, it, expect } from "vitest";
import { CANCELLATION_POLICIES, POLICY_REGISTRY, DEFAULT_CANCELLATION_POLICY, isCancellationPolicyName, isRevenueBearing } from "@/lib/constants";
import type { BookingStatus } from "@/types";

describe("cancellation policy presets", () => {
  it("defines exactly the 3 fixed presets — no custom entries", () => {
    expect(CANCELLATION_POLICIES.map((p) => p.name)).toEqual(["flexible", "moderate", "strict"]);
    expect(Object.keys(POLICY_REGISTRY).sort()).toEqual(["flexible", "moderate", "strict"]);
  });

  it("matches the locked refund tiers exactly", () => {
    expect(POLICY_REGISTRY.flexible.tiers.map((t) => t.refundPercent)).toEqual([100, 75, 50]);
    expect(POLICY_REGISTRY.moderate.tiers.map((t) => t.refundPercent)).toEqual([100, 50, 25]);
    expect(POLICY_REGISTRY.strict.tiers.map((t) => t.refundPercent)).toEqual([75, 25, 0]);
  });

  it("defaults new units to moderate", () => {
    expect(DEFAULT_CANCELLATION_POLICY).toBe("moderate");
    expect(isCancellationPolicyName(DEFAULT_CANCELLATION_POLICY)).toBe(true);
  });

  it("validates only the 3 known preset names", () => {
    expect(isCancellationPolicyName("flexible")).toBe(true);
    expect(isCancellationPolicyName("moderate")).toBe(true);
    expect(isCancellationPolicyName("strict")).toBe(true);
    expect(isCancellationPolicyName("custom")).toBe(false);
    expect(isCancellationPolicyName("")).toBe(false);
  });
});

/**
 * `pending_payment` joined BookingStatus as a fourth member. Until it did,
 * `status !== "cancelled"` happened to mean exactly "confirmed + completed", so
 * revenue code spelled the rule that way — and silently widened to include
 * unpaid bookings the moment the union grew.
 *
 * This Record is exhaustive by construction: a fifth BookingStatus makes it a
 * type error, so whoever adds one has to state whether it earns money instead
 * of letting a revenue total change on its own.
 */
const REVENUE_BEARING: Record<BookingStatus, boolean> = {
  pending_payment: false, // guest hasn't paid — no money exists yet
  confirmed: true,
  completed: true,
  cancelled: false,
};

describe("isRevenueBearing", () => {
  it("classifies every booking status, and only paid ones earn", () => {
    for (const [status, earns] of Object.entries(REVENUE_BEARING)) {
      expect(isRevenueBearing(status as BookingStatus), status).toBe(earns);
    }
  });

  it("is narrower than 'not cancelled' — that shortcut is what broke", () => {
    const notCancelled = (Object.keys(REVENUE_BEARING) as BookingStatus[]).filter((s) => s !== "cancelled");
    const earning = notCancelled.filter(isRevenueBearing);
    expect(earning).not.toEqual(notCancelled);
    expect(notCancelled).toContain("pending_payment");
    expect(earning).not.toContain("pending_payment");
  });
});
