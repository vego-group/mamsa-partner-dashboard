"use client";

import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { useLocale } from "@/stores/locale-store";
import { useEffect, useState } from "react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { dir, locale } = useLocale();
  const [navOpen, setNavOpen] = useState(false);

  // Keep <html> in sync with the store (handles refresh + toggle).
  useEffect(() => {
    document.documentElement.dir = dir;
    document.documentElement.lang = locale;
  }, [dir, locale]);

  // Back/forward-cache (bfcache) guard. Logout does a hard navigation to
  // /login, but pressing "back" from there can restore a *previous* dashboard
  // history entry (e.g. /units) straight from bfcache — an instant, unauthenticated
  // paint of stale content before anything re-checks the session.
  //
  // Cache-Control: no-store (next.config.mjs) is NOT enough by itself: since
  // ~Chrome 109 and in current Safari/Firefox, browsers bfcache no-store pages
  // anyway. The reliable cross-browser signal that still disqualifies a page
  // from bfcache is an `unload` listener — so this one is intentional (not a
  // real cleanup handler) purely to force that exclusion for these authenticated
  // routes. The `pageshow` reload stays as a fallback for the rare case a
  // browser bfcaches it regardless.
  useEffect(() => {
    function noop() {}
    window.addEventListener("unload", noop);
    return () => window.removeEventListener("unload", noop);
  }, []);

  useEffect(() => {
    function onPageShow(e: PageTransitionEvent) {
      if (e.persisted) window.location.reload();
    }
    window.addEventListener("pageshow", onPageShow);
    return () => window.removeEventListener("pageshow", onPageShow);
  }, []);

  return (
    <div className="flex min-h-screen bg-cream">
      <Sidebar mobileOpen={navOpen} onClose={() => setNavOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header onMenu={() => setNavOpen(true)} />
        <main className="flex-1 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
