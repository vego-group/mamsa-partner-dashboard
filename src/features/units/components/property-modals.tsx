"use client";

import { useState } from "react";
import Image from "next/image";
import { Modal, Button } from "@/components/ui";
import { MoneyText } from "@/components/shared/typed-text";
import { useLocale } from "@/stores/locale-store";
import { api } from "@/lib/api/client";
import { useAsync } from "@/lib/use-async";
import { SAUDI_CITIES, BRAND } from "@/lib/constants";
import type { Locale } from "@/lib/i18n";
import type { Unit, DayStatus } from "@/types";
import { cn } from "@/lib/cn";
import { MapPin, Star, Save, Link2, Check, Building2 } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar } from "recharts";

export type PropertyModalType = "preview" | "edit" | "calendar" | "analytics" | "share";

function loc(u: Unit, locale: Locale) {
  const city = SAUDI_CITIES.find((c) => c.value === u.city);
  const cityLabel = city ? city[locale] : u.city;
  const sep = locale === "ar" ? "، " : ", ";
  return [u.district, cityLabel].filter(Boolean).join(sep);
}

const badgeTone: Record<string, string> = {
  draft: "text-status-draft",
  pending: "text-status-pending",
  approved: "text-status-approved",
  rejected: "text-status-rejected",
  available: "text-status-approved",
  booked: "text-brand",
  blocked: "text-status-draft",
};

function OverlayBadge({ tone, children }: { tone: string; children: React.ReactNode }) {
  return (
    <span className={cn("inline-flex items-center rounded-full bg-white/95 px-2.5 py-0.5 text-xs font-semibold backdrop-blur", badgeTone[tone])}>
      {children}
    </span>
  );
}

export function PropertyModal({ type, unit, onClose }: { type: PropertyModalType; unit: Unit; onClose: () => void }) {
  if (type === "preview") return <PreviewModal unit={unit} onClose={onClose} />;
  if (type === "edit") return <EditModal unit={unit} onClose={onClose} />;
  if (type === "calendar") return <CalendarModal unit={unit} onClose={onClose} />;
  if (type === "analytics") return <AnalyticsModal unit={unit} onClose={onClose} />;
  return <ShareModal unit={unit} onClose={onClose} />;
}

/* ---------------- Preview ---------------- */
function PreviewModal({ unit, onClose }: { unit: Unit; onClose: () => void }) {
  const { t, locale } = useLocale();
  const p = t.pm;
  return (
    <Modal open onClose={onClose} size="lg" title={p.previewTitle}>
      <div className="relative h-56 overflow-hidden rounded-2xl bg-cream-dark">
        {unit.photos[0] && <Image src={unit.photos[0].url} alt="" fill className="object-cover" />}
        <div className="absolute bottom-3 start-3 flex flex-wrap gap-2">
          <OverlayBadge tone={unit.status}>{t.unitStatus[unit.status]}</OverlayBadge>
          {unit.availability && <OverlayBadge tone={unit.availability}>{t.dayStatus[unit.availability]}</OverlayBadge>}
        </div>
      </div>

      <h3 className="mt-4 text-xl font-bold text-ink">{unit.name}</h3>
      <p className="mt-1 flex items-center gap-1 text-sm text-ink-muted">
        <MapPin className="h-4 w-4 shrink-0" /> {loc(unit, locale)}
      </p>
      {unit.rating != null && (
        <div className="mt-2 flex items-center gap-1.5 text-sm font-semibold text-ink">
          <Star className="h-4 w-4 fill-status-pending text-status-pending" />
          {unit.rating.toFixed(1)}
          {unit.reviews != null && <span className="font-normal text-ink-muted">{p.reviews(unit.reviews)}</span>}
        </div>
      )}
      {unit.description && <p className="mt-3 text-sm leading-relaxed text-ink-muted">{unit.description}</p>}

      <div className="mt-4 grid grid-cols-3 gap-3">
        <BigTile value={unit.bedrooms} label={p.bedrooms} />
        <BigTile value={unit.bathrooms ?? 0} label={p.bathrooms} />
        <BigTile value={unit.capacity} label={p.maxGuests} />
      </div>
      <div className="mt-3 grid grid-cols-2 gap-3">
        <SideTile label={p.nightlyRate} value={<MoneyText amount={unit.pricePerNight} className="text-lg font-bold text-ink" />} />
        <SideTile label={p.occupancyRate} value={<span className="text-lg font-bold text-ink">{unit.occupancy ?? 0}%</span>} />
      </div>
    </Modal>
  );
}

