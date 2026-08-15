import { describe, it, expect } from "vitest";
import { deriveTopProperties } from "@/features/overview/lib/derive-metrics";
import { computeFinancials } from "@/lib/format";
import type { Booking, BookingStatus, Unit } from "@/types";

const unit = { id: "u_1", name: "استوديو مرسى العليا", photos: [] } as unknown as Unit;

const booking = (id: string, status: BookingStatus, total: number): Booking => ({
  id,
  code: `BK-${id}`,
  unitId: unit.id,
  unitName: unit.name,
  unitThumb: "",
  guestName: "ضيف",
  guestPhone: "+966500000000",
  checkIn: "2026-08-18T15:00:00Z",
  checkOut: "2026-08-21T12:00:00Z",
  nights: 3,
  guests: 2,
  status,
  financials: computeFinancials(total),
});

/**
 * Guards the widening bug: `deriveTopProperties` used to skip only `cancelled`,
 * which meant "confirmed + completed" only while those three were the whole
 * union. Adding `pending_payment` made that shortcut quietly count unpaid money.
 */
describe("deriveTopProperties revenue", () => {
  it("excludes a pending_payment booking — unpaid money is not revenue", () => {
    const paidOnly = deriveTopProperties([unit], [booking("a", "confirmed", 1000)]);
    const withUnpaid = deriveTopProperties([unit], [
      booking("a", "confirmed", 1000),
      booking("b", "pending_payment", 5000),
    ]);

    expect(withUnpaid[0].revenue).toBe(paidOnly[0].revenue);
    expect(withUnpaid[0].bookings).toBe(1);
  });

  it("counts confirmed and completed, and drops cancelled", () => {
    const rows = deriveTopProperties([unit], [
      booking("a", "confirmed", 1000),
      booking("b", "completed", 1000),
      booking("c", "cancelled", 1000),
      booking("d", "pending_payment", 1000),
    ]);

    expect(rows[0].bookings).toBe(2);
    expect(rows[0].revenue).toBe(computeFinancials(1000).partnerShare * 2);
  });

  it("reports no property at all when every booking is unpaid", () => {
    expect(deriveTopProperties([unit], [booking("a", "pending_payment", 1000)])).toEqual([]);
  });
});
