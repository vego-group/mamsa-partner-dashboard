import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, cleanup, fireEvent } from "@testing-library/react";
import AccountPage from "@/app/(dashboard)/account/page";
import { mockCompanyDocs, mockPartner, saveMockCompanyDocs } from "@/mocks/data";

const VALID_IBAN = "SA0380000000608010167519";

const partnerSeed = { ...mockPartner };

beforeEach(() => {
  Object.assign(mockPartner, partnerSeed, { accountType: "company" });
  saveMockCompanyDocs({
    cr: "1010101010",
    iban: VALID_IBAN,
    crFileId: null,
    nationalIdFileId: null,
    authorizationLetterFileId: null,
    vatCertificateFileId: null,
    operatorLicenseFileId: null,
  });
});
afterEach(cleanup);

const saveButton = () =>
  screen.getByRole("button", { name: /Save Company Details|حفظ بيانات الشركة/ }) as HTMLButtonElement;

/** The CR scan is the first upload row in the company card. */
const pickCrFile = async (name = "cr.jpg", type = "image/jpeg") => {
  const input = await waitFor(() => {
    const el = document.querySelectorAll('input[type="file"]')[0];
    if (!el) throw new Error("file input not mounted yet");
    return el as HTMLInputElement;
  });
  fireEvent.change(input, { target: { files: [new File(["x"], name, { type })] } });
  // The presign+PUT is async and this card's save button is never disabled —
  // clicking before the fileId lands would save nothing.
  await waitFor(() => expect(screen.getAllByText(/Replace file|استبدال الملف/).length).toBeGreaterThan(0));
};

/**
 * 🔴 REGRESSION GUARD — the company-partner KYC blocker.
 *
 * A company used to be approved on a typed 10-digit string with no document
 * behind it: the admin's `commercial_registration` row was permanently
 * fileless. This card is the only route by which a company already on the
 * platform can supply the scan.
 */
describe("a company partner can upload their CR scan", () => {
  it("persists the fileId to the field the backend reads", async () => {
    render(<AccountPage />);
    expect(await screen.findByText(/No CR scan uploaded yet|لم تُرفع صورة السجل التجاري/)).toBeTruthy();

    await pickCrFile();
    await waitFor(() => expect(saveButton().disabled).toBe(false));
    fireEvent.click(saveButton());

    await waitFor(() => expect(mockCompanyDocs.crFileId).toBeTruthy());
    expect(await screen.findByText(/CR scan is on file|صورة السجل التجاري مُسجَّلة/)).toBeTruthy();
  });

  it("shows the stored file back so the partner can check the right page uploaded", async () => {
    render(<AccountPage />);

    await pickCrFile();
    await waitFor(() => expect(saveButton().disabled).toBe(false));
    fireEvent.click(saveButton());

    const link = (await screen.findByRole("link", {
      name: /View uploaded file|عرض الملف المرفوع/,
    })) as HTMLAnchorElement;
    // `crUrl` comes back resolved — no second call and no signing on our side.
    expect(link.href).toBe(mockCompanyDocs.crUrl);
  });

  it("accepts a photographed CR, not only a PDF", async () => {
    render(<AccountPage />);
    const input = await waitFor(() => {
      const el = document.querySelectorAll('input[type="file"]')[0];
      if (!el) throw new Error("file input not mounted yet");
      return el as HTMLInputElement;
    });

    expect(input.accept).toContain("image/jpeg");
    expect(input.accept).toContain("image/png");
    expect(input.accept).toContain("application/pdf");
  });

  it("offers replace, never remove — the endpoint ignores a null", async () => {
    render(<AccountPage />);

    await pickCrFile();
    // An X here would clear the slot on screen and nowhere else: PUT
    // /me/company-docs merges partially, so `{crFileId: null}` is a no-op and
    // the file reappears on the next read.
    await waitFor(() => expect(screen.getAllByText(/Replace file|استبدال الملف/).length).toBeGreaterThan(0));
    expect(screen.queryByLabelText("remove")).toBeNull();
  });

  /**
   * §5 sequencing — the CR row's `expects` switch is still off. Requiring the
   * scan for completeness before every existing company has had a path to
   * upload one flags them all over something they cannot resolve, and an alarm
   * nobody can clear is one reviewers learn to scroll past.
   */
  it("does NOT gate documentsComplete on the scan yet", async () => {
    saveMockCompanyDocs({
      authorizationLetterFileId: "file_a",
      vatCertificateFileId: "file_v",
      operatorLicenseFileId: "file_o",
    });

    expect(mockCompanyDocs.crFileId).toBeNull();
    expect(mockCompanyDocs.complete).toBe(true);
  });
});
