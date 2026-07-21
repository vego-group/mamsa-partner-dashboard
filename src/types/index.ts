/**
 * Domain types — source of truth for the whole dashboard.
 * States match SRS v1.1 exactly.
 */

export type AccountType = "individual" | "company";

/** Unit lifecycle (§7). Do NOT conflate with availability. */
export type UnitStatus = "draft" | "pending" | "approved" | "rejected";

/** Booking states — NO "pending" (payment is instant via Moyasar). */
export type BookingStatus = "confirmed" | "completed" | "cancelled";

/** Calendar day availability. */
export type DayStatus = "available" | "booked" | "blocked" | "external";

export type PropertyType = "apartment" | "studio" | "villa";

/** Per-unit, partner-chosen at creation/edit — never a platform-wide setting. */
export type CancellationPolicyName = "flexible" | "moderate" | "strict";

export type Amenity =
  | "wifi"
  | "ac"
  | "kitchen"
  | "parking"
  | "pool"
  | "security"
  | "self_checkin"
  | "family_friendly";

export interface Partner {
  id: string;
  name: string;
  email: string;
  phone: string; // +9665XXXXXXXX
  accountType: AccountType;
  /** Individual: National ID (10, starts 1). Company: CR (10). Read-only in UI. */
  verificationId: string;
  /** Account gate — controls dashboard access. */
  accountState: "approved" | "pending" | "suspended";
  hostCancellationsLast12m: number;
  flagged: boolean;
  memberSince: string; // ISO
}

/**
 * §9.2 — one-time, per-partner payout docs (companies only). Entered once on
 * the Account page, never re-collected per unit. `complete` is server-computed;
 * a company can't submit a unit while it's false (409 COMPANY_DOCS_INCOMPLETE).
 */
export interface CompanyDocs {
  cr: string; // 10 digits
  iban: string; // SA + 22 digits
  authorizationLetterFileId: string | null;
  vatCertificateFileId: string | null;
  operatorLicenseFileId: string | null;
  complete: boolean;
}

export type UploadKind = "unit_photo" | "license_pdf" | "company_doc";

/** §9.1 — presign → PUT → reference by fileId. */
export interface PresignedUpload {
  uploadUrl: string;
  fileId: string;
}

/** POST /units — partial body allowed (drafts don't validate required fields). */
export interface UnitCreateInput {
  name?: string;
  type?: PropertyType;
  pricePerNight?: number;
  cancellationPolicy?: CancellationPolicyName;
  bedrooms?: number;
  beds?: number;
  bathrooms?: number;
  capacity?: number;
  city?: string;
  district?: string;
  description?: string;
  amenities?: Amenity[];
  checkIn?: string;
  checkOut?: string;
  lat?: number;
  lng?: number;
  address?: string;
  tourismLicenseNumber?: string;
  tourismLicenseFileId?: string;
  /** Uploaded photo fileIds, in display order; `coverFileId` marks the cover. */
  photoFileIds?: string[];
  coverFileId?: string;
}

export interface UnitPhoto {
  id: string;
  url: string;
  isCover: boolean;
}

export interface Unit {
  id: string;
  code: string; // e.g. C7HKHYA4
  name: string;
  type: PropertyType;
  status: UnitStatus;
  pricePerNight: number; // SAR
  /** One of the 3 fixed presets — always set (defaults to "moderate" on create). */
  cancellationPolicy: CancellationPolicyName;
  bedrooms: number;
  /** Optional on read: units created before these fields shipped have neither. */
  beds?: number;
  bathrooms?: number;
  capacity: number;
  /** v1.2 — avg guest rating from the user-website reviews. Absent if no reviews yet. */
  rating?: number; // 0–5
  reviewsCount?: number; // v1.2 — optional
  city: string; // Saudi cities only
  district: string;
  description: string;
  amenities: Amenity[];
  checkIn: string; // "15:00"
  checkOut: string; // "12:00"
  lat: number;
  lng: number;
  address: string;
  tourismLicenseNumber: string;
  tourismLicenseFileId?: string; // uploaded PDF ref
  photos: UnitPhoto[];
  rejectionReason?: string; // present only when status=rejected
  publicUrl?: string; // present only when approved
  updatedAt: string; // ISO
}

