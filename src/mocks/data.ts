import type {
  Partner,
  Unit,
  Booking,
  CalendarDay,
  ICalFeed,
  AppNotification,
  OverviewMetrics,
} from "@/types";
import { computeFinancials } from "@/lib/format";

/**
 * Mock seed — deliberately SPEC-CORRECT (the designer's mocks were not):
 * SAR currency · Saudi cities only · +966 phones · lifecycle states incl. rejected.
 */

export const mockPartner: Partner = {
  id: "p_1",
  name: "منصور القاسمي",
  companyName: "مجموعة ممسى العقارية",
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
    bedrooms: 1,
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
    photos: [photo("ph1", true), photo("ph2"), photo("ph3")],
    updatedAt: "2026-07-10T09:00:00Z",
    rating: 4.9,
    reviews: 127,
    occupancy: 91,
    availability: "available",
  },
  {
    id: "u_2",
    code: "JDH2402",
    name: "شقة إطلالة البحر — جدة",
    type: "apartment",
    status: "approved",
    pricePerNight: 540,
    bedrooms: 2,
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
    photos: [photo("ph4", true), photo("ph5")],
    updatedAt: "2026-07-08T12:00:00Z",
    rating: 4.7,
    reviews: 89,
    occupancy: 84,
    availability: "booked",
  },
  {
    id: "u_3",
    code: "DMM2403",
    name: "فيلا الروضة — الدمام",
    type: "villa",
    status: "pending",
    pricePerNight: 1200,
    bedrooms: 4,
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
    photos: [photo("ph6", true)],
    updatedAt: "2026-07-11T08:00:00Z",
    rating: 4.8,
    reviews: 64,
    occupancy: 96,
    availability: "available",
  },
  {
    id: "u_4",
    code: "RYD2404",
    name: "شقة النرجس المودرن",
    type: "apartment",
    status: "rejected",
    pricePerNight: 410,
    bedrooms: 2,
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
    rating: 4.6,
    reviews: 203,
    occupancy: 78,
    availability: "blocked",
  },
  {
    id: "u_5",
    code: "DRAFT01",
    name: "مسودة — شقة الملقا",
    type: "apartment",
    status: "draft",
    pricePerNight: 0,
    bedrooms: 1,
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
  guestEmail: string,
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
    guestEmail,
    guestPhone,
    checkIn,
    checkOut,
    nights,
    guests,
    status,
    financials: computeFinancials(total),
    notes: id === "b_1" ? "طلب تسجيل دخول مبكر" : undefined,
  };
};

export const mockBookings: Booking[] = [
  bk("b_1", "BK-2401", mockUnits[0], "أحمد الراشدي", "ahmed.rashidi@email.com", "+966502345678", "2026-07-20T15:00:00Z", "2026-07-25T12:00:00Z", 5, 2, "confirmed"),
  bk("b_2", "BK-2402", mockUnits[1], "سارة المطيري", "sara.mutairi@email.com", "+966553456789", "2026-07-22T16:00:00Z", "2026-07-29T12:00:00Z", 7, 4, "confirmed"),
  bk("b_3", "BK-2403", mockUnits[0], "خالد العتيبي", "khalid.otaibi@email.com", "+966561234567", "2026-06-10T15:00:00Z", "2026-06-14T12:00:00Z", 4, 2, "completed"),
  bk("b_4", "BK-2404", mockUnits[1], "منى الدوسري", "mona.dosari@email.com", "+966544567890", "2026-07-01T16:00:00Z", "2026-07-05T12:00:00Z", 4, 3, "cancelled"),
];