function BigTile({ value, label }: { value: number; label: string }) {
  return (
    <div className="rounded-2xl bg-brand-soft/60 py-4 text-center">
      <div className="text-2xl font-bold tabular-nums text-ink">{value}</div>
      <div className="mt-0.5 text-xs text-ink-muted">{label}</div>
    </div>
  );
}
function SideTile({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-brand-soft/60 px-4 py-3">
      <div className="text-xs text-ink-muted">{label}</div>
      <div className="mt-0.5">{value}</div>
    </div>
  );
}

/* ---------------- Edit ---------------- */
function EditModal({ unit, onClose }: { unit: Unit; onClose: () => void }) {
  const { t, locale } = useLocale();
  const p = t.pm;
  return (
    <Modal
      open
      onClose={onClose}
      size="lg"
      title={p.editTitle}
      footer={
        <>
          <Button variant="outline" className="flex-1" onClick={onClose}>{t.common.cancel}</Button>
          <Button className="flex-1" onClick={onClose}>
            <Save className="h-4 w-4" /> {p.saveChanges}
          </Button>
        </>
      }
    >
      <div className="relative mb-5 h-40 overflow-hidden rounded-2xl bg-cream-dark">
        {unit.photos[0] && <Image src={unit.photos[0].url} alt="" fill className="object-cover" />}
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <EditField label={p.propertyName} defaultValue={unit.name} />
        <EditField label={p.location} defaultValue={loc(unit, locale)} />
        <EditField label={p.pricePerNight} defaultValue={String(unit.pricePerNight)} />
        <EditField label={p.bedrooms} defaultValue={String(unit.bedrooms)} />
        <EditField label={p.bathrooms} defaultValue={String(unit.bathrooms ?? 0)} />
        <EditField label={p.maxGuests} defaultValue={String(unit.capacity)} />
      </div>
      <div className="mt-5">
        <FieldLabel>{p.description}</FieldLabel>
        <textarea
          defaultValue={unit.description}
          rows={3}
          className="w-full rounded-xl border border-line bg-cream/40 px-4 py-2.5 text-sm text-ink outline-none focus:border-brand focus:bg-white"
        />
      </div>
      <div className="mt-5 grid gap-5 sm:grid-cols-2">
        <div>
          <FieldLabel>{p.status}</FieldLabel>
          <select defaultValue={unit.status} className={selectCls}>
            {(["draft", "pending", "approved", "rejected"] as const).map((s) => (
              <option key={s} value={s}>{t.unitStatus[s]}</option>
            ))}
          </select>
        </div>
        <div>
          <FieldLabel>{p.availability}</FieldLabel>
          <select defaultValue={unit.availability ?? "available"} className={selectCls}>
            {(["available", "booked", "blocked"] as const).map((s) => (
              <option key={s} value={s}>{t.dayStatus[s]}</option>
            ))}
          </select>
        </div>
      </div>
    </Modal>
  );
}

const inputCls = "w-full rounded-xl border border-line bg-cream/40 px-4 py-2.5 text-sm text-ink outline-none focus:border-brand focus:bg-white";
const selectCls = cn(inputCls, "appearance-none");

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-faint">{children}</span>;
}
function EditField({ label, defaultValue }: { label: string; defaultValue: string }) {
  return (
    <label className="block">
      <FieldLabel>{label}</FieldLabel>
      <input defaultValue={defaultValue} className={inputCls} />
    </label>
  );
}

