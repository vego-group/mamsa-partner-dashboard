"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";
import { useLocale } from "@/stores/locale-store";
import { SAUDI_BOUNDS } from "@/lib/constants";
import { isInsideSaudi, type LatLng } from "@/features/units/lib/geo";
import { cn } from "@/lib/cn";
import { Search, Loader2, MapPin, AlertTriangle } from "lucide-react";

interface SearchResult {
  lat: number;
  lng: number;
  label: string;
}

/** Brand-colored teardrop pin — avoids bundling Leaflet's default PNG marker assets. */
const pinIcon = L.divIcon({
  className: "",
  html: `<svg width="34" height="44" viewBox="0 0 34 44" xmlns="http://www.w3.org/2000/svg">
    <path d="M17 0C7.6 0 0 7.6 0 17c0 12.4 17 27 17 27s17-14.6 17-27C34 7.6 26.4 0 17 0z" fill="#1F4A3C"/>
    <circle cx="17" cy="17" r="7" fill="#fff"/>
  </svg>`,
  iconSize: [34, 44],
  iconAnchor: [17, 44],
});

async function geocodeSearch(query: string, lang: string): Promise<SearchResult[]> {
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
    query,
  )}&countrycodes=sa&limit=5&addressdetails=1&accept-language=${lang}`;
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error("geocode failed");
  const rows = (await res.json()) as { lat: string; lon: string; display_name: string }[];
  return rows.map((r) => ({ lat: Number(r.lat), lng: Number(r.lon), label: r.display_name }));
}

async function reverseGeocode(p: LatLng, lang: string): Promise<string | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${p.lat}&lon=${p.lng}&addressdetails=1&accept-language=${lang}`;
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    if (!res.ok) return null;
    const j = (await res.json()) as { display_name?: string };
    return j.display_name ?? null;
  } catch {
    return null;
  }
}

function ClickHandler({ onPick }: { onPick: (p: LatLng) => void }) {
  useMapEvents({
    click(e) {
      onPick({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}

/** Imperatively re-centers the map when `center` changes (e.g. after a search pick). */
function RecenterOnChange({ center }: { center: LatLng | null }) {
  const map = useMapEvents({});
  useEffect(() => {
    if (center) map.setView([center.lat, center.lng], Math.max(map.getZoom(), 13));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [center?.lat, center?.lng]);
  return null;
}

export interface LocationPickerProps {
  value: LatLng | null;
  onChange: (point: LatLng, address: string | null) => void;
}

export default function LocationPicker({ value, onChange }: LocationPickerProps) {
  const { t, locale } = useLocale();
  const w = t.wiz;
  const lang = locale === "ar" ? "ar" : "en";

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [reverseLoading, setReverseLoading] = useState(false);
  const [outsideBounds, setOutsideBounds] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  async function commitPoint(p: LatLng) {
    setResults([]);
    if (!isInsideSaudi(p)) {
      setOutsideBounds(true);
      onChange(p, null);
      return;
    }
    setOutsideBounds(false);
    setReverseLoading(true);
    const address = await reverseGeocode(p, lang);
    setReverseLoading(false);
    onChange(p, address);
  }

  async function runSearch() {
    if (!query.trim()) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setSearching(true);
    setSearchError(null);
    try {
      const rows = await geocodeSearch(query.trim(), lang);
      setResults(rows);
      if (rows.length === 0) setSearchError(w.noResults);
    } catch {
      setSearchError(w.geocodeError);
    } finally {
      setSearching(false);
    }
  }

  const center = value ?? SAUDI_BOUNDS.center;

  return (
    <div className="space-y-3">
      {/* Address search */}
      <div className="relative">
        <div dir="ltr" className="flex items-stretch gap-2">
          <div className="relative flex-1">
            <input
              dir="rtl"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), runSearch())}
              placeholder={w.fullAddressPh}
              className="w-full rounded-2xl border border-line bg-cream/40 px-4 py-3 text-sm outline-none placeholder:text-ink-faint focus:border-brand focus:bg-white"
            />
          </div>
          <button
            onClick={runSearch}
            disabled={searching || !query.trim()}
            className="flex shrink-0 items-center gap-1.5 rounded-2xl bg-brand px-4 py-3 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:opacity-50"
          >
            {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            {w.searchBtn}
          </button>
        </div>

        {results.length > 0 && (
          <div className="absolute z-[1000] mt-1 w-full overflow-hidden rounded-2xl border border-line bg-white shadow-modal">
            {results.map((r, i) => (
              <button
                key={i}
                onClick={() => {
                  setQuery(r.label);
                  commitPoint({ lat: r.lat, lng: r.lng });
                }}
                className="flex w-full items-start gap-2 border-b border-line/60 px-4 py-3 text-start text-sm last:border-0 hover:bg-cream"
              >
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-ink-faint" />
                <span className="text-ink">{r.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {searchError && <p className="text-xs text-status-rejected">{searchError}</p>}

      {/* Map */}
      <div className="relative h-72 overflow-hidden rounded-2xl border border-line">
        <MapContainer
          center={[center.lat, center.lng]}
          zoom={value ? 13 : 5}
          scrollWheelZoom
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <ClickHandler onPick={commitPoint} />
          <RecenterOnChange center={value} />
          {value && (
            <Marker
              position={[value.lat, value.lng]}
              icon={pinIcon}
              draggable
              eventHandlers={{
                dragend: (e) => {
                  const m = e.target as L.Marker;
                  const p = m.getLatLng();
                  commitPoint({ lat: p.lat, lng: p.lng });
                },
              }}
            />
          )}
        </MapContainer>

        {!value && (
          <div className="pointer-events-none absolute inset-0 grid place-items-center bg-black/0">
            <div className="rounded-2xl bg-white px-6 py-4 text-center shadow-card">
              <MapPin className="mx-auto h-6 w-6 text-ink-muted" />
              <div className="mt-1 text-sm font-bold text-ink">{w.enterAddressToPin}</div>
              <div className="text-xs text-ink-muted">{w.saudiOnly}</div>
            </div>
          </div>
        )}
      </div>

      <p className="text-xs text-ink-faint">{w.clickMapHint}</p>

      {outsideBounds && (
        <div className="flex items-start gap-3 rounded-2xl border border-status-rejected/30 bg-status-rejected/5 px-4 py-3 text-sm text-status-rejected">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          {w.outsideSaudi}
        </div>
      )}

      {value && !outsideBounds && (
        <div className="flex items-start gap-3 rounded-2xl bg-brand-soft px-4 py-4">
          <MapPin className="mt-0.5 h-5 w-5 text-brand" />
          <div>
            <div className="font-bold text-ink">{w.locationConfirmed}</div>
            {reverseLoading ? (
              <div className="text-sm text-ink-muted">{w.searching}</div>
            ) : (
              <div className="text-sm text-ink-muted">{w.saudiArabia}</div>
            )}
            <div dir="ltr" className="text-xs text-ink-faint">
              Lat {value.lat.toFixed(4)} · Lng {value.lng.toFixed(4)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
