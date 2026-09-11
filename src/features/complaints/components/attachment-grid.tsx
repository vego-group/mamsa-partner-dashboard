"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale } from "@/stores/locale-store";
import { classifyAttachmentFailure, probeAttachment, type AttachmentFailure } from "../lib/attachment-status";
import type { PartnerComplaintImage } from "@/types";
import { FileX2, ImageOff, RefreshCw } from "lucide-react";

type TileState = "ok" | AttachmentFailure;

/**
 * Area B of the complaint detail — the guest's attachments.
 *
 * Each tile fails on its own: one attachment can be `404` while the rest are
 * fine, and an expired link must never be dressed up as a server error. The
 * first `expired` tile reports up once via `onExpired`, so the page can do
 * its single silent refetch; after that the tile shows the calm expiry
 * message with a reload that refetches the complaint (which issues fresh
 * signed URLs — never the same dead link).
 */
export function AttachmentGrid({
  images,
  fetchedAt,
  onExpired,
  onReload,
  probe = probeAttachment,
}: {
  images: PartnerComplaintImage[];
  /** When the complaint response landed — the signed URLs age from here. */
  fetchedAt: number;
  /** Called at most once per response, the first time a link turns out to be expired. */
  onExpired?: () => void;
  /** Refetch the complaint — the parent resource that issues the signed URLs. */
  onReload: () => void;
  /** Test seam: reads the failed URL's status. */
  probe?: (url: string) => Promise<number | null>;
}) {
  const { t } = useLocale();
  const c = t.complaints;
  const [states, setStates] = useState<Record<string, TileState>>({});
  const reportedExpiry = useRef(false);

  // A new response means new URLs: forget the old verdicts.
  useEffect(() => {
    setStates({});
    reportedExpiry.current = false;
  }, [images]);

  async function onError(url: string) {
    if (states[url]) return;
    const status = await probe(url);
    const failure = classifyAttachmentFailure({ status, ageMs: Date.now() - fetchedAt });
    setStates((s) => (s[url] ? s : { ...s, [url]: failure }));
    if (failure === "expired" && !reportedExpiry.current) {
      reportedExpiry.current = true;
      onExpired?.();
    }
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {images.map((img, i) => {
        const state = states[img.url] ?? "ok";
        if (state !== "ok") {
          return <FailedTile key={`${i}-${img.url}`} state={state} onReload={onReload} />;
        }
        return (
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
            <img
              src={img.url}
              alt={c.attachmentAlt(i + 1)}
              loading="lazy"
              onError={() => onError(img.url)}
              className="h-full w-full object-cover"
            />
          </a>
        );
      })}
    </div>
  );
}

function FailedTile({ state, onReload }: { state: AttachmentFailure; onReload: () => void }) {
  const { t } = useLocale();
  const c = t.complaints;
  const label =
    state === "expired" ? c.attachmentExpired : state === "missing" ? c.attachmentMissing : c.attachmentBroken;
  const Icon = state === "missing" ? FileX2 : ImageOff;
  return (
    <div
      role="status"
      className="flex aspect-[4/3] flex-col items-center justify-center gap-2 rounded-card bg-cream/70 px-4 text-center text-sm text-ink-muted"
    >
      <Icon className="h-5 w-5 shrink-0" />
      <span>{label}</span>
      {state === "expired" && (
        <button
          type="button"
          onClick={onReload}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-brand transition hover:text-brand-dark"
        >
          <RefreshCw className="h-4 w-4" />
          {c.refreshAttachments}
        </button>
      )}
    </div>
  );
}
