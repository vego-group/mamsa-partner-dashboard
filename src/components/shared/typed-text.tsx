"use client";

import { useLocale } from "@/stores/locale-store";
import { formatCurrency, formatDate, formatPhone } from "@/lib/format";
import { cn } from "@/lib/cn";

/** Always renders SAR — never AED/USD. */
export function MoneyText({ amount, className }: { amount: number; className?: string }) {
  const { locale } = useLocale();
  return <span className={cn("tabular-nums", className)}>{formatCurrency(amount, locale)}</span>;
}

/** Always DD/MM/YYYY, Latin digits. */
export function DateText({ iso, className }: { iso: string; className?: string }) {
  return <span className={cn("tabular-nums", className)}>{formatDate(iso)}</span>;
}

/** Always +966, no leading zero, dir=ltr. */
export function PhoneText({ phone, className }: { phone: string; className?: string }) {
  return (
    <span dir="ltr" className={cn("tabular-nums", className)}>
      {formatPhone(phone)}
    </span>
  );
}
