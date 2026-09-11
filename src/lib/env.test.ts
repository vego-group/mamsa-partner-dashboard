import { describe, it, expect } from "vitest";
import { parseMockFlag, shouldShowMockBadge } from "./env";

/**
 * The flag used to read `!== "false"`, so `False`, `0` and `true1` all
 * silently meant "mock on" while the developer believed the opposite. The
 * strict parser accepts two spellings and refuses everything else out loud.
 */
describe("parseMockFlag", () => {
  it("accepts true and false, trimmed and case-insensitive", () => {
    expect(parseMockFlag("true")).toBe(true);
    expect(parseMockFlag("false")).toBe(false);
    expect(parseMockFlag(" TRUE ")).toBe(true);
    expect(parseMockFlag("False")).toBe(false);
  });

  it("refuses every plausible-but-wrong value instead of defaulting", () => {
    for (const bad of ["true1", "0", "1", "", "  ", "yes", "no", "mock", "off"]) {
      expect(() => parseMockFlag(bad), JSON.stringify(bad)).toThrow();
    }
  });

  it("refuses an unset variable", () => {
    expect(() => parseMockFlag(undefined)).toThrow(/unset/);
  });

  it("names the variable and the value it got", () => {
    expect(() => parseMockFlag("true1")).toThrow(/NEXT_PUBLIC_USE_MOCK/);
    expect(() => parseMockFlag("true1")).toThrow(/"true1"/);
  });
});

describe("shouldShowMockBadge", () => {
  it("shows only in a dev build with the mock on", () => {
    expect(shouldShowMockBadge("development", true)).toBe(true);
    expect(shouldShowMockBadge("development", false)).toBe(false);
    expect(shouldShowMockBadge("production", true)).toBe(false);
    expect(shouldShowMockBadge("test", true)).toBe(false);
    expect(shouldShowMockBadge(undefined, true)).toBe(false);
  });
});
