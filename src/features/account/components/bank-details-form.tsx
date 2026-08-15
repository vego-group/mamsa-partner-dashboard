"use client";

import { useEffect, useMemo, useState } from "react";
import { api, ApiError } from "@/lib/api/client";
import { useAsync } from "@/lib/use-async";
import { useLocale } from "@/stores/locale-store";
import { ErrorState } from "@/components/shared/states";
import { Button, Field, Input, Modal } from "@/components/ui";
import { isValidIban, normalizeIban } from "@/lib/iban";
import { bankDetailsSchema } from "@/lib/schema";
import { cn } from "@/lib/cn";
import type { BankDetails } from "@/types";
import { AlertTriangle, Check, Info, Loader2, Save } from "lucide-react";

type BannerTone = "success" | "info" | "warning" | "error";

const TONES: Record<BannerTone, { wrap: string; icon: string }> = {
  success: { wrap: "border-status-approved/30 bg-status-approved/10 text-status-approved", icon: "text-status-approved" },
  info: { wrap: "border-brand/30 bg-brand-soft text-brand", icon: "text-brand" },
  warning: { wrap: "border-status-pending/40 bg-status-pending/10 text-status-pending", icon: "text-status-pending" },
  error: { wrap: "border-status-rejected/30 bg-status-rejected/10 text-status-rejected", icon: "text-status-rejected" },
};

/**
 * Payout bank account, for both account types — STAGING ONLY, gated by
 * `BANK_DETAILS_ENABLED`.
 *
 * `/me/bank-details` has no table behind it yet: it persists nothing and 404s
 * on production. The IBAN that actually reaches the partner record is still the
 * one written by PUT /me/company-docs, so this screen does not yet solve the
 * individual-partner payout gap it was built for.
 */
export function BankDetailsForm() {
  const { t } = useLocale();
  const b = t.bank;
  const { data, loading, error, reload, setData } = useAsync(() => api.getBankDetails());

  const [iban, setIban] = useState("");
  const [holder, setHolder] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // `data` is null for a partner who has never saved an account — the empty
  // form IS the correct state, not an error.
  const saved: BankDetails | null = data ?? null;

  // Syncs the fields from the server copy. Deliberately does NOT touch
  // `savedAt` — a successful save changes `saved`, and clearing it here would
  // wipe the confirmation in the same render that earns it.
  useEffect(() => {
    setIban(saved?.iban ?? "");
    setHolder(saved?.accountHolderName ?? "");
    setFormError(null);
  }, [saved]);

  const normalized = normalizeIban(iban);
  const parsed = useMemo(
    () => bankDetailsSchema.safeParse({ iban: normalized, accountHolderName: holder }),
    [normalized, holder],
  );
  const ibanChanged = normalized !== normalizeIban(saved?.iban ?? "");
  const dirty = ibanChanged || holder.trim() !== (saved?.accountHolderName ?? "");

  /**
   * Server-owned. We never guess it from the IBAN — a local SAMA table would be
   * a second source of truth that quietly disagrees with the server's.
   *
   * So between typing a new IBAN and the save response there is genuinely
   * nothing to show, and the field shows an em dash rather than a stale bank or
   * an invented one. It is display-only and never gates submission.
   */
  const bankName = ibanChanged ? null : saved?.bankName ?? null;

  // Only complain once the field is long enough to be a real attempt — a
  // checksum error on the third keystroke is noise, not help.
  const ibanError = normalized.length >= 24 && !isValidIban(normalized) ? b.invalidIban : undefined;

  if (loading) return <div className="h-64 animate-pulse rounded-3xl bg-white shadow-card" />;
  if (error) return <ErrorState onRetry={reload} />;

  async function commit() {
    setConfirming(false);
    setFormError(null);
    setSavedAt(null);
    setSaving(true);
    try {
      const updated = await api.updateBankDetails({ iban: normalized, accountHolderName: holder.trim() });
      setData(updated);
      setSavedAt(Date.now());
    } catch (e) {
      setFormError(e instanceof ApiError ? e.message : t.states.errorBody);
    } finally {
      setSaving(false);
    }
  }

  /** Changing a saved IBAN costs the partner their verified status — say so first. */
  function submit() {
    if (!parsed.success) return;
    if (saved && ibanChanged) return setConfirming(true);
    void commit();
  }

  return (
    <div className="rounded-3xl bg-white p-6 shadow-card">
      <div>
        <h3 className="text-lg font-bold text-ink">{b.title}</h3>
        <p className="mt-0.5 text-sm text-ink-muted">{b.subtitle}</p>
      </div>

      <StatusBanner details={saved} />

      <div className="mt-5 grid gap-5 sm:grid-cols-2">
        <Field label={b.iban} required error={ibanError}>
          {/* LTR input under an RTL label — an IBAN reads left-to-right and must
              not be visually reversed, or the partner cannot proof-read it. */}
          <Input
            value={iban}
            onChange={(e) => setIban(e.target.value)}
            dir="ltr"
            inputMode="text"
            autoComplete="off"
            spellCheck={false}
            placeholder={b.ibanPlaceholder}
            className="font-mono tracking-wide"
          />
        </Field>
        <Field label={b.accountHolder} required>
          <Input value={holder} onChange={(e) => setHolder(e.target.value)} maxLength={100} />
        </Field>
        <Field label={b.bankName}>
          {/* Neutral placeholder, never "Unknown Bank" — an absent value means
              the server hasn't told us yet, not that the bank is unrecognised. */}
          <Input
            value={bankName ?? ""}
            placeholder={b.bankNamePending}
            readOnly
            className="cursor-default bg-cream/60 text-ink-muted"
          />
        </Field>
      </div>

      {formError && <p className="mt-4 text-sm text-status-rejected">{formError}</p>}

      <div className="mt-6 flex items-center gap-3">
        <Button onClick={submit} disabled={saving || !parsed.success || !dirty}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {b.save}
        </Button>
        {savedAt && <span className="text-sm text-status-approved">{b.saved}</span>}
      </div>

      <Modal
        open={confirming}
        onClose={() => setConfirming(false)}
        size="sm"
        title={b.changeTitle}
        footer={
          <>
            <Button variant="outline" onClick={() => setConfirming(false)}>
              {t.common.cancel}
            </Button>
            <Button onClick={commit}>{b.confirmChange}</Button>
          </>
        }
      >
        <p className="text-sm text-ink">{b.changeWarning}</p>
      </Modal>
    </div>
  );
}

/** Answers "why haven't I been paid yet" before the partner has to ask. */
function StatusBanner({ details }: { details: BankDetails | null }) {
  const { t } = useLocale();
  const b = t.bank;

  const { tone, text, detail } =
    !details ? { tone: "warning" as const, text: b.missing, detail: undefined }
    : details.rejectionReason ? { tone: "error" as const, text: b.rejected, detail: `${details.rejectionReason} — ${b.rejectedFix}` }
    : details.verified ? { tone: "success" as const, text: b.verified, detail: undefined }
    : { tone: "info" as const, text: b.pending, detail: undefined };

  const Icon = tone === "success" ? Check : tone === "info" ? Info : AlertTriangle;

  return (
    <div className={cn("mt-5 flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm", TONES[tone].wrap)}>
      <Icon className={cn("mt-0.5 h-4 w-4 shrink-0", TONES[tone].icon)} />
      <div>
        <p className="font-semibold">{text}</p>
        {detail && <p className="mt-0.5 opacity-90">{detail}</p>}
      </div>
    </div>
  );
}
