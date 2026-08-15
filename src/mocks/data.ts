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
  BankDetails,
  WalletSummary,
  WalletIneligibleReason,
  PartnerLedgerEntry,
  PartnerPayout,
  PartnerPayoutDetail,
  PayoutStatus,
  UnitCreateInput,
  PresignedUpload,
} from "@/types";
import { computeFinancials } from "@/lib/format";
import { DEFAULT_CANCELLATION_POLICY, PAYOUT_MIN_BALANCE, isRevenueBearing } from "@/lib/constants";
import { isValidIban, maskIban, normalizeIban } from "@/lib/iban";

/**
 * Mock seed — deliberately SPEC-CORRECT (the designer's mocks were not):
 * SAR currency · Saudi cities only · +966 phones · lifecycle states incl. rejected.
 */

export const mockPartner: Partner = {
  id: "p_1",
  name: "منصور القاسمي",
  email: "mansour@mamsaa.com",
  phone: "+966501234567",
  accountType: "company",
  verificationId: "1010101010",
  accountState: "approved",
  hostCancellationsLast12m: 0,
  flagged: false,
  memberSince: "2022-01-15",
};

const photo = (id: string, cover = false) => ({
  id,
  url: `https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=500&fit=crop&auto=format`,
  isCover: cover,
});

export const mockUnits: Unit[] = [
  {
    id: "u_1",
    code: "MRN2401",
    name: "استوديو مرسى العليا",
    type: "studio",
    status: "approved",
    pricePerNight: 320,
    cancellationPolicy: "flexible",
    bedrooms: 1,
    beds: 1,
    bathrooms: 1,
    capacity: 2,
    city: "riyadh",
    district: "العليا",
    description: "استوديو أنيق في قلب حي العليا بالرياض، قريب من الخدمات والمطاعم.",
    amenities: ["wifi", "ac", "kitchen", "parking"],
    checkIn: "15:00",
    checkOut: "12:00",
    lat: 24.7136,
    lng: 46.6753,
    address: "حي العليا، الرياض",
    tourismLicenseNumber: "TL-2025-73101",
    tourismLicenseFileId: "file_lic_u1",
    photos: [photo("ph1", true), photo("ph2"), photo("ph3")],
    publicUrl: "https://mamsaa.com/units/MRN2401",
    updatedAt: "2026-07-10T09:00:00Z",
    rating: 4.9,
    reviewsCount: 127,
  },
  {
    id: "u_2",
    code: "JDH2402",
    name: "شقة إطلالة البحر — جدة",
    type: "apartment",
    status: "approved",
    pricePerNight: 540,
    cancellationPolicy: "moderate",
    bedrooms: 2,
    beds: 2,
    bathrooms: 2,
    capacity: 4,
    city: "jeddah",
    district: "الشاطئ",
    description: "شقة واسعة بإطلالة على البحر في جدة، مناسبة للعائلات.",
    amenities: ["wifi", "ac", "kitchen", "pool", "security"],
    checkIn: "16:00",
    checkOut: "12:00",
    lat: 21.5433,
    lng: 39.1728,
    address: "حي الشاطئ، جدة",
    tourismLicenseNumber: "TL-2025-88214",
    tourismLicenseFileId: "file_lic_u2",
    photos: [photo("ph4", true), photo("ph5")],
    publicUrl: "https://mamsaa.com/units/JDH2402",
    updatedAt: "2026-07-08T12:00:00Z",
    rating: 4.7,
    reviewsCount: 89,
  },
  {
    id: "u_3",
    code: "DMM2403",
    name: "فيلا الروضة — الدمام",
    type: "villa",
    status: "pending",
    pricePerNight: 1200,
    cancellationPolicy: "strict",
    bedrooms: 4,
    beds: 5,
    bathrooms: 3,
    capacity: 8,
    city: "dammam",
    district: "الروضة",
    description: "فيلا فاخرة بمسبح خاص في الدمام، مثالية للتجمعات العائلية.",
    amenities: ["wifi", "ac", "kitchen", "parking", "pool", "security"],
    checkIn: "15:00",
    checkOut: "12:00",
    lat: 26.4207,
    lng: 50.0888,
    address: "حي الروضة، الدمام",
    tourismLicenseNumber: "TL-2025-90551",
    tourismLicenseFileId: "file_lic_u3",
    photos: [photo("ph6", true)],
    updatedAt: "2026-07-11T08:00:00Z",
    // pending — no publicUrl, no reviews yet
  },
  {
    id: "u_4",
    code: "RYD2404",
    name: "شقة النرجس المودرن",
    type: "apartment",
    status: "rejected",
    pricePerNight: 410,
    cancellationPolicy: "moderate",
    bedrooms: 2,
    beds: 3,
    bathrooms: 2,
    capacity: 3,
    city: "riyadh",
    district: "النرجس",
    description: "شقة عصرية بتصميم مريح في حي النرجس شمال الرياض.",
    amenities: ["wifi", "ac", "kitchen"],
    checkIn: "15:00",
    checkOut: "12:00",
    lat: 24.8607,
    lng: 46.6853,
    address: "حي النرجس، الرياض",
    tourismLicenseNumber: "TL-2025-11002",
    photos: [photo("ph7", true)],
    rejectionReason:
      "التصريح السياحي منتهي الصلاحية. يُرجى رفع تصريح ساري المفعول وإعادة الإرسال.",
    updatedAt: "2026-07-09T14:00:00Z",
    // was live before the license expired — reviews carry over
    rating: 4.6,
    reviewsCount: 203,
  },
  {
    id: "u_5",
    code: "DRAFT01",
    name: "مسودة — شقة الملقا",
    type: "apartment",
    status: "draft",
    pricePerNight: 0,
    cancellationPolicy: "moderate",
    bedrooms: 1,
    beds: 1,
    bathrooms: 1,
    capacity: 2,
    city: "riyadh",
    district: "الملقا",
    description: "",
    amenities: ["wifi"],
    checkIn: "15:00",
    checkOut: "12:00",
    lat: 24.7136,
    lng: 46.6753,
    address: "حي الملقا، الرياض",
    tourismLicenseNumber: "",
    photos: [],
    updatedAt: "2026-07-12T10:00:00Z",
  },
];

