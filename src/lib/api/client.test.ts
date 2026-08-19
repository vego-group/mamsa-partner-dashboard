import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";

describe("api client network failures", () => {
  const originalUseMock = process.env.NEXT_PUBLIC_USE_MOCK;

  beforeEach(() => {
    process.env.NEXT_PUBLIC_USE_MOCK = "false";
    vi.resetModules();
  });

  afterEach(() => {
    if (originalUseMock === undefined) {
      delete process.env.NEXT_PUBLIC_USE_MOCK;
    } else {
      process.env.NEXT_PUBLIC_USE_MOCK = originalUseMock;
    }
    vi.unstubAllGlobals();
  });

  it("returns a user-facing OTP result when fetch fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")));

    const { api } = await import("./client");

    await expect(api.requestOtp("512345678")).resolves.toEqual({
      ok: false,
      reason: "network_error",
    });
  });

  it("strips the leading zero from Saudi phone numbers before sending them", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const { api } = await import("./client");

    await api.requestOtp("0512345678");

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/auth/otp/request"),
      expect.objectContaining({
        body: JSON.stringify({ phone: "512345678" }),
      }),
    );
  });

  /**
   * The endpoint reads `Idempotency-Key`: a duplicate key returns the
   * already-cancelled booking instead of issuing a SECOND refund. Dropping the
   * header leaves a double-click guarded only by the status check, which is a
   * narrower race.
   */
  it("sends an Idempotency-Key with a host cancellation", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: "b_63", status: "cancelled" }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const { api } = await import("./client");

    await api.hostCancel("b_63", "الوحدة محجوزة على منصة أخرى", "key-1");

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toContain("/bookings/b_63/host-cancel");
    expect(init.method).toBe("POST");
    expect(init.headers["Idempotency-Key"]).toBe("key-1");
    expect(init.body).toBe(JSON.stringify({ reason: "الوحدة محجوزة على منصة أخرى" }));
  });
});
