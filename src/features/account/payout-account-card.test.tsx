import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, cleanup, fireEvent } from "@testing-library/react";
import AccountPage from "@/app/(dashboard)/account/page";
import { PayoutAccountCard } from "@/features/account/components/payout-account-card";
import { mockCompanyDocs, mockPartner, saveMockCompanyDocs } from "@/mocks/data";

const VALID = "SA0380000000608010167519";
const BAD_CHECKSUM = "SA0380000000608010167518";

const partnerSeed = { ...mockPartner };

beforeEach(() => {
  Object.assign(mockPartner, partnerSeed);
  saveMockCompanyDocs({
    cr: "",
    iban: "",
    authorizationLetterFileId: null,
    vatCertificateFileId: null,
    operatorLicenseFileId: null,
  });
});
afterEach(cleanup);

const saveButton = () =>
  screen.getByRole("button", { name: /Save Bank Account|حفظ الحساب البنكي/ }) as HTMLButtonElement;
const setValue = (el: HTMLElement, value: string) => fireEvent.change(el, { target: { value } });
const ibanField = () => screen.findByPlaceholderText("SA0000000000000000000000");

/**
 * 🔴 REGRESSION GUARD — the individual-partner payout blocker.
 *
 * `PUT /me/company-docs` has no partner-type gate: it validates and persists
 * `iban` for any partner. Rendering the field only when
 * `accountType === "company"` was purely client-side, and it left individual
 * partners with no way to supply a payout account at all.
 *
 * If that condition comes back, or `iban` is dropped from the individual
 * payload, these fail.
 */
describe("an individual partner can save an IBAN through company-docs", () => {
  it("persists the IBAN to the same field the backend reads", async () => {
    render(<PayoutAccountCard />);
    setValue(await ibanField(), VALID);
    await waitFor(() => expect(saveButton().disabled).toBe(false));
    fireEvent.click(saveButton());

    await waitFor(() => expect(mockCompanyDocs.iban).toBe(VALID));
  });

  it("sends ONLY bank fields — no cr, no company document ids", async () => {
    render(<PayoutAccountCard />);
    setValue(await ibanField(), VALID);
    await waitFor(() => expect(saveButton().disabled).toBe(false));
    fireEvent.click(saveButton());

    await waitFor(() => expect(mockCompanyDocs.iban).toBe(VALID));
    // An individual has none of these, and saving must not invent them.
    expect(mockCompanyDocs.cr).toBe("");
    expect(mockCompanyDocs.authorizationLetterFileId).toBeNull();
    expect(mockCompanyDocs.vatCertificateFileId).toBeNull();
    expect(mockCompanyDocs.operatorLicenseFileId).toBeNull();
  });

  it("does not block saving on the holder name, which has no column yet", async () => {
    render(<PayoutAccountCard />);
    setValue(await ibanField(), VALID);

    // Holder name left blank — the partner must still be able to become payable.
    await waitFor(() => expect(saveButton().disabled).toBe(false));
    fireEvent.click(saveButton());
    await waitFor(() => expect(mockCompanyDocs.iban).toBe(VALID));
  });

  it("accepts a holder name, sends it, and tolerates it coming back empty", async () => {
    render(<PayoutAccountCard />);
    setValue(await ibanField(), VALID);
    setValue(screen.getAllByRole("textbox")[1], "عبدالله الحارثي");
    await waitFor(() => expect(saveButton().disabled).toBe(false));
    fireEvent.click(saveButton());

    await waitFor(() => expect(mockCompanyDocs.iban).toBe(VALID));
    // Dropped server-side — the form must survive the round-trip regardless.
    expect(mockCompanyDocs.accountHolderName).toBeUndefined();
  });

  it("keeps submit disabled on a checksum-invalid IBAN", async () => {
    render(<PayoutAccountCard />);
    setValue(await ibanField(), BAD_CHECKSUM);

    expect(BAD_CHECKSUM).toMatch(/^SA\d{22}$/);
    await waitFor(() => expect(saveButton().disabled).toBe(true));
    expect(mockCompanyDocs.iban).toBe("");
  });
});

describe("the account page renders a payout IBAN field for every partner type", () => {
  it("shows it to an individual partner", async () => {
    Object.assign(mockPartner, { accountType: "individual" });
    render(<AccountPage />);
    expect(await ibanField()).toBeTruthy();
  });

  it("still shows one to a company partner", async () => {
    Object.assign(mockPartner, { accountType: "company" });
    render(<AccountPage />);
    // Company partners enter it alongside their documents.
    expect(await screen.findByText(/IBAN|رقم الآيبان/)).toBeTruthy();
  });
});
