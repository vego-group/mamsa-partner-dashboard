import { describe, it, expect } from "vitest";
import { CANCELLATION_POLICIES, POLICY_REGISTRY, DEFAULT_CANCELLATION_POLICY, isCancellationPolicyName } from "@/lib/constants";

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
