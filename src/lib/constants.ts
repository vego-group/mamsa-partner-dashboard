/**
 * Business constants — resolved decisions. Single source; never inline these.
 */

/** Mamsa commission = 2% of booking total. Partner share = 98%. */
export const COMMISSION_RATE = 0.02;
export const PARTNER_SHARE_RATE = 1 - COMMISSION_RATE;

/** Official review SLA — used verbatim in success screen + notifications. */
export const REVIEW_SLA = { ar: "24–48 ساعة", en: "24–48 hours" } as const;

/** OTP policy. */
export const OTP = {
  length: 6,
  validitySeconds: 60,
  maxAttempts: 3,
  resendCountdown: 60,
  /** Mock only — never used in production mode. */
  mockCode: "123456",
} as const;

export const PHONE_PREFIX = "+966";

/** Saudi cities only. No Dubai/Qatar/UAE anywhere. */
export const SAUDI_CITIES = [
  { value: "riyadh", ar: "الرياض", en: "Riyadh" },
  { value: "jeddah", ar: "جدة", en: "Jeddah" },
  { value: "dammam", ar: "الدمام", en: "Dammam" },
  { value: "khobar", ar: "الخبر", en: "Khobar" },
  { value: "mecca", ar: "مكة المكرمة", en: "Mecca" },
  { value: "medina", ar: "المدينة المنورة", en: "Medina" },
  { value: "taif", ar: "الطائف", en: "Taif" },
  { value: "abha", ar: "أبها", en: "Abha" },
] as const;

export const BRAND = {
  domain: "mamsaa.com",
  api: "api.mamsaa.com",
  staging: "staging.mamsaa.com",
  supportEmail: "info@mamsaa.com",
  headerLocation: { ar: "الرياض، السعودية", en: "Riyadh, Saudi Arabia" },
} as const;

/** Geo bounding box for the map — Saudi Arabia only. */
export const SAUDI_BOUNDS = {
  minLat: 16.0,
  maxLat: 32.2,
  minLng: 34.5,
  maxLng: 55.7,
  center: { lat: 24.7136, lng: 46.6753 }, // Riyadh
} as const;

export const MAX_UPLOAD_MB = 10;
