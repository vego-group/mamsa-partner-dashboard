"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useLocale } from "@/stores/locale-store";
import { api, type OtpResult } from "@/lib/api/client";
import { Button } from "@/components/ui";
import { OTP, PHONE_PREFIX } from "@/lib/constants";
import { LanguageToggle } from "@/components/layout/language-toggle";
import { Home, MapPin } from "lucide-react";

type Step = "phone" | "otp";

export default function LoginPage() {
  const { t, dir } = useLocale();
  const router = useRouter();
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [digits, setDigits] = useState<string[]>(Array(OTP.length).fill(""));
  const [error, setError] = useState<string>();
  const [notice, setNotice] = useState<string>();
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (dir) document.documentElement.dir = dir;
  }, [dir]);

  useEffect(() => {
    if (countdown <= 0) return;
    const id = setInterval(() => setCountdown((c) => c - 1), 1000);
    return () => clearInterval(id);
  }, [countdown]);

  function mapError(res: OtpResult) {
    switch (res.reason) {
      case "wrong_number":
        return setError(t.login.errWrongNumber);
      case "wrong_code":
        return setError(t.login.errWrongCode);
      case "expired":
        return setError(t.login.errExpired);
      case "locked":
        return setError(t.login.errLocked);
      case "rate_limited":
        return setError(t.login.errRateLimited);
      case "pending":
        return setNotice(t.login.pending);
      case "suspended":
        return setNotice(t.login.suspended);
    }
  }

  async function sendOtp() {
    setError(undefined);
    setNotice(undefined);
    setLoading(true);
    const res = await api.requestOtp(phone);
    setLoading(false);
    if (!res.ok) return mapError(res);
    setStep("otp");
    setCountdown(OTP.resendCountdown);
  }

  async function verify() {
    setError(undefined);
    const code = digits.join("");
    if (code.length !== OTP.length) return;
    setLoading(true);
    const res = await api.verifyOtp(phone, code);
    setLoading(false);
    if (!res.ok) return mapError(res);
    router.push("/overview");
  }

  function onDigit(i: number, v: string) {
    const clean = v.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[i] = clean;
    setDigits(next);
    if (clean && i < OTP.length - 1) inputs.current[i + 1]?.focus();
  }

  const year = new Date().getFullYear();
  const submitButton = "rounded-2xl py-4 text-base shadow-[0_10px_28px_rgba(31,74,60,0.28)]";

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Brand panel — full-bleed photography */}
      <div className="relative hidden overflow-hidden lg:block">
        <Image
          src="/dashboard-login.jpg"
          alt=""
          fill
          priority
          sizes="(min-width: 1024px) 50vw, 0px"
          className="object-cover"
        />
        {/* Keep the photo bright up top; darken only where text sits */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-black/30 to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-3/5 bg-gradient-to-t from-black/70 via-black/25 to-transparent" />

        <div className="relative flex h-full flex-col justify-between p-12 text-white">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-xl border border-white/20 bg-white/15 backdrop-blur">
              <Home className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="text-lg font-bold">{t.brand}</div>
              <div className="text-sm text-white/70">{t.dashboardTag}</div>
            </div>
          </div>

          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-white/10 px-3 py-1.5 text-xs backdrop-blur">
              <MapPin className="h-3.5 w-3.5" />
              {t.login.heroBadge}
            </span>
            <h1 className="mt-5 text-5xl font-bold leading-[1.05] tracking-tight">
              {t.login.heroTitleLine1}
              <br />
              {t.login.heroTitleLine2}
            </h1>
            <p className="mt-5 max-w-md text-white/80">{t.login.heroSubtitle}</p>

            <div className="mt-8 grid grid-cols-3 gap-3">
              <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-4 backdrop-blur-md">
                <div dir="ltr" className="text-xl font-bold tabular-nums">{t.login.statProperties}</div>
                <div className="mt-0.5 text-xs text-white/70">{t.login.statPropertiesLabel}</div>
              </div>
              <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-4 backdrop-blur-md">
                <div dir="ltr" className="text-xl font-bold tabular-nums">{t.login.statPartners}</div>
                <div className="mt-0.5 text-xs text-white/70">{t.login.statPartnersLabel}</div>
              </div>
              <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-4 backdrop-blur-md">
                <div dir="ltr" className="text-xl font-bold tabular-nums">{t.login.statRevenue}</div>
                <div className="mt-0.5 text-xs text-white/70">{t.login.statRevenueLabel}</div>
              </div>
            </div>

            <div className="mt-7 flex items-center gap-1.5">
              <span className="h-1.5 w-7 rounded-full bg-white" />
              <span className="h-1.5 w-1.5 rounded-full bg-white/40" />
              <span className="h-1.5 w-1.5 rounded-full bg-white/40" />
            </div>
          </div>
        </div>
      </div>

      {/* Form panel */}
      <div className="relative flex flex-col justify-center bg-cream px-6 py-10 sm:px-10 lg:px-12">
        <div className="absolute end-6 top-6 lg:end-8 lg:top-8">
          <LanguageToggle />
        </div>

        <div className="mx-auto w-full max-w-md rounded-3xl bg-white p-8 shadow-modal sm:p-10">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand">
            {t.login.portal}
          </p>

          {step === "phone" ? (
            <>
              <h2 className="mt-2 text-3xl font-bold text-ink">{t.login.welcome}</h2>
              <p className="mt-2 text-ink-muted">{t.login.subtitle}</p>

              <div className="my-8 flex items-center gap-6">
                <span className="h-px flex-1 bg-line" />
                <span className="h-px flex-1 bg-line" />
              </div>

              <label className="mb-2 block text-sm font-semibold text-ink">
                {t.login.phoneLabel}
              </label>
              <div
                dir="ltr"
                className="flex items-stretch overflow-hidden rounded-2xl border border-line bg-white transition focus-within:border-brand focus-within:ring-4 focus-within:ring-brand/10"
              >
                <span className="flex items-center gap-2 border-r border-line bg-cream/50 px-4 text-sm font-semibold text-ink">
                  <span aria-hidden className="text-base">🇸🇦</span>
                  {PHONE_PREFIX}
                </span>
                <input
                  dir="ltr"
                  inputMode="numeric"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 9))}
                  placeholder="5X XXX XXXX"
                  className="w-full bg-transparent px-4 py-4 text-base tracking-wide outline-none placeholder:text-ink-faint"
                />
              </div>

              {error && <p className="mt-3 text-sm text-status-rejected">{error}</p>}

              <Button
                full
                className={`mt-6 ${submitButton}`}
                onClick={sendOtp}
                disabled={loading || phone.length < 9}
              >
                {t.login.sendOtp}
              </Button>
            </>
          ) : (
            <>
              <h2 className="mt-2 text-3xl font-bold text-ink">{t.login.verifyTitle}</h2>
              <p className="mt-2 text-ink-muted">
                {t.login.otpSent}{" "}
                <span className="font-semibold text-ink">{PHONE_PREFIX} {phone}</span>
              </p>

              <div className="my-8 flex items-center gap-6">
                <span className="h-px flex-1 bg-line" />
                <span className="h-px flex-1 bg-line" />
              </div>

              <div dir="ltr" className="flex justify-center gap-2.5">
                {digits.map((d, i) => (
                  <input
                    key={i}
                    ref={(el) => {
                      inputs.current[i] = el;
                    }}
                    value={d}
                    onChange={(e) => onDigit(i, e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Backspace" && !digits[i] && i > 0)
                        inputs.current[i - 1]?.focus();
                    }}
                    inputMode="numeric"
                    maxLength={1}
                    className="h-14 w-14 rounded-full border-2 border-line bg-cream/40 text-center text-xl font-semibold text-ink outline-none transition focus:border-brand focus:bg-white focus:ring-4 focus:ring-brand/10"
                  />
                ))}
              </div>

              {error && <p className="mt-3 text-center text-sm text-status-rejected">{error}</p>}

              <Button
                full
                className={`mt-7 ${submitButton}`}
                onClick={verify}
                disabled={loading || digits.join("").length < OTP.length}
              >
                {t.login.verify}
              </Button>

              {countdown > 0 ? (
                <p className="mt-5 text-center text-sm text-ink-muted">
                  {t.login.resendIn(countdown)}
                </p>
              ) : (
                <button
                  onClick={sendOtp}
                  className="mt-5 block w-full text-center text-sm font-semibold text-ink hover:text-brand"
                >
                  {t.login.resend}
                </button>
              )}

              <button
                onClick={() => {
                  setStep("phone");
                  setDigits(Array(OTP.length).fill(""));
                  setError(undefined);
                }}
                className="mx-auto mt-3 block text-center text-sm font-medium text-brand hover:underline"
              >
                {t.login.changeNumber}
              </button>
            </>
          )}

          {notice && (
            <div className="mt-6 rounded-2xl bg-status-pending/10 px-4 py-3 text-sm text-status-pending">
              {notice}
            </div>
          )}

          <p className="mt-8 text-center text-xs text-ink-faint">
            © {year} {t.brand} · {t.login.privacy} · {t.login.terms}
          </p>
        </div>
      </div>
    </div>
  );
}
