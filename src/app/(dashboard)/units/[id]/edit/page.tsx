"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api/client";
import { useAsync } from "@/lib/use-async";
import { Card, Button, Field, Input, Modal } from "@/components/ui";
import { UnitBadge } from "@/components/shared/status-badge";
import { LoadingSkeleton, ErrorState } from "@/components/shared/states";
import { SAUDI_CITIES } from "@/lib/constants";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function EditUnitPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: u, loading, error, reload } = useAsync(() => api.getUnit(id), [id]);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  if (loading) return <LoadingSkeleton rows={4} />;
  if (error || !u) return <ErrorState onRetry={reload} />;

  const isApproved = u.status === "approved";
  const isRejected = u.status === "rejected";

  async function save() {
    setSaving(true);
    await api.updateUnit(id, {});
    setSaving(false);
    router.push(`/units/${id}`);
  }

  function onSaveClick() {
    if (isApproved) setConfirmOpen(true);
    else save();
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink">تعديل الوحدة</h1>
          <p className="text-sm text-ink-muted">{u.name}</p>
        </div>
        <UnitBadge status={u.status} />
      </div>

      {isRejected && u.rejectionReason && (
        <Card className="border-status-rejected/30 bg-status-rejected/5 p-5">
          <div className="mb-2 flex items-center gap-2 font-semibold text-status-rejected">
            <AlertTriangle className="h-5 w-5" /> سبب الرفض
          </div>
          <p className="text-sm text-ink">{u.rejectionReason}</p>
        </Card>
      )}

      {isApproved && (
        <div className="rounded-card border border-status-pending/30 bg-status-pending/8 px-4 py-3 text-sm text-status-pending">
          تعديل وحدة معتمدة سيعيدها إلى «قيد الموافقة» وتُخفى من الموقع حتى تُراجع.
        </div>
      )}

      <Card className="space-y-5 p-6">
        <Field label="اسم الوحدة" required>
          <Input defaultValue={u.name} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="السعر لليلة (ر.س)" required>
            <Input dir="ltr" type="number" defaultValue={u.pricePerNight} />
          </Field>
          <Field label="المدينة" required>
            <select
              defaultValue={u.city}
              className="w-full rounded-field border border-line bg-cream/40 px-3.5 py-2.5 text-sm outline-none focus:border-brand"
            >
              {SAUDI_CITIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.ar}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <Field label="الوصف" required>
          <textarea
            rows={4}
            defaultValue={u.description}
            className="w-full rounded-field border border-line bg-cream/40 px-3.5 py-2.5 text-sm outline-none focus:border-brand"
          />
        </Field>
      </Card>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={() => router.back()}>
          إلغاء
        </Button>
        <Button onClick={onSaveClick} disabled={saving}>
          {isRejected ? (
            <>
              <RefreshCw className="h-4 w-4" /> إعادة الإرسال للمراجعة
            </>
          ) : (
            "حفظ التغييرات"
          )}
        </Button>
      </div>

      <Modal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="تأكيد التعديل"
        footer={
          <>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              تراجع
            </Button>
            <Button
              onClick={() => {
                setConfirmOpen(false);
                save();
              }}
            >
              متابعة الحفظ
            </Button>
          </>
        }
      >
        <p className="text-sm text-ink-muted">
          سيعيد هذا التعديل الوحدة إلى «قيد الموافقة» وستُخفى من الموقع حتى تتم مراجعتها من جديد.
        </p>
      </Modal>
    </div>
  );
}
