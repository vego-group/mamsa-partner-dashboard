"use client";

import Link from "next/link";
import { useLocale } from "@/stores/locale-store";
import { formatCurrency, formatDate } from "@/lib/format";
import { BANK_DETAILS_ENABLED } from "@/lib/constants";
import { cn } from "@/lib/cn";
import type { WalletSummary } from "@/types";
import { AlertTriangle, ArrowLeft, CheckCircle2, Clock, Info, Landmark } from "lucide-react";

type Tone = "success" | "success-muted" | "info" | "warning" | "error";

const TONES: Record<Tone, string> = {
  success: "border-status-approved/30 bg-status-approved/10 text-status-approved",
  "success-muted": "border-line bg-cream/60 text-ink-muted",
  info: "border-brand/25 bg-brand-soft text-brand",
  warning: "border-status-pending/40 bg-status-pending/10 text-status-pending",
  error: "border-status-rejected/30 bg-status-rejected/10 text-status-rejected",
};

/**
 * Exactly one state, always. This is where "why haven't I been paid yet" gets
 * answered — if the partner has to guess, the page has failed.
 */
export function PayoutStatusStrip({ wallet }: { wallet: WalletSummary }) {
  const { t, locale } = useLocale();
  const w = t.wallet;
  const money = (n: number) => formatCurrency(n, locale, true);

  const state = resolve();

  function resolve(): {
    tone: Tone;
    icon: typeof CheckCircle2;
    message: React.ReactNode;
    progress?: number;
    action?: { href: string; label: string };
  } {
    if (wallet.paidThisMonth) {
      return {
        tone: "success-muted",
        icon: CheckCircle2,
        message: w.paidThisMonth(wallet.lastPayoutAt ? formatDate(wallet.lastPayoutAt) : "—"),
      };
    }

    switch (wallet.ineligibleReason) {
      case "below_minimum": {
        const remaining = Math.max(0, wallet.minPayoutAmount - wallet.availableBalance);
        return {
          tone: "info",
          icon: Clock,
          // "يُرحّل تلقائيًا" has to survive any rewrite — without it partners
          // read a sub-threshold balance as money they have forfeited.
          message: w.needMore(money(remaining)),
          progress: Math.min(1, Math.max(0, wallet.availableBalance / wallet.minPayoutAmount)),
        };
      }
      case "bank_missing":
        return {
          tone: "warning",
          icon: Landmark,
          message: w.bankMissing,
          // Only offer the CTA where the screen exists — never link production
          // navigation at a route that 404s.
          action: BANK_DETAILS_ENABLED ? { href: "/account", label: w.bankMissingCta } : undefined,
        };
      case "bank_unverified":
        return { tone: "info", icon: Info, message: w.bankUnverified };
      case "partner_suspended":
        return { tone: "error", icon: AlertTriangle, message: w.suspended };
      case "negative_balance":
        return { tone: "warning", icon: AlertTriangle, message: w.negativeBalance };
      default:
        return {
          tone: "success",
          icon: CheckCircle2,
          message: w.readyToTransfer(money(wallet.availableBalance)),
        };
    }
  }

  const Icon = state.icon;

  return (
    <div className={cn("rounded-3xl border px-5 py-4", TONES[state.tone])}>
      <div className="flex flex-wrap items-center gap-3">
        <Icon className="h-5 w-5 shrink-0" />
        <p className="flex-1 text-sm font-semibold leading-relaxed">{state.message}</p>
        {state.action && (
          <Link
            href={state.action.href}
            className="inline-flex items-center gap-1.5 rounded-full bg-white/80 px-4 py-1.5 text-sm font-semibold shadow-sm transition hover:bg-white"
          >
            {state.action.label}
            <ArrowLeft className="h-3.5 w-3.5 rtl:rotate-180" />
          </Link>
        )}
      </div>

      {state.progress !== undefined && (
        <div className="mt-3">
          <div className="h-2 overflow-hidden rounded-full bg-white/70">
            <div
              className="h-full rounded-full bg-brand transition-[width]"
              style={{ width: `${state.progress * 100}%` }}
            />
          </div>
          <p className="mt-1.5 text-xs tabular-nums opacity-80">
            {w.progressToMin(money(wallet.availableBalance), money(wallet.minPayoutAmount))}
          </p>
        </div>
      )}
    </div>
  );
}
