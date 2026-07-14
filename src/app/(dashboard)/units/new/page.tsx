"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useLocale } from "@/stores/locale-store";
import { SAUDI_CITIES, SAUDI_BOUNDS } from "@/lib/constants";
import { cn } from "@/lib/cn";
import type { AccountType, PropertyType, Amenity } from "@/types";
import {
  X,
  Check,
  User,
  Building2,
  Upload,
  MapPin,
  Minus,
  Plus,
  Save,
  ChevronLeft,
  ChevronRight,
  Info,
  Wifi,
  Wind,
  UtensilsCrossed,
  Car,
  Waves,
  ShieldCheck,
  KeyRound,
  Users,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";

const TIMES = [8, 6, 3, 4, 1];
const PIN = { lat: SAUDI_BOUNDS.center.lat, lng: SAUDI_BOUNDS.center.lng };
const SAMPLE_PHOTO =
  "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop&auto=format";

const AMENITIES: { key: Amenity; icon: typeof Wifi }[] = [
  { key: "wifi", icon: Wifi },
  { key: "ac", icon: Wind },
  { key: "kitchen", icon: UtensilsCrossed },
  { key: "parking", icon: Car },
  { key: "pool", icon: Waves },
  { key: "security", icon: ShieldCheck },
  { key: "self_checkin", icon: KeyRound },
  { key: "family_friendly", icon: Users },
];

export default function NewUnitPage() {
  const router = useRouter();
  const { t, locale } = useLocale();
  const w = t.wiz;

  const [step, setStep] = useState(0);
  const [done, setDone] = useState(false);

  // Step 1
  const [accountType, setAccountType] = useState<AccountType>("individual");
  const [licenseNo, setLicenseNo] = useState("");
  const [tourismFile, setTourismFile] = useState(false);
  const [nationalId, setNationalId] = useState("");
  const [companyReg, setCompanyReg] = useState("");
  const [companyIban, setCompanyIban] = useState("");
  const [companyAddress, setCompanyAddress] = useState("");
  const [companyPhone, setCompanyPhone] = useState("");
  const [companyDocs, setCompanyDocs] = useState<Record<string, boolean>>({});

  // Step 2
  const [name, setName] = useState("");
  const [type, setType] = useState<PropertyType | "">("");
  const [price, setPrice] = useState("");
  const [bedrooms, setBedrooms] = useState(1);
  const [guests, setGuests] = useState(2);
  const [city, setCity] = useState("");
  const [district, setDistrict] = useState("");
  const [description, setDescription] = useState("");
  const [amenities, setAmenities] = useState<Amenity[]>([]);

  // Step 3 / 4
  const [address, setAddress] = useState("");
  const [pinned, setPinned] = useState(false);
  const [photos, setPhotos] = useState<string[]>([]);

  const identityOk =
    accountType === "individual"
      ? nationalId.trim().length > 0
      : companyReg.trim() && companyIban.trim() && companyAddress.trim();

  const stepValid = [
    licenseNo.trim().length > 0 && Boolean(identityOk),
    name.trim() && type && Number(price) > 0 && city && description.trim().length > 0,
    pinned,
    photos.length >= 1,
    true,
  ][step];

  const cityLabel = SAUDI_CITIES.find((c) => c.value === city)?.[locale] ?? city;

  function toggleAmenity(a: Amenity) {
    setAmenities((prev) => (prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]));
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#F6F7F4]">
      {/* Top bar */}
      <header className="shrink-0 border-b border-line bg-white">
        <div className="flex items-center gap-3 px-4 py-4 sm:px-8">
          <button
            onClick={() => router.push("/units")}
            className="grid h-8 w-8 place-items-center rounded-lg text-ink-muted hover:bg-cream"
            aria-label="close"
          >
            <X className="h-5 w-5" />
          </button>
          <h1 className="text-lg font-bold text-ink">{w.addNewProperty}</h1>
          <span className="rounded-full bg-cream-dark px-2.5 py-0.5 text-xs font-semibold text-ink-muted">
            {w.draft}
          </span>
          <div className="ms-auto text-end text-xs leading-tight text-ink-muted">
            <div>{w.stepOf(step + 1, 5)}</div>
            <div>{w.minEstimate(TIMES[step])}</div>
          </div>
        </div>
        <div className="h-0.5 w-full bg-line">
          <div className="h-full bg-brand transition-all" style={{ width: `${((step + 1) / 5) * 100}%` }} />
        </div>
        <div className="px-4 py-4 sm:px-8">
          <StepRail current={step} labels={w.steps} />
        </div>
      </header>

      {/* Scrollable content */}
      <main className="flex-1 overflow-y-auto px-4 py-8 sm:px-6">
        <div className="mx-auto max-w-2xl space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-ink">{[w.s1Title, w.s2Title, w.s3Title, w.s4Title, w.s5Title][step]}</h2>
            <p className="mt-1 text-ink-muted">{[w.s1Sub, w.s2Sub, w.s3Sub, w.s4Sub, w.s5Sub][step]}</p>
          </div>

          {/* STEP 1 — License */}
          {step === 0 && (
            <>
              <Section label={w.accountType}>
                <div className="grid grid-cols-2 gap-4">
                  {(["individual", "company"] as const).map((at) => {
                    const active = accountType === at;
                    const Icon = at === "individual" ? User : Building2;
                    return (
                      <button
                        key={at}
                        onClick={() => setAccountType(at)}
                        className={cn(
                          "flex flex-col items-center gap-3 rounded-2xl border-2 px-4 py-6 text-sm font-semibold transition",
                          active ? "border-brand bg-brand-soft text-ink" : "border-line bg-white text-ink-muted hover:border-line",
                        )}
                      >
                        <Icon className="h-6 w-6" />
                        {at === "individual" ? w.individual : w.company}
                        {active && (
                          <span className="grid h-6 w-6 place-items-center rounded-full bg-brand text-white">
                            <Check className="h-3.5 w-3.5" />
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </Section>

              <Section label={w.tourismLicense}>
                <FieldLabel required info>{w.tourismLicenseNo}</FieldLabel>
                <TextInput value={licenseNo} onChange={setLicenseNo} placeholder="TL-2025-XXXXX" dir="ltr" />
                <div className="mt-4">
                  <UploadRow
                    title={w.uploadTourismLicense}
                    subtitle={w.pdfMax10}
                    clickHint={w.clickToUpload}
                    fileName="tourism-license-2025.pdf"
                    uploaded={tourismFile}
                    onToggle={() => setTourismFile((v) => !v)}
                  />
                </div>
              </Section>

              {accountType === "individual" ? (
                <Section label={w.identityVerification}>
                  <FieldLabel required info>{w.nationalId}</FieldLabel>
                  <TextInput value={nationalId} onChange={setNationalId} placeholder="1XXXXXXXXX" dir="ltr" />
                </Section>
              ) : (
                <Section label={w.companyDetails}>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <FieldLabel required>{w.commercialReg}</FieldLabel>
                      <TextInput value={companyReg} onChange={setCompanyReg} placeholder="10XXXXXXXX" dir="ltr" />
                    </div>
                    <div>
                      <FieldLabel required>{w.companyIban}</FieldLabel>
                      <TextInput value={companyIban} onChange={setCompanyIban} placeholder="SA XX XXXX XXXX" dir="ltr" />
                    </div>
                  </div>
                  <div className="mt-4">
                    <FieldLabel required>{w.companyAddress}</FieldLabel>
                    <TextInput value={companyAddress} onChange={setCompanyAddress} placeholder={w.companyAddressPh} />
                  </div>
                  <div className="mt-4">
                    <FieldLabel>{w.companyPhone}</FieldLabel>
                    <TextInput value={companyPhone} onChange={setCompanyPhone} placeholder="+966 XX XXX XXXX" dir="ltr" />
                  </div>
                  <div className="mt-4 space-y-3">
                    {[
                      { key: "reg", title: w.commercialRegPdf, sub: w.commercialRegPdfSub, file: "commercial-registration.pdf" },
                      { key: "rep", title: w.repAuthLetter, sub: w.repAuthLetterSub },
                      { key: "vat", title: w.vatCert, sub: w.vatCertSub, optional: true },
                      { key: "hosp", title: w.hospitalityLicense, sub: w.hospitalityLicenseSub, optional: true },
                    ].map((doc) => (
                      <UploadRow
                        key={doc.key}
                        title={doc.title}
                        subtitle={doc.sub}
                        optional={doc.optional ? w.optional : undefined}
                        clickHint={w.clickToUpload}
                        fileName={doc.file}
                        uploaded={!!companyDocs[doc.key]}
                        onToggle={() => setCompanyDocs((d) => ({ ...d, [doc.key]: !d[doc.key] }))}
                      />
                    ))}
                  </div>
                </Section>
              )}
            </>
          )}

          {/* STEP 2 — Details */}
          {step === 1 && (
            <>
              <Section label={w.basicInfo}>
                <FieldLabel required info>{w.propertyName}</FieldLabel>
                <TextInput value={name} onChange={setName} placeholder={w.propertyNamePh} />
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div>
                    <FieldLabel required>{w.propertyTypeLabel}</FieldLabel>
                    <SelectInput value={type} onChange={(v) => setType(v as PropertyType)} placeholder={w.selectPh}
                      options={(["apartment", "studio", "villa"] as const).map((v) => ({ value: v, label: t.propertyType[v] }))} />
                  </div>
                  <div>
                    <FieldLabel required>{w.nightPrice}</FieldLabel>
                    <TextInput value={price} onChange={setPrice} placeholder="0" dir="ltr" type="number" />
                  </div>
                </div>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <Stepper label={w.bedrooms} value={bedrooms} onChange={setBedrooms} min={0} />
                  <Stepper label={w.guests} value={guests} onChange={setGuests} min={1} />
                </div>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div>
                    <FieldLabel required>{w.city}</FieldLabel>
                    <SelectInput value={city} onChange={setCity} placeholder={w.selectPh}
                      options={SAUDI_CITIES.map((c) => ({ value: c.value, label: c.en }))} localizedOptions={SAUDI_CITIES} />
                  </div>
                  <div>
                    <FieldLabel>{w.district}</FieldLabel>
                    <TextInput value={district} onChange={setDistrict} placeholder={w.districtPh} />
                  </div>
                </div>
              </Section>

              <Section label={w.description}>
                <div className="flex items-center justify-between">
                  <FieldLabel required>{w.propertyDescription}</FieldLabel>
                  <span className="text-xs text-ink-faint tabular-nums">{description.length}/500</span>
                </div>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value.slice(0, 500))}
                  rows={4}
                  placeholder={w.descriptionPh}
                  className="w-full rounded-2xl border border-line bg-cream/40 px-4 py-3 text-sm outline-none focus:border-brand focus:bg-white"
                />
              </Section>

              <Section label={w.amenities}>
                <div className="flex flex-wrap gap-2.5">
                  {AMENITIES.map(({ key, icon: Icon }) => {
                    const active = amenities.includes(key);
                    return (
                      <button
                        key={key}
                        onClick={() => toggleAmenity(key)}
                        className={cn(
                          "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition",
                          active ? "border-brand bg-brand-soft text-ink" : "border-line bg-white text-ink-muted hover:bg-cream",
                        )}
                      >
                        <Icon className="h-4 w-4" />
                        {t.amenity[key]}
                        {active && <Check className="h-3.5 w-3.5 text-brand" />}
                      </button>
                    );
                  })}
                </div>
                <p className="mt-3 text-xs text-ink-faint">{w.amenitiesSelected(amenities.length)}</p>
              </Section>

              <Section label={w.checkInOut}>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <FieldLabel>{w.checkInTime}</FieldLabel>
                    <TextInput defaultValue="15:00" type="time" dir="ltr" />
                  </div>
                  <div>
                    <FieldLabel>{w.checkOutTime}</FieldLabel>
                    <TextInput defaultValue="12:00" type="time" dir="ltr" />
                  </div>
                </div>
              </Section>
            </>
          )}

          {/* STEP 3 — Location */}
          {step === 2 && (
            <>
              <Section label={w.searchAddress}>
                <FieldLabel required>{w.fullAddress}</FieldLabel>
                <TextInput value={address} onChange={(v) => { setAddress(v); if (!v) setPinned(false); }} placeholder={w.fullAddressPh} />
                {address.trim() && (
                  <button
                    onClick={() => setPinned(true)}
                    className={cn(
                      "mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border-2 py-3 text-sm font-semibold transition",
                      pinned ? "border-brand bg-brand-soft text-brand" : "border-brand text-brand hover:bg-brand-soft",
                    )}
                  >
                    {pinned ? <Check className="h-4 w-4" /> : <MapPin className="h-4 w-4" />}
                    {pinned ? w.locationPinned : w.pinOnMap}
                  </button>
                )}
              </Section>

              <MapBox pinned={pinned} pinLabel={pinned ? w.locationPinned : w.enterAddressToPin} subLabel={pinned ? `${PIN.lat}° N, ${PIN.lng}° E` : w.saudiOnly} />

              {pinned && (
                <div className="flex items-start gap-3 rounded-2xl bg-brand-soft px-4 py-4">
                  <Check className="mt-0.5 h-5 w-5 text-brand" />
                  <div>
                    <div className="font-bold text-ink">{w.locationConfirmed}</div>
                    <div className="text-sm text-ink-muted">{w.saudiArabia}</div>
                    <div dir="ltr" className="text-xs text-ink-faint">Lat {PIN.lat} · Lng {PIN.lng}</div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* STEP 4 — Photos */}
          {step === 3 && (
            <>
              <button
                onClick={() => photos.length < 4 && setPhotos((p) => [...p, SAMPLE_PHOTO])}
                className="flex w-full flex-col items-center gap-2 rounded-3xl border-2 border-dashed border-line bg-white py-12 transition hover:border-brand"
              >
                <span className="grid h-14 w-14 place-items-center rounded-2xl bg-brand-soft text-brand">
                  <Upload className="h-6 w-6" />
                </span>
                <span className="mt-2 font-bold text-ink">{w.dragPhotos}</span>
                <span className="text-sm text-ink-muted">{w.pngJpgMax}</span>
                <span className="text-sm text-ink-faint">{w.uploadedCount(photos.length, 4)}</span>
              </button>

              {photos.length === 0 && (
                <div className="flex items-center gap-3 rounded-2xl border border-status-pending/40 bg-status-pending/10 px-4 py-3 text-sm text-status-pending">
                  <AlertTriangle className="h-5 w-5 shrink-0" />
                  {w.photoRequired}
                </div>
              )}

              {photos.length > 0 && (
                <div className="grid grid-cols-2 gap-4">
                  {photos.map((p, i) => (
                    <div key={i} className="group relative aspect-[4/3] overflow-hidden rounded-2xl bg-cream-dark">
                      <Image src={p} alt="" fill className="object-cover" />
                      {i === 0 && (
                        <span className="absolute start-3 top-3 rounded-lg bg-brand-dark px-2.5 py-1 text-xs font-semibold text-white">
                          {w.cover}
                        </span>
                      )}
                      <button
                        onClick={() => setPhotos((ps) => ps.filter((_, idx) => idx !== i))}
                        className="absolute end-3 top-3 grid h-7 w-7 place-items-center rounded-full bg-white/90 text-status-rejected opacity-0 shadow transition group-hover:opacity-100"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-start gap-2 rounded-2xl bg-brand-soft px-4 py-3 text-sm text-ink">
                <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                <span>{w.photoTip}</span>
              </div>
            </>
          )}

          {/* STEP 5 — Review */}
          {step === 4 && (
            <>
              <ReviewCard title={w.s1Title} onEdit={() => setStep(0)} editLabel={t.common.edit}>
                <ReviewRow label={w.licenseNo} value={licenseNo || "—"} />
                <ReviewRow label={w.accountType} value={accountType === "individual" ? w.individual : w.company} />
                <ReviewRow label={w.tourismLicense} value={tourismFile ? `${w.uploaded} ✓` : "—"} />
              </ReviewCard>

              <ReviewCard title={w.s2Title} onEdit={() => setStep(1)} editLabel={t.common.edit}>
                <ReviewRow label={w.name} value={name || "—"} />
                <ReviewRow label={w.typeLabel} value={type ? t.propertyType[type] : "—"} />
                <ReviewRow label={w.priceLabel} value={w.sarPerNight(price || "0")} />
                <ReviewRow label={w.city} value={cityLabel || "—"} />
                <ReviewRow label={w.capacity} value={w.bedGuest(bedrooms, guests)} />
                <ReviewRow label={w.amenities} value={w.amenitiesCount(amenities.length)} />
              </ReviewCard>

              <ReviewCard title={w.s3Title} onEdit={() => setStep(2)} editLabel={t.common.edit}>
                <ReviewRow label={w.address} value={address || "—"} />
                <ReviewRow label={w.coordinates} value={`${PIN.lat}, ${PIN.lng}`} />
              </ReviewCard>

              <ReviewCard title={w.s4Title} onEdit={() => setStep(3)} editLabel={t.common.edit}>
                <ReviewRow label={w.photosUploaded} value={w.photosCount(photos.length)} />
                <ReviewRow label={w.coverPhoto} value={photos.length ? w.photoN(1) : "—"} />
              </ReviewCard>

              {photos.length > 0 && (
                <div className="rounded-2xl bg-white p-5 shadow-card">
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="font-bold text-ink">{w.uploadedPhotos}</h3>
                    <button onClick={() => setStep(3)} className="text-sm font-semibold text-brand">{t.common.edit}</button>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {photos.map((p, i) => (
                      <div key={i} className="relative aspect-[3/4] overflow-hidden rounded-xl bg-cream-dark">
                        <Image src={p} alt="" fill className="object-cover" />
                        {i === 0 && (
                          <span className="absolute bottom-2 start-2 rounded-md bg-brand-dark px-2 py-0.5 text-xs font-semibold text-white">
                            {w.cover}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3 rounded-2xl bg-brand-soft px-4 py-3 text-sm font-medium text-brand">
                <CheckCircle2 className="h-5 w-5" />
                {w.allComplete}
              </div>
            </>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="shrink-0 border-t border-line bg-white px-4 py-4 sm:px-8">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3">
          <FooterBtn onClick={() => router.push("/units")} variant="outline">
            <Save className="h-4 w-4" /> {w.saveDraft}
          </FooterBtn>
          <div className="flex flex-wrap items-center gap-3">
            {!stepValid && <span className="hidden text-sm text-ink-muted sm:inline">{w.completeToContinue}</span>}
            {step > 0 && (
              <FooterBtn onClick={() => setStep((s) => s - 1)} variant="outline">
                <ChevronLeft className="h-4 w-4" /> {t.common.back}
              </FooterBtn>
            )}
            {step < 4 ? (
              <FooterBtn onClick={() => stepValid && setStep((s) => s + 1)} disabled={!stepValid}>
                {t.common.next} <ChevronRight className="h-4 w-4" />
              </FooterBtn>
            ) : (
              <>
                <FooterBtn onClick={() => router.push("/units")} variant="outline">{w.saveAsDraft}</FooterBtn>
                <FooterBtn onClick={() => setDone(true)}>
                  <CheckCircle2 className="h-4 w-4" /> {w.submitForReview}
                </FooterBtn>
              </>
            )}
          </div>
        </div>
      </footer>

      {done && (
        <div className="fixed inset-0 z-[60] grid place-items-center bg-ink/40 p-4">
          <div className="w-full max-w-sm rounded-3xl bg-white p-8 text-center shadow-modal">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-brand-soft text-brand">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <h2 className="mt-5 text-2xl font-bold text-ink">{w.submittedSuccessfully}</h2>
            <p className="mt-2 text-sm text-ink-muted">{w.submittedBody}</p>
            <button
              onClick={() => router.push("/units")}
              className="mt-6 w-full rounded-2xl bg-gradient-to-r from-brand-light to-brand-dark py-3.5 font-semibold text-white shadow-[0_10px_28px_rgba(31,74,60,0.28)]"
            >
              {w.backToProperties}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------------- Footer button ---------------- */
function FooterBtn({
  children,
  onClick,
  variant = "primary",
  disabled,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "primary" | "outline";
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-5 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed",
        variant === "primary"
          ? "bg-brand text-white hover:bg-brand-dark disabled:bg-brand/30"
          : "border border-line bg-white text-ink hover:bg-cream disabled:opacity-50",
      )}
    >
      {children}
    </button>
  );
}

/* ---------------- Step rail ---------------- */
function StepRail({ current, labels }: { current: number; labels: string[] }) {
  return (
    <div className="flex items-center">
      {labels.map((label, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <div key={label} className="flex flex-1 items-center last:flex-none">
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  "grid h-8 w-8 shrink-0 place-items-center rounded-full text-sm font-semibold transition",
                  done || active ? "bg-brand-dark text-white" : "bg-cream-dark text-ink-faint",
                )}
              >
                {done ? <Check className="h-4 w-4" /> : i + 1}
              </div>
              <span className={cn("whitespace-nowrap text-sm font-medium", active || done ? "text-ink" : "text-ink-faint")}>
                {label}
              </span>
            </div>
            {i < labels.length - 1 && (
              <div className={cn("mx-2 hidden h-px flex-1 sm:block", done ? "bg-brand" : "bg-line")} />
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ---------------- Section card ---------------- */
function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-card sm:p-6">
      <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-ink-faint">{label}</p>
      {children}
    </div>
  );
}

function FieldLabel({ children, required, info }: { children: React.ReactNode; required?: boolean; info?: boolean }) {
  return (
    <label className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-ink">
      {children}
      {required && <span className="text-status-rejected">*</span>}
      {info && <Info className="h-3.5 w-3.5 text-ink-faint" />}
    </label>
  );
}

const inputCls =
  "w-full rounded-2xl border border-line bg-cream/40 px-4 py-3 text-sm outline-none placeholder:text-ink-faint focus:border-brand focus:bg-white";

function TextInput({
  value,
  onChange,
  placeholder,
  dir,
  type,
  defaultValue,
}: {
  value?: string;
  onChange?: (v: string) => void;
  placeholder?: string;
  dir?: "ltr" | "rtl";
  type?: string;
  defaultValue?: string;
}) {
  return (
    <input
      value={value}
      defaultValue={defaultValue}
      onChange={onChange ? (e) => onChange(e.target.value) : undefined}
      placeholder={placeholder}
      dir={dir}
      type={type}
      className={inputCls}
    />
  );
}

function SelectInput({
  value,
  onChange,
  placeholder,
  options,
  localizedOptions,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  options: { value: string; label: string }[];
  localizedOptions?: readonly { value: string; ar: string; en: string }[];
}) {
  const { locale } = useLocale();
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} className={cn(inputCls, "appearance-none")}>
      <option value="">{placeholder}</option>
      {(localizedOptions
        ? localizedOptions.map((o) => ({ value: o.value, label: o[locale] }))
        : options
      ).map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

function Stepper({ label, value, onChange, min }: { label: string; value: number; onChange: (v: number) => void; min: number }) {
  const btn = "grid h-10 w-10 place-items-center rounded-full border border-line text-ink transition hover:bg-cream disabled:opacity-40";
  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <div className="flex items-center gap-3">
        <button onClick={() => onChange(Math.max(min, value - 1))} disabled={value <= min} className={btn}>
          <Minus className="h-4 w-4" />
        </button>
        <span className="w-8 text-center text-lg font-bold tabular-nums text-ink">{value}</span>
        <button onClick={() => onChange(value + 1)} className={btn}>
          <Plus className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function UploadRow({
  title,
  subtitle,
  optional,
  clickHint,
  fileName,
  uploaded,
  onToggle,
}: {
  title: string;
  subtitle?: string;
  optional?: string;
  clickHint?: string;
  fileName?: string;
  uploaded: boolean;
  onToggle: () => void;
}) {
  if (uploaded) {
    return (
      <div className="flex items-center gap-3 rounded-2xl border-2 border-brand bg-brand-soft px-4 py-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-dark text-white">
          <Check className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold text-ink">{title}</div>
          {fileName && <div className="truncate text-xs text-ink-muted">{fileName}</div>}
        </div>
        <button onClick={onToggle} className="text-status-rejected hover:opacity-70" aria-label="remove">
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }
  return (
    <button
      onClick={onToggle}
      className="flex w-full items-center justify-between gap-3 rounded-2xl border border-dashed border-line px-4 py-3 text-start transition hover:border-brand"
    >
      <div className="min-w-0">
        <div className="text-sm font-semibold text-ink">
          {title} {optional && <span className="font-normal text-ink-faint">({optional})</span>}
        </div>
        {subtitle && <div className="text-xs text-ink-muted">{subtitle}</div>}
        {clickHint && <div className="text-xs text-ink-faint">{clickHint}</div>}
      </div>
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-cream text-ink-muted">
        <Upload className="h-4 w-4" />
      </span>
    </button>
  );
}

function MapBox({ pinned, pinLabel, subLabel }: { pinned: boolean; pinLabel: string; subLabel: string }) {
  return (
    <div className="relative h-64 overflow-hidden rounded-2xl border border-line bg-[#e8ede6]">
      <div className="absolute inset-0 opacity-50 [background:repeating-linear-gradient(50deg,#cfd9cf_0,#cfd9cf_1.5px,transparent_1.5px,transparent_26px),repeating-linear-gradient(-40deg,#d7ddd3_0,#d7ddd3_1.5px,transparent_1.5px,transparent_34px)]" />
      <div className="absolute inset-0 grid place-items-center">
        {pinned ? (
          <div className="flex flex-col items-center gap-2">
            <span className="grid h-10 w-10 place-items-center rounded-full bg-brand-dark text-white shadow-lg">
              <MapPin className="h-5 w-5" />
            </span>
            <div className="rounded-xl bg-white px-4 py-2 text-center shadow-card">
              <div className="text-sm font-bold text-ink">{pinLabel}</div>
              <div dir="ltr" className="text-xs text-ink-muted">{subLabel}</div>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl bg-white px-6 py-4 text-center shadow-card">
            <MapPin className="mx-auto h-6 w-6 text-ink-muted" />
            <div className="mt-1 text-sm font-bold text-ink">{pinLabel}</div>
            <div className="text-xs text-ink-muted">{subLabel}</div>
          </div>
        )}
      </div>
    </div>
  );
}

function ReviewCard({
  title,
  onEdit,
  editLabel,
  children,
}: {
  title: string;
  onEdit: () => void;
  editLabel: string;
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-card">
      <div className="flex items-center justify-between px-5 py-4">
        <div className="flex items-center gap-3">
          <span className="grid h-8 w-8 place-items-center rounded-full bg-brand-dark text-white">
            <Check className="h-4 w-4" />
          </span>
          <h3 className="font-bold text-ink">{title}</h3>
        </div>
        <button onClick={onEdit} className="rounded-full border border-line px-4 py-1.5 text-sm font-semibold text-ink hover:bg-cream">
          {editLabel}
        </button>
      </div>
      <div className="grid grid-cols-2 gap-x-6 gap-y-4 border-t border-line px-5 py-4">{children}</div>
    </div>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-ink-faint">{label}</div>
      <div className="mt-0.5 font-semibold text-ink">{value}</div>
    </div>
  );
}
