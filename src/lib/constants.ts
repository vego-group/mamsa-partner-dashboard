/**
 * Business constants — resolved decisions. Single source; never inline these.
 */

/** Mamsa commission = 2% of booking total. Partner share = 98%. */
export const COMMISSION_RATE = 0.02;
export const PARTNER_SHARE_RATE = 1 - COMMISSION_RATE;

/** Official review SLA — used verbatim in success screen + notifications. */
export const REVIEW_SLA = { ar: "24–48 ساعة", en: "24–48 hours" } as const;

/**
 * OTP policy — matches the live backend (NEXTJS-DASHBOARD-DEVIATIONS §3):
 * 6 digits, 5-minute TTL (platform-wide, deviates from the contract's 60s),
 * 3 verify attempts, 60s resend cooldown.
 */
export const OTP = {
  length: 6,
  validitySeconds: 300,
  maxAttempts: 3,
  resendCountdown: 60,
  /** Mock only — never used in production mode. */
  mockCode: "123456",
} as const;

export const PHONE_PREFIX = "+966";

/**
 * Saudi cities only. No Dubai/Qatar/UAE anywhere.
 * Exact 20-slug enum confirmed by the backend (docs/backend/NEXTJS-DASHBOARD-ENUMS.md) —
 * `Maps::CITIES` in `app/Support/Dashboard/Maps.php`. Slugs are the literal values the
 * validator checks; never send the label. `mecca`/`medina` were the original (wrong)
 * slugs — the backend's canonical values are `makkah`/`madinah`.
 */
export const SAUDI_CITIES = [
  { value: "riyadh", ar: "الرياض", en: "Riyadh" },
  { value: "jeddah", ar: "جدة", en: "Jeddah" },
  { value: "makkah", ar: "مكة المكرمة", en: "Makkah" },
  { value: "madinah", ar: "المدينة المنورة", en: "Madinah" },
  { value: "dammam", ar: "الدمام", en: "Dammam" },
  { value: "khobar", ar: "الخبر", en: "Khobar" },
  { value: "dhahran", ar: "الظهران", en: "Dhahran" },
  { value: "taif", ar: "الطائف", en: "Taif" },
  { value: "abha", ar: "أبها", en: "Abha" },
  { value: "khamis_mushait", ar: "خميس مشيط", en: "Khamis Mushait" },
  { value: "tabuk", ar: "تبوك", en: "Tabuk" },
  { value: "buraydah", ar: "بريدة", en: "Buraydah" },
  { value: "hail", ar: "حائل", en: "Hail" },
  { value: "jubail", ar: "الجبيل", en: "Jubail" },
  { value: "yanbu", ar: "ينبع", en: "Yanbu" },
  { value: "najran", ar: "نجران", en: "Najran" },
  { value: "jazan", ar: "جازان", en: "Jazan" },
  { value: "alula", ar: "العلا", en: "AlUla" },
  { value: "baha", ar: "الباحة", en: "Al Baha" },
  { value: "hofuf", ar: "الهفوف", en: "Hofuf" },
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