const bk = (
  id: string,
  code: string,
  unit: Unit,
  guestName: string,
  guestPhone: string,
  checkIn: string,
  checkOut: string,
  nights: number,
  guests: number,
  status: Booking["status"],
): Booking => {
  const total = unit.pricePerNight * nights;
  return {
    id,
    code,
    unitId: unit.id,
    unitName: unit.name,
    unitThumb: unit.photos[0]?.url ?? "",
    guestName,
    guestPhone,
    checkIn,
    checkOut,
    nights,
    guests,
    status,
    financials: computeFinancials(total),
    // Frozen at booking time (FR-036)
    policySnapshot: { name: "flexible", rules: "إلغاء مجاني حتى 48 ساعة قبل الوصول" },
    notes: id === "b_1" ? "طلب تسجيل دخول مبكر" : undefined,
  };
};

export const mockBookings: Booking[] = [
  bk("b_1", "BK-2401", mockUnits[0], "أحمد الراشدي", "+966502345678", "2026-07-20T15:00:00Z", "2026-07-25T12:00:00Z", 5, 2, "confirmed"),
  bk("b_2", "BK-2402", mockUnits[1], "سارة المطيري", "+966553456789", "2026-07-22T16:00:00Z", "2026-07-29T12:00:00Z", 7, 4, "confirmed"),
  bk("b_3", "BK-2403", mockUnits[0], "خالد العتيبي", "+966561234567", "2026-06-10T15:00:00Z", "2026-06-14T12:00:00Z", 4, 2, "completed"),
  bk("b_4", "BK-2404", mockUnits[1], "منى الدوسري", "+966544567890", "2026-07-01T16:00:00Z", "2026-07-05T12:00:00Z", 4, 3, "cancelled"),
  // Unpaid — seeded so the awaiting-payment state is reachable in mock mode.
  bk("b_5", "BK-2405", mockUnits[0], "فهد القحطاني", "+966555678901", "2026-08-18T15:00:00Z", "2026-08-21T12:00:00Z", 3, 2, "pending_payment"),
  // Completed history — the wallet's available balance is derived from these,
  // so there has to be enough of it to clear the 2,000 payout threshold and
  // still show a prior payout. Chronological by check-out.
  bk("b_6", "BK-2312", mockUnits[1], "نورة الشمري", "+966501112233", "2026-03-04T16:00:00Z", "2026-03-09T12:00:00Z", 5, 4, "completed"),
  bk("b_7", "BK-2345", mockUnits[2], "بندر الحربي", "+966502223344", "2026-04-12T15:00:00Z", "2026-04-15T12:00:00Z", 3, 6, "completed"),
  bk("b_8", "BK-2377", mockUnits[0], "ريم الغامدي", "+966503334455", "2026-05-20T15:00:00Z", "2026-05-26T12:00:00Z", 6, 2, "completed"),
];

