"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale } from "@/stores/locale-store";
import { useAsync } from "@/lib/use-async";
import { api } from "@/lib/api/client";
import { cn } from "@/lib/cn";
import {
  LayoutGrid,
  Building2,
  CalendarDays,
  BookOpen,
  BarChart3,
  Bell,
  User,
  Home,
  LogOut,
} from "lucide-react";

const items = [
  { href: "/overview", key: "overview", icon: LayoutGrid },
  { href: "/units", key: "units", icon: Building2 },
  { href: "/calendar", key: "calendar", icon: CalendarDays },
  { href: "/bookings", key: "bookings", icon: BookOpen },
  { href: "/reports", key: "reports", icon: BarChart3 },
  { href: "/notifications", key: "notifications", icon: Bell },
  { href: "/account", key: "account", icon: User },
] as const;

export function Sidebar({ mobileOpen, onClose }: { mobileOpen?: boolean; onClose?: () => void }) {
  const pathname = usePathname();
  const { t } = useLocale();
  const partner = useAsync(() => api.getPartner());
  const bookings = useAsync(() => api.listBookings());
  const notifications = useAsync(() => api.listNotifications());
  const [signingOut, setSigningOut] = useState(false);

  /**
   * POST /auth/logout invalidates the server session + clears the cookie, then a
   * hard replace drops the client router cache so Back can't restore a live view.
   */
  async function logout() {
    if (signingOut) return;
    setSigningOut(true);
    try {
      await api.logout();
    } catch {
      // Session may already be dead — still leave the dashboard.
    }
    window.location.replace("/login");
  }

  const badges: Partial<Record<(typeof items)[number]["key"], number>> = {
    bookings: (bookings.data ?? []).filter((b) => b.status !== "cancelled").length,
    notifications: (notifications.data ?? []).filter((n) => !n.read).length,
  };

  const name = partner.data?.name ?? t.brand;
  const initials = name.split(" ").slice(0, 2).map((w) => w[0]).join("");

  const panel = (
    <div className="flex h-full flex-col rounded-3xl bg-brand-dark p-4 text-white">
      <div className="mb-6 flex items-center gap-3 px-1 pt-1">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-white/10">
          <Home className="h-5 w-5" />
        </div>
        <div>
          <div className="font-bold">{t.brand}</div>
          <div className="text-xs text-white/60">{t.dashboardTag}</div>
        </div>
      </div>

      <nav className="flex-1 space-y-1">
        {items.map(({ href, key, icon: Icon }) => {
          const active = pathname.startsWith(href);
          const count = badges[key];
          return (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              className={cn(
                "relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
                active ? "bg-white/12 text-white" : "text-white/70 hover:bg-white/8 hover:text-white",
              )}
            >
              {active && <span className="absolute inset-y-2 start-0 w-1 rounded-full bg-white/80" />}
              <Icon className="h-5 w-5" />
              <span className="flex-1">{t.nav[key]}</span>
              {count ? (
                <span className="grid h-5 min-w-5 place-items-center rounded-full bg-white px-1.5 text-xs font-bold text-brand-dark tabular-nums">
                  {count}
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>

      <div className="mt-2 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-2.5">
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand-light text-sm font-bold">
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold">{name}</div>
          <div className="text-xs text-white/60">{t.overview.proPartner}</div>
        </div>
        <button
          onClick={logout}
          disabled={signingOut}
          className="rounded-lg p-1.5 text-white/70 transition hover:bg-white/10 hover:text-white disabled:opacity-50"
          aria-label={t.nav.logout}
          title={t.nav.logout}
        >
          <LogOut className={cn("h-4 w-4", signingOut && "animate-pulse")} />
        </button>
      </div>
    </div>
  );

  return (
    <>
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 p-3 md:block">{panel}</aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-ink/40" onClick={onClose} />
          <div className="absolute inset-y-0 start-0 h-full w-64 p-3">{panel}</div>
        </div>
      )}
    </>
  );
}
