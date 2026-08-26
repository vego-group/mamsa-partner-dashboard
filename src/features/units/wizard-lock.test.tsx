import { describe, it, expect, afterEach, vi } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { PropertyWizard } from "@/features/units/components/property-wizard";
import { mockUnits } from "@/mocks/data";
import { dict } from "@/lib/i18n";
import type { Unit } from "@/types";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn(), back: vi.fn() }),
}));

const w = dict.ar.wiz;

afterEach(cleanup);

const unitWith = (status: Unit["status"]): Unit => ({ ...mockUnits[0], status });

/**
 * 🔴 REGRESSION GUARD — the unguarded edit route.
 *
 * `units/page.tsx` gives a unit pending review an eye and no pencil, which reads as "this
 * cannot be edited". The route never enforced it: typing `/units/{id}/edit` opened a fully
 * editable wizard on a unit the server is mid-review on, and saving from there PATCHes it.
 *
 * Locking beats refusing the page — the partner can still read what they submitted, and
 * the description preview is the reason they would come here at all.
 */
describe("a unit sitting in review", () => {
  it("opens read-only, and says why", () => {
    const { container } = render(<PropertyWizard existing={unitWith("pending")} />);

    expect(screen.getByText(w.lockedForReview)).toBeTruthy();
    expect(container.querySelector("fieldset")?.disabled).toBe(true);
  });

  it("cannot be saved or resubmitted from the locked form", () => {
    render(<PropertyWizard existing={unitWith("pending")} />);

    const save = screen.getByRole("button", { name: new RegExp(w.saveDraft) }) as HTMLButtonElement;
    expect(save.disabled).toBe(true);
  });

  it("leaves a draft, a rejected and an approved unit editable", () => {
    for (const status of ["draft", "rejected", "approved"] as const) {
      const { container } = render(<PropertyWizard existing={unitWith(status)} />);

      expect(screen.queryByText(w.lockedForReview)).toBeNull();
      expect(container.querySelector("fieldset")?.disabled).toBe(false);
      cleanup();
    }
  });

  it("still shows the description the way a guest will read it", () => {
    // The whole point of not refusing the page: mockUnits[0] carries a formatted
    // description, and a partner waiting on review can still check how it renders.
    const unit = { ...unitWith("pending"), description: "## عنوان\n- نقطة" };
    const { container } = render(<PropertyWizard existing={unit} />);

    // Step 2 owns the description; the wizard opens on step 1, so the field is not
    // mounted yet. What must hold here is that the lock did not remove the preview
    // machinery — the editor drops its tab strip rather than rendering a dead one.
    expect(screen.queryAllByRole("tab")).toHaveLength(0);
    expect(container.querySelector("fieldset")?.disabled).toBe(true);
  });
});
