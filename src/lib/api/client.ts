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
  buildReportCsv,
  addMockFeed,
  deleteMockFeed,
  syncMockFeed,
  mockIcalExportUrl,
} from "@/mocks/data";
import { OTP } from "@/lib/constants";

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK !== "false";
const BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

const delay = (ms = 350) => new Promise((r) => setTimeout(r, ms));

/**
 * Real-mode fetch wrapper. Auth is a cookie session (no bearer token) — always
 * `credentials: "include"`. Mutations are protected server-side by SameSite +
 * an Origin allowlist (no CSRF token to send). Failures use the global envelope
 * `{ error: { code, message, fields? } }` — surfaced as ApiError.
 */
async function http<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) throw await toApiError(res);
  return res.json() as Promise<T>;
}

/** Lists are paginated as `{ data, meta: { page, limit, total } }` — unwrap `data`. */
async function httpList<T>(path: string, init?: RequestInit): Promise<T[]> {
  const json = await http<{ data: T[] } | T[]>(path, init);
  return Array.isArray(json) ? json : json.data;
}

async function toApiError(res: Response): Promise<ApiError> {
  let code = `HTTP_${res.status}`;
  let message = res.statusText;
  let fields: Record<string, string> | undefined;
  try {
    const j = (await res.json()) as { error?: { code?: string; message?: string; fields?: Record<string, string> } };
    code = j.error?.code ?? code;
    message = j.error?.message ?? message; // Arabic, user-facing
    fields = j.error?.fields;
  } catch {
    /* non-JSON body — keep statusText */
  }
  return new ApiError(res.status, message, code, fields);
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public code: string = "UNKNOWN",
    public fields?: Record<string, string>,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export interface OtpResult {
  ok: boolean;
  reason?:
    | "wrong_number"
    | "wrong_code"
    | "expired"
    | "locked"
    | "rate_limited"
    | "pending"
    | "suspended";
}

/** Backend error codes (§1.2 + deviations §2) → login-screen reasons. */
const otpReasonByCode: Record<string, NonNullable<OtpResult["reason"]>> = {
  VALIDATION: "wrong_number",
  PARTNER_NOT_FOUND: "wrong_number",
  OTP_WRONG: "wrong_code",
  OTP_EXPIRED: "expired",
  OTP_LOCKED: "locked",
  RATE_LIMITED: "rate_limited",
  ACCOUNT_PENDING: "pending", // backend folds "rejected" applications into pending
  ACCOUNT_SUSPENDED: "suspended",
};

function toOtpResult(e: unknown): OtpResult {
  if (e instanceof ApiError && otpReasonByCode[e.code]) {
    return { ok: false, reason: otpReasonByCode[e.code] };
  }
  throw e;
}

export const api = {
  // ---- Auth (OTP only) --------------------------------------------------
  async requestOtp(phone: string): Promise<OtpResult> {
    if (USE_MOCK) {
      await delay();
      if (!/^5\d{8}$/.test(phone)) return { ok: false, reason: "wrong_number" };
      return { ok: true };
    }
    try {
      return await http("/auth/otp/request", {
        method: "POST",
        body: JSON.stringify({ phone }),
      });
    } catch (e) {
      return toOtpResult(e);
    }
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
    try {
      return await http("/auth/otp/verify", {
        method: "POST",
        body: JSON.stringify({ phone, code }),
      });
    } catch (e) {
      return toOtpResult(e);
    }
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

  /**
   * §7.2 — authenticated file download (server-rendered Arabic-RTL PDF via mpdf,
   * or CSV with UTF-8 BOM). Returns a Blob; the caller triggers the download.
   * Mock mode always produces a CSV built from the seeded summary.
   */
  async exportReport(from: string, to: string, format: "pdf" | "csv"): Promise<Blob> {
    if (USE_MOCK) {
      await delay(500);
      return new Blob(["﻿" + buildReportCsv(from, to)], { type: "text/csv;charset=utf-8" });
    }
    const res = await fetch(
      `${BASE}/reports/export?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&format=${format}`,
      { credentials: "include" },
    );
    if (!res.ok) throw await toApiError(res);
    return res.blob();
  },

  // ---- Units ------------------------------------------------------------
  async listUnits(): Promise<Unit[]> {
    if (USE_MOCK) {
      await delay();
      return mockUnits;
    }
    return httpList("/units");
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

  /** §5.4 — bare array (not enveloped). */
  async listFeeds(unitId: string): Promise<ICalFeed[]> {
    if (USE_MOCK) {
      await delay();
      return [...mockFeeds];
    }
    return http(`/units/${unitId}/ical`);
  },

  /** Backend fetches + validates the URL is real iCal before saving (400 INVALID_ICAL otherwise). */
  async addFeed(unitId: string, source: string, url: string): Promise<ICalFeed> {
    if (USE_MOCK) {
      await delay(600);
      return addMockFeed(source, url);
    }
    return http(`/units/${unitId}/ical`, {
      method: "POST",
      body: JSON.stringify({ source, url }),
    });
  },

  async deleteFeed(unitId: string, feedId: string): Promise<void> {
    if (USE_MOCK) {
      await delay();
      deleteMockFeed(feedId);
      return;
    }
    await http(`/units/${unitId}/ical/${feedId}`, { method: "DELETE" });
  },

  /** "مزامنة الآن" — returns the updated feed; re-fetch the month grid afterwards. */
  async syncFeed(unitId: string, feedId: string): Promise<ICalFeed> {
    if (USE_MOCK) {
      await delay(700);
      return syncMockFeed(feedId);
    }
    return http(`/units/${unitId}/ical/${feedId}/sync`, { method: "POST" });
  },

  /** §5.5 — server-minted public .ics URL (revocable token). Never build it client-side. */
  async getIcalExport(unitId: string): Promise<{ url: string }> {
    if (USE_MOCK) {
      await delay();
      return { url: mockIcalExportUrl(unitId) };
    }
    return http(`/units/${unitId}/ical/export`);
  },

  // ---- Bookings ---------------------------------------------------------
  async listBookings(): Promise<Booking[]> {
    if (USE_MOCK) {
      await delay();
      return mockBookings;
    }
    return httpList("/bookings");
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

  /**
   * Host "unable to host" — atomic + idempotent server-side; auto refund 100%.
   * Pass a stable `idempotencyKey` per cancel flow so a double-click / retry
   * with the same key never double-refunds (deviations §8).
   */
  async hostCancel(id: string, reason: string, idempotencyKey?: string): Promise<Booking> {
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
      headers: idempotencyKey ? { "Idempotency-Key": idempotencyKey } : undefined,
      body: JSON.stringify({ reason }),
    });
  },

  // ---- Notifications ----------------------------------------------------
  async listNotifications(): Promise<AppNotification[]> {
    if (USE_MOCK) {
      await delay();
      return mockNotifications;
    }
    return httpList("/notifications");
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
