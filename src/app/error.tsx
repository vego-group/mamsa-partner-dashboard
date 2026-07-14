"use client";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="grid min-h-screen place-items-center bg-cream p-6 text-center">
      <div>
        <div className="font-display text-6xl font-bold text-status-rejected">500</div>
        <h1 className="mt-2 text-xl font-bold text-ink">خطأ في الخادم</h1>
        <p className="mt-1 text-sm text-ink-muted">نعمل على إصلاحه. حاول مرة أخرى.</p>
        <button
          onClick={reset}
          className="mt-6 rounded-field bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark"
        >
          إعادة المحاولة
        </button>
      </div>
    </div>
  );
}
