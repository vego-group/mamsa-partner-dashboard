import { SAUDI_BOUNDS } from "@/lib/constants";

export interface LatLng {
  lat: number;
  lng: number;
}

export function isInsideSaudi(p: LatLng): boolean {
  return (
    p.lat >= SAUDI_BOUNDS.minLat &&
    p.lat <= SAUDI_BOUNDS.maxLat &&
    p.lng >= SAUDI_BOUNDS.minLng &&
    p.lng <= SAUDI_BOUNDS.maxLng
  );
}
