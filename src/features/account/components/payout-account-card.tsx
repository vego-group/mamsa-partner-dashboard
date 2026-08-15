"use client";

import { useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api/client";
import { useAsync } from "@/lib/use-async";
import { useLocale } from "@/stores/locale-store";
import { Button, Field, Input } from "@/components/ui";
import { isValidIban, normalizeIban } from "@/lib/iban";
import { Loader2, Save } from "lucide-react";

/**
 * Payout bank account for INDIVIDUAL partners.
 *
 * It writes through `PUT /me/company-docs`, which is badly named for this: the
 * endpoint has no partner-type gate (ProfileController validates and persists
 * `iban` for any partner), and the legacy `partner_details.iban` it populates
 * is the only column that actually stores a payout IBAN today. Rendering the
 * field only for companies was a client-side restriction, not a backend one —
 * which is why individuals could not be paid at all.
 *
 * Individuals send ONLY the bank fields; `cr` and the three company file ids
 * are deliberately absent from the payload. This whole card moves to
 * `/me/bank-details` once the backend ships Phase A.
 */
export function PayoutAccountCard() {
  const { t } = useLocale();
  const a = t.account;
  const { data, loading } = useAsync(() => api.getCompanyDocs());

  const [iban, setIban] = useState("");
  const [holder, setHolder] = useState("");
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!data) return;
    setIban(data.iban ?? "");
    // Expected to come back empty — there is no column for it yet. The field is
    // still collected and sent so nothing is lost once one exists.
    setHolder(data.accountHolderName ?? "");
  }, [data]);

  // A failed read must not hide the form: the write is the point, and this
  // endpoint may not return a record for an individual at all.
  if (loading) return <div className="h-48 animate-pulse rounded-3xl bg-white shadow-card" />;

  const normalized = normalizeIban(iban);
  const ibanValid = isValidIban(normalized);
  const ibanError = normalized.length >= 24 && !ibanValid ? a.ibanInvalid : undefined;

  async function save() {
    setFormError(null);
    setSavedAt(null);
    if (!ibanValid) return setFormError(a.ibanInvalid);

    setSaving(true);
    try {
      // Bank fields only — no `cr`, no company document ids.
      await api.putCompanyDocs({ iban: normalized, accountHolderName: holder.trim() });
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
        <h3 className="text-lg font-bold text-ink">{a.payoutAccountTitle}</h3>
        <p className="mt-0.5 text-sm text-ink-muted">{a.payoutAccountSubtitle}</p>
      </div>

      <div className="mt-5 grid gap-5 sm:grid-cols-2">
        <Field label={a.ibanLabel} required error={ibanError}>
          {/* LTR under an RTL label — an IBAN reads left-to-right. */}
          <Input
            value={iban}
            onChange={(e) => setIban(e.target.value)}
            dir="ltr"
            autoComplete="off"
            spellCheck={false}
            placeholder="SA0000000000000000000000"
            className="font-mono tracking-wide"
          />
        </Field>
        <Field label={a.accountHolderLabel}>
          <Input value={holder} onChange={(e) => setHolder(e.target.value)} maxLength={100} />
        </Field>
      </div>

      {formError && <p className="mt-4 text-sm text-status-rejected">{formError}</p>}

      <div className="mt-6 flex items-center gap-3">
        {/* Gated on the IBAN only — the holder name has nowhere to land yet and
            must never be what stops a partner from being payable. */}
        <Button onClick={save} disabled={saving || !ibanValid}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {a.savePayoutAccount}
        </Button>
        {savedAt && <span className="text-sm text-status-approved">{a.payoutAccountSaved}</span>}
      </div>
    </div>
  );
}
