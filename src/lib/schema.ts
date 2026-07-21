import { z } from "zod";

/** National ID / Iqama: 10 digits, starts with 1. */
export const nationalIdSchema = z
  .string()
  .regex(/^1\d{9}$/, "رقم الهوية يجب أن يبدأ بـ 1 ويتكون من 10 أرقام");

/** Commercial Registration: 10 digits. */
export const crSchema = z
  .string()
  .regex(/^\d{10}$/, "رقم السجل التجاري يجب أن يتكون من 10 أرقام");

/** Saudi IBAN: SA + 22 digits. */
export const ibanSchema = z
  .string()
  .regex(/^SA\d{22}$/i, "رقم الآيبان غير صحيح (يبدأ بـ SA)");

/** Phone: 9 digits after +966, first digit 5. */
export const phoneSchema = z
  .string()
  .regex(/^5\d{8}$/, "رقم الجوال يجب أن يبدأ بـ 5 ويتكون من 9 أرقام");

export const otpSchema = z.string().regex(/^\d{6}$/, "الرمز يتكون من 6 أرقام");

/** Unit form — the shared shape validated on submit for review. */
export const unitSchema = z.object({
  name: z.string().min(2, "اسم الوحدة مطلوب"),
  type: z.enum(["apartment", "studio", "villa"]),
  pricePerNight: z.number().positive("السعر يجب أن يكون أكبر من صفر"),
  bedrooms: z.number().int().min(0),
  beds: z.number().int().min(1).max(20),
  bathrooms: z.number().int().min(1).max(10),
  capacity: z.number().int().min(1),
  city: z.string().min(1, "المدينة مطلوبة"),
  district: z.string().optional(),
  description: z.string().min(10, "الوصف مطلوب").max(500),
  amenities: z.array(z.string()),
  checkIn: z.string(),
  checkOut: z.string(),
  lat: z.number(),
  lng: z.number(),
  address: z.string().min(3, "العنوان مطلوب"),
  tourismLicenseNumber: z.string().min(3, "رقم التصريح مطلوب"),
});

/** Company payout docs — required for companies (needed to receive payouts). */
export const companyDocsSchema = z.object({
  cr: crSchema,
  iban: ibanSchema,
  hasAuthorizationLetter: z.literal(true, {
    errorMap: () => ({ message: "خطاب التفويض مطلوب" }),
  }),
  hasVatCertificate: z.literal(true, {
    errorMap: () => ({ message: "شهادة ضريبة القيمة المضافة مطلوبة" }),
  }),
  hasOperatorLicense: z.literal(true, {
    errorMap: () => ({ message: "رخصة المشغّل السياحي مطلوبة" }),
  }),
});

/** iCal feed add — mirrors backend rules (source ≤50, http(s) URL ≤2048). */
export const icalFeedSchema = z.object({
  source: z.string().min(1, "المصدر مطلوب").max(50, "المصدر بحد أقصى 50 حرفًا"),
  url: z
    .string()
    .max(2048, "الرابط طويل جدًا")
    .regex(/^https?:\/\//i, "الرابط يجب أن يبدأ بـ http(s)://"),
});

/** Manual calendar block — reason optional, ≤255 chars. */
export const blockReasonSchema = z.string().max(255, "السبب بحد أقصى 255 حرفًا").optional();

export type UnitInput = z.infer<typeof unitSchema>;
