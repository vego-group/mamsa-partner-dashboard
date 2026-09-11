"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ApiError } from "@/lib/api/client";
import { useLocale } from "@/stores/locale-store";
import { useComplaint } from "@/features/complaints/use-complaints";
import { ComplaintStatusBadge } from "@/features/complaints/components/complaint-status-badge";
import { ComplaintImpactCard } from "@/features/complaints/components/complaint-impact-card";
import { AttachmentGrid } from "@/features/complaints/components/attachment-grid";
import { Card, Button } from "@/components/ui";
import { DateText } from "@/components/shared/typed-text";
import { EmptyState, ErrorState, LoadingSkeleton } from "@/components/shared/states";
import { ArrowLeft, ImageOff, RefreshCw, SearchX } from "lucide-react";

/** Attachment URLs are signed for ~15 minutes. Refetch a little before that when the tab comes back. */
const ATTACHMENT_TTL_MS = 14 * 60_000;

export default function ComplaintDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { t } = useLocale();
  const c = t.complaints;
  const { data, loading, error, reload } = useComplaint(id);

  // When the current response landed — the signed URLs in it age from here.
  // State, not a ref: the grid classifies image failures against it.
  const [fetchedAt, setFetchedAt] = useState(0);
  const autoReloaded = useRef(false);
  const [linksExpired, setLinksExpired] = useState(false);

  useEffect(() => {
    if (!data) return;
    setFetchedAt(Date.now());
    setLinksExpired(false);
  }, [data]);

  // Left open past the signature window, then brought back — refetch rather
  // than let the partner meet a grid of broken images.
  useEffect(() => {
    function onVisible() {
      if (document.visibilityState !== "visible" || !fetchedAt) return;
      if (Date.now() - fetchedAt > ATTACHMENT_TTL_MS) {
        autoReloaded.current = false;
        reload();
      }
    }
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [fetchedAt, reload]);

  function manualReload() {
    // A deliberate reload earns the next expiry one more silent retry.
    autoReloaded.current = false;
    reload();
  }

  function onLinksExpired() {
    // Not an error — the links aged out. One silent refetch of the complaint
    // (which issues fresh signed URLs), then tell the partner if it still
    // fails. The flag survives the refetch, so this can never loop.
    if (!autoReloaded.current) {
      autoReloaded.current = true;
      reload();
      return;
    }
    setLinksExpired(true);
  }

  if (loading) return <LoadingSkeleton rows={4} />;

  if (error instanceof ApiError && error.status === 404) {
    return (
      <div className="space-y-6">
        <BackLink label={c.backToList} />
        <EmptyState
          title={c.notFoundTitle}
          body={c.notFoundBody}
          icon={<SearchX className="h-6 w-6" />}
          action={
            <Link href="/complaints">
              <Button variant="outline">{c.backToList}</Button>
            </Link>
          }
        />
      </div>
    );
  }
  if (error || !data) return <ErrorState onRetry={reload} />;

  const title = data.bookingCode ? c.detailTitle(data.bookingCode) : c.detailTitleNoBooking(data.id);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <BackLink label={c.backToList} />
          <h1 className="mt-2 text-2xl font-bold text-ink">{title}</h1>
          <p className="mt-0.5 text-sm text-ink-muted">{data.unitName ?? "—"}</p>
        </div>
        <ComplaintStatusBadge status={data.status} className="px-3 py-1 text-sm" />
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        {/* A — the complaint, as the guest wrote it. */}
        <Card className="p-5 lg:col-span-2">
          <h3 className="mb-3 font-semibold text-ink">{c.sectionComplaint}</h3>
          <dl className="grid gap-3 text-sm sm:grid-cols-3">
            <Meta label={c.submittedAt} value={data.createdAt ? <DateText iso={data.createdAt} /> : "—"} />
            <Meta label={c.booking} value={<span dir="ltr">{data.bookingCode ?? "—"}</span>} />
            <Meta label={c.unit} value={data.unitName ?? "—"} />
          </dl>
          <div className="mt-4 text-xs font-semibold uppercase tracking-wide text-ink-faint">{c.description}</div>
          {/* Verbatim: the guest's line breaks are part of what they said. */}
          <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-ink">{data.description}</p>
        </Card>

        {/* C — what it did to the balance. */}
        <ComplaintImpactCard complaint={data} />

        {/* B — attachments. */}
        <Card className="p-5 lg:col-span-3">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <h3 className="font-semibold text-ink">{c.sectionAttachments}</h3>
            {data.images.length > 0 && (
              <button
                onClick={manualReload}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-muted transition hover:text-brand"
              >
                <RefreshCw className="h-4 w-4" />
                {c.refreshAttachments}
              </button>
            )}
          </div>

          {linksExpired && (
            <div className="mb-3 flex items-center gap-2 rounded-2xl bg-cream/70 px-4 py-2.5 text-sm text-ink-muted">
              <ImageOff className="h-4 w-4 shrink-0" />
              {c.attachmentsExpired}
            </div>
          )}

          {data.images.length === 0 ? (
            <p className="text-sm text-ink-muted">{c.noAttachments}</p>
          ) : (
            <AttachmentGrid images={data.images} fetchedAt={fetchedAt} onExpired={onLinksExpired} onReload={manualReload} />
          )}
        </Card>
      </div>
    </div>
  );
}

function BackLink({ label }: { label: string }) {
  return (
    <Link
      href="/complaints"
      className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-muted transition hover:text-brand"
    >
      <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
      {label}
    </Link>
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
