"use client";

import Link from "next/link";
import Image from "next/image";
import { useParams } from "next/navigation";
import { api } from "@/lib/api/client";
import { useAsync } from "@/lib/use-async";
import { useLocale } from "@/stores/locale-store";
import { POLICY_REGISTRY } from "@/lib/constants";
import { Card, Button } from "@/components/ui";
import { UnitBadge } from "@/components/shared/status-badge";
import { MoneyText, DateText } from "@/components/shared/typed-text";
import { LoadingSkeleton, ErrorState } from "@/components/shared/states";
import { AlertTriangle, CalendarDays, ExternalLink, Link2, RefreshCw } from "lucide-react";

export default function UnitDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { t, locale } = useLocale();
  const { data: u, loading, error, reload } = useAsync(() => api.getUnit(id), [id]);

  if (loading) return <LoadingSkeleton rows={4} />;
  if (error || !u) return <ErrorState onRetry={reload} />;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-ink">{u.name}</h1>
          <p className="text-sm text-ink-muted">
            {t.propertyType[u.type]} · {u.code} · آخر تحديث <DateText iso={u.updatedAt} />
          </p>
        </div>
        <UnitBadge status={u.status} />
      </div>

      {u.status === "rejected" && u.rejectionReason && (
        <Card className="border-status-rejected/30 bg-status-rejected/5 p-5">
          <div className="mb-2 flex items-center gap-2 font-semibold text-status-rejected">
            <AlertTriangle className="h-5 w-5" /> سبب الرفض
          </div>
          <p className="text-sm text-ink">{u.rejectionReason}</p>
          <Link href={`/units/${u.id}/edit`}>
            <Button className="mt-4">
              <RefreshCw className="h-4 w-4" /> تعديل وإعادة إرسال
            </Button>
          </Link>
        </Card>
      )}

      {u.status === "approved" && (
        <div className="flex flex-wrap gap-2">
          <Button variant="outline">
            <ExternalLink className="h-4 w-4" /> عرض في الموقع
          </Button>
          <Button variant="outline">
            <Link2 className="h-4 w-4" /> نسخ الرابط
          </Button>
          <Link href={`/calendar?unit=${u.id}`}>
            <Button variant="outline">
              <CalendarDays className="h-4 w-4" /> التقويم
            </Button>
          </Link>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {u.photos.map((p) => (
          <div key={p.id} className="relative aspect-[4/3] overflow-hidden rounded-card bg-line">
            <Image src={p.url} alt={u.name} fill className="object-cover" />
          </div>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card className="p-5">
          <h3 className="mb-3 font-semibold text-ink">البيانات</h3>
          <dl className="space-y-2 text-sm">
            <Row label="السعر / ليلة" value={<MoneyText amount={u.pricePerNight} />} />
            <Row label="غرف النوم" value={`${u.bedrooms}`} />
            <Row label="الأسرّة" value={`${u.beds ?? 0}`} />
            <Row label="دورات المياه" value={`${u.bathrooms ?? 0}`} />
            <Row label="السعة" value={`${u.capacity} أشخاص`} />
            <Row label="المدينة / الحي" value={`${u.city} · ${u.district}`} />
            <Row label="الوصول / المغادرة" value={`${u.checkIn} — ${u.checkOut}`} />
          </dl>
        </Card>
        <Card className="p-5">
          <h3 className="mb-3 font-semibold text-ink">الترخيص</h3>
          <dl className="space-y-2 text-sm">
            <Row label="رقم التصريح السياحي" value={u.tourismLicenseNumber || "—"} />
            <Row label="الإحداثيات" value={`${u.lat}, ${u.lng}`} />
            <Row label="العنوان" value={u.address} />
          </dl>
          <p className="mt-4 text-sm text-ink-muted">{u.description}</p>
        </Card>

        <Card className="p-5 lg:col-span-2">
          <h3 className="mb-3 font-semibold text-ink">سياسة الإلغاء</h3>
          <div className="flex items-center justify-between">
            <span className="font-bold text-ink">
              {locale === "ar" ? POLICY_REGISTRY[u.cancellationPolicy].labelAr : POLICY_REGISTRY[u.cancellationPolicy].labelEn}
            </span>
            <span className="text-xs text-ink-muted">
              {locale === "ar" ? POLICY_REGISTRY[u.cancellationPolicy].descriptionAr : POLICY_REGISTRY[u.cancellationPolicy].descriptionEn}
            </span>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2 text-center">
            {POLICY_REGISTRY[u.cancellationPolicy].tiers.map((tier) => (
              <div key={tier.minDaysBeforeCheckIn} className="rounded-2xl bg-cream/60 px-3 py-2">
                <div className="text-lg font-bold text-ink">{tier.refundPercent}%</div>
                <div className="text-xs text-ink-muted">{locale === "ar" ? tier.labelAr : tier.labelEn}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-ink-muted">{label}</dt>
      <dd className="font-medium text-ink">{value}</dd>
    </div>
  );
}
