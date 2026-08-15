import { COMMISSION_RATE, PARTNER_SHARE_RATE, VAT_RATE } from "./constants";
import type { BookingFinancials } from "@/types";
import type { Locale } from "./i18n";

/**
 * THE single money formatter. SAR only — never AED/USD.
 * Latin digits always, even in Arabic UI.
 *
 * `precise` keeps halalas. Whole SAR is right for KPI tiles and prices, but a
 * ledger whose rows are each rounded to the nearest riyal visibly fails to add
 * up to its own balance column — so anything reconciling passes `precise`.
 */
export function formatCurrency(amount: number, locale: Locale = "ar", precise = false): string {
  const n = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: precise ? 2 : 0,
    maximumFractionDigits: precise ? 2 : 0,
  }).format(precise ? amount : Math.round(amount));
  return locale === "ar" ? `${n} ر.س` : `SAR ${n}`;
}

/** Compact money for KPI tiles — "SAR 728K" / "728K ر.س". Latin digits. */
export function formatCompactCurrency(amount: number, locale: Locale = "ar"): string {
  const abs = Math.abs(amount);
  let n: string;
  if (abs >= 1000) {
    const k = amount / 1000;
    n = `${Number.isInteger(k) ? k : k.toFixed(1)}K`;
  } else {
    n = String(Math.round(amount));
  }
  return locale === "ar" ? `${n} ر.س` : `SAR ${n}`;
}

/**
 * Compact money for a field the API may not send yet. Production still returns
 * the pre-VAT-cutover reports shape, and `formatCompactCurrency(undefined)`
 * would render "NaN ر.س" — an em dash is an empty state, NaN is a bug report.
 */
export function formatCompactCurrencyOptional(
  amount: number | null | undefined,
  locale: Locale = "ar",
): string {
  return amount == null || Number.isNaN(amount) ? "—" : formatCompactCurrency(amount, locale);
}

/** THE single date formatter — Gregorian DD/MM/YYYY, Latin digits. */
export function formatDate(iso: string): string {
  const d = new Date(iso);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

/**
 * Short date for booking lists — "Jul 10, 2025" / Arabic month, Latin digits.
 * Wrapped in Unicode isolate marks (U+2068/U+2069): the Arabic month name is
 * an RTL run sitting between LTR digits, and without isolation the bidi
 * algorithm reorders it against whatever sits next to it — e.g. two dates
 * joined by "→" in one table cell come out visually scrambled. Isolating
 * each formatted date makes it safe to concatenate/interpolate anywhere.
 */
export function formatDateShort(iso: string, locale: Locale = "ar"): string {
  const formatted = new Intl.DateTimeFormat(locale === "ar" ? "ar" : "en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    calendar: "gregory",
    numberingSystem: "latn",
  }).format(new Date(iso));
  return `⁨${formatted}⁩`; // FIRST STRONG ISOLATE ... POP DIRECTIONAL ISOLATE
}

/**
 * THE single phone formatter — +966 with no leading zero.
 * Accepts "0512345678", "512345678", "+966512345678" → "+966 51 234 5678"
 */
export function formatPhone(raw: string): string {
  let digits = raw.replace(/\D/g, "");
  if (digits.startsWith("966")) digits = digits.slice(3);
  if (digits.startsWith("0")) digits = digits.slice(1);
  digits = digits.slice(0, 9);
  const a = digits.slice(0, 2);
  const b = digits.slice(2, 5);
  const c = digits.slice(5, 9);
  return `+966 ${[a, b, c].filter(Boolean).join(" ")}`.trim();
}

/** Halalas are the smallest unit — every money figure settles at 2 decimals. */
function round2(n: number): number {
  return Math.round((n + Number.EPSILON * Math.abs(n)) * 100) / 100;
}

export interface PriceSplit {
  gross: number; // what the guest pays, VAT included
  netBase: number; // gross excluding VAT
  vat: number; // 15%, remitted to ZATCA
  commission: number; // 2% of netBase, Mamsa
  partnerShare: number; // what the partner keeps
}

/**
 * THE single price decomposition. The partner enters a GROSS, VAT-inclusive
 * price — what the guest sees is what the guest pays — and everything else is
 * carved out of it.
 *
 * `partnerShare` is computed by SUBTRACTION, never `netBase * 0.98`. Two
 * independently rounded percentages of the same base do not have to add back
 * up to it; subtracting the rounded commission does, which is what keeps
 * `commission + partnerShare + vat === gross` true at every value.
 *
 * The returned `gross` is the input rounded to 2 decimals — the invariant is
 * stated against that, since a 3-decimal input has no exact halala split.
 */
export function splitPrice(gross: number): PriceSplit {
  const g = round2(gross);
  const netBase = round2(g / (1 + VAT_RATE));
  const vat = round2(g - netBase);
  const commission = round2(netBase * COMMISSION_RATE);
  const partnerShare = round2(netBase - commission);
  return { gross: g, netBase, vat, commission, partnerShare };
}

/** Booking money, from the gross total the guest paid. */
export function computeFinancials(total: number): BookingFinancials {
  const { gross, netBase, vat, commission, partnerShare } = splitPrice(total);
  return { total: gross, netBase, vat, commission, partnerShare };
}

export { COMMISSION_RATE, PARTNER_SHARE_RATE };