/* ---------------- Calendar ---------------- */
const dayColors: Record<DayStatus, string> = {
  available: "bg-status-approved/15 text-status-approved",
  booked: "bg-brand-dark text-white",
  blocked: "bg-status-draft/15 text-ink-muted",
  external: "bg-[#ECE6F6] text-[#7C5CBF]",
};

function CalendarModal({ unit, onClose }: { unit: Unit; onClose: () => void }) {
  const { t } = useLocale();
  const p = t.pm;
  const cal = useAsync(() => api.getCalendar(unit.id, "2026-07"), [unit.id]);
  const [overrides, setOverrides] = useState<Record<string, DayStatus>>({});
  const [selected, setSelected] = useState<string[]>([]);

  const days = cal.data ?? [];
  const firstWeekday = days[0] ? new Date(days[0].date).getDay() : 0;
  const statusOf = (d: { date: string; status: DayStatus }): DayStatus => overrides[d.date] ?? d.status;

  function toggle(d: { date: string; status: DayStatus }) {
    const s = statusOf(d);
    if (s === "booked" || s === "external") return;
    setSelected((prev) => (prev.includes(d.date) ? prev.filter((x) => x !== d.date) : [...prev, d.date]));
  }
  function apply(status: DayStatus) {
    setOverrides((o) => ({ ...o, ...Object.fromEntries(selected.map((d) => [d, status])) }));
    status === "blocked" ? api.blockDates(unit.id, selected) : api.unblockDates(unit.id, selected);
    setSelected([]);
  }
  const selectedDays = selected.map((d) => new Date(d).getDate()).sort((a, b) => a - b).join(", ");

  return (
    <Modal open onClose={onClose} size="lg" title={p.calendarTitle(unit.name)}>
      <p className="mb-4 text-sm text-ink-muted">{p.clickDatesHint}</p>
      <div className="grid grid-cols-7 gap-2">
        {t.calendar.weekdays.map((d) => (
          <div key={d} className="pb-1 text-center text-xs font-medium text-ink-faint">{d.slice(0, 2)}</div>
        ))}
        {Array.from({ length: firstWeekday }).map((_, i) => (
          <div key={`pad-${i}`} />
        ))}
        {days.map((d) => {
          const s = statusOf(d);
          const isSel = selected.includes(d.date);
          const clickable = s !== "booked" && s !== "external";
          return (
            <button
              key={d.date}
              onClick={() => toggle(d)}
              disabled={!clickable}
              className={cn(
                "grid aspect-square place-items-center rounded-2xl text-sm font-semibold transition",
                isSel ? "bg-amber-500 text-white" : dayColors[s],
                !clickable && "cursor-default",
              )}
            >
              {new Date(d.date).getDate()}
            </button>
          );
        })}
      </div>

      {selected.length > 0 ? (
        <div className="mt-5 rounded-2xl bg-brand-soft/60 p-4">
          <div className="mb-3 text-sm font-semibold text-ink">{p.datesSelected(selected.length, selectedDays)}</div>
          <div className="flex gap-2">
            <button onClick={() => setSelected([])} className="flex-1 rounded-full border border-line bg-white py-2 text-sm font-semibold text-ink hover:bg-cream">
              {t.calendar.clear}
            </button>
            <button onClick={() => apply("blocked")} className="flex-1 rounded-full bg-status-rejected py-2 text-sm font-semibold text-white hover:brightness-95">
              {p.blockDates}
            </button>
            <button onClick={() => apply("available")} className="flex-1 rounded-full bg-brand-dark py-2 text-sm font-semibold text-white hover:brightness-110">
              {t.calendar.makeAvailable}
            </button>
          </div>
        </div>
      ) : (
        <button onClick={onClose} className="mt-5 w-full rounded-full border border-line py-2.5 text-sm font-semibold text-ink hover:bg-cream">
          {t.common.close}
        </button>
      )}
    </Modal>
  );
}

