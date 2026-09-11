"use client";

import { useId, useState } from "react";
import { Building2, Plus } from "lucide-react";
import { Modal, Button, Card, Input } from "@/components/ui";
import { useLocale } from "@/stores/locale-store";
import { api } from "@/lib/api/client";
import { cn } from "@/lib/cn";
import {
  canExpandBuilding,
  expansionErrorMessage,
  expansionPlanLine,
  expansionResultMessage,
  groupSizeOf,
  planExpansion,
} from "@/features/units/lib/building";
import type { BuildingExpansion, Unit } from "@/types";

/**
 * FE-7 — the building's state and the only way a partner has to grow it.
 *
 * Shown when the unit is already a building (`groupSize > 1`) or could become
 * one (a tourist facility licence). An unclassified standalone unit — what
 * nearly every older unit looks like — gets one quiet line pointing at the
 * licence type, since classifying is the way in. A standalone unit on a
 * private licence renders nothing: the answer there is a definite no.
 */
export function BuildingCard({ unit, onChange }: { unit: Unit; onChange: (u: Unit) => void }) {
  const { t } = useLocale();
  const b = t.building;
  const [open, setOpen] = useState(false);

  const current = groupSizeOf(unit);
  const isBuilding = current > 1;
  const expandable = canExpandBuilding(unit);
  const unclassified = unit.licenseType == null;
  if (!isBuilding && !expandable && !unclassified) return null;

  const licensed = unit.licensedUnitsCount ?? null;
  // Every larger total would be a licence rejection — say so instead of offering a dead button.
  const capReached = expandable && licensed != null && licensed <= current;

  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-brand-soft/60 text-brand">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-semibold text-ink">{b.title}</h3>
            {isBuilding ? (
              <p className="text-sm text-ink">
                {b.summary(current)}
                {licensed != null && <span className="text-ink-muted"> · {b.licensedSummary(current, licensed)}</span>}
              </p>
            ) : (
              licensed != null && <p className="text-sm text-ink-muted">{b.licensedSummary(current, licensed)}</p>
            )}
          </div>
        </div>

        {!expandable ? (
          <p className="text-sm text-ink-muted">{!isBuilding && unclassified ? b.classifyFirst : b.requiresFacility}</p>
        ) : capReached ? (
          <p className="text-sm text-ink-muted">{b.capReached(licensed)}</p>
        ) : (
          <Button variant="outline" onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" /> {b.addApartments}
          </Button>
        )}
      </div>

      {open && (
        <ExpandBuildingModal
          unit={unit}
          onClose={() => setOpen(false)}
          onExpanded={(res) => onChange({ ...unit, groupSize: res.groupSize })}
        />
      )}
    </Card>
  );
}

/**
 * One number field. Its value is the building's TOTAL afterwards — the likely
 * misreading is "how many to add", so the label, the hint and the live line
 * all say the same thing from three sides. Only a `grow` plan ever sends a
 * request; every other plan disables the button with its own sentence.
 */
export function ExpandBuildingModal({
  unit,
  onClose,
  onExpanded,
}: {
  unit: Unit;
  onClose: () => void;
  onExpanded: (result: BuildingExpansion) => void;
}) {
  const { t } = useLocale();
  const b = t.building;
  const inputId = useId();
  const current = groupSizeOf(unit);
  const licensed = unit.licensedUnitsCount ?? null;

  const [raw, setRaw] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [fieldError, setFieldError] = useState<string>();
  const [formError, setFormError] = useState<string>();
  const [result, setResult] = useState<BuildingExpansion>();

  const plan = planExpansion({ current, target: raw, licensed });
  const target = Number(raw);
  const line = expansionPlanLine(plan, current, target, b);
  const blocked = plan.kind !== "grow" && plan.kind !== "empty";
  const canSubmit = plan.kind === "grow" && !submitting;

  async function submit() {
    if (!canSubmit) return;
    setSubmitting(true);
    setFieldError(undefined);
    setFormError(undefined);
    try {
      const res = await api.expandBuilding(unit.id, target);
      setResult(res);
      onExpanded(res);
    } catch (e) {
      // A 400 is about the body and lands on the field; a 422 is about the permit and lands on the form.
      const err = expansionErrorMessage(e, t);
      if (err.scope === "field") setFieldError(err.text);
      else setFormError(err.text);
    } finally {
      setSubmitting(false);
    }
  }

  if (result) {
    return (
      <Modal open onClose={onClose} size="sm" title={b.dialogTitle} footer={<Button onClick={onClose}>{t.common.close}</Button>}>
        <p role="status" className="text-sm font-medium text-ink">
          {expansionResultMessage(result, b)}
        </p>
      </Modal>
    );
  }

  return (
    <Modal
      open
      onClose={onClose}
      size="sm"
      title={b.dialogTitle}
      subtitle={b.dialogSub}
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            {t.common.cancel}
          </Button>
          <Button onClick={submit} disabled={!canSubmit}>
            {submitting ? b.submitting : b.submit}
          </Button>
        </>
      }
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
      >
        <label htmlFor={inputId} className="mb-1.5 block text-sm font-medium text-ink">
          {b.totalLabel}
        </label>
        <Input
          id={inputId}
          type="number"
          inputMode="numeric"
          min={current + 1}
          max={licensed ?? undefined}
          step={1}
          dir="ltr"
          placeholder={String(current + 1)}
          value={raw}
          onChange={(e) => {
            setRaw(e.target.value);
            setFieldError(undefined);
            setFormError(undefined);
          }}
          aria-describedby={`${inputId}-line`}
          aria-invalid={blocked || !!fieldError}
          autoFocus
        />
        <p className="mt-1 text-xs text-ink-muted">{b.totalHint}</p>
        <p
          id={`${inputId}-line`}
          data-testid="expansion-line"
          className={cn("mt-3 text-sm", blocked || fieldError ? "text-status-rejected" : "font-medium text-ink")}
        >
          {fieldError ?? line}
        </p>
        {formError && (
          <p role="alert" className="mt-3 rounded-2xl bg-status-rejected/5 px-3 py-2 text-sm text-status-rejected">
            {formError}
          </p>
        )}
      </form>
    </Modal>
  );
}