export const mockCalendar: Record<string, CalendarDay[]> = {
  u_1: buildMonth("2026-07", {
    3: { status: "booked", bookingCode: "BK-2401", bookingId: "b_1" },
    4: { status: "booked", bookingCode: "BK-2401", bookingId: "b_1" },
    5: { status: "booked", bookingCode: "BK-2401", bookingId: "b_1" },
    8: { status: "blocked", reason: "صيانة" },
    9: { status: "blocked", reason: "صيانة" },
    17: { status: "external", source: "Booking.com" },
    18: { status: "external", source: "Booking.com" },
    22: { status: "booked", bookingCode: "BK-2401", bookingId: "b_1" },
    23: { status: "booked", bookingCode: "BK-2401", bookingId: "b_1" },
    24: { status: "booked", bookingCode: "BK-2401", bookingId: "b_1" },
    27: { status: "blocked", reason: null },
    28: { status: "blocked", reason: null },
  }),
};

function buildMonth(
  ym: string,
  overrides: Record<number, Partial<CalendarDay>>,
): CalendarDay[] {
  const [y, m] = ym.split("-").map(Number);
  const days = new Date(y, m, 0).getDate();
  return Array.from({ length: days }, (_, i) => {
    const day = i + 1;
    const date = `${ym}-${String(day).padStart(2, "0")}`;
    const o = overrides[day];
    return { date, status: o?.status ?? "available", ...o } as CalendarDay;
  });
}

export const mockFeeds: ICalFeed[] = [
  { id: "f_1", source: "Airbnb — استوديو مرسى العليا", url: "https://airbnb.com/ical/1", status: "synced", lastSync: "2026-07-13T09:58:00Z" },
  { id: "f_2", source: "Booking.com — شقة إطلالة البحر", url: "https://booking.com/ical/2", status: "synced", lastSync: "2026-07-13T09:55:00Z" },
  { id: "f_3", source: "Vrbo — فيلا الروضة", url: "https://vrbo.com/ical/3", status: "error", lastSync: "2026-07-13T07:30:00Z" },
];

/** Seeded relative to "now" so the اليوم/أمس/سابقًا grouping always demos nicely. */
const hoursAgo = (h: number) => new Date(Date.now() - h * 3_600_000).toISOString();

/**
 * §8 contract — exactly the five agreed types, ready Arabic strings.
 * No review / partial-payment / "awaiting your approval" notifications exist
 * (locked rules: instant full payment via Moyasar, no partner approval step).
 */
export const mockNotifications: AppNotification[] = [
  { id: "n_1", type: "new_booking", title: "حجز جديد", body: "حجز أحمد الراشدي وحدة استوديو مرسى العليا لمدة 5 ليالٍ (BK-2401).", read: false, createdAt: hoursAgo(2), href: "/bookings/b_1" },
  { id: "n_2", type: "unit_rejected", title: "تم رفض وحدتك", body: "شقة النرجس المودرن — السبب: التصريح السياحي منتهي الصلاحية.", read: false, createdAt: hoursAgo(5), href: "/units/u_4" },
  { id: "n_3", type: "sync_failed", title: "فشلت مزامنة تقويم خارجي", body: "تعذّرت مزامنة Vrbo لوحدة فيلا الروضة — الدمام.", read: true, createdAt: hoursAgo(27), href: "/calendar" },
  { id: "n_4", type: "host_cancellation", title: "تم تسجيل إلغاء مضيف", body: "أُلغي الحجز BK-2404 واستُرد كامل المبلغ (2,160 ر.س) للضيف.", read: true, createdAt: hoursAgo(31), href: "/bookings" },
  { id: "n_5", type: "unit_approved", title: "تمت الموافقة على وحدتك", body: "شقة إطلالة البحر — جدة أصبحت معتمدة وظاهرة في الموقع.", read: true, createdAt: hoursAgo(24 * 6), href: "/units/u_2" },
  // A partner should learn they were paid from the app, not from a bank SMS.
  { id: "n_6", type: "payout", title: "تم تحويل مستحقاتك", body: "حوّلنا 5,368.69 ر.س إلى حسابك البنكي (المرجع PO-2026-04).", read: false, createdAt: hoursAgo(9), href: "/wallet/payouts?payout=po_1" },
];

/**
 * The header/sidebar badge polls `GET /notifications/unread-count`, so mock mode
 * has to keep read state — otherwise "تحديد الكل كمقروء" is undone by the next
 * poll. Mutates the seed in place, same as the other mock writers.
 */
export function markMockNotificationRead(id: string): void {
  const n = mockNotifications.find((x) => x.id === id);
  if (n) n.read = true;
}

export function markAllMockNotificationsRead(): void {
  mockNotifications.forEach((n) => {
    n.read = true;
  });
}

export function mockUnreadCount(): number {
  return mockNotifications.filter((n) => !n.read).length;
}

/** Last-12-months keys ending this month: ["2025-08", …, "2026-07"]. */
function last12Months(): string[] {
  const now = new Date();
  return Array.from({ length: 12 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });
}

const monthKey = (iso: string) => iso.slice(0, 7);

