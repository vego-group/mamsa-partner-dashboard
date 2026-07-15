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
  CompanyDocs,
  UnitCreateInput,
  UploadKind,
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
  mockCompanyDocs,
  saveMockCompanyDocs,
  saveMockPartner,
  mockPresignUpload,
  createMockUnit,
  updateMockUnit,
  submitMockUnit,
  deleteMockUnit,
} from "@/mocks/data";
import { OTP } from "@/lib/constants";

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK !== "false";
const USE_PROXY = process.env.NODE_ENV === "development";
const BASE = USE_PROXY ? "/api/proxy" : process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

/**
 * Units/bookings/notifications have no pagination UI (no "load more", no page
 * controls) — they render whatever this one page returns. The contract's own
 * example defaults to a 20-item page (§0.5), so without this a partner with
 * >20 of any of these would silently lose data past page 1. This is a stopgap:
 * it raises the ceiling but doesn't remove it. If any partner can realistically
 * exceed 200, this needs real pagination (infinite scroll / page controls),
 * not a bigger constant.
 */
const LIST_ALL_QS = "limit=200";

const delay = (ms = 350) => new Promise((r) => setTimeout(r, ms));

function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("966")) return digits.slice(3);
  if (digits.startsWith("0")) return digits.slice(1);
  return digits;
}

function isNetworkError(error: unknown): boolean {
  return (
    error instanceof TypeError ||
    (error instanceof Error && /fetch|network|load failed|aborted/i.test(error.message))
  );
}

async function fetchWithErrorHandling(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  try {
    const res = await fetch(input, init);
    if (!res.ok) throw bounceIfUnauthenticated(await toApiError(res));
    return res;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (isNetworkError(error)) {
      throw new ApiError(0, "We couldn't reach the server. Please try again.", "NETWORK_ERROR");
    }
    throw error;
  }
}

/**
 * Session expired → bounce to the OTP login (REPORTS.md §4). Keyed on the
 * `UNAUTHENTICATED` code specifically — a 401 `OTP_WRONG` during login must
 * NOT redirect. Hard replace so the dead dashboard view leaves history.
 */
function bounceIfUnauthenticated(e: ApiError): ApiError {
  if (
    e.code === "UNAUTHENTICATED" &&
    typeof window !== "undefined" &&
    !window.location.pathname.startsWith("/login")
  ) {
    window.location.replace("/login");
  }
  return e;
}

/**
 * Real-mode fetch wrapper. Auth is a cookie session (no bearer token) — always
 * `credentials: "include"`. Mutations are protected server-side by SameSite +
 * an Origin allowlist (no CSRF token to send). Failures use the global envelope
 * `{ error: { code, message, fields? } }` — surfaced as ApiError.
 */
