import { COMMISSION_RATE, PARTNER_SHARE_RATE } from "./constants";
import type { BookingFinancials } from "@/types";
import type { Locale } from "./i18n";

/**
 * THE single money formatter. SAR only — never AED/USD.
 * Latin digits always, even in Arabic UI.
 */
export function formatCurrency(amount: number, locale: Locale = "ar"): string {
  const n = new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0,
  }).format(Math.round(amount));
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

/** Commission math — 2% platform, 98% partner. */
export function computeFinancials(total: number): BookingFinancials {
  const commission = Math.round(total * COMMISSION_RATE);
  return {
    total,
    commission,
    partnerShare: total - commission,
  };
}

export { COMMISSION_RATE, PARTNER_SHARE_RATE };