/** §3.1 contract shape — aggregates computed honestly from the seeded data. */
export function buildOverview(): OverviewMetrics {
  const months = last12Months();
  // §3.1: bookingsCount/totalRevenue are confirmed + completed — an unpaid
  // booking has earned nothing yet, so it stays out of both.
  const active = mockBookings.filter((b) => isRevenueBearing(b.status));

  const bookingsByMonth = months.map((month) => ({
    month,
    count: active.filter((b) => monthKey(b.checkIn) === month).length,
  }));
  const revenueByMonth = months.map((month) => ({
    month,
    amount: active
      .filter((b) => monthKey(b.checkIn) === month)
      .reduce((s, b) => s + b.financials.partnerShare, 0),
  }));

  // v1.2 — % booked nights / available (non-blocked) nights, current mock month
  const days = mockCalendar.u_1;
  const booked = days.filter((d) => d.status === "booked").length;
  const blocked = days.filter((d) => d.status === "blocked").length;
  const occupancyRate = Math.round((booked / (days.length - blocked)) * 100);

  return {
    unitsCount: mockUnits.filter((u) => u.status !== "draft").length,
    bookingsCount: active.length,
    totalRevenue: active.reduce((s, b) => s + b.financials.partnerShare, 0),
    bookingsByMonth,
    revenueByMonth,
    thisMonthRevenue: revenueByMonth[revenueByMonth.length - 1]?.amount ?? 0,
    occupancyRate,
    hasRejectedUnit: mockUnits.some((u) => u.status === "rejected"),
  };
}

/** §7.1 contract shape — computed from the seeded bookings within [from, to]. */
export function buildReportsSummary(from: string, to: string): ReportsSummary {
  const start = new Date(from);
  const end = new Date(to);
  const inRange = mockBookings.filter((b) => {
    const d = new Date(b.checkIn);
    return isRevenueBearing(b.status) && d >= start && d <= end;
  });

  // Every line is summed from the per-booking split, so gross still equals
  // net + VAT and netProfit is literally the partner's share — not a
  // re-derivation that could round differently from the wallet.
  const grossRevenue = round2(inRange.reduce((s, b) => s + b.financials.total, 0));
  const netRevenue = round2(inRange.reduce((s, b) => s + b.financials.netBase, 0));
  const vat = round2(inRange.reduce((s, b) => s + b.financials.vat, 0));
  const commission = round2(inRange.reduce((s, b) => s + b.financials.commission, 0));
  const netProfit = round2(inRange.reduce((s, b) => s + b.financials.partnerShare, 0));

  // Live backend returns ONLY months with data, ascending (NEXTJS-DASHBOARD-REPORTS §2)
  const months = [...new Set(inRange.map((b) => monthKey(b.checkIn)))].sort();

  const perUnit = new Map<string, ReportsSummary["perUnit"][number]>();
  for (const b of inRange) {
    const row = perUnit.get(b.unitId) ?? { unitId: b.unitId, unitName: b.unitName, bookings: 0, revenue: 0 };
    row.bookings += 1;
    row.revenue += b.financials.total;
    perUnit.set(b.unitId, row);
  }

  return {
    grossRevenue,
    netRevenue,
    vat,
    // The seeds are all modern bookings — no abolished service/cleaning fees on
    // any of them — so this is 0 and the tile stays hidden, which is the state
    // every real range produces today. Summed rather than hardcoded so it
    // follows if a fee-era booking is ever seeded.
    fees: round2(grossRevenue - netRevenue - vat),
    bookingsCount: inRange.length,
    commission,
    netProfit,
    revenueByMonth: months.map((month) => ({
      month,
      amount: inRange.filter((b) => monthKey(b.checkIn) === month).reduce((s, b) => s + b.financials.total, 0),
    })),
    bookingsByMonth: months.map((month) => ({
      month,
      count: inRange.filter((b) => monthKey(b.checkIn) === month).length,
    })),
    perUnit: [...perUnit.values()].sort((a, b) => b.revenue - a.revenue),
  };
}

/** Mock of §7.2 export — CSV matching what the backend's csv/xlsx formats return. */
export function buildReportCsv(from: string, to: string): string {
  const s = buildReportsSummary(from, to);
  const lines = [
    `التقرير,${from},${to}`,
    `إجمالي الإيرادات (شامل الضريبة),${s.grossRevenue}`,
    `صافي الإيراد,${s.netRevenue}`,
    `ضريبة القيمة المضافة (15%),${s.vat}`,
    `عدد الحجوزات,${s.bookingsCount}`,
    `عمولة ممسى (2%),${s.commission}`,
    `صافي الربح,${s.netProfit}`,
    "",
    "الوحدة,الحجوزات,الإيراد",
    ...s.perUnit.map((u) => `${u.unitName},${u.bookings},${u.revenue}`),
  ];
  return lines.join("\r\n");
}

