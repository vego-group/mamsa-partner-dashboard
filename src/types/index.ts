/**
 * Domain types — source of truth for the whole dashboard.
 * States match SRS v1.1 exactly.
 */

export type AccountType = "individual" | "company";

/** Unit lifecycle (§7). Do NOT conflate with availability. */
export type UnitStatus = "draft" | "pending" | "approved" | "rejected";

/**
 * Booking states. `pending_payment` = the booking exists but the guest hasn't
 * paid yet — NOT an approval queue (that's `UnitStatus.pending`, a different
 * concept). Money is only real from `confirmed` onward.
 */
export type BookingStatus = "pending_payment" | "confirmed" | "completed" | "cancelled";

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
  /** Null until the partner sets one — GET /me returns `null`, not "". */
  email: string | null;
  phone: string; // +9665XXXXXXXX
  accountType: AccountType;
  /**
   * Individual: National ID (10, starts 1). Company: CR (10). Read-only in UI.
   *
   * Nullable: partners onboarded straight through OTP never went through the
   * registration step that collects `national_id`/`cr_number`, so live `/me`
   * returns `null` here even for `accountState: "approved"` accounts. The UI
   * must say so rather than render a blank field with a verified checkmark.
   */
  verificationId: string | null;
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
  /**
   * The payout IBAN, for ANY partner type — `PUT /me/company-docs` has no
   * partner-type gate. Badly named here; it moves to `/me/bank-details` once
   * the backend ships that table.
   */
  iban: string; // SA + 22 digits
  /** Accepted by the endpoint but NOT stored — no column yet, so reads come back empty. */
  accountHolderName?: string;
  /**
   * The individual partner's ID scan. Lives on this endpoint despite the name:
   * registration writes the same record, and there is no per-type endpoint.
   * Uploaded with `kind: "company_doc"` — the presign kinds are a fixed set of
   * three and this is the one identity scans are stored under.
   */
  nationalIdFileId: string | null;
  authorizationLetterFileId: string | null;
  vatCertificateFileId: string | null;
  operatorLicenseFileId: string | null;
  complete: boolean;
}

/**
 * Payout bank account — `GET`/`PUT /me/bank-details`. Collected for BOTH
 * account types: an individual partner with no IBAN cannot be paid at all.
 * Verification is manual, by Mamsa finance, and any IBAN change resets it.
 */
export interface BankDetails {
  iban: string;
  accountHolderName: string;
  bankName: string | null;
  verified: boolean;
  verifiedAt: string | null; // ISO
  rejectionReason: string | null;
  updatedAt: string | null; // ISO
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
  /**
   * Nullable by design: the columns stay empty on a draft until the partner
   * fills them in — submit validation is what guarantees a real number, so
   * approved/public units always have both.
   */
  beds?: number | null;
  bathrooms?: number | null;
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
  /**
   * Nullable for the same reason as `beds`/`bathrooms`: a draft carries no
   * coordinates until the partner drops the pin on the map. Guard with
   * `isValidLatLng` before handing these to Leaflet.
   */
  lat: number | null;
  lng: number | null;
  address: string;
  tourismLicenseNumber: string;
  tourismLicenseFileId?: string; // uploaded PDF ref
  photos: UnitPhoto[];
  rejectionReason?: string; // present only when status=rejected
  publicUrl?: string; // present only when approved
  updatedAt: string; // ISO
}

