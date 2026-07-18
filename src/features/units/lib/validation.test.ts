import { describe, it, expect } from "vitest";
import { isValidCleaningFee } from "./validation";

describe("isValidCleaningFee", () => {
  it("treats an empty value as valid (defaults to 0)", () => {
    expect(isValidCleaningFee("")).toBe(true);
    expect(isValidCleaningFee("   ")).toBe(true);
  });
  it("rejects negative numbers", () => {
    expect(isValidCleaningFee("-1")).toBe(false);
    expect(isValidCleaningFee("-50")).toBe(false);
  });
  it("accepts zero and positive numbers", () => {
    expect(isValidCleaningFee("0")).toBe(true);
    expect(isValidCleaningFee("50")).toBe(true);
    expect(isValidCleaningFee("1200")).toBe(true);
  });
});
