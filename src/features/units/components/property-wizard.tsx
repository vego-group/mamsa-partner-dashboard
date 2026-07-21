"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { api, ApiError } from "@/lib/api/client";
import { useAsync } from "@/lib/use-async";
import { useLocale } from "@/stores/locale-store";
import {
  SAUDI_CITIES,
  MAX_UPLOAD_MB,
  CANCELLATION_POLICIES,
  POLICY_REGISTRY,
  DEFAULT_CANCELLATION_POLICY,
  isCancellationPolicyName,
  type CancellationPolicyPreset,
} from "@/lib/constants";
import { cn } from "@/lib/cn";
import type { Locale } from "@/lib/i18n";
import type { Amenity, CancellationPolicyName, PropertyType, Unit, UnitCreateInput } from "@/types";
import { isInsideSaudi, type LatLng } from "@/features/units/lib/geo";
import { FileUploadRow, type UploadedFile } from "@/features/units/components/file-upload";
import {
  X,
  Check,
  User,
  Building2,
  Upload,
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
  Loader2,
} from "lucide-react";

const LocationPicker = dynamic(() => import("@/features/units/components/location-picker"), {
  ssr: false,
  loading: () => <div className="h-72 animate-pulse rounded-2xl bg-cream-dark" />,
});

const TIMES = [8, 6, 3, 4, 1];
const MAX_PHOTOS = 10;

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

interface PhotoItem {
  localId: string;
  previewUrl: string;
  fileName: string;
  fileId: string | null;
  uploading: boolean;
  error: string | null;
  /** True for photos already on the unit (remote URL) — don't revoke as a blob. */
  remote?: boolean;
}

function fileNameFromUrl(url: string): string {
  return url.split("/").pop()?.split("?")[0] || "photo";
}

/**
 * The full-screen add/edit-property flow. When `existing` is passed the wizard
 * runs in **edit mode**: state is pre-filled, the header reflects the current
 * status, and saving PATCHes the unit (editing an approved unit sends it back
 * to pending per §4) instead of creating a new draft.
 */
