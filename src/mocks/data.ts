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
  PresignedUpload,
} from "@/types";
import { computeFinancials } from "@/lib/format";
import { DEFAULT_CANCELLATION_POLICY } from "@/lib/constants";

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
  { id: "n_1", type: "new_booking", title: "حجز جديد", body: "حجز أحمد الراشدي وحدة استوديو مرسى العليا لمدة 5 ليالٍ (BK-2401).", read: false, createdAt: hoursAgo(2), href: "/bookings" },
  { id: "n_2", type: "unit_rejected", title: "تم رفض وحدتك", body: "شقة النرجس المودرن — السبب: التصريح السياحي منتهي الصلاحية.", read: false, createdAt: hoursAgo(5), href: "/units/u_4" },
  { id: "n_3", type: "sync_failed", title: "فشلت مزامنة تقويم خارجي", body: "تعذّرت مزامنة Vrbo لوحدة فيلا الروضة — الدمام.", read: true, createdAt: hoursAgo(27), href: "/calendar" },
  { id: "n_4", type: "host_cancellation", title: "تم تسجيل إلغاء مضيف", body: "أُلغي الحجز BK-2404 واستُرد كامل المبلغ (2,160 ر.س) للضيف.", read: true, createdAt: hoursAgo(31), href: "/bookings" },
  { id: "n_5", type: "unit_approved", title: "تمت الموافقة على وحدتك", body: "شقة إطلالة البحر — جدة أصبحت معتمدة وظاهرة في الموقع.", read: true, createdAt: hoursAgo(24 * 6), href: "/units/u_2" },
];

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
  const active = mockBookings.filter((b) => b.status !== "cancelled");

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
    return b.status !== "cancelled" && d >= start && d <= end;
  });

  const grossRevenue = inRange.reduce((s, b) => s + b.financials.total, 0);
  const commission = inRange.reduce((s, b) => s + b.financials.commission, 0);

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
    bookingsCount: inRange.length,
    commission,
    netProfit: grossRevenue - commission,
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
    `إجمالي الإيرادات,${s.grossRevenue}`,
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
  authorizationLetterFileId: null,
  vatCertificateFileId: null,
  operatorLicenseFileId: null,
  complete: false,
};

function recomputeCompanyDocsComplete() {
  mockCompanyDocs.complete = Boolean(
    /^\d{10}$/.test(mockCompanyDocs.cr) &&
      /^SA\d{22}$/i.test(mockCompanyDocs.iban) &&
      mockCompanyDocs.authorizationLetterFileId &&
      mockCompanyDocs.vatCertificateFileId &&
      mockCompanyDocs.operatorLicenseFileId,
  );
}

export function saveMockCompanyDocs(patch: Partial<CompanyDocs>): CompanyDocs {
  Object.assign(mockCompanyDocs, patch);
  recomputeCompanyDocsComplete();
  return { ...mockCompanyDocs };
}

/** §2.2 — PATCH /me editable fields are name + email only. */
export function saveMockPartner(patch: Partial<Pick<Partner, "name" | "email">>): Partner {
  Object.assign(mockPartner, patch);
  return { ...mockPartner };
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
  Object.assign(u, {
    ...input,
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
