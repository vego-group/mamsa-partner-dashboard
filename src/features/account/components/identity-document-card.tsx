"use client";

import { useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api/client";
import { useAsync } from "@/lib/use-async";
import { useLocale } from "@/stores/locale-store";
import { Button, Field, Input } from "@/components/ui";
import { FileUploadRow, type UploadedFile } from "@/features/units/components/file-upload";
import { cn } from "@/lib/cn";
import type { Partner } from "@/types";
import { AlertTriangle, Check, Loader2, Save } from "lucide-react";

/**
 * The ID scan for INDIVIDUAL partners.
 *
 * Registration collects the number and the scan together, but every partner who
 * signed up before that shipped has only the number — and until this card there
 * was nowhere in the dashboard to add the file. Those partners sat at
 * `documentsComplete: false` permanently, with a reviewer looking at a number
 * they had no way to check.
 *
 * It writes through `PUT /me/company-docs` (`nationalIdFileId`), which is badly
 * named for an individual's identity document — but it is the same record
 * registration writes, so both routes produce one document rather than two.
 *
 * Uploaded as `kind: "company_doc"`: the presign kinds are a fixed set of three
 * and this is the one identity scans are stored under. It accepts png/jpg as
 * well as pdf — an ID gets photographed, not scanned to PDF.
 */
export function IdentityDocumentCard({ partner }: { partner: Partner }) {
  const { t } = useLocale();
  const a = t.account;
  const { data, loading, setData } = useAsync(() => api.getCompanyDocs());

  const [file, setFile] = useState<UploadedFile | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (data?.nationalIdFileId) setFile({ fileId: data.nationalIdFileId, fileName: a.identityDocFileLabel });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  // A failed read must not hide the form — the write is the point, and this
  // endpoint may not return a record for an individual at all.
  if (loading) return <div className="h-56 animate-pulse rounded-3xl bg-white shadow-card" />;

  const onFile = Boolean(data?.nationalIdFileId);
  // Nothing to save until the picked file differs from what's already stored.
  const dirty = (file?.fileId ?? null) !== (data?.nationalIdFileId ?? null);

  async function save() {
    setFormError(null);
    setSavedAt(null);
    setSaving(true);
    try {
      // ONLY the identity field — no `cr`, no company document ids, and no
      // `iban`. The payout card owns the IBAN; sending an empty one from here
      // would wipe it.
      const updated = await api.putCompanyDocs({ nationalIdFileId: file?.fileId ?? null });
      setData(updated);
      setSavedAt(Date.now());
    } catch (e) {
      setFormError(e instanceof ApiError ? e.message : t.states.errorBody);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-3xl bg-white p-6 shadow-card">
      <div>
        <h3 className="text-lg font-bold text-ink">{a.identityDocTitle}</h3>
        <p className="mt-0.5 text-sm text-ink-muted">{a.identityDocSubtitle}</p>
      </div>

      <div className="mt-5 grid gap-5 sm:grid-cols-2">
        {/* Read-only: the number is set at registration and PATCH /me edits name
            and email only, so an editable field here would silently discard. */}
        <Field label={a.identityDocNumber}>
          <Input value={partner.verificationId ?? ""} readOnly disabled dir="ltr" className="font-mono tracking-wide" />
        </Field>
      </div>

      <div className="mt-5">
        <FileUploadRow
          kind="company_doc"
          title={a.identityDocFileLabel}
          subtitle={a.identityDocHint}
          accept="image/png,image/jpeg,application/pdf"
          value={file}
          onChange={setFile}
        />
      </div>

      <div
        className={cn(
          "mt-5 flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm",
          onFile ?
            "border-status-approved/30 bg-status-approved/10 text-status-approved"
          : "border-status-pending/40 bg-status-pending/10 text-status-pending",
        )}
      >
        {onFile ?
          <Check className="mt-0.5 h-4 w-4 shrink-0" />
        : <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />}
        <p className="font-semibold">{onFile ? a.identityDocOnFile : a.identityDocMissing}</p>
      </div>

      {formError && <p className="mt-4 text-sm text-status-rejected">{formError}</p>}

      <div className="mt-6 flex items-center gap-3">
        <Button onClick={save} disabled={saving || !dirty}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {a.identityDocSave}
        </Button>
        {savedAt && <span className="text-sm text-status-approved">{a.identityDocSaved}</span>}
      </div>
    </div>
  );
}
