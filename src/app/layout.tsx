import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "مَمسَى — لوحة الشركاء",
  description: "Mamsa Partner Dashboard",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // Default to Arabic RTL (primary). The language toggle updates these at runtime.
  return (
    <html lang="ar" dir="rtl">
      <body>{children}</body>
    </html>
  );
}