/* ---------------- iCal feed mock helpers (§5.4–5.5 live behavior) ---------------- */

/** Add = validate + immediate first sync server-side; the returned feed is already synced. */
export function addMockFeed(source: string, url: string): ICalFeed {
  const feed: ICalFeed = {
    id: `f_${Date.now()}`,
    source,
    url,
    status: "synced",
    lastSync: new Date().toISOString(),
  };
  mockFeeds.push(feed);
  return feed;
}

export function deleteMockFeed(feedId: string): void {
  const i = mockFeeds.findIndex((f) => f.id === feedId);
  if (i >= 0) mockFeeds.splice(i, 1);
}

export function syncMockFeed(feedId: string): ICalFeed {
  const feed = mockFeeds.find((f) => f.id === feedId);
  if (!feed) throw new Error("FEED_NOT_FOUND");
  feed.status = "synced";
  feed.lastSync = new Date().toISOString();
  return { ...feed };
}

/** Server-minted public .ics URL with an unguessable per-unit token. */
export function mockIcalExportUrl(unitId: string): string {
  return `https://api.mamsaa.com/api/v1/calendar/9f3a${unitId.replace(/\W/g, "")}7be2d14cc1.ics`;
}

/* ---------------- Company payout docs (§9.2 — one-time per partner) ---------------- */
export const mockCompanyDocs: CompanyDocs = {
  cr: "",
  iban: "",
  nationalIdFileId: null,
  authorizationLetterFileId: null,
  vatCertificateFileId: null,
  operatorLicenseFileId: null,
  complete: false,
};

/**
 * Completeness is per partner TYPE — the server evaluates a different required
 * set for each, so a single rule here would let one type look complete on the
 * other's evidence.
 *
 * An individual needs the ID NUMBER *and* its scan: the number alone is what a
 * reviewer cannot check, which is the whole reason the scan is required.
 */
function recomputeCompanyDocsComplete() {
  // The BACKEND still reads the legacy `partner_details.iban` written by
  // PUT /me/company-docs — there is no bank_details table yet. Do NOT repoint
  // this at /me/bank-details: that endpoint persists nothing, so a partner
  // would stop being able to submit units entirely.
  const hasIban = isValidIban(mockCompanyDocs.iban);

  if (mockPartner.accountType === "individual") {
    mockCompanyDocs.complete = Boolean(
      mockPartner.verificationId && mockCompanyDocs.nationalIdFileId && hasIban,
    );
    return;
  }

  mockCompanyDocs.complete = Boolean(
    /^\d{10}$/.test(mockCompanyDocs.cr) &&
      hasIban &&
      mockCompanyDocs.authorizationLetterFileId &&
      mockCompanyDocs.vatCertificateFileId &&
      mockCompanyDocs.operatorLicenseFileId,
  );
}

export function saveMockCompanyDocs(patch: Partial<CompanyDocs>): CompanyDocs {
  // `accountHolderName` is accepted and then dropped — there is no column for
  // it yet. Mirrored here on purpose so mock mode reproduces the real "comes
  // back empty on reload" behaviour instead of looking like it persists.
  const { accountHolderName: _discarded, ...stored } = patch;
  Object.assign(mockCompanyDocs, stored);
  recomputeCompanyDocsComplete();
  return { ...mockCompanyDocs };
}

/* ---------------- Bank details (staging-only stub) ---------------- */

/** What the staging stub echoes back regardless of the IBAN sent. */
const STUB_BANK_NAME = "مصرف الراجحي";

/**
 * Seeded verified so the wallet's happy path is the default view. The
 * unverified and missing states are reachable by editing the IBAN (which resets
 * verification, exactly as the server does) or via `MOCK_WALLET_SCENARIO`.
 */
export const mockBankDetails: BankDetails = {
  iban: "SA0380000000608010167519",
  accountHolderName: "عبدالله بن سعيد الحارثي",
  bankName: "مصرف الراجحي",
  verified: true,
  verifiedAt: "2026-02-11T09:20:00Z",
  rejectionReason: null,
  updatedAt: "2026-02-10T14:05:00Z",
};

/** null until the partner has actually saved something — mirrors GET returning 404/null. */
export function readMockBankDetails(): BankDetails | null {
  return mockBankDetails.iban ? { ...mockBankDetails } : null;
}

/**
 * Mirrors the server rule exactly: ANY real edit — the IBAN *or* the holder
 * name — drops verification back to pending and clears the previous rejection.
 *
 * The holder name counts because a bank rejects a transfer whose beneficiary
 * name doesn't match, so finance verified the name as much as the number. It
 * also closes the trap where a partner rejected FOR a name mismatch fixed the
 * name and stayed rejected forever.
 */