export function PropertyWizard({ existing }: { existing?: Unit }) {
  const router = useRouter();
  const { t, locale } = useLocale();
  const w = t.wiz;
  const editing = Boolean(existing);

  const partner = useAsync(() => api.getPartner());
  const isCompany = partner.data?.accountType === "company";
  const companyDocs = useAsync(
    () => (isCompany ? api.getCompanyDocs() : Promise.resolve(null)),
    [isCompany],
  );

  const [step, setStep] = useState(0);
  const [done, setDone] = useState(false);
  const [draftId, setDraftId] = useState<string | null>(existing?.id ?? null);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Step 1
  const [licenseNo, setLicenseNo] = useState(existing?.tourismLicenseNumber ?? "");
  const [tourismFile, setTourismFile] = useState<UploadedFile | null>(
    existing?.tourismLicenseFileId
      ? { fileId: existing.tourismLicenseFileId, fileName: existing.tourismLicenseNumber || "tourism-license.pdf" }
      : null,
  );

  // Step 2
  const [name, setName] = useState(existing?.name ?? "");
  const [type, setType] = useState<PropertyType | "">(existing?.type ?? "");
  const [price, setPrice] = useState(existing && existing.pricePerNight > 0 ? String(existing.pricePerNight) : "");
  const [bedrooms, setBedrooms] = useState(existing?.bedrooms ?? 1);
  const [beds, setBeds] = useState(existing?.beds ?? 1);
  const [bathrooms, setBathrooms] = useState(existing?.bathrooms ?? 1);
  const [guests, setGuests] = useState(existing?.capacity ?? 2);
  const [city, setCity] = useState(existing?.city ?? "");
  const [district, setDistrict] = useState(existing?.district ?? "");
  const [description, setDescription] = useState(existing?.description ?? "");
  const [amenities, setAmenities] = useState<Amenity[]>(existing?.amenities ?? []);
  const [checkInTime, setCheckInTime] = useState(existing?.checkIn ?? "15:00");
  const [checkOutTime, setCheckOutTime] = useState(existing?.checkOut ?? "12:00");
  const [cancellationPolicy, setCancellationPolicy] = useState<CancellationPolicyName>(
    existing?.cancellationPolicy ?? DEFAULT_CANCELLATION_POLICY,
  );

  // Step 3
  const [location, setLocation] = useState<LatLng | null>(
    existing && existing.lat !== 0 && existing.lng !== 0 ? { lat: existing.lat, lng: existing.lng } : null,
  );
  const [address, setAddress] = useState(existing?.address ?? "");

  // Step 4 — existing photos come in as already-uploaded (remote URLs)
  const [photos, setPhotos] = useState<PhotoItem[]>(
    (existing?.photos ?? []).map((ph) => ({
      localId: ph.id,
      previewUrl: ph.url,
      fileName: fileNameFromUrl(ph.url),
      fileId: ph.id,
      uploading: false,
      error: null,
      remote: true,
    })),
  );
  const [coverId, setCoverId] = useState<string | null>(
    existing?.photos.find((ph) => ph.isCover)?.id ?? existing?.photos[0]?.id ?? null,
  );

  useEffect(() => {
    // Only revoke object URLs we created (local previews), never remote unit photos.
    return () => photos.forEach((p) => !p.remote && URL.revokeObjectURL(p.previewUrl));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const identityOk = !partner.data
    ? false
    : partner.data.accountType === "individual"
      ? true // National ID is on file already (read-only, captured at registration)
      : Boolean(companyDocs.data?.complete);

  // Blocks navigation while any photo is still mid-upload — otherwise a slow
  // upload can silently drop out of `photoFileIds` if the user submits early.
  const anyPhotoUploading = photos.some((p) => p.uploading);

  const stepValid = [
    Boolean(partner.data) && !(isCompany && companyDocs.loading) && licenseNo.trim().length > 0 && Boolean(tourismFile) && identityOk,
    name.trim() && type && Number(price) > 0 && city && description.trim().length > 0 && isCancellationPolicyName(cancellationPolicy),
    Boolean(location) && isInsideSaudi(location ?? { lat: 0, lng: 0 }) && address.trim().length > 0,
    photos.some((p) => p.fileId) && !anyPhotoUploading,
    true,
  ][step];

  const cityLabel = SAUDI_CITIES.find((c) => c.value === city)?.[locale] ?? city;
  const policyLabel = locale === "ar" ? POLICY_REGISTRY[cancellationPolicy].labelAr : POLICY_REGISTRY[cancellationPolicy].labelEn;
  const coverPhoto = photos.find((p) => p.localId === coverId) ?? photos.find((p) => p.fileId);

  // Captured once on mount so edit mode can tell whether the partner actually
  // changed anything. Only matters for an already-approved unit: PATCHing it
  // flips it to pending even when the payload is byte-identical, so a true
  // no-op save on an approved unit must skip the API call entirely. Draft/
  // rejected units still submit normally on a no-op save — clicking "Submit
  // for Review" there is a deliberate status change, not an edit.
  const [initialInputSnapshot] = useState(() => JSON.stringify(buildInput()));
  const hasChanges = JSON.stringify(buildInput()) !== initialInputSnapshot;
  const isNoOpApprovedEdit = editing && existing?.status === "approved" && !hasChanges;

  function toggleAmenity(a: Amenity) {
    setAmenities((prev) => (prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]));
  }

  function buildInput(): UnitCreateInput {
    return {
      name: name || undefined,
      type: type || undefined,
      pricePerNight: Number(price) || undefined,
      cancellationPolicy,
      bedrooms,
      beds,
      bathrooms,
      capacity: guests,
      city: city || undefined,
      district: district || undefined,
      description: description || undefined,
      amenities,
      checkIn: checkInTime,
      checkOut: checkOutTime,
      lat: location?.lat,
      lng: location?.lng,
      address: address || undefined,
      tourismLicenseNumber: licenseNo || undefined,
      tourismLicenseFileId: tourismFile?.fileId,
      photoFileIds: photos.filter((p) => p.fileId).map((p) => p.fileId as string),
      coverFileId: coverPhoto?.fileId ?? undefined,
    };
  }

  /** Creates the draft on first save, PATCHes it afterwards. Returns the unit, or null on failure. */
  async function persistDraft(): Promise<Unit | null> {
    try {
      const unit = draftId ? await api.updateUnit(draftId, buildInput()) : await api.createUnit(buildInput());
      if (!draftId) setDraftId(unit.id);
      return unit;
    } catch (e) {
      setSubmitError(e instanceof ApiError ? e.message : w.submitError);
      return null;
    }
  }

  async function onSaveDraft() {
    if (isNoOpApprovedEdit) {
      // Nothing changed — closing is equivalent to saving, and skips a PATCH
      // that would otherwise needlessly flip an approved unit back to pending.
      router.push("/units");
      return;
    }
    setSaving(true);
    setSubmitError(null);
    const unit = await persistDraft();
    setSaving(false);
    if (unit) router.push("/units");
  }

  async function onSubmitForReview() {
    if (isNoOpApprovedEdit) {
      router.push("/units");
      return;
    }
    setSubmitting(true);
    setSubmitError(null);
    const unit = await persistDraft();
    if (!unit) {
      setSubmitting(false);
      return;
    }
    try {
      // draft/rejected need an explicit submit; editing an approved unit already
      // moved it to pending via the PATCH, so no separate submit call is needed.
      if (unit.status === "draft" || unit.status === "rejected") {
        await api.submitUnit(unit.id);
      }
      setDone(true);
    } catch (e) {
      setSubmitError(e instanceof ApiError ? e.message : w.submitError);
    } finally {
      setSubmitting(false);
    }
  }

  function onPickPhotos(files: FileList | null) {
    if (!files) return;
    const room = MAX_PHOTOS - photos.length;
    const picked = Array.from(files).slice(0, Math.max(0, room));
    for (const file of picked) {
      const localId = `${Date.now()}_${Math.random().toString(36).slice(2)}`;
      const previewUrl = URL.createObjectURL(file);
      setPhotos((prev) => [...prev, { localId, previewUrl, fileName: file.name, fileId: null, uploading: true, error: null }]);

      if (file.size > MAX_UPLOAD_MB * 1024 * 1024) {
        setPhotos((prev) =>
          prev.map((p) => (p.localId === localId ? { ...p, uploading: false, error: w.fileTooLarge(MAX_UPLOAD_MB) } : p)),
        );
        continue;
      }

      api
        .uploadFile("unit_photo", file)
        .then(({ fileId }) => {
          setPhotos((prev) => prev.map((p) => (p.localId === localId ? { ...p, fileId, uploading: false } : p)));
          setCoverId((cur) => cur ?? localId);
        })
        .catch(() => {
          setPhotos((prev) => prev.map((p) => (p.localId === localId ? { ...p, uploading: false, error: w.uploadFailed } : p)));
        });
    }
  }

  function removePhoto(localId: string) {
    setPhotos((prev) => {
      const target = prev.find((p) => p.localId === localId);
      if (target && !target.remote) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((p) => p.localId !== localId);
    });
    setCoverId((cur) => (cur === localId ? null : cur));
  }

  const partnerTypeLabel = partner.data
    ? partner.data.accountType === "individual"
      ? w.individual
      : w.company
    : "";

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
          <h1 className="text-lg font-bold text-ink">{editing ? w.editProperty : w.addNewProperty}</h1>
          <span className="rounded-full bg-cream-dark px-2.5 py-0.5 text-xs font-semibold text-ink-muted">
            {existing ? t.unitStatus[existing.status] : w.draft}
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

          {/* Approved-edit warning banner */}
          {editing && existing?.status === "approved" && hasChanges && (
            <div className="flex items-start gap-3 rounded-2xl border border-status-pending/40 bg-status-pending/10 px-4 py-3 text-sm text-status-pending">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
              {w.approvedEditWarning}
            </div>
          )}

          {/* STEP 1 — License */}
          {step === 0 && (
            <>
              {partner.loading ? (
                <div className="h-40 animate-pulse rounded-2xl bg-white shadow-card" />
              ) : (
                <>
                  <Section label={w.accountType}>
                    <div className="flex items-center gap-4 rounded-2xl border-2 border-brand bg-brand-soft px-5 py-4">
                      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-dark text-white">
                        {partner.data?.accountType === "individual" ? (
                          <User className="h-5 w-5" />
                        ) : (
                          <Building2 className="h-5 w-5" />
                        )}
                      </span>
                      <div>
                        <div className="font-bold text-ink">{partnerTypeLabel}</div>
                        <div className="text-xs text-ink-muted">{w.accountTypeFixedNote}</div>
                      </div>
                    </div>
                  </Section>

                  <Section label={w.tourismLicense}>
                    <FieldLabel required info>{w.tourismLicenseNo}</FieldLabel>
                    <TextInput value={licenseNo} onChange={setLicenseNo} placeholder="TL-2025-XXXXX" dir="ltr" />
                    <div className="mt-4">
                      <FileUploadRow
                        kind="license_pdf"
                        title={w.uploadTourismLicense}
                        subtitle={w.pdfMax10}
                        accept="application/pdf"
                        value={tourismFile}
                        onChange={setTourismFile}
                      />
                    </div>
                  </Section>

                  {partner.data?.accountType === "individual" ? (
                    <Section label={w.identityVerification}>
                      <FieldLabel info>{w.nationalId}</FieldLabel>
                      <div className="flex items-center gap-2 rounded-2xl border border-line bg-cream/60 px-4 py-3 text-sm text-ink-muted">
                        <span dir="ltr">{partner.data.verificationId}</span>
                        <Check className="ms-auto h-4 w-4 text-status-approved" />
                      </div>
                      <p className="mt-1.5 text-xs text-ink-faint">{w.verificationIdNote}</p>
                    </Section>
                  ) : (
                    <Section label={w.companyDetails}>
                      {companyDocs.loading ? (
                        <div className="h-16 animate-pulse rounded-2xl bg-cream" />
                      ) : companyDocs.data?.complete ? (
                        <div className="flex items-center gap-3 rounded-2xl border border-status-approved/30 bg-status-approved/5 px-4 py-3 text-sm text-status-approved">
                          <CheckCircle2 className="h-5 w-5 shrink-0" />
                          {w.companyDocsComplete}
                        </div>
                      ) : (
                        <div className="rounded-2xl border border-status-pending/40 bg-status-pending/10 px-4 py-4">
                          <div className="flex items-start gap-3 text-sm text-status-pending">
                            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
                            <div>
                              <div className="font-semibold">{w.companyDocsIncompleteTitle}</div>
                              <p className="mt-0.5 text-ink-muted">{w.companyDocsIncompleteBody}</p>
                            </div>
                          </div>
                          <a
                            href="/account"
                            target="_blank"
                            rel="noreferrer"
                            className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-brand px-4 py-2 text-xs font-semibold text-white hover:bg-brand-dark"
                          >
                            {w.goToAccount}
                          </a>
                        </div>
                      )}
                    </Section>
                  )}
                </>
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
                  <Stepper label={w.beds} value={beds} onChange={setBeds} min={1} />
                  <Stepper label={w.bathrooms} value={bathrooms} onChange={setBathrooms} min={1} />
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
                    <TextInput value={checkInTime} onChange={setCheckInTime} type="time" dir="ltr" />
                  </div>
                  <div>
                    <FieldLabel>{w.checkOutTime}</FieldLabel>
                    <TextInput value={checkOutTime} onChange={setCheckOutTime} type="time" dir="ltr" />
                  </div>
                </div>
              </Section>

              <Section label={w.cancellationPolicy}>
                <FieldLabel required>{w.cancellationPolicy}</FieldLabel>
                <div className="grid gap-3 sm:grid-cols-3">
                  {CANCELLATION_POLICIES.map((preset) => (
                    <PolicyCard
                      key={preset.name}
                      preset={preset}
                      locale={locale}
                      selected={cancellationPolicy === preset.name}
                      onSelect={() => setCancellationPolicy(preset.name)}
                    />
                  ))}
                </div>
                <p className="mt-3 text-xs text-ink-faint">{w.cancellationLockedNote}</p>
              </Section>
            </>
          )}

          {/* STEP 3 — Location (real interactive map + OSM geocoding) */}
          {step === 2 && (
            <>
              <Section label={w.searchAddress}>
                <LocationPicker
                  value={location}
                  onChange={(p, addr) => {
                    setLocation(p);
                    if (addr) setAddress(addr);
                  }}
                />
              </Section>

              <Section label={w.fullAddress}>
                <FieldLabel required>{w.fullAddress}</FieldLabel>
                <TextInput value={address} onChange={setAddress} placeholder={w.fullAddressPh} />
              </Section>
            </>
          )}

          {/* STEP 4 — Photos (real files, real previews, pick your own cover) */}
          {step === 3 && (
            <>
              <label className="flex w-full cursor-pointer flex-col items-center gap-2 rounded-3xl border-2 border-dashed border-line bg-white py-12 transition hover:border-brand">
                <input
                  type="file"
                  accept="image/png,image/jpeg"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    onPickPhotos(e.target.files);
                    e.target.value = "";
                  }}
                  disabled={photos.length >= MAX_PHOTOS}
                />
                <span className="grid h-14 w-14 place-items-center rounded-2xl bg-brand-soft text-brand">
                  <Upload className="h-6 w-6" />
                </span>
                <span className="mt-2 font-bold text-ink">{w.dragPhotos}</span>
                <span className="text-sm text-ink-muted">{w.pngJpgMax}</span>
                <span className="text-sm text-ink-faint">{w.uploadedCount(photos.filter((p) => p.fileId).length, MAX_PHOTOS)}</span>
              </label>

              {photos.length === 0 && (
                <div className="flex items-center gap-3 rounded-2xl border border-status-pending/40 bg-status-pending/10 px-4 py-3 text-sm text-status-pending">
                  <AlertTriangle className="h-5 w-5 shrink-0" />
                  {w.photoRequired}
                </div>
              )}

              {photos.length > 0 && (
                <div className="grid grid-cols-2 gap-4">
                  {photos.map((p) => {
                    const isCover = p.localId === (coverId ?? coverPhoto?.localId);
                    return (
                      <div key={p.localId} className="group relative aspect-[4/3] overflow-hidden rounded-2xl bg-cream-dark">
                        {/* eslint-disable-next-line @next/next/no-img-element -- local blob / remote preview, not an optimizable static asset */}
                        <img src={p.previewUrl} alt="" className="h-full w-full object-cover" />

                        {p.uploading && (
                          <div className="absolute inset-0 grid place-items-center bg-black/40">
                            <Loader2 className="h-6 w-6 animate-spin text-white" />
                          </div>
                        )}
                        {p.error && (
                          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-status-rejected/80 px-2 text-center text-xs text-white">
                            <AlertTriangle className="h-5 w-5" />
                            {p.error}
                          </div>
                        )}

                        {isCover && p.fileId && (
                          <span className="absolute start-3 top-3 rounded-lg bg-brand-dark px-2.5 py-1 text-xs font-semibold text-white">
                            {w.cover}
                          </span>
                        )}
                        {!isCover && p.fileId && (
                          <button
                            onClick={() => setCoverId(p.localId)}
                            className="absolute start-3 top-3 rounded-lg bg-white/90 px-2.5 py-1 text-xs font-semibold text-ink opacity-0 shadow transition group-hover:opacity-100"
                          >
                            {w.setCover}
                          </button>
                        )}
                        <button
                          onClick={() => removePhoto(p.localId)}
                          className="absolute end-3 top-3 grid h-7 w-7 place-items-center rounded-full bg-white/90 text-status-rejected opacity-0 shadow transition group-hover:opacity-100"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    );
                  })}
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
                <ReviewRow label={w.accountType} value={partnerTypeLabel || "—"} />
                <ReviewRow label={w.tourismLicense} value={tourismFile ? `${w.uploaded} ✓` : "—"} />
              </ReviewCard>

              <ReviewCard title={w.s2Title} onEdit={() => setStep(1)} editLabel={t.common.edit}>
                <ReviewRow label={w.name} value={name || "—"} />
                <ReviewRow label={w.typeLabel} value={type ? t.propertyType[type] : "—"} />
                <ReviewRow label={w.priceLabel} value={w.sarPerNight(price || "0")} />
                <ReviewRow label={w.city} value={cityLabel || "—"} />
                <ReviewRow label={w.capacity} value={w.capacitySummary(bedrooms, beds, bathrooms, guests)} />
                <ReviewRow label={w.amenities} value={w.amenitiesCount(amenities.length)} />
                <ReviewRow label={w.cancellationPolicy} value={policyLabel} />
              </ReviewCard>

              <ReviewCard title={w.s3Title} onEdit={() => setStep(2)} editLabel={t.common.edit}>
                <ReviewRow label={w.address} value={address || "—"} />
                <ReviewRow label={w.coordinates} value={location ? `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}` : "—"} />
              </ReviewCard>

              <ReviewCard title={w.s4Title} onEdit={() => setStep(3)} editLabel={t.common.edit}>
                <ReviewRow label={w.photosUploaded} value={w.photosCount(photos.filter((p) => p.fileId).length)} />
                <ReviewRow label={w.coverPhoto} value={coverPhoto?.fileName ?? "—"} />
              </ReviewCard>

              {photos.some((p) => p.fileId) && (
                <div className="rounded-2xl bg-white p-5 shadow-card">
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="font-bold text-ink">{w.uploadedPhotos}</h3>
                    <button onClick={() => setStep(3)} className="text-sm font-semibold text-brand">{t.common.edit}</button>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {photos.filter((p) => p.fileId).map((p) => (
                      <div key={p.localId} className="relative aspect-[3/4] overflow-hidden rounded-xl bg-cream-dark">
                        {/* eslint-disable-next-line @next/next/no-img-element -- local blob / remote preview */}
                        <img src={p.previewUrl} alt="" className="h-full w-full object-cover" />
                        {p.localId === (coverId ?? coverPhoto?.localId) && (
                          <span className="absolute bottom-2 start-2 rounded-md bg-brand-dark px-2 py-0.5 text-xs font-semibold text-white">
                            {w.cover}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {submitError && (
                <div className="flex items-start gap-3 rounded-2xl border border-status-rejected/30 bg-status-rejected/5 px-4 py-3 text-sm text-status-rejected">
                  <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
                  {submitError}
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
          <FooterBtn onClick={onSaveDraft} variant="outline" disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} {w.saveDraft}
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
                <FooterBtn onClick={onSaveDraft} variant="outline" disabled={saving || submitting}>
                  {w.saveAsDraft}
                </FooterBtn>
                <FooterBtn onClick={onSubmitForReview} disabled={submitting || saving || anyPhotoUploading}>
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                  {w.submitForReview}
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
}: {
  value?: string;
  onChange?: (v: string) => void;
  placeholder?: string;
  dir?: "ltr" | "rtl";
  type?: string;
}) {
  return (
    <input
      value={value}
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

function PolicyCard({
  preset,
  locale,
  selected,
  onSelect,
}: {
  preset: CancellationPolicyPreset;
  locale: Locale;
  selected: boolean;
  onSelect: () => void;
}) {
  const label = locale === "ar" ? preset.labelAr : preset.labelEn;
  const description = locale === "ar" ? preset.descriptionAr : preset.descriptionEn;
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "flex flex-col items-start gap-2 rounded-2xl border-2 p-4 text-start transition",
        selected ? "border-brand bg-brand-soft" : "border-line bg-white hover:bg-cream",
      )}
    >
      <div className="flex w-full items-center justify-between">
        <span className="font-bold text-ink">{label}</span>
        {selected && <Check className="h-4 w-4 shrink-0 text-brand" />}
      </div>
      <p className="text-xs text-ink-muted">{description}</p>
      <div className="flex flex-wrap gap-1.5">
        {preset.tiers.map((tier) => (
          <span key={tier.minDaysBeforeCheckIn} className="rounded-full bg-cream-dark px-2 py-0.5 text-xs font-semibold text-ink">
            {tier.refundPercent}%
          </span>
        ))}
      </div>
    </button>
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