async function http<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetchWithErrorHandling(`${BASE}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
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
    | "suspended"
    | "network_error";
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
  if (e instanceof ApiError) {
    if (otpReasonByCode[e.code]) {
      return { ok: false, reason: otpReasonByCode[e.code] };
    }
    if (e.code === "NETWORK_ERROR" || e.status === 0) {
      return { ok: false, reason: "network_error" };
    }
  }
  if (isNetworkError(e)) {
    return { ok: false, reason: "network_error" };
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
        body: JSON.stringify({ phone: normalizePhone(phone) }),
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
        body: JSON.stringify({ phone: normalizePhone(phone), code }),
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

  /** §2.2 — PATCH /me. Editable: name + email only (phone goes through the OTP flow). */
  async updateMe(patch: { name: string; email: string }): Promise<Partner> {
    if (USE_MOCK) {
      await delay();
      return saveMockPartner(patch);
    }
    return http("/me", { method: "PATCH", body: JSON.stringify(patch) });
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
    const res = await fetchWithErrorHandling(
      `${BASE}/reports/export?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&format=${format}`,
      { credentials: "include" },
    );
    return res.blob();
  },

  // ---- Units ------------------------------------------------------------
  async listUnits(): Promise<Unit[]> {
    if (USE_MOCK) {
      await delay();
      return mockUnits;
    }
    // The UI has no pagination controls — request a high limit so a partner
    // with more units than the backend's default page size (contract example: 20)
    // doesn't silently lose data past page 1.
    return httpList(`/units?${LIST_ALL_QS}`);
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

  /** POST /units — creates a draft. Partial body allowed (drafts skip required-field validation). */
  async createUnit(input: UnitCreateInput): Promise<Unit> {
    if (USE_MOCK) {
      await delay();
      return createMockUnit(input);
    }
    return http("/units", { method: "POST", body: JSON.stringify(input) });
  },

  async updateUnit(id: string, input: UnitCreateInput): Promise<Unit> {
    if (USE_MOCK) {
      await delay();
      return updateMockUnit(id, input);
    }
    return http(`/units/${id}`, { method: "PATCH", body: JSON.stringify(input) });
  },

  /**
   * POST /units/:id/submit — draft/rejected → pending. Full field validation
   * happens server-side here (§4); a company partner with incomplete payout
   * docs gets 409 COMPANY_DOCS_INCOMPLETE.
   */
  async submitUnit(id: string): Promise<Unit> {
    if (USE_MOCK) {
      await delay(500);
      return submitMockUnit(id);
    }
    return http(`/units/${id}/submit`, { method: "POST" });
  },

  async deleteUnit(id: string): Promise<void> {
    if (USE_MOCK) {
      await delay();
      deleteMockUnit(id);
      return;
    }
    await http(`/units/${id}`, { method: "DELETE" });
  },

  // ---- Uploads (§9.1) ----------------------------------------------------
  /**
   * Two-step presigned upload: ask for a signed PUT URL, then PUT the raw
   * bytes to it, then reference the returned `fileId` on the owning resource
   * (unit photo / license PDF / company doc). Server validates type by magic
   * bytes and size ≤10MB on receipt — client MIME is never trusted there.
   */
  async uploadFile(kind: UploadKind, file: File): Promise<{ fileId: string }> {
    if (USE_MOCK) {
      await delay(400 + Math.random() * 400);
      return mockPresignUpload(file.name);
    }
    const { uploadUrl, fileId } = await http<{ uploadUrl: string; fileId: string }>("/uploads/presign", {
      method: "POST",
      body: JSON.stringify({ kind, fileName: file.name, mimeType: file.type, size: file.size }),
    });
    const putRes = await fetch(uploadUrl, { method: "PUT", body: file });
    if (!putRes.ok) throw new ApiError(putRes.status, "تعذّر رفع الملف.", "UPLOAD_FAILED");
    return { fileId };
  },

  // ---- Company payout docs (§9.2 — one-time per partner, companies only) ---
  async getCompanyDocs(): Promise<CompanyDocs> {
    if (USE_MOCK) {
      await delay();
      return { ...mockCompanyDocs };
    }
    return http("/me/company-docs");
  },

  async putCompanyDocs(patch: Partial<CompanyDocs>): Promise<CompanyDocs> {
    if (USE_MOCK) {
      await delay();
      return saveMockCompanyDocs(patch);
    }
    return http("/me/company-docs", { method: "PUT", body: JSON.stringify(patch) });
  },

  // ---- Calendar ---------------------------------------------------------
  async getCalendar(unitId: string, month: string): Promise<CalendarDay[]> {
    if (USE_MOCK) {
      await delay();
      return mockCalendar[unitId] ?? mockCalendar.u_1;
    }
    // Contract returns a bare array; tolerate a `{ data }` envelope defensively.
    const json = await http<{ data: CalendarDay[] } | CalendarDay[]>(
      `/units/${unitId}/calendar?month=${month}`,
    );
    return Array.isArray(json) ? json : json.data ?? [];
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
    return httpList(`/bookings?${LIST_ALL_QS}`);
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
    return httpList(`/notifications?${LIST_ALL_QS}`);
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