export function saveMockBankDetails(input: { iban: string; accountHolderName: string }): BankDetails {
  const iban = normalizeIban(input.iban);
  const accountHolderName = input.accountHolderName.trim();
  const changed =
    iban !== mockBankDetails.iban || accountHolderName !== mockBankDetails.accountHolderName;

  // An identical re-save is a no-op. Without this a partner could strip their
  // own verified badge just by pressing save twice.
  if (!changed) return { ...mockBankDetails };

  mockBankDetails.iban = iban;
  mockBankDetails.accountHolderName = accountHolderName;
  // Server-derived. The staging stub returns the same name for every IBAN, so
  // the mock does too — pretending to resolve real bank codes here would make
  // mock mode look more capable than the endpoint actually is.
  mockBankDetails.bankName = iban ? STUB_BANK_NAME : null;
  mockBankDetails.updatedAt = new Date().toISOString();
  mockBankDetails.verified = false;
  mockBankDetails.verifiedAt = null;
  mockBankDetails.rejectionReason = null;

  recomputeCompanyDocsComplete();
  return { ...mockBankDetails };
}

/** §2.2 — PATCH /me editable fields are name + email only. */
export function saveMockPartner(patch: Partial<Pick<Partner, "name" | "email">>): Partner {
  Object.assign(mockPartner, patch);
  return { ...mockPartner };
}

/* ---------------- Wallet ---------------- */

/**
 * Flip this to exercise each payout state by hand. Deliberately a constant and
 * not a UI control — it exists for manual testing, not for partners.
 */
export type MockWalletScenario =
  | "eligible"
  | "already_paid_this_month"
  | "below_minimum"
  | "bank_missing"
  | "bank_unverified"
  | "partner_suspended"
  | "negative_balance";

export const MOCK_WALLET_SCENARIO: MockWalletScenario = "eligible";

const round2 = (n: number) => Math.round((n + Number.EPSILON * Math.abs(n)) * 100) / 100;

/** Completed stays, oldest first — the order earnings actually landed. */
function completedBookingsChronologically(): Booking[] {
  return mockBookings
    .filter((b) => b.status === "completed")
    .sort((a, b) => a.checkOut.localeCompare(b.checkOut));
}

/**
 * Payouts are the SOURCE, and the ledger is derived from them — not the other
 * way round. That is what makes a payout's `bookings[]` sum to its `amount` by
 * construction: the amount is never written down, it is the sum.
 *
 * A reversed payout keeps its debit row AND gets a compensating credit, so the
 * money nets to zero without erasing the history. Removing the record would be
 * worse than useless: the partner already got an email saying they were paid.
 */
const payoutSeed = [
  {
    id: "po_1",
    reference: "PO-2026-04",
    periodMonth: "2026-03",
    bookingIds: ["b_6", "b_7"],
    paidAt: "2026-04-24T10:15:00Z",
    bankReference: "TRF-884213-SA",
    note: null,
    status: "paid" as PayoutStatus,
    reversedAt: null,
    reversalReason: null,
  },
  {
    id: "po_2",
    reference: "PO-2026-06",
    periodMonth: "2026-05",
    bookingIds: ["b_8"],
    paidAt: "2026-06-08T09:40:00Z",
    bankReference: "TRF-901554-SA",
    note: null,
    status: "reversed" as PayoutStatus,
    reversedAt: "2026-06-20T12:00:00Z",
    reversalReason: "أعاد البنك الحوالة — بيانات الحساب لم تطابق اسم صاحب الحساب.",
  },
];

function payoutBookings(bookingIds: string[]) {
  return bookingIds
    .map((id) => mockBookings.find((b) => b.id === id))
    .filter((b): b is Booking => Boolean(b))
    .map((b) => ({
      bookingId: b.id,
      bookingCode: b.code,
      unitName: b.unitName,
      checkOut: b.checkOut,
      gross: b.financials.total,
      netBase: b.financials.netBase,
      commission: b.financials.commission,
      partnerShare: b.financials.partnerShare,
    }));
}

function payoutAmount(bookingIds: string[]): number {
  return round2(payoutBookings(bookingIds).reduce((s, b) => s + b.partnerShare, 0));
}

export const mockPayouts: PartnerPayout[] = payoutSeed.map((p) => ({
  id: p.id,
  reference: p.reference,
  periodMonth: p.periodMonth,
  amount: payoutAmount(p.bookingIds),
  bookingsCount: p.bookingIds.length,
  currency: "SAR",
  ibanMasked: maskIban(mockBankDetails.iban),
  bankName: mockBankDetails.bankName,
  status: p.status,
  paidAt: p.paidAt,
  bankReference: p.bankReference,
  note: p.note,
  reversedAt: p.reversedAt,
  reversalReason: p.reversalReason,
}));

