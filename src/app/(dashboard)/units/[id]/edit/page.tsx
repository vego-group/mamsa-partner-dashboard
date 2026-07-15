"use client";

import { useParams } from "next/navigation";
import { api } from "@/lib/api/client";
import { useAsync } from "@/lib/use-async";
import { LoadingSkeleton, ErrorState } from "@/components/shared/states";
import { PropertyWizard } from "@/features/units/components/property-wizard";

export default function EditUnitPage() {
  const { id } = useParams<{ id: string }>();
  const { data, loading, error, reload } = useAsync(() => api.getUnit(id), [id]);

  if (loading) return <LoadingSkeleton rows={5} />;
  if (error || !data) return <ErrorState onRetry={reload} />;

  // `key` forces a fresh wizard instance if the unit id changes.
  return <PropertyWizard key={data.id} existing={data} />;
}
