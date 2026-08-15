"use client";

import { api } from "@/lib/api/client";
import { useAsync } from "@/lib/use-async";
import { useLocale } from "@/stores/locale-store";
import { ErrorState, LoadingSkeleton } from "@/components/shared/states";
import { MoneyText } from "@/components/shared/typed-text";
import { BalanceHeader } from "@/features/wallet/components/balance-header";
import { PayoutStatusStrip } from "@/features/wallet/components/payout-status-strip";
import { LedgerTable } from "@/features/wallet/components/ledger-table";
import Link from "next/link";
import { Landmark } from "lucide-react";

export default function WalletPage() {
  const { t } = useLocale();
  const w = t.wallet;
  const wallet = useAsync(() => api.getWallet());
  const ledger = useAsync(() => api.listPartnerLedgerEntries({ limit: 20 }));

  if (wallet.loading || ledger.loading) return <LoadingSkeleton rows={4} />;
  if (wallet.error || !wallet.data) return <ErrorState onRetry={wallet.reload} />;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-ink">{w.title}</h1>
          <p className="mt-0.5 text-sm text-ink-muted">{w.subtitle}</p>
        </div>
        {/* Payouts is a sub-route reached from here — never a second nav item. */}
        <Link
          href="/wallet/payouts"
          className="inline-flex items-center gap-2 rounded-full border border-line bg-white px-4 py-2 text-sm font-semibold text-ink transition hover:bg-cream"
        >
          <Landmark className="h-4 w-4" />
          {w.viewPayouts}
        </Link>
      </div>

      <BalanceHeader wallet={wallet.data} />
      <PayoutStatusStrip wallet={wallet.data} />

      <div className="grid gap-5 sm:grid-cols-2">
        <LifetimeStat label={w.lifetimeEarnings} amount={wallet.data.lifetimeEarnings} />
        <LifetimeStat label={w.lifetimePaidOut} amount={wallet.data.lifetimePaidOut} />
      </div>

      <div>
        <h2 className="mb-3 text-lg font-bold text-ink">{w.ledger}</h2>
        {ledger.error ? <ErrorState onRetry={ledger.reload} /> : <LedgerTable initial={ledger.data ?? []} />}
      </div>
    </div>
  );
}

function LifetimeStat({ label, amount }: { label: string; amount: number }) {
  return (
    <div className="rounded-3xl bg-white p-5 shadow-card">
      <div className="text-xs font-semibold uppercase tracking-wide text-ink-faint">{label}</div>
      <MoneyText amount={amount} precise className="mt-1.5 block text-xl font-bold text-ink" />
    </div>
  );
}
