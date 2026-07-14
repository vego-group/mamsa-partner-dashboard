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
  companyName?: string;
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
  bedrooms: number;
  bathrooms?: number;
  capacity: number;
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
  photos: UnitPhoto[];
  rejectionReason?: string;
  updatedAt: string; // ISO
  // Display-only aggregates shown on the property card
  rating?: number; // 0–5
  reviews?: number;
  occupancy?: number; // %
  availability?: "available" | "booked" | "blocked";
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
  guestEmail?: string;
  guestPhone: string; // +966
  checkIn: string; // ISO
  checkOut: string; // ISO
  nights: number;
  guests: number;
  status: BookingStatus;
  financials: BookingFinancials;
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
  source?: string; // when external, e.g. "Booking.com"
}

export interface ICalFeed {
  id: string;
  source: string; // "Airbnb — Marina Loft"
  url: string;
  status: "synced" | "error";
  lastSync: string; // ISO
}

export type NotificationCategory = "booking" | "review" | "payment" | "alert" | "system";
export type NotificationGroup = "today" | "yesterday" | "earlier";

/** Bilingual text — notification content is templated per locale in the mock. */
export interface LocalizedText {
  ar: string;
  en: string;
}

export interface AppNotification {
  id: string;
  category: NotificationCategory;
  group: NotificationGroup;
  read: boolean;
  href: string;
  title: LocalizedText;
  body: LocalizedText;
  timeLabel: LocalizedText;
  guestName?: string; // renders an avatar when present
  meta?: LocalizedText; // colored sub-line
  metaTone?: "green" | "red" | "muted";
  rating?: number; // review star count
  quote?: LocalizedText; // review quote
}

export interface OverviewTopProperty {
  name: string;
  revenue: number; // SAR
  rating: number; // 0–5
}

export interface OverviewPropertyPerf {
  name: string;
  district: string;
  city: string;
  thumb: string;
  revenue: number; // SAR
  bookings: number;
  occupancy: number; // %
  rating: number; // 0–5
  growth: number; // % vs last period
}

export interface OverviewMetrics {
  partnerName: string;

  // Hero mini-stats
  activeGuests: number;
  pendingActions: number;
  thisMonthRevenue: number; // SAR

  // KPI cards
  totalProperties: number;
  propertiesApproved: number;
  propertiesPending: number;
  propertiesDelta: number; // absolute change vs last period

  totalBookings: number;
  bookingsDeltaPct: number;

  totalRevenue: number; // SAR (this year)
  revenueLastYear: number; // SAR
  revenueDeltaPct: number;

  occupancyRate: number; // %
  occupancyDeltaPct: number;

  avgNightlyRate: number; // SAR
  avgNightlyDeltaPct: number;

  guestRating: number; // 0–5
  guestRatingDelta: number;

  // Per-card sparkline series (8 points each)
  spark: {
    properties: number[];
    bookings: number[];
    revenue: number[];
    occupancy: number[];
    nightly: number[];
    rating: number[];
  };

  netProfitDeltaPct: number;

  // Charts — 12 points, Jan…Dec
  revenueSeries: number[]; // SAR
  bookingsSeries: number[];
  occupancySeries: number[]; // %
  occupancy: { available: number; booked: number; blocked: number }; // %

  topProperties: OverviewTopProperty[];
  propertyPerformance: OverviewPropertyPerf[];

  hasRejectedUnit: boolean;
}
