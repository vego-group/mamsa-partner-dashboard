"use client";

import { LanguageToggle } from "./language-toggle";
import { useLocale } from "@/stores/locale-store";
import { useAsync } from "@/lib/use-async";
import { api } from "@/lib/api/client";
import { Bell, Menu, Plus, Search } from "lucide-react";
import Link from "next/link";

export function Header({ onMenu }: { onMenu?: () => void }) {
  const { t } = useLocale();
  const partner = useAsync(() => api.getPartner());
  const notifications = useAsync(() => api.listNotifications());

  const name = partner.data?.name ?? t.brand;
  const initials = name.split(" ").slice(0, 2).map((w) => w[0]).join("");
  const unread = (notifications.data ?? []).some((n) => !n.read);

  return (
    <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-line bg-cream/80 px-4 py-3 backdrop-blur sm:px-6">
      <button
        onClick={onMenu}
        className="rounded-lg p-2 text-ink hover:bg-white md:hidden"
        aria-label="menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      <div className="relative hidden flex-1 sm:block">
        <Search className="pointer-events-none absolute inset-y-0 my-auto ms-3 h-4 w-4 text-ink-faint" />
        <input
          className="w-full max-w-md rounded-full border border-line bg-white py-2 ps-9 pe-4 text-sm outline-none placeholder:text-ink-faint focus:border-brand"
          placeholder={t.overview.searchPlaceholder}
        />
      </div>

      <div className="ms-auto flex items-center gap-2">
        <LanguageToggle />
        <Link
          href="/units/new"
          className="inline-flex items-center gap-1.5 rounded-full bg-brand px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-brand-dark"
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">{t.overview.newBtn}</span>
        </Link>
        <Link
          href="/notifications"
          className="relative rounded-full border border-line bg-white p-2 text-ink hover:bg-cream"
          aria-label={t.nav.notifications}
        >
          <Bell className="h-4 w-4" />
          {unread && <span className="absolute end-1.5 top-1.5 h-2 w-2 rounded-full bg-status-rejected" />}
        </Link>
        <div className="grid h-9 w-9 place-items-center rounded-full bg-brand text-sm font-bold text-white">
          {initials}
        </div>
      </div>
    </header>
  );
}
