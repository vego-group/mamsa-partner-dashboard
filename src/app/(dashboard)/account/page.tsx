"use client";

import { useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api/client";
import { useAsync } from "@/lib/use-async";
import { useLocale } from "@/stores/locale-store";
import { Avatar } from "@/components/shared/avatar";
import { LoadingSkeleton, ErrorState } from "@/components/shared/states";
import { FileUploadRow, type UploadedFile } from "@/features/units/components/file-upload";
import { BankDetailsForm } from "@/features/account/components/bank-details-form";
import { PayoutAccountCard } from "@/features/account/components/payout-account-card";
import { IdentityDocumentCard } from "@/features/account/components/identity-document-card";
import { isValidIban, normalizeIban } from "@/lib/iban";
import { BANK_DETAILS_ENABLED } from "@/lib/constants";
import { formatPhone } from "@/lib/format";
import { BRAND } from "@/lib/constants";
import type { Locale } from "@/lib/i18n";
import type { Partner } from "@/types";
import { Save, Check, AlertTriangle, Loader2 } from "lucide-react";

export default function AccountPage() {
  const { t, locale } = useLocale();
  const a = t.account;
  const { data, loading, error, reload, setData } = useAsync(() => api.getPartner());

  if (loading) return <LoadingSkeleton rows={4} />;
  if (error || !data) return <ErrorState onRetry={reload} />;

  const partnerType = data.accountType === "company" ? a.companyType : a.individualType;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink">{a.title}</h1>
        <p className="mt-0.5 text-sm text-ink-muted">{a.subtitle}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <ProfileCard data={data} locale={locale} partnerType={partnerType} onSaved={setData} />
      </div>

      {/* Staging-only. The endpoint is a stub with no table behind it, so this
          stays off in production until the backend ships bank_details. */}
      {BANK_DETAILS_ENABLED && <BankDetailsForm />}

      {/* The payout IBAN is NOT company-only — PUT /me/company-docs persists it
          for any partner type. Companies enter it alongside their documents
          below; individuals get the bank fields on their own. */}
      {data.accountType === "company" ?
        <CompanyDocsCard />
      : <>
          <PayoutAccountCard />
          {/* Individuals only: a company's identity evidence is its CR, which
              CompanyDocsCard already collects. Shown even once a scan is on
              file so a partner can replace an unreadable one — hiding it would
              leave them with a rejection they cannot act on. */}
          <IdentityDocumentCard partner={data} />
        </>
      }
    </div>
  );
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Partner profile — PATCH /me edits name + email only (§2.2). */
function ProfileCard({
  data,
  locale,
  partnerType,
  onSaved,
}: {
  data: Partner;
  locale: Locale;
  partnerType: string;
  onSaved: (p: Partner) => void;
}) {
  const { t } = useLocale();
  const a = t.account;
  const [name, setName] = useState(data.name);
  // `/me` returns null for an unset email — coerce so the input stays controlled.
  const [email, setEmail] = useState(data.email ?? "");
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    setName(data.name);
    setEmail(data.email ?? "");
  }, [data]);

  const since = new Intl.DateTimeFormat(locale === "ar" ? "ar" : "en-US", {
    month: "long",
    year: "numeric",
    calendar: "gregory",
    numberingSystem: "latn",
  }).format(new Date(data.memberSince));

  async function save() {
    setFormError(null);
    setSavedAt(null);
    if (!name.trim()) return setFormError(a.nameRequired);
    if (!EMAIL_RE.test(email.trim())) return setFormError(a.emailInvalid);

    setSaving(true);
    try {
      const updated = await api.updateMe({ name: name.trim(), email: email.trim() });
      onSaved(updated);
      setSavedAt(Date.now());
    } catch (e) {
      setFormError(e instanceof ApiError ? e.message : t.states.errorBody);
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <div className="rounded-3xl bg-white p-6 shadow-card lg:col-span-2">
        <h3 className="mb-5 text-lg font-bold text-ink">{a.partnerProfile}</h3>
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField label={a.fullName} value={name} onChange={setName} />
          <TextField label={a.emailAddress} value={email} onChange={setEmail} type="email" dir="ltr" />
          {/* Phone changes go through the OTP flow (§2.3) — read-only here */}
          <TextField label={a.phoneNumber} defaultValue={formatPhone(data.phone)} dir="ltr" readOnly />
          <TextField label={a.partnerType} defaultValue={partnerType} readOnly />
          {/* National ID / CR — admin-managed, never editable (§2.2). Null when
              the partner never went through registration; an unexplained empty
              box just looks broken, so name the reason in the placeholder. */}
          <TextField
            label={a.verificationId}
            defaultValue={data.verificationId ?? ""}
            placeholder={data.verificationId ? undefined : a.verificationIdMissing}
            dir={data.verificationId ? "ltr" : undefined}
            readOnly
          />
          <TextField label={a.location} defaultValue={BRAND.headerLocation[locale]} readOnly />
        </div>
        {formError && <p className="mt-4 text-sm text-status-rejected">{formError}</p>}
        <div className="mt-6 flex items-center gap-3">
          <button
            onClick={save}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:opacity-60"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {a.saveChanges}
          </button>
          {savedAt && <span className="text-sm text-status-approved">{a.profileSaved}</span>}
        </div>
      </div>

      {/* Profile card */}
      <div className="h-fit rounded-3xl bg-white p-6 text-center shadow-card">
        <Avatar name={data.name} className="mx-auto h-20 w-20 rounded-2xl bg-brand text-2xl" />
        <div className="mt-4 text-lg font-bold text-ink">{data.name}</div>
        <div className="text-sm text-ink-muted">{partnerType}</div>
        <span className="mt-2 inline-block rounded-full bg-status-approved/15 px-3 py-1 text-xs font-semibold text-status-approved">
          {a.approved}
        </span>
        <p className="mt-3 text-xs text-ink-muted">{a.partnerSince(since)}</p>
      </div>
    </>
  );
}

