"use client";

import { api } from "@/lib/api/client";
import { useAsync } from "@/lib/use-async";
import { useLocale } from "@/stores/locale-store";
import { Modal } from "@/components/ui";
import { MoneyText, DateText } from "@/components/shared/typed-text";
import { ErrorState } from "@/components/shared/states";
import { formatDateShort } from "@/lib/format";
import { PayoutStatusBadge } from "@/features/wallet/components/payout-status-badge";
import type { PartnerPayout } from "@/types";
import { AlertTriangle } from "lucide-react";

/**
 * What made up this transfer. The footer total must equal `amount` — a partner
 * checking our arithmetic has to find it correct, so the total is summed from
 * the rows rather than echoing the payout's own field.
 */
export function PayoutDetail({ payout, onClose }: { payout: PartnerPayout; onClose: () => void }) {
  const { t, locale } = useLocale();
  const p = t.payouts;
  const { data, loading, error, reload } = useAsync(() => api.getPayout(payout.id), [payout.id]);

  const rowsTotal = data ? Math.round(data.bookings.reduce((s, b) => s + b.partnerShare, 0) * 100) / 100 : 0;

  return (
    <Modal open onClose={onClose} size="lg" title={p.detailTitle(payout.reference)}>
      <div className="flex flex-wrap items-center gap-3">
        <PayoutStatusBadge status={payout.status} />
        <MoneyText amount={payout.amount} precise className="text-2xl font-bold text-ink" />
      </div>

      {payout.status === "reversed" && payout.reversalReason && (
        <div className="mt-4 flex items-start gap-3 rounded-2xl border border-status-pending/40 bg-status-pending/10 px-4 py-3 text-sm text-status-pending">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <p className="font-semibold">{p.reversalReason}</p>
            <p className="mt-0.5">{payout.reversalReason}</p>
            {payout.reversedAt && (
              <p className="mt-1 text-xs opacity-80">
                {p.reversedAt}: <DateText iso={payout.reversedAt} />
              </p>
            )}
          </div>
        </div>
      )}

      <dl className="mt-5 grid grid-cols-2 gap-3 text-sm">
        <Meta label={p.period} value={payout.periodMonth} />
        <Meta label={p.paidAt} value={<DateText iso={payout.paidAt} />} />
        <Meta label={p.bankReference} value={<span dir="ltr">{payout.bankReference}</span>} />
        {/* Masked only — the partner never gets a full IBAN back from the server. */}
        <Meta
          label={p.bankAccount}
          value={
            <span dir="ltr">
              {payout.ibanMasked}
              {payout.bankName ? ` · ${payout.bankName}` : ""}
            </span>
          }
        />
        {payout.note && <Meta label={p.note} value={payout.note} />}
      </dl>

      <h4 className="mt-6 mb-2 text-sm font-bold text-ink">{p.includedBookings}</h4>

      {loading ? (
        <div className="h-32 animate-pulse rounded-2xl bg-cream/60" />
      ) : error || !data ? (
        <ErrorState onRetry={reload} />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-line">
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="border-b border-line bg-cream/40 text-xs uppercase tracking-wide text-ink-faint">
                <th className="py-2.5 ps-4 text-start font-semibold">{p.colBooking}</th>
                <th className="py-2.5 text-start font-semibold">{p.colUnit}</th>
                <th className="py-2.5 text-start font-semibold">{p.colCheckOut}</th>
                <th className="py-2.5 text-start font-semibold">{p.colNetBase}</th>
                <th className="py-2.5 pe-4 text-start font-semibold">{p.colShare}</th>
              </tr>
            </thead>
            <tbody>
              {data.bookings.map((b) => (
                <tr key={b.bookingId} className="border-b border-line/60 last:border-0">
                  <td className="py-2.5 ps-4 font-semibold text-ink">{b.bookingCode}</td>
                  <td className="py-2.5 text-ink-muted">{b.unitName}</td>
                  <td className="py-2.5 text-ink-muted">{formatDateShort(b.checkOut, locale)}</td>
                  <td className="py-2.5 text-ink-muted">
                    <MoneyText amount={b.netBase} precise />
                  </td>
                  <td className="py-2.5 pe-4 font-semibold text-ink">
                    <MoneyText amount={b.partnerShare} precise />
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-line bg-cream/40">
                <td className="py-3 ps-4 font-bold text-ink" colSpan={4}>
                  {p.total}
                </td>
                <td className="py-3 pe-4 font-bold text-ink">
                  <MoneyText amount={rowsTotal} precise />
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </Modal>
  );
}

function Meta({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-brand-soft/60 px-4 py-2.5">
      <dt className="text-xs text-ink-muted">{label}</dt>
      <dd className="mt-0.5 font-semibold text-ink">{value}</dd>
    </div>
  );
}