export function readMockPayouts(params: { limit?: number } = {}): PartnerPayout[] {
  const sorted = [...mockPayouts].sort((a, b) => b.paidAt.localeCompare(a.paidAt));
  return params.limit ? sorted.slice(0, params.limit) : sorted;
}

export function readMockPayout(id: string): PartnerPayoutDetail | null {
  const payout = mockPayouts.find((p) => p.id === id);
  const seed = payoutSeed.find((p) => p.id === id);
  if (!payout || !seed) return null;
  return { ...payout, bookings: payoutBookings(seed.bookingIds) };
}

/**
 * The ledger is BUILT, not written down: every row's `balanceAfter` is the
 * running total of the rows before it, so the summary below can be read off the
 * end of it rather than invented separately. That is what makes the two
 * reconcile — a hand-keyed balance would drift the first time a seed changed.
 */
function buildLedger(): PartnerLedgerEntry[] {
  const completed = completedBookingsChronologically();
  const rows: Omit<PartnerLedgerEntry, "balanceAfter">[] = [];

  completed.forEach((b, i) => {
    rows.push({
      id: `led_e${i + 1}`,
      type: "earning",
      amount: b.financials.partnerShare,
      refType: "booking",
      refId: b.id,
      refCode: b.code,
      description: `حصتك من الحجز ${b.code} — ${b.unitName}`,
      createdAt: b.checkOut,
    });

    // A guest refund clawed back after the fact.
    if (i === 2) {
      rows.push({
        id: "led_r1",
        type: "refund_reversal",
        amount: -250,
        refType: "booking",
        refId: b.id,
        refCode: b.code,
        description: `استرجاع مبلغ مسترد للضيف — ${b.code}`,
        createdAt: addDays(b.checkOut, 3),
      });
    }
  });

  // Each payout debits exactly what its bookings earned; a reversed one is
  // credited straight back, so the record survives while the money doesn't.
  for (const p of payoutSeed) {
    const amount = payoutAmount(p.bookingIds);
    rows.push({
      id: `led_${p.id}`,
      type: "payout",
      amount: -amount,
      refType: "payout",
      refId: p.id,
      refCode: p.reference,
      description: "حوالة بنكية شهرية",
      createdAt: p.paidAt,
    });

    if (p.status === "reversed" && p.reversedAt) {
      rows.push({
        id: `led_${p.id}_rev`,
        type: "adjustment",
        amount,
        refType: "payout",
        refId: p.id,
        refCode: p.reference,
        description: `عكس الحوالة ${p.reference} — أُعيد المبلغ إلى رصيدك`,
        createdAt: p.reversedAt,
      });
    }
  }

  let running = 0;
  return rows
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    .map((r) => {
      running = round2(running + r.amount);
      return { ...r, balanceAfter: running };
    });
}