function CompanyDocsCard() {
  const { t } = useLocale();
  const a = t.account;
  const { data, loading, error, reload, setData } = useAsync(() => api.getCompanyDocs());

  const [cr, setCr] = useState("");
  const [iban, setIban] = useState("");
  const [authLetter, setAuthLetter] = useState<UploadedFile | null>(null);
  const [vatCert, setVatCert] = useState<UploadedFile | null>(null);
  const [operatorLicense, setOperatorLicense] = useState<UploadedFile | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!data) return;
    setCr(data.cr);
    setIban(data.iban);
    if (data.authorizationLetterFileId) setAuthLetter({ fileId: data.authorizationLetterFileId, fileName: a.authLetterLabel });
    if (data.vatCertificateFileId) setVatCert({ fileId: data.vatCertificateFileId, fileName: a.vatCertLabel });
    if (data.operatorLicenseFileId) setOperatorLicense({ fileId: data.operatorLicenseFileId, fileName: a.operatorLicenseLabel });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  if (loading) return <div className="h-48 animate-pulse rounded-3xl bg-white shadow-card" />;
  if (error || !data) return <ErrorState onRetry={reload} />;

  async function save() {
    setFormError(null);
    if (!/^\d{10}$/.test(cr)) return setFormError(a.crInvalid);
    if (!isValidIban(iban)) return setFormError(a.ibanInvalid);

    setSaving(true);
    try {
      // `iban` MUST stay in this payload. The backend has no bank_details table;
      // company-docs completeness (and therefore unit submission) reads the
      // legacy `partner_details.iban` this write populates.
      const updated = await api.putCompanyDocs({
        cr,
        iban: normalizeIban(iban),
        authorizationLetterFileId: authLetter?.fileId ?? null,
        vatCertificateFileId: vatCert?.fileId ?? null,
        operatorLicenseFileId: operatorLicense?.fileId ?? null,
      });
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
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold text-ink">{a.companyDocsTitle}</h3>
          <p className="mt-0.5 text-sm text-ink-muted">{a.companyDocsSubtitle}</p>
        </div>
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
            data.complete ? "bg-status-approved/15 text-status-approved" : "bg-status-pending/15 text-status-pending"
          }`}
        >
          {data.complete ? <Check className="h-3.5 w-3.5" /> : <AlertTriangle className="h-3.5 w-3.5" />}
          {data.complete ? a.companyDocsCompleteBadge : a.companyDocsIncompleteBadge}
        </span>
      </div>

      <div className="mt-5 grid gap-5 sm:grid-cols-2">
        <TextField label={a.crLabel} value={cr} onChange={setCr} dir="ltr" />
        {/* A payout account, not a company document — the endpoint is just badly
            named for it. This is the write that actually reaches the partner
            record today; it moves to /me/bank-details once Phase A ships. */}
        <TextField label={a.ibanLabel} value={iban} onChange={setIban} dir="ltr" />
      </div>

      <div className="mt-5 space-y-3">
        <FileUploadRow kind="company_doc" title={a.authLetterLabel} accept="application/pdf" value={authLetter} onChange={setAuthLetter} />
        <FileUploadRow kind="company_doc" title={a.vatCertLabel} accept="application/pdf" value={vatCert} onChange={setVatCert} />
        <FileUploadRow kind="company_doc" title={a.operatorLicenseLabel} accept="application/pdf" value={operatorLicense} onChange={setOperatorLicense} />
      </div>

      {formError && <p className="mt-4 text-sm text-status-rejected">{formError}</p>}

      <div className="mt-6 flex items-center gap-3">
        <button
          onClick={save}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:opacity-60"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {a.saveCompanyDocs}
        </button>
        {savedAt && <span className="text-sm text-status-approved">{a.companyDocsSaved}</span>}
      </div>
    </div>
  );
}

function TextField({
  label,
  defaultValue,
  value,
  onChange,
  type,
  dir,
  readOnly,
  placeholder,
}: {
  label: string;
  defaultValue?: string;
  value?: string;
  onChange?: (v: string) => void;
  type?: string;
  dir?: "ltr" | "rtl";
  readOnly?: boolean;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-faint">{label}</span>
      <input
        defaultValue={defaultValue}
        value={value}
        onChange={onChange ? (e) => onChange(e.target.value) : undefined}
        type={type}
        dir={dir}
        readOnly={readOnly}
        placeholder={placeholder}
        className={`w-full rounded-xl border border-line px-4 py-2.5 text-sm outline-none ${
          readOnly
            ? "cursor-default bg-cream/60 text-ink-muted"
            : "bg-cream/40 text-ink focus:border-brand focus:bg-white"
        }`}
      />
    </label>
  );
}
