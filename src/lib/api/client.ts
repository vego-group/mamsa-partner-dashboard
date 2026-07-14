/**
 * apiClient — the SINGLE data-access abstraction.
 * Components NEVER call fetch directly; they call these typed methods.
 *
 * Flip NEXT_PUBLIC_USE_MOCK=false + set NEXT_PUBLIC_API_BASE_URL to hit the real
 * backend with ZERO component changes. The method signatures are identical in
 * both modes.
 */

import type {
  Partner,
  Unit,
  Booking,
  CalendarDay,
  ICalFeed,
  AppNotification,
  OverviewMetrics,
  ReportsSummary,
} from "@/types";
import {
  mockPartner,
  mockUnits,
  mockBookings,
  mockCalendar,
  mockFeeds,
  mockNotifications,
  buildOverview,
  buildReportsSummary,
} from "@/mocks/data";
import { OTP } from "@/lib/constants";

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK !== "false";
const BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

const delay = (ms = 350) => new Promise((r) => setTimeout(r, ms));

/** Real-mode fetch wrapper — credentials via httpOnly cookie, CSRF header on writes. */
async function http<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) throw new ApiError(res.status, await safeText(res));
  return res.json() as Promise<T>;
}

async function safeText(res: Response) {
  try {
    return await res.text();
  } catch {
    return res.statusText;
  }
}

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = "ApiError";
  }
}

export interface OtpResult {
  ok: boolean;
  reason?: "wrong_number" | "wrong_code" | "expired" | "pending" | "suspended";
}

export const api = {
  // ---- Auth (OTP only) --------------------------------------------------
  async requestOtp(phone: string): Promise<OtpResult> {
    if (USE_MOCK) {
      await delay();
      if (!/^5\d{8}$/.test(phone)) return { ok: false, reason: "wrong_number" };
      return { ok: true };
    }
    return http("/auth/otp/request", {
      method: "POST",
      body: JSON.stringify({ phone }),
    });
  },

  async verifyOtp(phone: string, code: string): Promise<OtpResult> {
    if (USE_MOCK) {
      await delay();
      if (code !== OTP.mockCode) return { ok: false, reason: "wrong_code" };
      // Mock account gate — flip mockPartner.accountState to test states.
      if (mockPartner.accountState === "pending") return { ok: false, reason: "pending" };
      if (mockPartner.accountState === "suspended") return { ok: false, reason: "suspended" };
      return { ok: true };
    }
    return http("/auth/otp/verify", {
      method: "POST",
      body: JSON.stringify({ phone, code }),
    });
  },

  async logout(): Promise<void> {
    if (USE_MOCK) return;
    await http("/auth/logout", { method: "POST" });
  },

  // ---- Partner ----------------------------------------------------------
  async getPartner(): Promise<Partner> {
    if (USE_MOCK) {
      await delay();
      return mockPartner;
    }
    return http("/me");
  },

  // ---- Overview ---------------------------------------------------------
  async getOverview(): Promise<OverviewMetrics> {
    if (USE_MOCK) {
      await delay();
      return buildOverview();
    }
    return http("/overview");
  },

  // ---- Reports ----------------------------------------------------------
  /** §7.1 — from/to as ISO dates (yyyy-mm-dd). Range shortcuts are frontend-side. */
  async getReportsSummary(from: string, to: string): Promise<ReportsSummary> {
    if (USE_MOCK) {
      await delay();
      return buildReportsSummary(from, to);
    }
    return http(`/reports/summary?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`);
  },

  // ---- Units ------------------------------------------------------------
  async listUnits(): Promise<Unit[]> {
    if (USE_MOCK) {
      await delay();
      return mockUnits;
    }
    return http("/units");
  },

  async getUnit(id: string): Promise<Unit> {
    if (USE_MOCK) {
      await delay();
      const u = mockUnits.find((x) => x.id === id);
      if (!u) throw new ApiError(404, "Unit not found");
      return u;
    }
    return http(`/units/${id}`);
  },

  async createUnit(input: Partial<Unit>): Promise<Unit> {
    if (USE_MOCK) {
      await delay();
      return { ...mockUnits[0], ...input, id: `u_${Date.now()}`, status: "pending" };
    }
    return http("/units", { method: "POST", body: JSON.stringify(input) });
  },

  async updateUnit(id: string, input: Partial<Unit>): Promise<Unit> {
    if (USE_MOCK) {
      await delay();
      const u = mockUnits.find((x) => x.id === id)!;
      // Editing an approved unit returns it to pending (§7).
      const status = u.status === "approved" ? "pending" : u.status;
      return { ...u, ...input, status };
    }
    return http(`/units/${id}`, { method: "PATCH", body: JSON.stringify(input) });
  },

  async deleteUnit(id: string): Promise<void> {
    if (USE_MOCK) {
      await delay();
      return;
    }
    await http(`/units/${id}`, { method: "DELETE" });
  },

  // ---- Calendar ---------------------------------------------------------
  async getCalendar(unitId: string, _month: string): Promise<CalendarDay[]> {
    if (USE_MOCK) {
      await delay();
      return mockCalendar[unitId] ?? mockCalendar.u_1;
    }
    return http(`/units/${unitId}/calendar?month=${_month}`);
  },

  async blockDates(unitId: string, dates: string[], reason?: string): Promise<void> {
    if (USE_MOCK) {
      await delay();
      return;
    }
    await http(`/units/${unitId}/calendar/block`, {
      method: "POST",
      body: JSON.stringify({ dates, reason }),
    });
  },

  async unblockDates(unitId: string, dates: string[]): Promise<void> {
    if (USE_MOCK) {
      await delay();
      return;
    }
    await http(`/units/${unitId}/calendar/unblock`, {
      method: "POST",
      body: JSON.stringify({ dates }),
    });
  },

  async listFeeds(unitId: string): Promise<ICalFeed[]> {
    if (USE_MOCK) {
      await delay();
      return mockFeeds;
    }
    return http(`/units/${unitId}/ical`);
  },

  // ---- Bookings ---------------------------------------------------------
  async listBookings(): Promise<Booking[]> {
    if (USE_MOCK) {
      await delay();
      return mockBookings;
    }
    return http("/bookings");
  },

  async getBooking(id: string): Promise<Booking> {
    if (USE_MOCK) {
      await delay();
      const b = mockBookings.find((x) => x.id === id);
      if (!b) throw new ApiError(404, "Booking not found");
      return b;
    }
    return http(`/bookings/${id}`);
  },

  /** Host "unable to host" — auto refund 100%, record host cancellation. */
  async hostCancel(id: string, reason: string): Promise<Booking> {
    if (USE_MOCK) {
      await delay(900);
      const b = mockBookings.find((x) => x.id === id)!;
      return {
        ...b,
        status: "cancelled",
        cancellation: {
          type: "host",
          reason,
          date: new Date().toISOString(),
          refundAmount: b.financials.total, // 100% of total
          refundStatus: "processing",
        },
      };
    }
    return http(`/bookings/${id}/host-cancel`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    });
  },

  // ---- Notifications ----------------------------------------------------
  async listNotifications(): Promise<AppNotification[]> {
    if (USE_MOCK) {
      await delay();
      return mockNotifications;
    }
    return http("/notifications");
  },

  async markAllRead(): Promise<void> {
    if (USE_MOCK) {
      await delay();
      return;
    }
    await http("/notifications/read-all", { method: "POST" });
  },
};

export const IS_MOCK = USE_MOCK;
