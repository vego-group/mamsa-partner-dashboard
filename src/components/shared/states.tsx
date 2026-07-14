"use client";

import { cn } from "@/lib/cn";
import { useLocale } from "@/stores/locale-store";
import { AlertTriangle, Inbox } from "lucide-react";

export function EmptyState({
  title,
  body,
  action,
  icon,
}: {
  title: string;
  body?: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-card border border-line bg-white px-6 py-16 text-center">
      <div className="mb-4 grid h-14 w-14 place-items-center rounded-full bg-brand-soft text-brand">
        {icon ?? <Inbox className="h-6 w-6" />}
      </div>
      <h3 className="text-lg font-semibold text-ink">{title}</h3>
      {body && <p className="mt-1 max-w-sm text-sm text-ink-muted">{body}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

export function ErrorState({ onRetry }: { onRetry?: () => void }) {
  const { t } = useLocale();
  return (
    <div className="flex flex-col items-center justify-center rounded-card border border-status-rejected/25 bg-status-rejected/5 px-6 py-16 text-center">
      <div className="mb-4 grid h-14 w-14 place-items-center rounded-full bg-status-rejected/15 text-status-rejected">
        <AlertTriangle className="h-6 w-6" />
      </div>
      <h3 className="text-lg font-semibold text-ink">{t.states.errorTitle}</h3>
      <p className="mt-1 max-w-sm text-sm text-ink-muted">{t.states.errorBody}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-6 rounded-field bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark"
        >
          {t.common.retry}
        </button>
      )}
    </div>
  );
}

export function LoadingSkeleton({ rows = 5, className }: { rows?: number; className?: string }) {
  return (
    <div className={cn("space-y-3", className)}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-16 animate-pulse rounded-card bg-line/60" />
      ))}
    </div>
  );
}

export function CardGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="h-72 animate-pulse rounded-card bg-line/60" />
      ))}
    </div>
  );
}
