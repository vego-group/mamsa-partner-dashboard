"use client";

import { api } from "@/lib/api/client";
import { useAsync } from "@/lib/use-async";
import { useLocale } from "@/stores/locale-store";
import { Avatar } from "@/components/shared/avatar";
import { LoadingSkeleton, ErrorState } from "@/components/shared/states";
import { formatPhone } from "@/lib/format";
import { BRAND } from "@/lib/constants";
import { Save } from "lucide-react";

export default function AccountPage() {
  const { t, locale } = useLocale();
  const a = t.account;
  const { data, loading, error, reload } = useAsync(() => api.getPartner());

  if (loading) return <LoadingSkeleton rows={4} />;
  if (error || !data) return <ErrorState onRetry={reload} />;

  const partnerType = data.accountType === "company" ? a.companyType : a.individualType;
  const since = new Intl.DateTimeFormat(locale === "ar" ? "ar" : "en-US", {
    month: "long",
    year: "numeric",
    calendar: "gregory",
    numberingSystem: "latn",
  }).format(new Date(data.memberSince));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink">{a.title}</h1>
        <p className="mt-0.5 text-sm text-ink-muted">{a.subtitle}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Partner profile — PATCH /me edits name + email only (§2.2) */}
        <div className="rounded-3xl bg-white p-6 shadow-card lg:col-span-2">
          <h3 className="mb-5 text-lg font-bold text-ink">{a.partnerProfile}</h3>
          <div className="grid gap-5 sm:grid-cols-2">
            <TextField label={a.fullName} defaultValue={data.name} />
            <TextField label={a.emailAddress} defaultValue={data.email} type="email" dir="ltr" />
            {/* Phone changes go through the OTP flow (§2.3) — read-only here */}
            <TextField label={a.phoneNumber} defaultValue={formatPhone(data.phone)} dir="ltr" readOnly />
            <TextField label={a.partnerType} defaultValue={partnerType} readOnly />
            {/* National ID / CR — admin-managed, never editable (§2.2) */}
            <TextField label={a.verificationId} defaultValue={data.verificationId} dir="ltr" readOnly />
            <TextField label={a.location} defaultValue={BRAND.headerLocation[locale]} readOnly />
          </div>
          <button className="mt-6 inline-flex items-center gap-2 rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-dark">
            <Save className="h-4 w-4" /> {a.saveChanges}
          </button>
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
      </div>
    </div>
  );
}

function TextField({
  label,
  defaultValue,
  type,
  dir,
  readOnly,
}: {
  label: string;
  defaultValue: string;
  type?: string;
  dir?: "ltr" | "rtl";
  readOnly?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-faint">{label}</span>
      <input
        defaultValue={defaultValue}
        type={type}
        dir={dir}
        readOnly={readOnly}
        className={`w-full rounded-xl border border-line px-4 py-2.5 text-sm outline-none ${
          readOnly
            ? "cursor-default bg-cream/60 text-ink-muted"
            : "bg-cream/40 text-ink focus:border-brand focus:bg-white"
        }`}
      />
    </label>
  );
}
