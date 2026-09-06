"use client";

import { useRouter } from "next/navigation";
import { useLocale } from "@/stores/locale-store";
import { useSearch } from "@/stores/search-store";
import { matchesQuery } from "@/lib/search";
import { useComplaints } from "@/features/complaints/use-complaints";
import { ComplaintStatusBadge } from "@/features/complaints/components/complaint-status-badge";
import { EmptyState, ErrorState, LoadingSkeleton } from "@/components/shared/states";
import { DateText } from "@/components/shared/typed-text";
import { ShieldCheck } from "lucide-react";

/**
 * Read-only by design. The partner does not act on a complaint — Mamsa
 * mediates the dispute — so there is no button here that writes anything,
 * and adding one is out of scope, not an improvement.
 */
export default function ComplaintsPage() {
  const { t } = useLocale();
  const c = t.complaints;
  const router = useRouter();
  const { data, loading, error, reload } = useComplaints();
  const { query } = useSearch();

  const all = data ?? [];
  const rows = all.filter((r) => matchesQuery(query, r.bookingCode ?? undefined, r.unitName ?? undefined));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink">{c.title}</h1>
        <p className="mt-0.5 text-sm text-ink-muted">{c.subtitle}</p>
      </div>

      {loading ? (
        <LoadingSkeleton />
      ) : error ? (
        <ErrorState onRetry={reload} />
      ) : all.length === 0 ? (
        // Most partners land here. Reassuring, not alarming — a shield, not a warning sign.
        <EmptyState title={c.emptyTitle} body={c.emptyBody} icon={<ShieldCheck className="h-6 w-6" />} />
      ) : rows.length === 0 ? (
        <EmptyState title={t.wiz.noResults} />
      ) : (
        <div className="overflow-hidden rounded-3xl bg-white shadow-card">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-line text-xs uppercase tracking-wide text-ink-faint">
                  <th className="py-3 ps-5 text-start font-semibold">{c.colStatus}</th>
                  <th className="py-3 text-start font-semibold">{c.colBooking}</th>
                  <th className="py-3 text-start font-semibold">{c.colUnit}</th>
                  <th className="py-3 pe-5 text-start font-semibold">{c.colDate}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr
                    key={row.id}
                    onClick={() => router.push(`/complaints/${row.id}`)}
                    className="cursor-pointer border-b border-line/60 last:border-0 hover:bg-cream/40"
                  >
                    <td className="py-3 ps-5">
                      <ComplaintStatusBadge status={row.status} />
                    </td>
                    <td className="py-3 font-semibold text-ink" dir="ltr">
                      {row.bookingCode ?? "—"}
                    </td>
                    <td className="py-3 text-ink">{row.unitName ?? "—"}</td>
                    <td className="py-3 pe-5 text-ink-muted">{row.createdAt ? <DateText iso={row.createdAt} /> : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
