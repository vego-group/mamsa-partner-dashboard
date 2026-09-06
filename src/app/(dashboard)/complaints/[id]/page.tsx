"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ApiError } from "@/lib/api/client";
import { useLocale } from "@/stores/locale-store";
import { useComplaint } from "@/features/complaints/use-complaints";
import { ComplaintStatusBadge } from "@/features/complaints/components/complaint-status-badge";
import { ComplaintImpactCard } from "@/features/complaints/components/complaint-impact-card";
import { Card, Button } from "@/components/ui";
import { DateText } from "@/components/shared/typed-text";
import { EmptyState, ErrorState, LoadingSkeleton } from "@/components/shared/states";
import type { PartnerComplaintImage } from "@/types";
import { ArrowLeft, ImageOff, RefreshCw, SearchX } from "lucide-react";

/** Attachment URLs are signed for ~15 minutes. Refetch a little before that when the tab comes back. */
const ATTACHMENT_TTL_MS = 14 * 60_000;
/** An image that fails this soon after the fetch did not expire — don't loop on it. */
const EXPIRY_GRACE_MS = 60_000;

export default function ComplaintDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { t } = useLocale();
  const c = t.complaints;
  const { data, loading, error, reload } = useComplaint(id);

  // When the current response landed — the signed URLs in it age from here.
  // A ref, not state: nothing renders off it, it only decides whether a
  // broken image means "expired, refetch" or "just broken, say so".
  const fetchedAt = useRef(0);
  const autoReloaded = useRef(false);
  const [imagesBroken, setImagesBroken] = useState(false);

  useEffect(() => {
    if (!data) return;
    fetchedAt.current = Date.now();
    autoReloaded.current = false;
    setImagesBroken(false);
  }, [data]);

  // Left open past the signature window, then brought back — refetch rather
  // than let the partner meet a grid of broken images.
  useEffect(() => {
    function onVisible() {
      if (document.visibilityState !== "visible" || !fetchedAt.current) return;
      if (Date.now() - fetchedAt.current > ATTACHMENT_TTL_MS) reload();
    }
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [reload]);

  function onImageError() {
    if (imagesBroken) return;
    const stale = Date.now() - fetchedAt.current > EXPIRY_GRACE_MS;
    if (stale && !autoReloaded.current) {
      // Not an error — the links aged out. One silent refetch, then fall
      // back to telling the partner if it still fails.
      autoReloaded.current = true;
      reload();
      return;
    }
    setImagesBroken(true);
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
                onClick={reload}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-muted transition hover:text-brand"
              >
                <RefreshCw className="h-4 w-4" />
                {c.refreshAttachments}
              </button>
            )}
          </div>

          {imagesBroken && (
            <div className="mb-3 flex items-center gap-2 rounded-2xl bg-cream/70 px-4 py-2.5 text-sm text-ink-muted">
              <ImageOff className="h-4 w-4 shrink-0" />
              {c.attachmentsExpired}
            </div>
          )}

          {data.images.length === 0 ? (
            <p className="text-sm text-ink-muted">{c.noAttachments}</p>
          ) : (
            <AttachmentGrid images={data.images} alt={c.attachmentAlt} onError={onImageError} />
          )}
        </Card>
      </div>
    </div>
  );
}

function AttachmentGrid({
  images,
  alt,
  onError,
}: {
  images: PartnerComplaintImage[];
  alt: (n: number) => string;
  onError: () => void;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {images.map((img, i) => (
        <a
          key={`${i}-${img.url}`}
          href={img.url}
          target="_blank"
          rel="noopener noreferrer"
          className="relative block aspect-[4/3] overflow-hidden rounded-card bg-line"
        >
          {/*
            Plain <img>, not next/image: these are short-lived signed URLs on
            whatever host the storage signs for, which is not something to pin
            in `images.remotePatterns` — and there is nothing to optimise on a
            link that dies in fifteen minutes.
          */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={img.url} alt={alt(i + 1)} loading="lazy" onError={onError} className="h-full w-full object-cover" />
        </a>
      ))}
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
