"use client";

import { useLocale } from "@/stores/locale-store";
import { MoneyText } from "@/components/shared/typed-text";
import type { WalletSummary } from "@/types";
import { Clock, Wallet } from "lucide-react";

/**
 * Available is visually dominant — it is the number the partner came for.
 *
 * The note under it deliberately promises a cadence, never a day: transfers are
 * executed by hand once a month and may land on the 1st or the 28th. The note
 * under pending is what stops the "why is my money in the wrong bucket" ticket.
 */
export function BalanceHeader({ wallet }: { wallet: WalletSummary }) {
  const { t } = useLocale();
  const w = t.wallet;

  return (
    <div className="grid gap-5 lg:grid-cols-5">
      <div className="rounded-3xl bg-brand p-6 text-white shadow-card lg:col-span-3">
        <div className="flex items-center gap-2 text-sm text-white/80">
          <Wallet className="h-4 w-4" />
          {w.available}
        </div>
        <MoneyText amount={wallet.availableBalance} precise className="mt-2 block text-4xl font-bold" />
        <p className="mt-3 text-sm leading-relaxed text-white/75">{w.cycleNote}</p>
      </div>

      <div className="rounded-3xl bg-white p-6 shadow-card lg:col-span-2">
        <div className="flex items-center gap-2 text-sm text-ink-muted">
          <Clock className="h-4 w-4 text-status-pending" />
          {w.pending}
        </div>
        <MoneyText amount={wallet.pendingBalance} precise className="mt-2 block text-2xl font-bold text-ink" />
        <p className="mt-3 text-sm leading-relaxed text-ink-muted">{w.pendingNote}</p>
      </div>
    </div>
  );
}
