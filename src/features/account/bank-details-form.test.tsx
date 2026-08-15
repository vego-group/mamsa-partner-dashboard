import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, cleanup, fireEvent } from "@testing-library/react";
import { BankDetailsForm } from "@/features/account/components/bank-details-form";
import { mockBankDetails, saveMockBankDetails } from "@/mocks/data";

const VALID = "SA0380000000608010167519";
/** Same IBAN with one digit bumped — passes the regex, fails the checksum. */
const BAD_CHECKSUM = "SA0380000000608010167518";
const OTHER_VALID = "SA1620000004512345678901";

const seed = { ...mockBankDetails };

beforeEach(() => {
  Object.assign(mockBankDetails, seed, { verified: true, rejectionReason: null });
});
afterEach(cleanup);

const saveButton = () =>
  screen.getByRole("button", { name: /Save Bank Account|حفظ الحساب البنكي/ }) as HTMLButtonElement;

const findIbanInput = () =>
  screen.findByDisplayValue(VALID) as Promise<HTMLInputElement>;

const setValue = (el: HTMLElement, value: string) => fireEvent.change(el, { target: { value } });

describe("BankDetailsForm", () => {
  it("keeps submit disabled when the IBAN fails its checksum", async () => {
    render(<BankDetailsForm />);
    setValue(await findIbanInput(), BAD_CHECKSUM);

    // Regex-valid, checksum-invalid — the exact case a shape-only check waves through.
    expect(BAD_CHECKSUM).toMatch(/^SA\d{22}$/);
    await waitFor(() => expect(saveButton().disabled).toBe(true));
    expect(await screen.findByText(/Invalid IBAN|رقم الآيبان غير صحيح/)).toBeTruthy();
  });

  it("enables submit once the checksum is valid", async () => {
    render(<BankDetailsForm />);
    setValue(await findIbanInput(), OTHER_VALID);

    await waitFor(() => expect(saveButton().disabled).toBe(false));
  });

  it("asks for confirmation before changing a saved IBAN", async () => {
    render(<BankDetailsForm />);
    setValue(await findIbanInput(), OTHER_VALID);
    await waitFor(() => expect(saveButton().disabled).toBe(false));
    fireEvent.click(saveButton());

    // The consequence has to land BEFORE the change, not after.
    expect(await screen.findByText(/verified again|إعادة توثيق/)).toBeTruthy();
    // Nothing is written until the partner confirms.
    expect(mockBankDetails.iban).toBe(VALID);
  });

  it("resets the verified badge to pending after a confirmed IBAN change", async () => {
    render(<BankDetailsForm />);
    expect(await screen.findByText(/bank account is verified|حسابك البنكي موثّق/)).toBeTruthy();

    setValue(await findIbanInput(), OTHER_VALID);
    await waitFor(() => expect(saveButton().disabled).toBe(false));
    fireEvent.click(saveButton());
    fireEvent.click(screen.getByRole("button", { name: /Confirm Change|تأكيد التغيير/ }));

    expect(await screen.findByText(/being verified by Mamsa|قيد التوثيق/)).toBeTruthy();
    expect(mockBankDetails.iban).toBe(OTHER_VALID);
    expect(mockBankDetails.verified).toBe(false);
  });

  /**
   * The holder name is NOT a free edit: a bank rejects a transfer whose
   * beneficiary name doesn't match, so the server resets verification on it too.
   * Warning only on the IBAN let a partner lose their badge silently.
   */
  it("warns before a holder-name-only edit and drops verification once confirmed", async () => {
    render(<BankDetailsForm />);
    setValue(await screen.findByDisplayValue(seed.accountHolderName), "شركة ممسى للضيافة");
    await waitFor(() => expect(saveButton().disabled).toBe(false));
    fireEvent.click(saveButton());

    expect(await screen.findByText(/verified again|إعادة توثيق/)).toBeTruthy();
    // Nothing is written until the partner confirms.
    expect(mockBankDetails.accountHolderName).toBe(seed.accountHolderName);

    fireEvent.click(screen.getByRole("button", { name: /Confirm Change|تأكيد التغيير/ }));

    await waitFor(() => expect(mockBankDetails.accountHolderName).toBe("شركة ممسى للضيافة"));
    expect(mockBankDetails.verified).toBe(false);
    expect(mockBankDetails.iban).toBe(VALID);
  });

  /** An unverified account has nothing to lose — an edit there saves straight through. */
  it("saves without a dialog when the account is not yet verified", async () => {
    Object.assign(mockBankDetails, { verified: false, verifiedAt: null });
    render(<BankDetailsForm />);
    setValue(await findIbanInput(), OTHER_VALID);
    await waitFor(() => expect(saveButton().disabled).toBe(false));
    fireEvent.click(saveButton());

    await waitFor(() => expect(mockBankDetails.iban).toBe(OTHER_VALID));
    expect(screen.queryByText(/verified again|إعادة توثيق/)).toBeNull();
  });

  /** A no-op save must not strip the badge — the server treats it as no change. */
  it("keeps verification when nothing was actually edited", async () => {
    render(<BankDetailsForm />);
    await findIbanInput();
    saveMockBankDetails({ iban: VALID, accountHolderName: seed.accountHolderName });

    expect(mockBankDetails.verified).toBe(true);
  });

  it("shows the missing-account warning when nothing is on file", async () => {
    saveMockBankDetails({ iban: "", accountHolderName: "" });
    render(<BankDetailsForm />);

    expect(await screen.findByText(/Add your bank account|أضف حسابك البنكي/)).toBeTruthy();
  });
});
