import Link from "next/link";

export default function NotFound() {
  return (
    <div className="grid min-h-screen place-items-center bg-cream p-6 text-center">
      <div>
        <div className="font-display text-6xl font-bold text-brand">404</div>
        <h1 className="mt-2 text-xl font-bold text-ink">الصفحة غير موجودة</h1>
        <p className="mt-1 text-sm text-ink-muted">تأكد من الرابط أو عُد للرئيسية.</p>
        <Link
          href="/overview"
          className="mt-6 inline-block rounded-field bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark"
        >
          العودة للرئيسية
        </Link>
      </div>
    </div>
  );
}
