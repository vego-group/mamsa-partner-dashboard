import { describe, it, expect } from "vitest";
import { createMockUnit, updateMockUnit, mockUnits } from "@/mocks/data";

describe("cancellationPolicy persistence in mock unit create/update", () => {
  it("defaults to moderate when omitted on create", () => {
    const unit = createMockUnit({ name: "Test Unit" });
    expect(unit.cancellationPolicy).toBe("moderate");
  });

  it("persists a partner-chosen preset on create and reflects it in the unit list", () => {
    const unit = createMockUnit({ name: "Strict Unit", cancellationPolicy: "strict" });
    expect(unit.cancellationPolicy).toBe("strict");
    expect(mockUnits.find((u) => u.id === unit.id)?.cancellationPolicy).toBe("strict");
  });

  it("persists an updated preset", () => {
    const created = createMockUnit({ name: "Flexible Unit", cancellationPolicy: "flexible" });
    const updated = updateMockUnit(created.id, { cancellationPolicy: "strict" });
    expect(updated.cancellationPolicy).toBe("strict");
    expect(mockUnits.find((u) => u.id === created.id)?.cancellationPolicy).toBe("strict");
  });
});
