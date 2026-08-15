import { describe, it, expect } from "vitest";
import { isValidLatLng, isInsideSaudi } from "@/features/units/lib/geo";
import { createMockUnit, updateMockUnit } from "@/mocks/data";

describe("isValidLatLng", () => {
  it("accepts a real pin", () => {
    expect(isValidLatLng({ lat: 24.7136, lng: 46.6753 })).toBe(true);
  });

  it("rejects the shapes a never-placed draft comes back with", () => {
    // The bug: `lat !== 0` let all of these through as a truthy point, and the
    // wizard handed them to Leaflet on step 3 → "Invalid LatLng object" → 500.
    expect(isValidLatLng({ lat: null, lng: null })).toBe(false);
    expect(isValidLatLng({ lat: undefined, lng: undefined })).toBe(false);
    expect(isValidLatLng({ lat: 24.7136, lng: null })).toBe(false);
    expect(isValidLatLng({ lat: NaN, lng: NaN })).toBe(false);
    expect(isValidLatLng({ lat: 0, lng: 0 })).toBe(false); // null island, not Riyadh
    expect(isValidLatLng(null)).toBe(false);
    expect(isValidLatLng(undefined)).toBe(false);
  });

  it("does not confuse validity with being inside Saudi", () => {
    const paris = { lat: 48.8566, lng: 2.3522 };
    expect(isValidLatLng(paris)).toBe(true);
    expect(isInsideSaudi(paris)).toBe(false);
  });
});

describe("mock PATCH /units/:id", () => {
  it("keeps stored coordinates when the payload omits them", () => {
    const unit = createMockUnit({ name: "Pinned", lat: 24.7136, lng: 46.6753 });
    // What the wizard sends from step 2 with no location picked yet.
    const updated = updateMockUnit(unit.id, { name: "Renamed", lat: undefined, lng: undefined });
    expect(updated.name).toBe("Renamed");
    expect(updated.lat).toBe(24.7136);
    expect(updated.lng).toBe(46.6753);
  });
});
