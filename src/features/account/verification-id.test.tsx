import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, waitFor, cleanup } from "@testing-library/react";
import AccountPage from "@/app/(dashboard)/account/page";
import { PropertyWizard } from "@/features/units/components/property-wizard";
import { mockPartner } from "@/mocks/data";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn(), back: vi.fn() }),
}));

/**
 * 🔴 REGRESSION GUARD — the "verified blank" identity field.
 *
 * Live `GET /me` returns `verificationId: null` for partners onboarded straight
 * through OTP (they never hit the registration step that collects
 * `national_id`/`cr_number`), even while `accountState` is "approved". Both
 * surfaces used to render that null as an empty box — and the wizard put an
 * approved-green checkmark next to it, so a missing ID looked verified.
 */
const partnerSeed = { ...mockPartner };

beforeEach(() => {
  Object.assign(mockPartner, partnerSeed, { accountType: "individual", verificationId: null });
});
afterEach(cleanup);

describe("a partner with no ID on file", () => {
  it("says so on the account page instead of showing a blank field", async () => {
    render(<AccountPage />);

    const field = (await screen.findByPlaceholderText(
      /Not on file|غير مسجَّل/,
    )) as HTMLInputElement;
    expect(field.value).toBe("");
    expect(field.readOnly).toBe(true);
  });

  it("warns in the wizard rather than showing the verified checkmark", async () => {
    render(<PropertyWizard />);

    await screen.findByText(/No National ID on file|لم يُسجَّل رقم الهوية على حسابك/);
  });

  it("still shows the ID and the checkmark when one IS on file", async () => {
    mockPartner.verificationId = "1012345678";
    const { container } = render(<PropertyWizard />);

    await screen.findByText("1012345678");
    await waitFor(() =>
      expect(
        screen.queryByText(/No National ID on file|لم يُسجَّل رقم الهوية على حسابك/),
      ).toBeNull(),
    );
    expect(container).toBeTruthy();
  });
});