export const mockCalendar: Record<string, CalendarDay[]> = {
  u_1: buildMonth("2026-07", {
    3: { status: "booked", bookingCode: "BK-2401" },
    4: { status: "booked", bookingCode: "BK-2401" },
    5: { status: "booked", bookingCode: "BK-2401" },
    8: { status: "blocked" },
    9: { status: "blocked" },
    17: { status: "external", source: "Booking.com" },
    18: { status: "external", source: "Booking.com" },
    22: { status: "booked", bookingCode: "BK-2401" },
    23: { status: "booked", bookingCode: "BK-2401" },
    24: { status: "booked", bookingCode: "BK-2401" },
    27: { status: "blocked" },
    28: { status: "blocked" },
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

export const mockNotifications: AppNotification[] = [
  {
    id: "n_1",
    category: "booking",
    group: "today",
    read: false,
    href: "/bookings",
    guestName: "أحمد الراشدي",
    title: { ar: "حجز جديد", en: "New Booking Received" },
    body: {
      ar: "حجز أحمد الراشدي وحدة استوديو مرسى العليا لمدة 5 ليالٍ.",
      en: "Ahmed Al-Rashidi booked استوديو مرسى العليا for 5 nights.",
    },
    meta: { ar: "1,600 ر.س · BK-2401", en: "SAR 1,600 · BK-2401" },
    metaTone: "green",
    timeLabel: { ar: "اليوم، 09:42 ص", en: "Today, 09:42 AM" },
  },
  {
    id: "n_2",
    category: "review",
    group: "today",
    read: false,
    href: "/reports",
    guestName: "سارة المطيري",
    title: { ar: "تقييم جديد بخمس نجوم", en: "New 5-Star Review" },
    body: {
      ar: "تركت سارة المطيري تقييمًا رائعًا لوحدة شقة إطلالة البحر — جدة.",
      en: "Sarah Al-Mutairi left a glowing review on شقة إطلالة البحر — جدة.",
    },
    rating: 5,
    quote: { ar: "إقامة مذهلة حقًا!", en: "Absolutely stunning stay!" },
    timeLabel: { ar: "اليوم، 08:55 ص", en: "Today, 08:55 AM" },
  },
  {
    id: "n_3",
    category: "payment",
    group: "today",
    read: false,
    href: "/bookings",
    title: { ar: "تم تأكيد الدفع", en: "Payment Confirmed" },
    body: {
      ar: "تم استلام كامل مبلغ 3,780 ر.س للحجز BK-2402.",
      en: "Full payment of SAR 3,780 received for booking BK-2402.",
    },
    meta: { ar: "شقة إطلالة البحر · 22–29 يوليو", en: "Beachfront · Jul 22–29" },
    metaTone: "green",
    timeLabel: { ar: "اليوم، 06:30 ص", en: "Today, 06:30 AM" },
  },
  {
    id: "n_4",
    category: "alert",
    group: "today",
    read: true,
    href: "/units?status=pending",
    title: { ar: "بانتظار الموافقة", en: "Pending Approval" },
    body: {
      ar: "لا تزال فيلا الروضة — الدمام بانتظار موافقة المنصة. مطلوب إجراء.",
      en: "فيلا الروضة — الدمام is still awaiting platform approval. Action required.",
    },
    meta: { ar: "أُرسلت قبل يومين", en: "Submitted 2 days ago" },
    metaTone: "red",
    timeLabel: { ar: "اليوم، 04:10 ص", en: "Today, 04:10 AM" },
  },
  {
    id: "n_5",
    category: "booking",
    group: "yesterday",
    read: true,
    href: "/bookings",
    guestName: "خالد العتيبي",
    title: { ar: "الحجز يتطلب تأكيدًا", en: "Booking Requires Confirmation" },
    body: {
      ar: "حجز خالد العتيبي BK-2403 لوحدة استوديو مرسى العليا بانتظار موافقتك.",
      en: "Khalid Al-Otaibi's booking BK-2403 for استوديو مرسى العليا is pending your approval.",
    },
    meta: { ar: "1,280 ر.س · 4 ليالٍ", en: "SAR 1,280 · 4 nights" },
    metaTone: "muted",
    timeLabel: { ar: "أمس، 07:20 م", en: "Yesterday, 07:20 PM" },
  },
  {
    id: "n_6",
    category: "system",
    group: "yesterday",
    read: true,
    href: "/calendar",
    title: { ar: "اكتملت مزامنة التقويم", en: "iCal Sync Complete" },
    body: {
      ar: "تمت مزامنة التقويم بنجاح لـ 3 وحدات. جميع الحجوزات الخارجية محدّثة الآن.",
      en: "Calendar sync completed successfully for 3 properties. All external bookings are now reflected.",
    },
    meta: { ar: "مرسى العليا · إطلالة البحر · الروضة", en: "Marsa Al-Olaya · Beachfront · Al-Rawdah" },
    metaTone: "muted",
    timeLabel: { ar: "أمس، 03:00 م", en: "Yesterday, 03:00 PM" },
  },
  {
    id: "n_7",
    category: "payment",
    group: "earlier",
    read: true,
    href: "/bookings",
    guestName: "خالد الشمري",
    title: { ar: "تم استلام دفعة جزئية", en: "Partial Payment Received" },
    body: {
      ar: "دفع خالد الشمري عربونًا بقيمة 4,200 ر.س (50%) لوحدة فيلا الروضة — الدمام.",
      en: "Khalid Al-Shammari paid a deposit of SAR 4,200 (50%) for فيلا الروضة — الدمام.",
    },
    meta: { ar: "8,400 ر.س إجمالي · BK-2405", en: "SAR 8,400 total · BK-2405" },
    metaTone: "green",
    timeLabel: { ar: "الإثنين، 10:15 ص", en: "Mon, 10:15 AM" },
  },
  {
    id: "n_8",
    category: "alert",
    group: "earlier",
    read: true,
    href: "/bookings",
    guestName: "منى الدوسري",
    title: { ar: "تم إلغاء الحجز", en: "Booking Cancelled" },
    body: {
      ar: "ألغت منى الدوسري حجزها لوحدة شقة إطلالة البحر — جدة. تم بدء استرداد 2,160 ر.س.",
      en: "Mona Al-Dosari cancelled her reservation for شقة إطلالة البحر — جدة. Refund of SAR 2,160 initiated.",
    },
    meta: { ar: "BK-2404 · 1–5 يوليو", en: "BK-2404 · Jul 1–5" },
    metaTone: "red",
    timeLabel: { ar: "الإثنين، 08:00 ص", en: "Mon, 08:00 AM" },
  },
];

/**
 * Portfolio-level demo aggregates for the Overview dashboard.
 * SAR currency · Saudi properties (the designer's mock used AED — corrected here).
 */
export function buildOverview(): OverviewMetrics {
  return {
    partnerName: mockPartner.name,

    activeGuests: 14,
    pendingActions: 3,
    thisMonthRevenue: 67_000,

    totalProperties: 12,
    propertiesApproved: 8,
    propertiesPending: 4,
    propertiesDelta: 2,

    totalBookings: 248,
    bookingsDeltaPct: 18,

    totalRevenue: 728_000,
    revenueLastYear: 610_000,
    revenueDeltaPct: 19.3,

    occupancyRate: 87,
    occupancyDeltaPct: 5.2,

    avgNightlyRate: 476,
    avgNightlyDeltaPct: -2.1,

    guestRating: 4.8,
    guestRatingDelta: 0.2,

    netProfitDeltaPct: 22,

    spark: {
      properties: [8, 8, 9, 9, 10, 11, 11, 12],
      bookings: [180, 195, 205, 210, 224, 231, 240, 248],
      revenue: [520, 560, 600, 640, 660, 690, 710, 728],
      occupancy: [78, 80, 79, 82, 84, 85, 86, 87],
      nightly: [500, 495, 490, 486, 482, 480, 478, 476],
      rating: [4.5, 4.5, 4.6, 4.6, 4.7, 4.7, 4.8, 4.8],
    },

    revenueSeries: [42_000, 40_000, 45_000, 52_000, 58_000, 61_000, 68_000, 79_000, 72_000, 60_000, 55_000, 67_000],
    bookingsSeries: [27, 22, 33, 35, 36, 47, 45, 51, 46, 42, 34, 44],
    occupancySeries: [68, 64, 72, 78, 82, 85, 88, 90, 86, 80, 76, 84],
    occupancy: { available: 32, booked: 51, blocked: 17 },

    topProperties: [
      { name: "شقة إطلالة البحر — جدة", revenue: 31_000, rating: 4.8 },
      { name: "استوديو مرسى العليا", revenue: 24_500, rating: 4.9 },
      { name: "فيلا الروضة — الدمام", revenue: 20_100, rating: 4.5 },
      { name: "شقة النرجس المودرن", revenue: 18_200, rating: 4.7 },
      { name: "شقة الملقا", revenue: 14_800, rating: 4.6 },
    ],

    propertyPerformance: [mockUnits[0], mockUnits[1], mockUnits[2], mockUnits[3]].map((u, i) => ({
      name: u.name,
      district: u.district,
      city: u.city,
      thumb: u.photos[0]?.url ?? "",
      revenue: [24_500, 18_200, 31_000, 14_800][i],
      bookings: [26, 29, 12, 27][i],
      occupancy: u.occupancy ?? 0,
      rating: u.rating ?? 0,
      growth: [12, 19, 11, 18][i],
    })),

    hasRejectedUnit: mockUnits.some((u) => u.status === "rejected"),
  };
}
