"use client";

import { useLocale } from "@/stores/locale-store";
import { formatCurrency, formatDate, formatPhone } from "@/lib/format";
import { cn } from "@/lib/cn";

/** Always renders SAR — never AED/USD. `precise` keeps halalas (wallet/ledger). */
export function MoneyText({
  amount,
  className,
  precise,
}: {
  amount: number;
  className?: string;
  precise?: boolean;
}) {
  const { locale } = useLocale();
  return <span className={cn("tabular-nums", className)}>{formatCurrency(amount, locale, precise)}</span>;
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