/* ---------------- Analytics ---------------- */
function AnalyticsModal({ unit, onClose }: { unit: Unit; onClose: () => void }) {
  const { t, locale } = useLocale();
  const p = t.pm;
  const occ = unit.occupancy ?? 80;
  const nightsBooked = Math.round((occ / 100) * 26);
  const revenue = unit.pricePerNight * nightsBooked;
  const bookings = Math.max(1, Math.round(nightsBooked / 4));
  const series = [0.7, 0.82, 0.76, 0.9, 0.85, 1].map((f, i) => ({ i, v: Math.round(revenue * f) }));

  return (
    <Modal
      open
      onClose={onClose}
      size="lg"
      title={p.analyticsTitle(unit.name)}
      footer={<Button variant="outline" className="flex-1" onClick={onClose}>{t.common.close}</Button>}
    >
      <div className="grid grid-cols-2 gap-4">
        <KpiTile label={t.overview.totalRevenue} value={<MoneyText amount={revenue} />} />
        <KpiTile label={t.overview.totalBookings} value={<span dir="ltr">{bookings}</span>} />
        <KpiTile label={p.occupancyRate} value={`${occ}%`} />
        <KpiTile label={t.overview.guestRating} value={`${(unit.rating ?? 0).toFixed(1)} ★`} />
      </div>
      <div className="mt-4 rounded-2xl bg-cream/50 p-4">
        <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-faint">{t.overview.revenueOverview}</div>
        <div dir="ltr" className="h-28">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={series}>
              <Bar dataKey="v" fill="#1F4A3C" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <p className="sr-only">{locale}</p>
    </Modal>
  );
}
function KpiTile({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-brand-soft/60 px-4 py-4">
      <div className="text-xs text-ink-muted">{label}</div>
      <div dir="ltr" className="mt-1 text-2xl font-bold tabular-nums text-ink text-start">{value}</div>
    </div>
  );
}

/* ---------------- Share ---------------- */
function ShareModal({ unit, onClose }: { unit: Unit; onClose: () => void }) {
  const { t, locale } = useLocale();
  const p = t.pm;
  const [copied, setCopied] = useState(false);
  const url = `https://${BRAND.domain}/property/${unit.code}`;

  function copy() {
    navigator.clipboard?.writeText(url).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <Modal open onClose={onClose} size="md" title={p.shareTitle}>
      <div className="relative h-44 overflow-hidden rounded-2xl bg-cream-dark">
        {unit.photos[0] ? <Image src={unit.photos[0].url} alt="" fill className="object-cover" /> : <div className="grid h-full place-items-center"><Building2 className="h-8 w-8 text-ink-faint" /></div>}
      </div>
      <h3 className="mt-4 font-bold text-ink">{unit.name}</h3>
      <p className="text-sm text-ink-muted">{loc(unit, locale)}</p>
      <div className="mt-4">
        <div className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-ink-faint">{p.listingUrl}</div>
        <div className="flex items-center gap-2 rounded-xl border border-line bg-cream/40 px-3 py-2">
          <Link2 className="h-4 w-4 shrink-0 text-ink-faint" />
          <span dir="ltr" className="flex-1 truncate text-sm text-ink-muted">{url}</span>
          <button onClick={copy} className="inline-flex items-center gap-1.5 rounded-lg bg-brand-dark px-3 py-1.5 text-xs font-semibold text-white hover:brightness-110">
            {copied ? <><Check className="h-3.5 w-3.5" /> {t.common.copied}</> : <><Link2 className="h-3.5 w-3.5" /> {p.copy}</>}
          </button>
        </div>
      </div>
    </Modal>
  );
}