function addDays(iso: string, days: number): string {
  const d = new Date(iso);
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

/** Ascending (oldest first) — the API hands it back newest-first. */
export const mockLedger: PartnerLedgerEntry[] = buildLedger();

export function readMockLedger(params: { limit?: number; before?: string } = {}): PartnerLedgerEntry[] {
  const { limit = 20, before } = params;
  const newestFirst = [...mockLedger].reverse();
  const start = before ? newestFirst.findIndex((r) => r.createdAt < before) : 0;
  return start === -1 ? [] : newestFirst.slice(start, start + limit);
}

/**
 * Read off the ledger, not stated alongside it. `MOCK_WALLET_SCENARIO` then
 * overrides only the eligibility surface — the money keeps reconciling.
 */
export function buildWallet(): WalletSummary {
  const ledger = mockLedger;
  const availableBalance = ledger.length ? ledger[ledger.length - 1].balanceAfter : 0;
  const lifetimeEarnings = round2(
    ledger.filter((r) => r.type === "earning").reduce((s, r) => s + r.amount, 0),
  );
  // Only transfers that actually stuck. A reversed payout came back — counting
  // it would tell the partner they've been paid money they still hold.
  const lifetimePaidOut = round2(
    mockPayouts.filter((p) => p.status === "paid").reduce((s, p) => s + p.amount, 0),
  );
  // Earned, but the guest hasn't checked out — not transferable yet.
  const pendingBalance = round2(
    mockBookings
      .filter((b) => b.status === "pending_payment" || b.status === "confirmed")
      .reduce((s, b) => s + b.financials.partnerShare, 0),
  );
  const lastPayout =
    [...mockPayouts].filter((p) => p.status === "paid").sort((a, b) => b.paidAt.localeCompare(a.paidAt))[0] ?? null;

  const base: WalletSummary = {
    availableBalance,
    pendingBalance,
    lifetimeEarnings,
    lifetimePaidOut,
    currency: "SAR",
    minPayoutAmount: PAYOUT_MIN_BALANCE,
    payoutEligible: true,
    ineligibleReason: null,
    paidThisMonth: false,
    bankVerified: true,
    lastPayoutAt: lastPayout?.paidAt ?? null,
    lastPayoutAmount: lastPayout?.amount ?? null,
  };

  const ineligible = (reason: WalletIneligibleReason, patch: Partial<WalletSummary> = {}) => ({
    ...base,
    payoutEligible: false,
    ineligibleReason: reason,
    ...patch,
  });

  switch (MOCK_WALLET_SCENARIO) {
    case "already_paid_this_month":
      return { ...base, paidThisMonth: true, lastPayoutAt: new Date().toISOString() };
    case "below_minimum":
      return ineligible("below_minimum", { availableBalance: round2(PAYOUT_MIN_BALANCE * 0.42) });
    case "bank_missing":
      return ineligible("bank_missing", { bankVerified: false });
    case "bank_unverified":
      return ineligible("bank_unverified", { bankVerified: false });
    case "partner_suspended":
      return ineligible("partner_suspended");
    case "negative_balance":
      return ineligible("negative_balance", { availableBalance: -320.5 });
    default:
      return base;
  }
}

/* ---------------- Uploads (§9.1 — presign, mocked as an instant local "upload") ---------------- */
let mockFileSeq = 0;
export function mockPresignUpload(fileName: string): PresignedUpload {
  mockFileSeq += 1;
  const fileId = `file_mock_${Date.now()}_${mockFileSeq}`;
  // No real server round-trip in mock mode — the client-side mock upload just
  // records the fileId; there's no uploadUrl to PUT to.
  return { uploadUrl: "", fileId };
}

/* ---------------- Units — create + submit (§4) ---------------- */
export function createMockUnit(input: UnitCreateInput): Unit {
  const id = `u_${Date.now()}`;
  const unit: Unit = {
    id,
    code: `NEW${Date.now().toString().slice(-6)}`,
    name: input.name ?? "",
    type: input.type ?? "apartment",
    status: "draft",
    pricePerNight: input.pricePerNight ?? 0,
    cancellationPolicy: input.cancellationPolicy ?? DEFAULT_CANCELLATION_POLICY,
    bedrooms: input.bedrooms ?? 0,
    beds: input.beds,
    bathrooms: input.bathrooms,
    capacity: input.capacity ?? 1,
    city: input.city ?? "",
    district: input.district ?? "",
    description: input.description ?? "",
    amenities: input.amenities ?? [],
    checkIn: input.checkIn ?? "15:00",
    checkOut: input.checkOut ?? "12:00",
    lat: input.lat ?? 0,
    lng: input.lng ?? 0,
    address: input.address ?? "",
    tourismLicenseNumber: input.tourismLicenseNumber ?? "",
    tourismLicenseFileId: input.tourismLicenseFileId,
    photos: (input.photoFileIds ?? []).map((fid, i) => ({
      id: fid,
      url: mockUnits[i % mockUnits.length]?.photos[0]?.url ?? "",
      isCover: fid === input.coverFileId,
    })),
    updatedAt: new Date().toISOString(),
  };
  mockUnits.push(unit);
  return unit;
}

export function updateMockUnit(id: string, input: UnitCreateInput): Unit {
  const u = mockUnits.find((x) => x.id === id);
  if (!u) throw new Error("UNIT_NOT_FOUND");
  // `JSON.stringify` drops undefined keys, so the real backend never sees the
  // fields the partner left blank. Object.assign does NOT — it would overwrite
  // a stored value with undefined and hand the next reader a half-null unit.
  // Strip them here so mock mode PATCHes exactly like the real one.
  const patch = Object.fromEntries(
    Object.entries(input).filter(([, v]) => v !== undefined),
  ) as UnitCreateInput;
  Object.assign(u, {
    ...patch,
    photos: input.photoFileIds
      ? input.photoFileIds.map((fid, i) => ({
          id: fid,
          url: u.photos[i]?.url ?? mockUnits[0]?.photos[0]?.url ?? "",
          isCover: fid === input.coverFileId,
        }))
      : u.photos,
    // Editing an approved unit returns it to pending (§7).
    status: u.status === "approved" ? "pending" : u.status,
    updatedAt: new Date().toISOString(),
  });
  return u;
}

/** POST /units/:id/submit — draft/rejected → pending, full validation server-side. */
export function submitMockUnit(id: string): Unit {
  const u = mockUnits.find((x) => x.id === id);
  if (!u) throw new Error("UNIT_NOT_FOUND");
  u.status = "pending";
  u.updatedAt = new Date().toISOString();
  return u;
}

/** DELETE /units/:id — drafts only (contract §4); mirrors the removal locally. */
export function deleteMockUnit(id: string): void {
  const i = mockUnits.findIndex((x) => x.id === id);
  if (i >= 0) mockUnits.splice(i, 1);
}
