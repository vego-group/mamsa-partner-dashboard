import { SAUDI_BOUNDS } from "@/lib/constants";

export interface LatLng {
  lat: number;
  lng: number;
}

/**
 * Runtime guard for coordinates coming off a `Unit`. A draft that was never
 * placed on the map comes back with null/absent lat+lng even though the type
 * says `number`, and Leaflet throws ("Invalid LatLng object") on a non-finite
 * pair — which takes the whole wizard down to the 500 error boundary. 0,0 is
 * treated as unset too: it's the null-island default, never a real Saudi pin.
 */
export function isValidLatLng(
  p: { lat?: number | null; lng?: number | null } | null | undefined,
): p is LatLng {
  if (!p || !Number.isFinite(p.lat) || !Number.isFinite(p.lng)) return false;
  return !(p.lat === 0 && p.lng === 0);
}

export function isInsideSaudi(p: LatLng): boolean {
  return (
    p.lat >= SAUDI_BOUNDS.minLat &&
    p.lat <= SAUDI_BOUNDS.maxLat &&
    p.lng >= SAUDI_BOUNDS.minLng &&
    p.lng <= SAUDI_BOUNDS.maxLng
  );
}
