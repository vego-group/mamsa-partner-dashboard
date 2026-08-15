"use client";

import { useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api/client";
import { useLocale } from "@/stores/locale-store";
import { MoneyText, DateText } from "@/components/shared/typed-text";
import { EmptyState } from "@/components/shared/states";
import { BOOKING_PARAM } from "@/lib/notifications";
import { cn } from "@/lib/cn";
import type { PartnerLedgerEntry, PartnerLedgerEntryType } from "@/types";
import type { Dict } from "@/lib/i18n";
import { Loader2 } from "lucide-react";

const PAGE = 20;

export function LedgerTable({ initial }: { initial: PartnerLedgerEntry[] }) {
  const { t } = useLocale();
  const w = t.wallet;
  const [rows, setRows] = useState(initial);
  // A short first page means there is nothing behind it — don't offer more.
  const [exhausted, setExhausted] = useState(initial.length < PAGE);
  const [loading, setLoading] = useState(false);

  async function loadMore() {
    const last = rows[rows.length - 1];
    if (!last || loading) return;
    setLoading(true);
    try {
      const next = await api.listPartnerLedgerEntries({ limit: PAGE, before: last.createdAt });
      setRows((prev) => [...prev, ...next]);
      if (next.length < PAGE) setExhausted(true);
    } finally {
      setLoading(false);
    }
  }

  if (rows.length === 0) return <EmptyState title={w.noTransactions} />;

  return (
    <div className="overflow-hidden rounded-3xl bg-white shadow-card">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b border-line text-xs uppercase tracking-wide text-ink-faint">
              <th className="py-3 ps-5 text-start font-semibold">{w.date}</th>
              <th className="py-3 text-start font-semibold">{w.type}</th>
              <th className="py-3 text-start font-semibold">{w.description}</th>
              <th className="py-3 text-start font-semibold">{w.amount}</th>
              <th className="py-3 pe-5 text-start font-semibold">{w.balanceAfter}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <LedgerRow key={row.id} row={row} />
            ))}
          </tbody>
        </table>
      </div>

      {!exhausted && (
        <div className="border-t border-line px-5 py-3 text-center">
          <button
            onClick={loadMore}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-semibold text-brand transition hover:bg-cream disabled:opacity-60"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {w.loadMore}
          </button>
        </div>
      )}
    </div>
  );
}

function LedgerRow({ row }: { row: PartnerLedgerEntry }) {
  const { t } = useLocale();
  const credit = row.amount >= 0;

  return (
    <tr className="border-b border-line/60 last:border-0">
      <td className="py-3 ps-5 text-ink-muted">
        <DateText iso={row.createdAt} />
      </td>
      <td className="py-3">
        <span className="rounded-full bg-cream px-2.5 py-0.5 text-xs font-semibold text-ink-muted">
          {typeLabel(t.wallet, row.type)}
        </span>
      </td>
      <td className="py-3 text-ink">
        {row.refType === "booking" ? (
          <Link href={`/bookings?${BOOKING_PARAM}=${row.refId}`} className="hover:text-brand hover:underline">
            {row.description}
          </Link>
        ) : (
          row.description
        )}
      </td>
      <td className={cn("py-3 font-bold", credit ? "text-status-approved" : "text-status-rejected")}>
        {/* Sign is explicit and leading — a debit must never read as a credit. */}
        <span dir="ltr" className="tabular-nums">
          {credit ? "+" : "−"}
          <MoneyText amount={Math.abs(row.amount)} precise />
        </span>
      </td>
      <td className="py-3 pe-5">
        <MoneyText amount={row.balanceAfter} precise className="font-semibold text-ink" />
      </td>
    </tr>
  );
}

function typeLabel(w: Dict["wallet"], type: PartnerLedgerEntryType): string {
  switch (type) {
    case "earning":
      return w.type_earning;
    case "payout":
      return w.type_payout;
    case "refund_reversal":
      return w.type_refund_reversal;
    case "adjustment":
      return w.type_adjustment;
  }
}
