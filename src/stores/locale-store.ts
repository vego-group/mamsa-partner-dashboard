"use client";

import { create } from "zustand";
import { dict, type Locale, type Dict } from "@/lib/i18n";

interface LocaleState {
  locale: Locale;
  t: Dict;
  dir: "rtl" | "ltr";
  toggle: () => void;
  setLocale: (l: Locale) => void;
}

/** Arabic is the primary (default) locale. */
export const useLocale = create<LocaleState>((set, get) => ({
  locale: "ar",
  t: dict.ar,
  dir: dict.ar.dir,
  toggle: () => {
    const next: Locale = get().locale === "ar" ? "en" : "ar";
    set({ locale: next, t: dict[next], dir: dict[next].dir });
    if (typeof document !== "undefined") {
      document.documentElement.lang = next;
      document.documentElement.dir = dict[next].dir;
    }
  },
  setLocale: (l) => {
    set({ locale: l, t: dict[l], dir: dict[l].dir });
    if (typeof document !== "undefined") {
      document.documentElement.lang = l;
      document.documentElement.dir = dict[l].dir;
    }
  },
}));
