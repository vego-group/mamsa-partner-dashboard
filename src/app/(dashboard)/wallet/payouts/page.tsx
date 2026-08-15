"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/api/client";
import { useAsync } from "@/lib/use-async";
import { useLocale } from "@/stores/locale-store";
import { EmptyState, ErrorState, LoadingSkeleton } from "@/components/shared/states";
import { MoneyText, DateText } from "@/components/shared/typed-text";
import { PayoutStatusBadge } from "@/features/wallet/components/payout-status-badge";
import { PayoutDetail } from "@/features/wallet/components/payout-detail";
import { cn } from "@/lib/cn";
import type { PartnerPayout } from "@/types";
import { ArrowLeft } from "lucide-react";

/** Payout notifications deep-link here as `?payout=<id>`. */
const PAYOUT_PARAM = "payout";

export default function PayoutsPage() {
  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <PayoutsView />
    </Suspense>
  );
}

function PayoutsView() {
  const { t } = useLocale();
  const p = t.payouts;
  const router = useRouter();
  const { data, loading, error, reload } = useAsync(() => api.listPayouts({ limit: 50 }));
  const [selected, setSelected] = useState<PartnerPayout | null>(null);

  const deepLinkId = useSearchParams().get(PAYOUT_PARAM);
  useEffect(() => {
    if (!deepLinkId || !data) return;
    const match = data.find((x) => x.id === deepLinkId || x.reference === deepLinkId);
    if (match) setSelected(match);
  }, [deepLinkId, data]);

  const rows = data ?? [];

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/wallet"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-muted transition hover:text-brand"
        >
          <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
          {t.wallet.title}
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-ink">{p.title}</h1>
        <p className="mt-0.5 text-sm text-ink-muted">{p.subtitle}</p>
      </div>

      {loading ? (
        <LoadingSkeleton />
      ) : error ? (
        <ErrorState onRetry={reload} />
      ) : rows.length === 0 ? (
        <EmptyState title={p.empty} body={p.emptyBody} />
      ) : (
        <div className="overflow-hidden rounded-3xl bg-white shadow-card">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr className="border-b border-line text-xs uppercase tracking-wide text-ink-faint">
                  <th className="py-3 ps-5 text-start font-semibold">{p.reference}</th>
                  <th className="py-3 text-start font-semibold">{p.period}</th>
                  <th className="py-3 text-start font-semibold">{p.amount}</th>
                  <th className="py-3 text-start font-semibold">{p.bookingsCount}</th>
                  <th className="py-3 text-start font-semibold">{p.status}</th>
                  <th className="py-3 pe-5 text-start font-semibold">{p.paidAt}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const reversed = row.status === "reversed";
                  return (
                    <tr
                      key={row.id}
                      onClick={() => setSelected(row)}
                      // Reversed rows stay visible, just muted. The partner already
                      // got an email saying they were paid — removing the record
                      // without explanation is how trust dies.
                      className={cn(
                        "cursor-pointer border-b border-line/60 last:border-0 hover:bg-cream/40",
                        reversed && "bg-cream/30 text-ink-muted",
                      )}
                    >
                      <td className="py-3 ps-5 font-semibold text-ink" dir="ltr">
                        {row.reference}
                      </td>
                      <td className="py-3 tabular-nums text-ink-muted" dir="ltr">
                        {row.periodMonth}
                      </td>
                      <td className="py-3">
                        <MoneyText
                          amount={row.amount}
                          precise
                          className={cn("font-bold", reversed ? "text-ink-muted line-through" : "text-ink")}
                        />
                      </td>
                      <td className="py-3 tabular-nums text-ink-muted">{row.bookingsCount}</td>
                      <td className="py-3">
                        <div className="flex flex-col gap-1">
                          <PayoutStatusBadge status={row.status} />
                          {reversed && row.reversalReason && (
                            <span className="max-w-[22rem] text-xs text-status-pending">{row.reversalReason}</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 pe-5 text-ink-muted">
                        <DateText iso={row.paidAt} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selected && (
        <PayoutDetail
          payout={selected}
          onClose={() => {
            setSelected(null);
            // Drop the deep-link param so a refresh doesn't reopen the sheet.
            if (deepLinkId) router.replace("/wallet/payouts", { scroll: false });
          }}
        />
      )}
    </div>
  );
}