/** All figures in SAR. `total` is the GROSS the guest paid, VAT included. */
export interface BookingFinancials {
  total: number;
  netBase: number; // total excluding VAT
  vat: number; // 15%, remitted to ZATCA
  commission: number; // 2% of netBase
  partnerShare: number; // netBase - commission
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

/* ---------------- Wallet ---------------- */

export type PartnerLedgerEntryType = "earning" | "payout" | "refund_reversal" | "adjustment";

/** Why no transfer is happening. Exactly one applies at a time. */
export type WalletIneligibleReason =
  | "below_minimum"
  | "bank_unverified"
  | "bank_missing"
  | "partner_suspended"
  | "negative_balance";

/**
 * `GET /wallet`. Answers the three questions a partner actually has: how much
 * am I owed, when do I get it, and why haven't I been paid yet.
 *
 * There is deliberately NO next-payout date. Transfers are executed manually by
 * finance once per Gregorian month with no fixed day — a promised date that
 * slips generates more tickets than no date at all.
 */
export interface WalletSummary {
  availableBalance: number; // ready to transfer
  pendingBalance: number; // earned but the stay hasn't finished
  lifetimeEarnings: number;
  lifetimePaidOut: number;
  currency: "SAR";
  minPayoutAmount: number;
  payoutEligible: boolean;
  ineligibleReason: WalletIneligibleReason | null;
  paidThisMonth: boolean;
  bankVerified: boolean;
  lastPayoutAt: string | null; // ISO
  lastPayoutAmount: number | null;
}

/** `GET /wallet/ledger`. `amount` is signed; `balanceAfter` is the running total. */
export interface PartnerLedgerEntry {
  id: string;
  type: PartnerLedgerEntryType;
  amount: number;
  balanceAfter: number;
  refType: "booking" | "payout" | "manual";
  refId: string;
  refCode: string;
  description: string;
  createdAt: string; // ISO
}

/**
 * Only two states exist. A payout is RECORDED after the bank transfer has
 * already happened, so there is no pending or failed state to render.
 */
export type PayoutStatus = "paid" | "reversed";

/**
 * A monthly transfer. The partner never sees a full IBAN back from the server
 * (`ibanMasked` only) and never sees which admin executed the transfer.
 */
export interface PartnerPayout {
  id: string;
  reference: string;
  periodMonth: string; // "YYYY-MM"
  amount: number;
  bookingsCount: number;
  currency: "SAR";
  ibanMasked: string; // "••••7519"
  bankName: string | null;
  status: PayoutStatus;
  paidAt: string; // ISO
  bankReference: string;
  note: string | null;
  reversedAt: string | null;
  reversalReason: string | null;
}

/** `bookings` must sum to `amount` — the detail sheet shows that total back. */
export interface PartnerPayoutDetail extends PartnerPayout {
  bookings: Array<{
    bookingId: string;
    bookingCode: string;
    unitName: string;
    checkOut: string;
    gross: number;
    netBase: number;
    commission: number;
    partnerShare: number;
  }>;
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
  | "host_cancellation"
  /** Added with payouts — a partner should learn they were paid from the app,
   *  not by noticing a bank SMS. */
  | "payout";

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
  totalRevenue: number; // SAR — partner share (98%) of confirmed + completed
  bookingsByMonth: { month: string; count: number }[]; // last 12 months, "YYYY-MM"
  revenueByMonth: { month: string; amount: number }[]; // last 12 months, SAR
  thisMonthRevenue: number; // v1.2 — partner share (SAR), current calendar month
  occupancyRate: number; // v1.2 — % booked/available nights, current month
  hasRejectedUnit: boolean;
}

/** §7.1 `GET /reports/summary?from=&to=`. */
export interface ReportsSummary {
  grossRevenue: number; // what guests paid, VAT INCLUDED
  /**
   * Revenue net of TAX — `grossRevenue` minus `vat`, and the base commission is
   * charged on. NOT `netProfit`: that is revenue minus COMMISSION. Different
   * questions, never the same tile or label.
   *
   * Optional until the production cutover — staging sends it, production still
   * returns the old shape. Read it, never recompute it.
   */
  netRevenue?: number;
  /**
   * VAT remitted to ZATCA. The partner surface reads `vat`; the admin panel's
   * own field is `vatCollected` — deliberately NOT normalised to each other.
   * Optional until the production cutover.
   */
  vat?: number;
  /**
   * Abolished service + cleaning fees the guest paid. Exists so the tiles add
   * up: `netRevenue + vat + fees === grossRevenue`, always. Without it the
   * remainder is unexplained on screen and reads as a wrong VAT rate — the
   * exact mistake we made reading a 19.6% gap as tax.
   *
   * `0` on every modern range; only non-zero on ranges reaching back into the
   * fee era, which is why the tile hides itself at zero. Optional because it
   * post-dates the rest of the shape.
   */
  fees?: number;
  bookingsCount: number;
  commission: number; // 2% of netRevenue
  netProfit: number; // netRevenue minus COMMISSION — SUM(partner_share), the wallet's own figure
  revenueByMonth: { month: string; amount: number }[];
  bookingsByMonth: { month: string; count: number }[];
  perUnit: { unitId: string; unitName: string; bookings: number; revenue: number }[];
}
