import { describe, it, expect, beforeEach } from "vitest";
import { api } from "@/lib/api/client";
import {
  buildOverview,
  createMockUnit,
  updateMockUnit,
  mockBookings,
  mockCompanyDocs,
  mockUnits,
  saveMockBankDetails,
  saveMockCompanyDocs,
} from "@/mocks/data";

describe("cancellationPolicy persistence in mock unit create/update", () => {
  it("defaults to moderate when omitted on create", () => {
    const unit = createMockUnit({ name: "Test Unit" });
    expect(unit.cancellationPolicy).toBe("moderate");
  });

  it("persists a partner-chosen preset on create and reflects it in the unit list", () => {
    const unit = createMockUnit({ name: "Strict Unit", cancellationPolicy: "strict" });
    expect(unit.cancellationPolicy).toBe("strict");
    expect(mockUnits.find((u) => u.id === unit.id)?.cancellationPolicy).toBe("strict");
  });

  it("persists an updated preset", () => {
    const created = createMockUnit({ name: "Flexible Unit", cancellationPolicy: "flexible" });
    const updated = updateMockUnit(created.id, { cancellationPolicy: "strict" });
    expect(updated.cancellationPolicy).toBe("strict");
    expect(mockUnits.find((u) => u.id === created.id)?.cancellationPolicy).toBe("strict");
  });
});

/**
 * §3.1 defines bookingsCount/totalRevenue as confirmed + completed. Reverting
 * this to `status !== "cancelled"` would fold the unpaid seed booking back in,
 * which is the widening these assertions exist to catch.
 */
describe("buildOverview excludes unpaid bookings", () => {
  it("counts only confirmed + completed, not merely non-cancelled", () => {
    const paid = mockBookings.filter((b) => b.status === "confirmed" || b.status === "completed");
    const notCancelled = mockBookings.filter((b) => b.status !== "cancelled");

    // The seed has to actually contain an unpaid booking for this to prove anything.
    expect(mockBookings.some((b) => b.status === "pending_payment")).toBe(true);
    expect(notCancelled.length).toBeGreaterThan(paid.length);

    expect(buildOverview().bookingsCount).toBe(paid.length);
  });

  it("keeps unpaid totals out of totalRevenue", () => {
    const paidShare = mockBookings
      .filter((b) => b.status === "confirmed" || b.status === "completed")
      .reduce((s, b) => s + b.financials.partnerShare, 0);

    expect(buildOverview().totalRevenue).toBe(paidShare);
  });
});

/**
 * 🔴 PRODUCTION-BLOCKING REGRESSION GUARD.
 *
 * There is no bank_details table. The backend computes company-docs
 * completeness — and therefore whether a company partner can submit a unit at
 * all — from the legacy `partner_details.iban` written by PUT /me/company-docs.
 *
 * If anyone drops `iban` from that payload again, or repoints completeness at
 * /me/bank-details (which persists nothing), every company partner silently
 * loses the ability to list a property. These tests are what make that loud.
 */
describe("a company partner can submit a unit", () => {
  const VALID_IBAN = "SA0380000000608010167519";
  const docsWithoutIban = {
    cr: "1010101010",
    authorizationLetterFileId: "file_auth",
    vatCertificateFileId: "file_vat",
    operatorLicenseFileId: "file_lic",
  };
  const fullDocs = { ...docsWithoutIban, iban: VALID_IBAN };

  beforeEach(() => {
    saveMockCompanyDocs({ cr: "", iban: "", authorizationLetterFileId: null, vatCertificateFileId: null, operatorLicenseFileId: null });
  });

  it("submits successfully once company docs INCLUDING the iban are saved", async () => {
    expect(saveMockCompanyDocs(fullDocs).complete).toBe(true);
    expect(mockCompanyDocs.iban).toBe(VALID_IBAN);

    const draft = createMockUnit({ name: "وحدة اختبار" });
    await expect(api.submitUnit(draft.id)).resolves.toMatchObject({ status: "pending" });
  });

  it("is blocked with 409 COMPANY_DOCS_INCOMPLETE when the iban is omitted from the payload", async () => {
    // Exactly the shape a "the IBAN lives on the bank-details screen now" refactor produces.
    expect(saveMockCompanyDocs(docsWithoutIban).complete).toBe(false);

    const draft = createMockUnit({ name: "وحدة بدون آيبان" });
    await expect(api.submitUnit(draft.id)).rejects.toMatchObject({
      status: 409,
      code: "COMPANY_DOCS_INCOMPLETE",
    });
  });

  it("does NOT accept a bank-details IBAN as a substitute — that endpoint persists nothing", async () => {
    saveMockBankDetails({ iban: VALID_IBAN, accountHolderName: "شركة ممسى" });
    saveMockCompanyDocs(docsWithoutIban);

    expect(mockCompanyDocs.complete).toBe(false);
    const draft = createMockUnit({ name: "وحدة بآيبان في الشاشة الأخرى" });
    await expect(api.submitUnit(draft.id)).rejects.toMatchObject({ code: "COMPANY_DOCS_INCOMPLETE" });
  });

  it("rejects a checksum-invalid iban even though it matches the regex", () => {
    expect(saveMockCompanyDocs({ ...docsWithoutIban, iban: "SA0380000000608010167518" }).complete).toBe(false);
  });
});
