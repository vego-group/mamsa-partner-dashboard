"use client";

import { useEffect, useState } from "react";
import { useLocale } from "@/stores/locale-store";
import { splitPrice, formatCurrency } from "@/lib/format";
import { cn } from "@/lib/cn";
import { ChevronDown, Info } from "lucide-react";

/**
 * Two numbers matter to a partner setting a price: what the guest pays, and
 * what they keep. Everything else is detail.
 *
 * So the net earning is the dominant element and the deductions live in a
 * disclosure that is collapsed by default — somebody choosing a price wants to
 * know their take-home, not a tax lecture. The detail is there for whoever
 * opens it. Collapsed, the card stays under six visible lines.
 */
export function PriceBreakdown({ gross, className }: { gross: number; className?: string }) {
  const { t, locale } = useLocale();
  const p = t.pricing;
  const [open, setOpen] = useState(false);
  const debounced = useDebounced(gross, 150);

  const money = (n: number) => formatCurrency(n, locale, true);
  const has = debounced > 0;
  const s = splitPrice(has ? debounced : 0);

  return (
    <div className={cn("rounded-2xl border border-line bg-cream/40 p-4", className)}>
      <Row label={p.guestPays} value={has ? money(s.gross) : "—"} muted />

      <div className="mt-3">
        <div className="text-xs text-ink-muted">{p.netEarning}</div>
        {/* The number the partner is actually deciding on. */}
        <div className={cn("text-2xl font-bold tabular-nums", has ? "text-brand" : "text-ink-faint")}>
          {has ? money(s.partnerShare) : "—"}
        </div>
        <p className="mt-1 text-xs text-ink-muted">{has ? p.netEarningNote : p.placeholder}</p>
      </div>

      {has && (
        <>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-ink-muted transition hover:text-ink"
          >
            {p.showDeductions}
            <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", open && "rotate-180")} />
          </button>

          {open && (
            <div className="mt-2 space-y-1.5 border-t border-line pt-2">
              <Row label={p.netBase} value={money(s.netBase)} muted />
              {/* Explanations ride on the ⓘ as tooltips, not as always-visible sub-lines. */}
              <Row label={p.vat} value={`− ${money(s.vat)}`} muted tooltip={p.vatTooltip} />
              <Row label={p.commission} value={`− ${money(s.commission)}`} muted tooltip={p.commissionTooltip} />
            </div>
          )}
        </>
      )}
    </div>
  );
}

function Row({
  label,
  value,
  muted,
  tooltip,
}: {
  label: string;
  value: string;
  muted?: boolean;
  tooltip?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <span className={cn("inline-flex items-center gap-1", muted ? "text-ink-muted" : "text-ink")}>
        {label}
        {tooltip && (
          <span title={tooltip} className="cursor-help text-ink-faint" aria-label={tooltip}>
            <Info className="h-3.5 w-3.5" />
          </span>
        )}
      </span>
      <span className="tabular-nums font-semibold text-ink">{value}</span>
    </div>
  );
}

/** Keeps the card from re-computing on every keystroke while staying live. */
function useDebounced<T>(value: T, ms: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(id);
  }, [value, ms]);
  return debounced;
}
