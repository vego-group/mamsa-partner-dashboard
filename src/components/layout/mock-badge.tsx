import { IS_MOCK, shouldShowMockBadge } from "@/lib/env";

/**
 * A small persistent badge whenever the mock is answering, dev builds only.
 * Nobody should be able to look at the screen and not know which data they
 * are seeing — a "verified against staging" claim made with this badge on
 * the screen is the mock's answer, not the server's.
 *
 * Rendered from the root layout so it covers the login page too, and kept
 * outside the i18n store so it works before any client state exists.
 */
export function MockBadge() {
  if (!shouldShowMockBadge(process.env.NODE_ENV, IS_MOCK)) return null;
  return (
    <div
      role="status"
      dir="ltr"
      className="pointer-events-none fixed bottom-3 start-3 z-[100] rounded-full bg-status-pending px-3 py-1 text-xs font-bold uppercase tracking-wide text-white shadow-card"
    >
      Mock data · بيانات تجريبية
    </div>
  );
}
