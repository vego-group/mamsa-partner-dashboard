"use client";

import { useLocale } from "@/stores/locale-store";
import { Globe } from "lucide-react";

export function LanguageToggle() {
  const { t, toggle } = useLocale();
  return (
    <button
      onClick={toggle}
      className="inline-flex items-center gap-1.5 rounded-field border border-line bg-white px-3 py-1.5 text-sm font-medium text-ink hover:bg-cream"
    >
      <Globe className="h-4 w-4" />
      {t.common.language}
    </button>
  );
}
