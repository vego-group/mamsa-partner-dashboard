"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/api/client";
import { useAsync } from "@/lib/use-async";
import { useLocale } from "@/stores/locale-store";
import { Button, Modal } from "@/components/ui";
import { CardGridSkeleton, EmptyState, ErrorState } from "@/components/shared/states";
import { SAUDI_CITIES, POLICY_REGISTRY } from "@/lib/constants";
import type { Locale } from "@/lib/i18n";
import type { Unit, UnitStatus } from "@/types";
import { PropertyModal, type PropertyModalType } from "@/features/units/components/property-modals";
import {
  Plus,
  Eye,
  Pencil,
  CalendarDays,
  BarChart3,
  Share2,
  RefreshCw,
  Trash2,
  MapPin,
  Star,
  MoreHorizontal,
  Building2,
  Loader2,
} from "lucide-react";

const FILTERS: (UnitStatus | "all")[] = ["all", "approved", "pending", "rejected", "draft"];

export default function UnitsPage() {
  const { t, locale } = useLocale();
  const router = useRouter();
  const { data, loading, error, reload } = useAsync(() => api.listUnits());
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("all");

  const all = data ?? [];
  const list = all.filter((u) => filter === "all" || u.status === filter);
  const approvedCount = all.filter((u) => u.status === "approved").length;
  const [modal, setModal] = useState<{ type: PropertyModalType; unit: Unit } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Unit | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string>();

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError(undefined);
    try {
      await api.deleteUnit(deleteTarget.id);
      setDeleteTarget(null);
      reload();
    } catch (e) {
      setDeleteError(e instanceof ApiError ? e.message : t.states.errorBody);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink">{t.nav.units}</h1>
          <p className="mt-0.5 text-sm text-ink-muted">
            {t.units.totalApproved(all.length, approvedCount)}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex flex-wrap items-center gap-1 rounded-full bg-white p-1 shadow-card">
            {FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                  filter === f ? "bg-brand text-white shadow-sm" : "text-ink-muted hover:text-ink"
                }`}
              >
                {f === "all" ? t.common.all : t.unitStatus[f]}
              </button>
            ))}
          </div>
          <Link href="/units/new">
            <Button className="rounded-full">
              <Plus className="h-4 w-4" /> {t.units.newProperty}
            </Button>
          </Link>
        </div>
      </div>

      {loading ? (
        <CardGridSkeleton />
      ) : error ? (
        <ErrorState onRetry={reload} />
      ) : list.length === 0 ? (
        <EmptyState
          title={t.units.emptyTitle}
          body={t.units.emptyBody}
          action={
            <Link href="/units/new">
              <Button>
                <Plus className="h-4 w-4" /> {t.units.newProperty}
              </Button>
            </Link>
          }
        />
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {list.map((u) => (
            <PropertyCard
              key={u.id}
              unit={u}
              locale={locale}
              onAction={(type) => setModal({ type, unit: u })}
              onEdit={() => router.push(`/units/${u.id}/edit`)}
              onDelete={() => {
                setDeleteError(undefined);
                setDeleteTarget(u);
              }}
            />
          ))}
        </div>
      )}

      {modal && <PropertyModal type={modal.type} unit={modal.unit} onClose={() => setModal(null)} />}

      <Modal
        open={Boolean(deleteTarget)}
        onClose={() => !deleting && setDeleteTarget(null)}
        title={t.units.deleteTitle}
        size="sm"
        footer={
          <>
            <Button variant="outline" className="flex-1" onClick={() => setDeleteTarget(null)} disabled={deleting}>
              {t.common.cancel}
            </Button>
            <Button variant="danger" className="flex-1" onClick={confirmDelete} disabled={deleting}>
              {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              {deleting ? t.units.deleting : t.common.delete}
            </Button>
          </>
        }
      >
        <p className="text-sm text-ink-muted">{t.units.deleteConfirm(deleteTarget?.name ?? "")}</p>
        {deleteError && <p className="mt-3 text-sm text-status-rejected">{deleteError}</p>}
      </Modal>
    </div>
  );
}

/* ---------------- Property card ---------------- */
function PropertyCard({
  unit: u,
  locale,
  onAction,
  onEdit,
  onDelete,
}: {
  unit: Unit;
  locale: Locale;
  onAction: (type: PropertyModalType) => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { t } = useLocale();
  const cur = locale === "ar" ? "ر.س" : "SAR";
  const cover = u.photos[0]?.url;

  return (
    <div className="group overflow-hidden rounded-3xl bg-white shadow-card transition hover:shadow-modal">
      <div className="relative h-48 bg-cream-dark">
        {cover ? (
          <Image src={cover} alt={u.name} fill className="object-cover" />
        ) : (
          <div className="grid h-full place-items-center text-ink-faint">
            <Building2 className="h-8 w-8" />
          </div>
        )}

        {/* lifecycle status + cancellation policy badges */}
        <div className="absolute start-3 top-3 flex flex-wrap gap-2">
          <OverlayBadge tone={u.status}>{t.unitStatus[u.status]}</OverlayBadge>
          <OverlayBadge tone={u.cancellationPolicy}>
            {locale === "ar" ? POLICY_REGISTRY[u.cancellationPolicy].labelAr : POLICY_REGISTRY[u.cancellationPolicy].labelEn}
          </OverlayBadge>
        </div>

        {/* menu */}
        <button
          onClick={() => onAction("preview")}
          className="absolute end-3 top-3 grid h-8 w-8 place-items-center rounded-full bg-white/90 text-ink-muted backdrop-blur transition hover:bg-white"
          aria-label="menu"
        >
          <MoreHorizontal className="h-4 w-4" />
        </button>

        {/* rating */}
        {u.rating != null && (
          <>
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/55 to-transparent" />
            <div className="absolute bottom-3 start-3 flex items-center gap-1.5 text-sm font-semibold text-white">
              <Star className="h-4 w-4 fill-status-pending text-status-pending" />
              <span className="tabular-nums">{u.rating.toFixed(1)}</span>
              {u.reviewsCount != null && <span className="font-normal text-white/70">({u.reviewsCount})</span>}
            </div>
          </>
        )}
      </div>

      <div className="p-5">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-bold text-ink">{u.name}</h3>
          <span className="shrink-0 text-xs text-ink-faint">{u.code}</span>
        </div>
        <p className="mt-1 flex items-center gap-1 text-sm text-ink-muted">
          <MapPin className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">{location(u, locale)}</span>
        </p>

        <div className="mt-4">
          {u.pricePerNight > 0 ? (
            <>
              <div className="flex items-baseline gap-1">
                <span className="text-sm font-semibold text-ink-muted">{cur}</span>
                <span className="text-2xl font-bold tabular-nums text-ink">
                  {u.pricePerNight.toLocaleString("en-US")}
                </span>
              </div>
              <div className="text-xs text-ink-muted">{t.units.perNight}</div>
            </>
          ) : (
            <span className="text-lg text-ink-faint">—</span>
          )}
        </div>

        {u.status === "rejected" && u.rejectionReason && (
          <p className="mt-3 rounded-2xl bg-status-rejected/8 px-3 py-2 text-xs text-status-rejected">
            {u.rejectionReason}
          </p>
        )}

        <div className="mt-4 flex items-center gap-2 border-t border-line pt-4">
          <UnitActions status={u.status} onAction={onAction} onEdit={onEdit} onDelete={onDelete} />
        </div>
      </div>
    </div>
  );
}

/* ---------------- Overlay badge (over photo) ---------------- */
const badgeTone: Record<string, string> = {
  draft: "text-status-draft",
  pending: "text-status-pending",
  approved: "text-status-approved",
  rejected: "text-status-rejected",
  available: "text-status-approved",
  booked: "text-brand",
  blocked: "text-status-draft",
  flexible: "text-status-approved",
  moderate: "text-status-pending",
  strict: "text-status-rejected",
};

function OverlayBadge({ tone, children }: { tone: string; children: React.ReactNode }) {
  return (
    <span
      className={`inline-flex items-center rounded-full bg-white/95 px-2.5 py-0.5 text-xs font-semibold backdrop-blur ${badgeTone[tone] ?? "text-ink"}`}
    >
      {children}
    </span>
  );
}

/* ---------------- Actions (state-aware, §7) ---------------- */
function UnitActions({
  status,
  onAction,
  onEdit,
  onDelete,
}: {
  status: UnitStatus;
  onAction: (type: PropertyModalType) => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const iconBtn =
    "grid h-9 w-9 place-items-center rounded-full bg-cream text-ink-muted transition hover:bg-brand-soft hover:text-brand";

  if (status === "draft") {
    return (
      <>
        <button onClick={onEdit} className={iconBtn} title="edit">
          <Pencil className="h-4 w-4" />
        </button>
        <button onClick={onDelete} className={`${iconBtn} hover:bg-status-rejected/10 hover:text-status-rejected`} title="delete">
          <Trash2 className="h-4 w-4" />
        </button>
      </>
    );
  }
  if (status === "pending") {
    return (
      <button onClick={() => onAction("preview")} className={iconBtn} title="view">
        <Eye className="h-4 w-4" />
      </button>
    );
  }
  if (status === "rejected") {
    return (
      <>
        <button onClick={() => onAction("preview")} className={iconBtn} title="view">
          <Eye className="h-4 w-4" />
        </button>
        <button onClick={onEdit} className={iconBtn} title="resubmit">
          <RefreshCw className="h-4 w-4" />
        </button>
      </>
    );
  }
  // approved
  return (
    <>
      <button onClick={() => onAction("preview")} className={iconBtn} title="view">
        <Eye className="h-4 w-4" />
      </button>
      <button onClick={onEdit} className={iconBtn} title="edit">
        <Pencil className="h-4 w-4" />
      </button>
      <button onClick={() => onAction("calendar")} className={iconBtn} title="calendar">
        <CalendarDays className="h-4 w-4" />
      </button>
      <button onClick={() => onAction("analytics")} className={iconBtn} title="analytics">
        <BarChart3 className="h-4 w-4" />
      </button>
      <button onClick={() => onAction("share")} className={iconBtn} title="share">
        <Share2 className="h-4 w-4" />
      </button>
    </>
  );
}

function location(u: Unit, locale: Locale): string {
  const city = SAUDI_CITIES.find((c) => c.value === u.city);
  const cityLabel = city ? city[locale] : u.city;
  const sep = locale === "ar" ? "، " : ", ";
  return [u.district, cityLabel].filter(Boolean).join(sep);
}
