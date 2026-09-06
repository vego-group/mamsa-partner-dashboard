import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { complaintImpact, halalasToSar } from "@/features/complaints/lib/impact";
import { complaintHrefForLedgerRow } from "@/features/complaints/lib/link-ledger";
import { ComplaintImpactCard } from "@/features/complaints/components/complaint-impact-card";
import { mockComplaints, mockLedger, readMockComplaint, readMockComplaints } from "@/mocks/data";
import { dict } from "@/lib/i18n";
import { formatCurrency } from "@/lib/format";
import type { PartnerComplaintRow, PartnerLedgerEntry } from "@/types";

const c = dict.ar.complaints;

afterEach(cleanup);

/**
 * §3 — `approved` is not `deducted`. Between Mamsa approving an amount and
 * the gateway settling it, the status reads `approved` and the amount is
 * null. Putting a number on screen then sends the partner to a statement
 * that does not have it, and from there to a support ticket.
 */
describe("complaintImpact never invents an amount", () => {
  it("treats approved-with-null as pending, with no figure", () => {
    expect(complaintImpact({ status: "approved", deductedHalalas: null })).toEqual({ kind: "approved_pending" });
  });

  it("only reports a deduction when the API sent the number", () => {
    // 500.00 refunded to the guest on a booking frozen at 10% → the partner's share is 391.30.
    expect(complaintImpact({ status: "resolved_refunded", deductedHalalas: 39130 })).toEqual({
      kind: "deducted",
      amountSar: 391.3,
    });
  });

  it("keeps a resolved_refunded row without an amount on the pending wording", () => {
    expect(complaintImpact({ status: "resolved_refunded", deductedHalalas: null })).toEqual({ kind: "approved_pending" });
  });

  it("maps the open and rejected states", () => {
    expect(complaintImpact({ status: "submitted", deductedHalalas: null }).kind).toBe("open");
    expect(complaintImpact({ status: "under_review", deductedHalalas: null }).kind).toBe("open");
    expect(complaintImpact({ status: "resolved_rejected", deductedHalalas: null }).kind).toBe("rejected");
  });

  it("converts halalas for display only, by division", () => {
    expect(halalasToSar(39130)).toBe(391.3);
    expect(halalasToSar(0)).toBe(0);
  });
});

describe("the impact card", () => {
  it("shows the approved-not-deducted line and no money at all while approved", () => {
    render(<ComplaintImpactCard complaint={{ status: "approved", deductedHalalas: null }} />);
    expect(screen.getByText(c.impactApproved)).toBeTruthy();
    expect(screen.queryByText(/ر\.س/)).toBeNull();
  });

  it("shows the API's amount and says it is the partner's share once deducted", () => {
    render(<ComplaintImpactCard complaint={{ status: "resolved_refunded", deductedHalalas: 39130 }} />);
    expect(screen.getByText(formatCurrency(391.3, "ar", true))).toBeTruthy();
    expect(screen.getByText(c.impactDeductedHint)).toBeTruthy();
  });

  it("says nothing was deducted on a rejected complaint", () => {
    render(<ComplaintImpactCard complaint={{ status: "resolved_rejected", deductedHalalas: null }} />);
    expect(screen.getByText(c.impactRejected)).toBeTruthy();
    expect(screen.queryByText(/ر\.س/)).toBeNull();
  });
});

/**
 * §6 — a `refund_reversal` row's `refId` is a refund id. The bridge to the
 * complaint is the booking code, matched locally over the unpaginated list.
 */
describe("complaintHrefForLedgerRow", () => {
  const complaints: PartnerComplaintRow[] = [
    { id: 7, status: "resolved_refunded", bookingCode: "BK-2377", unitName: "شقة", createdAt: null },
    { id: 8, status: "approved", bookingCode: "BK-2403", unitName: "شقة", createdAt: null },
  ];
  const row = (patch: Partial<PartnerLedgerEntry>): Pick<PartnerLedgerEntry, "type" | "refCode"> & Partial<PartnerLedgerEntry> => ({
    type: "refund_reversal",
    refType: "refund",
    refId: "rf_99", // a refund id — must never surface in the href
    refCode: "BK-2377",
    ...patch,
  });

  it("links by booking code, not by refId", () => {
    expect(complaintHrefForLedgerRow(row({}), complaints)).toBe("/complaints/7");
  });

  it("stays plain text when no complaint carries that booking code", () => {
    expect(complaintHrefForLedgerRow(row({ refCode: "BK-0000" }), complaints)).toBeNull();
  });

  it("stays plain text before the list has loaded", () => {
    expect(complaintHrefForLedgerRow(row({}), undefined)).toBeNull();
    expect(complaintHrefForLedgerRow(row({}), [])).toBeNull();
  });

  it("ignores rows that are not refund reversals", () => {
    expect(complaintHrefForLedgerRow(row({ type: "earning" }), complaints)).toBeNull();
    expect(complaintHrefForLedgerRow(row({ type: "adjustment" }), complaints)).toBeNull();
  });
});

describe("mock complaints agree with the mock ledger", () => {
  it("links the refund_reversal row to the refunded complaint by booking code", () => {
    const reversal = mockLedger.find((r) => r.type === "refund_reversal");
    expect(reversal).toBeDefined();
    expect(reversal!.refType).toBe("refund");
    const href = complaintHrefForLedgerRow(reversal!, readMockComplaints());
    expect(href).toMatch(/^\/complaints\/\d+$/);

    const complaint = readMockComplaint(href!.split("/").pop()!);
    expect(complaint?.status).toBe("resolved_refunded");
    // The statement's debit and the complaint's deduction are one number.
    expect(halalasToSar(complaint!.deductedHalalas!)).toBe(Math.abs(reversal!.amount));
  });

  it("has exactly one complaint per booking", () => {
    const codes = mockComplaints.map((m) => m.bookingCode);
    expect(new Set(codes).size).toBe(codes.length);
  });

  it("keeps the amount null on every non-refunded complaint", () => {
    for (const m of mockComplaints) {
      if (m.status !== "resolved_refunded") expect(m.deductedHalalas, `complaint ${m.id}`).toBeNull();
    }
  });

  it("keeps the detail fields out of the list shape", () => {
    for (const row of readMockComplaints()) {
      expect(row).not.toHaveProperty("description");
      expect(row).not.toHaveProperty("images");
      expect(row).not.toHaveProperty("deductedHalalas");
    }
  });

  it("returns null for a complaint id that is not the partner's", () => {
    expect(readMockComplaint("999")).toBeNull();
  });
});
