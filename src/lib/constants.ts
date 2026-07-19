import type { CancellationPolicyName } from "@/types";

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

/**
 * Cancellation policy presets — fixed, partner-chosen per unit at add/edit time.
 * No free-form percentage entry; these 3 tiers are the only options. Refund
 * tiers are business-locked values, never computed. "After check-in / during
 * the stay" is always fully locked across all 3 presets (enforced server-side;
 * the frontend only surfaces the note).
 */
export interface CancellationPolicyTier {
  /** Cancelling at/after this many days before check-in earns this tier's refund. */
  minDaysBeforeCheckIn: number;
  refundPercent: number;
  labelAr: string;
  labelEn: string;
}

export interface CancellationPolicyPreset {
  name: CancellationPolicyName;
  labelAr: string;
  labelEn: string;
  descriptionAr: string;
  descriptionEn: string;
  /** Ordered most-generous tier first. */
  tiers: CancellationPolicyTier[];
}

export const FLEXIBLE_POLICY: CancellationPolicyPreset = {
  name: "flexible",
  labelAr: "مرنة",
  labelEn: "Flexible",
  descriptionAr: "استرداد أعلى للضيف — مرونة أكبر في الإلغاء",
  descriptionEn: "Higher guest refunds — more flexible cancellations",
  tiers: [
    { minDaysBeforeCheckIn: 7, refundPercent: 100, labelAr: "7 أيام أو أكثر", labelEn: "7+ days before" },
    { minDaysBeforeCheckIn: 3, refundPercent: 75, labelAr: "3–7 أيام", labelEn: "3–7 days before" },
    { minDaysBeforeCheckIn: 0, refundPercent: 50, labelAr: "أقل من 3 أيام", labelEn: "Less than 3 days before" },
  ],
};

export const MODERATE_POLICY: CancellationPolicyPreset = {
  name: "moderate",
  labelAr: "متوسطة",
  labelEn: "Moderate",
  descriptionAr: "توازن بين مرونة الضيف وحماية عائدك",
  descriptionEn: "A balance between guest flexibility and revenue protection",
  tiers: [
    { minDaysBeforeCheckIn: 7, refundPercent: 100, labelAr: "7 أيام أو أكثر", labelEn: "7+ days before" },
    { minDaysBeforeCheckIn: 3, refundPercent: 50, labelAr: "3–7 أيام", labelEn: "3–7 days before" },
    { minDaysBeforeCheckIn: 0, refundPercent: 25, labelAr: "أقل من 3 أيام", labelEn: "Less than 3 days before" },
  ],
};

export const STRICT_POLICY: CancellationPolicyPreset = {
  name: "strict",
  labelAr: "صارمة",
  labelEn: "Strict",
  descriptionAr: "استرداد أقل للضيف — حماية أكبر لعائدك",
  descriptionEn: "Lower guest refunds — stronger protection for your revenue",
  tiers: [
    { minDaysBeforeCheckIn: 7, refundPercent: 75, labelAr: "7 أيام أو أكثر", labelEn: "7+ days before" },
    { minDaysBeforeCheckIn: 3, refundPercent: 25, labelAr: "3–7 أيام", labelEn: "3–7 days before" },
    { minDaysBeforeCheckIn: 0, refundPercent: 0, labelAr: "أقل من 3 أيام", labelEn: "Less than 3 days before" },
  ],
};

/** Ordered for display — flexible → moderate → strict. */
export const CANCELLATION_POLICIES: CancellationPolicyPreset[] = [FLEXIBLE_POLICY, MODERATE_POLICY, STRICT_POLICY];

export const POLICY_REGISTRY: Record<CancellationPolicyName, CancellationPolicyPreset> = {
  flexible: FLEXIBLE_POLICY,
  moderate: MODERATE_POLICY,
  strict: STRICT_POLICY,
};

export const DEFAULT_CANCELLATION_POLICY: CancellationPolicyName = "moderate";

export function isCancellationPolicyName(value: string): value is CancellationPolicyName {
  return value === "flexible" || value === "moderate" || value === "strict";
}
