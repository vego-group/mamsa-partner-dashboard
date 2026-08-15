import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, cleanup, fireEvent } from "@testing-library/react";
import AccountPage from "@/app/(dashboard)/account/page";
import { IdentityDocumentCard } from "@/features/account/components/identity-document-card";
import { mockCompanyDocs, mockPartner, saveMockCompanyDocs } from "@/mocks/data";

const VALID_IBAN = "SA0380000000608010167519";

const partnerSeed = { ...mockPartner };

beforeEach(() => {
  Object.assign(mockPartner, partnerSeed, { accountType: "individual" });
  saveMockCompanyDocs({
    cr: "",
    iban: "",
    nationalIdFileId: null,
    authorizationLetterFileId: null,
    vatCertificateFileId: null,
    operatorLicenseFileId: null,
  });
});
afterEach(cleanup);

const saveButton = () =>
  screen.getByRole("button", { name: /Save ID scan|حفظ صورة الهوية/ }) as HTMLButtonElement;

/**
 * The upload row is a real presign+PUT; drive it through the hidden file input.
 * Waits for it because the card renders a skeleton until the docs read settles.
 */
const pickFile = async (name = "id.jpg", type = "image/jpeg") => {
  const input = await waitFor(() => {
    const el = document.querySelector('input[type="file"]');
    if (!el) throw new Error("file input not mounted yet");
    return el as HTMLInputElement;
  });
  fireEvent.change(input, { target: { files: [new File(["x"], name, { type })] } });
};

/**
 * 🔴 REGRESSION GUARD — the individual-partner KYC blocker.
 *
 * Registration collects the ID number and its scan together, but every partner
 * who signed up before that shipped has only the number. Without this card
 * there is nowhere in the dashboard to add the file, so they sit at
 * `documentsComplete: false` forever and a reviewer has nothing to inspect.
 */
describe("an individual partner can upload their ID scan", () => {
  it("persists the fileId to the field the backend reads", async () => {
    render(<IdentityDocumentCard partner={mockPartner} />);
    expect(await screen.findByText(/No ID scan uploaded yet|لم تُرفع صورة الهوية/)).toBeTruthy();

    await pickFile();
    await waitFor(() => expect(saveButton().disabled).toBe(false));
    fireEvent.click(saveButton());

    await waitFor(() => expect(mockCompanyDocs.nationalIdFileId).toBeTruthy());
    expect(await screen.findByText(/ID scan is on file|صورة الهوية مُسجَّلة/)).toBeTruthy();
  });

  it("sends ONLY the identity field — it must not wipe the payout IBAN", async () => {
    saveMockCompanyDocs({ iban: VALID_IBAN });
    render(<IdentityDocumentCard partner={mockPartner} />);

    await pickFile();
    await waitFor(() => expect(saveButton().disabled).toBe(false));
    fireEvent.click(saveButton());

    await waitFor(() => expect(mockCompanyDocs.nationalIdFileId).toBeTruthy());
    // The payout card owns the IBAN; an empty one from here would unpay them.
    expect(mockCompanyDocs.iban).toBe(VALID_IBAN);
    expect(mockCompanyDocs.cr).toBe("");
  });

  it("keeps save disabled until something actually changes", async () => {
    render(<IdentityDocumentCard partner={mockPartner} />);
    await screen.findByText(/No ID scan uploaded yet|لم تُرفع صورة الهوية/);

    expect(saveButton().disabled).toBe(true);
  });

  it("completes KYC only with the number AND the scan AND an IBAN", async () => {
    // The number alone is exactly what a reviewer cannot check.
    saveMockCompanyDocs({ iban: VALID_IBAN });
    expect(mockCompanyDocs.complete).toBe(false);

    render(<IdentityDocumentCard partner={mockPartner} />);
    await pickFile();
    await waitFor(() => expect(saveButton().disabled).toBe(false));
    fireEvent.click(saveButton());

    await waitFor(() => expect(mockCompanyDocs.complete).toBe(true));
  });
});

describe("the account page shows the ID card to the right partner type", () => {
  it("shows it to an individual", async () => {
    Object.assign(mockPartner, { accountType: "individual" });
    render(<AccountPage />);

    expect(await screen.findByText(/National ID Scan|صورة الهوية الوطنية/)).toBeTruthy();
  });

  it("does NOT show it to a company — its identity evidence is the CR", async () => {
    Object.assign(mockPartner, { accountType: "company" });
    render(<AccountPage />);

    // Wait for the company card so we know the page finished loading.
    await screen.findByText(/IBAN|رقم الآيبان/);
    expect(screen.queryByText(/National ID Scan|صورة الهوية الوطنية/)).toBeNull();
  });
});
