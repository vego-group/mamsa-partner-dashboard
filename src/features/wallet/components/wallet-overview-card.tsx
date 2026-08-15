"use client";

import Link from "next/link";
import { api } from "@/lib/api/client";
import { useAsync } from "@/lib/use-async";
import { useLocale } from "@/stores/locale-store";
import { formatCurrency, formatDate } from "@/lib/format";
import { MoneyText } from "@/components/shared/typed-text";
import { cn } from "@/lib/cn";
import { ArrowLeft, CheckCircle2, Clock, Landmark, Wallet } from "lucide-react";

/**
 * Overview entry point to the wallet: the balance, one line saying whether it
 * is moving this month, and a way through. Deliberately not the ledger — that
 * belongs on /wallet.
 */
export function WalletOverviewCard() {
  const { t, locale } = useLocale();
  const w = t.wallet;
  const { data, loading, error } = useAsync(() => api.getWallet());

  if (loading) return <div className="h-40 animate-pulse rounded-card bg-white shadow-card" />;
  // Silent on failure — the overview has its own error surface and a broken
  // wallet fetch must not take the whole dashboard down with it.
  if (error || !data) return null;

  const money = (n: number) => formatCurrency(n, locale, true);
  const status =
    data.paidThisMonth ?
      { icon: CheckCircle2, tone: "text-ink-muted", text: w.paidThisMonth(data.lastPayoutAt ? formatDate(data.lastPayoutAt) : "—") }
    : data.ineligibleReason === "below_minimum" ?
      { icon: Clock, tone: "text-ink-muted", text: w.needMore(money(Math.max(0, data.minPayoutAmount - data.availableBalance))) }
    : data.ineligibleReason === "bank_missing" ?
      { icon: Landmark, tone: "text-status-pending", text: w.bankMissing }
    : data.ineligibleReason === "bank_unverified" ?
      { icon: Clock, tone: "text-status-pending", text: w.bankUnverified }
    : data.ineligibleReason === "partner_suspended" ?
      { icon: Landmark, tone: "text-status-rejected", text: w.suspended }
    : data.ineligibleReason === "negative_balance" ?
      { icon: Landmark, tone: "text-status-pending", text: w.negativeBalance }
    : { icon: CheckCircle2, tone: "text-status-approved", text: w.readyToTransfer(money(data.availableBalance)) };

  const Icon = status.icon;

  return (
    <Link
      href="/wallet"
      className="group flex flex-col rounded-card border border-line bg-white p-5 shadow-card transition hover:shadow-modal"
    >
      <div className="flex items-center justify-between">
        <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-ink-faint">
          <Wallet className="h-4 w-4" />
          {w.available}
        </span>
        <ArrowLeft className="h-4 w-4 text-ink-faint transition group-hover:text-brand rtl:rotate-180" />
      </div>

      <MoneyText amount={data.availableBalance} precise className="mt-2 block text-2xl font-bold text-ink" />

      <p className={cn("mt-3 flex items-start gap-2 text-xs leading-relaxed", status.tone)}>
        <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        <span>{status.text}</span>
      </p>
    </Link>
  );
}
