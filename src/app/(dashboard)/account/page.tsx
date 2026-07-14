"use client";

import { useState } from "react";
import { api } from "@/lib/api/client";
import { useAsync } from "@/lib/use-async";
import { useLocale } from "@/stores/locale-store";
import { Avatar } from "@/components/shared/avatar";
import { LoadingSkeleton, ErrorState } from "@/components/shared/states";
import { formatPhone } from "@/lib/format";
import { cn } from "@/lib/cn";
import { Save, Camera } from "lucide-react";

export default function AccountPage() {
  const { t, locale } = useLocale();
  const a = t.account;
  const { data, loading, error, reload } = useAsync(() => api.getPartner());

  const [prefs, setPrefs] = useState({
    email: true,
    sms: false,
    booking: true,
    revenue: true,
  });

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
        {/* Partner profile form */}
        <div className="rounded-3xl bg-white p-6 shadow-card lg:col-span-2">
          <h3 className="mb-5 text-lg font-bold text-ink">{a.partnerProfile}</h3>
          <div className="grid gap-5 sm:grid-cols-2">
            <TextField label={a.fullName} defaultValue={data.name} />
            <TextField label={a.companyName} defaultValue={data.companyName ?? ""} />
            <TextField label={a.emailAddress} defaultValue={data.email} type="email" dir="ltr" />
            <TextField label={a.phoneNumber} defaultValue={formatPhone(data.phone)} dir="ltr" />
            <TextField label={a.partnerType} defaultValue={partnerType} />
            <TextField label={a.location} defaultValue={locale === "ar" ? "الرياض، السعودية" : "Riyadh, Saudi Arabia"} />
          </div>
          <button className="mt-6 inline-flex items-center gap-2 rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-dark">
            <Save className="h-4 w-4" /> {a.saveChanges}
          </button>
        </div>

        <div className="space-y-6">
          {/* Profile card */}
          <div className="rounded-3xl bg-white p-6 text-center shadow-card">
            <Avatar name={data.name} className="mx-auto h-20 w-20 rounded-2xl bg-brand text-2xl" />
            <div className="mt-4 text-lg font-bold text-ink">{data.name}</div>
            {data.companyName && <div className="text-sm text-ink-muted">{data.companyName}</div>}
            <span className="mt-2 inline-block rounded-full bg-status-approved/15 px-3 py-1 text-xs font-semibold text-status-approved">
              {a.approved}
            </span>
            <p className="mt-3 text-xs text-ink-muted">{a.partnerSince(since)}</p>
            <button className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-line px-4 py-2.5 text-sm font-semibold text-ink transition hover:bg-cream">
              <Camera className="h-4 w-4" /> {a.uploadPhoto}
            </button>
          </div>

          {/* Preferences */}
          <div className="rounded-3xl bg-white p-6 shadow-card">
            <h3 className="mb-4 text-lg font-bold text-ink">{a.preferences}</h3>
            <div className="space-y-1">
              <Toggle label={a.emailNotifications} on={prefs.email} onToggle={() => setPrefs((p) => ({ ...p, email: !p.email }))} />
              <Toggle label={a.smsAlerts} on={prefs.sms} onToggle={() => setPrefs((p) => ({ ...p, sms: !p.sms }))} />
              <Toggle label={a.bookingReminders} on={prefs.booking} onToggle={() => setPrefs((p) => ({ ...p, booking: !p.booking }))} />
              <Toggle label={a.revenueReports} on={prefs.revenue} onToggle={() => setPrefs((p) => ({ ...p, revenue: !p.revenue }))} />
            </div>
            <button className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-dark">
              <Save className="h-4 w-4" /> {a.savePreferences}
            </button>
          </div>
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
}: {
  label: string;
  defaultValue: string;
  type?: string;
  dir?: "ltr" | "rtl";
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-faint">{label}</span>
      <input
        defaultValue={defaultValue}
        type={type}
        dir={dir}
        className="w-full rounded-xl border border-line bg-cream/40 px-4 py-2.5 text-sm text-ink outline-none focus:border-brand focus:bg-white"
      />
    </label>
  );
}

function Toggle({ label, on, onToggle }: { label: string; on: boolean; onToggle: () => void }) {
  return (
    <div className="flex items-center justify-between py-2.5">
      <span className="text-sm font-medium text-ink">{label}</span>
      <button
        onClick={onToggle}
        role="switch"
        aria-checked={on}
        className={cn("relative h-6 w-11 shrink-0 rounded-full transition", on ? "bg-brand" : "bg-line")}
      >
        <span
          className={cn(
            "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all",
            on ? "start-[1.375rem]" : "start-0.5",
          )}
        />
      </button>
    </div>
  );
}