export interface BookingFinancials {
  total: number; // SAR
  commission: number; // 2% of total
  partnerShare: number; // 98% of total
}

export interface Booking {
  id: string;
  code: string; // BK-2401
  unitId: string;
  unitName: string;
  unitThumb: string;
  guestName: string;
  guestPhone: string; // +966
  checkIn: string; // ISO
  checkOut: string; // ISO
  nights: number;
  guests: number;
  status: BookingStatus;
  financials: BookingFinancials;
  /** FROZEN at booking time (FR-036) — never re-read from the unit's current policy. */
  policySnapshot?: { name: string; rules: string };
  notes?: string;
  /** Present when cancelled by host. */
  cancellation?: {
    type: "host";
    reason: string;
    date: string; // ISO
    refundAmount: number;
    refundStatus: "processing" | "completed";
  };
}

export interface CalendarDay {
  date: string; // ISO (yyyy-mm-dd)
  status: DayStatus;
  bookingCode?: string; // when booked
  bookingId?: string; // when booked — deep link to the booking
  reason?: string | null; // when blocked (manual close reason, nullable)
  source?: string; // when external, e.g. "Booking.com"
}

export interface ICalFeed {
  id: string;
  source: string; // "Airbnb"
  url: string;
  status: "synced" | "error";
  lastSync: string | null; // ISO — null until first sync
}

/** §8 — the five agreed types. No review/payment/system notifications exist. */
export type NotificationType =
  | "unit_approved"
  | "unit_rejected"
  | "new_booking"
  | "sync_failed"
  | "host_cancellation";

/**
 * What the API actually sends: the §8 five plus extras outside the contract
 * (staging sent `partner_approved` on first sign-in). UI lookups keyed by type
 * must fall back gracefully instead of assuming the closed set.
 */
export type NotificationTypeWire = NotificationType | (string & {});

/**
 * §8 contract shape. `title`/`body` are ready Arabic strings from the backend.
 * Grouping (اليوم/أمس/سابقًا) and time labels are frontend presentation derived
 * from `createdAt` — never part of the API.
 */
export interface AppNotification {
  id: string;
  type: NotificationTypeWire;
  title: string;
  body: string;
  read: boolean;
  createdAt: string; // ISO
  href: string; // deep link into the app
}

/**
 * §3.1 contract. All deltas, sparklines and month-over-month comparisons are
 * frontend-derived from the 12-month series (see features/overview/lib/derive-metrics).
 */
export interface OverviewMetrics {
  unitsCount: number; // excluding drafts
  bookingsCount: number; // confirmed + completed (NOT cancelled)
  totalRevenue: number; // SAR — partner share (98%) of non-cancelled bookings
  bookingsByMonth: { month: string; count: number }[]; // last 12 months, "YYYY-MM"
  revenueByMonth: { month: string; amount: number }[]; // last 12 months, SAR
  thisMonthRevenue: number; // v1.2 — partner share (SAR), current calendar month
  occupancyRate: number; // v1.2 — % booked/available nights, current month
  hasRejectedUnit: boolean;
}

/** §7.1 `GET /reports/summary?from=&to=`. */
export interface ReportsSummary {
  grossRevenue: number; // sum of totals (non-cancelled, in range)
  bookingsCount: number;
  commission: number; // 2%
  netProfit: number; // grossRevenue - commission (SAR)
  revenueByMonth: { month: string; amount: number }[];
  bookingsByMonth: { month: string; count: number }[];
  perUnit: { unitId: string; unitName: string; bookings: number; revenue: number }[];
}
