import { describe, it, expect, afterEach, beforeEach, vi } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import { ApiError } from "@/lib/api/client";
import {
  LICENSE_ERROR_CODES,
  licenseErrorMessage,
  licenseIssueMessage,
  validateLicenseFields,
} from "@/features/units/lib/license";
import { PropertyWizard } from "@/features/units/components/property-wizard";
import { mockUnits, saveMockCompanyDocs } from "@/mocks/data";
import { dict } from "@/lib/i18n";
import type { Unit } from "@/types";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn(), back: vi.fn() }),
}));

const w = dict.ar.wiz;

afterEach(cleanup);

/**
 * FE-5 §2 — the two rules the form can see for itself. A request that breaks
 * either is refused before it is sent.
 */
describe("validateLicenseFields", () => {
  it("requires a count of at least one on a tourist facility licence", () => {
    expect(validateLicenseFields({ licenseType: "tourist_facility", licensedUnitsCount: null })).toBe("count_required");
    expect(validateLicenseFields({ licenseType: "tourist_facility", licensedUnitsCount: 0 })).toBe("count_required");
    expect(validateLicenseFields({ licenseType: "tourist_facility", licensedUnitsCount: 2.5 })).toBe("count_required");
    expect(validateLicenseFields({ licenseType: "tourist_facility", licensedUnitsCount: 8 })).toBeNull();
  });

  it("refuses a count above one on a private licence, and accepts one or none", () => {
    expect(validateLicenseFields({ licenseType: "private_hospitality", licensedUnitsCount: 2 })).toBe(
      "count_not_applicable",
    );
    expect(validateLicenseFields({ licenseType: "private_hospitality", licensedUnitsCount: 1 })).toBeNull();
    expect(validateLicenseFields({ licenseType: "private_hospitality", licensedUnitsCount: null })).toBeNull();
  });

  it("treats an unclassified unit as fine — null is the normal state, not an error", () => {
    expect(validateLicenseFields({ licenseType: null, licensedUnitsCount: null })).toBeNull();
  });

  it("gives each issue its own message", () => {
    expect(licenseIssueMessage("count_required", w)).toBe(w.licenseErrCountRequired);
    expect(licenseIssueMessage("count_not_applicable", w)).toBe(w.licenseErrCountNotApplicable);
  });
});

/**
 * FE-5 §3 — six codes, six messages. Branch on `code`, never on the Arabic
 * `message`, and never let the English code reach the screen.
 */
describe("licenseErrorMessage", () => {
  const err = (code: string, meta?: Record<string, unknown>) => new ApiError(422, "نص عربي قابل للتغيير", code, undefined, meta);

  it("maps every licence code to a distinct dictionary message that never contains the code", () => {
    const messages = LICENSE_ERROR_CODES.map((code) => licenseErrorMessage(err(code, { licensed_units_count: 8 }), w));
    for (const [i, m] of messages.entries()) {
      expect(m, LICENSE_ERROR_CODES[i]).toBeTruthy();
      expect(m).not.toContain(LICENSE_ERROR_CODES[i]);
      expect(m).not.toContain("نص عربي قابل للتغيير");
    }
    expect(new Set(messages).size).toBe(LICENSE_ERROR_CODES.length);
  });

  it("puts the licensed count from meta into the quantity message", () => {
    expect(licenseErrorMessage(err("QUANTITY_EXCEEDS_LICENSED_UNITS", { licensed_units_count: 8 }), w)).toBe(
      w.licenseErrQuantityExceeds(8),
    );
    expect(licenseErrorMessage(err("QUANTITY_EXCEEDS_LICENSED_UNITS", { licensed_units_count: 8 }), w)).toContain("8");
    // Accepts the camelCase twin and a numeric string; falls back to the number-free wording otherwise.
    expect(licenseErrorMessage(err("QUANTITY_EXCEEDS_LICENSED_UNITS", { licensedUnitsCount: "3" }), w)).toBe(
      w.licenseErrQuantityExceeds(3),
    );
    expect(licenseErrorMessage(err("QUANTITY_EXCEEDS_LICENSED_UNITS"), w)).toBe(w.licenseErrQuantityExceeds(null));
  });

  it("does not translate the Arabic message itself — an unknown code stays the caller's problem", () => {
    expect(licenseErrorMessage(err("VALIDATION"), w)).toBeNull();
    expect(licenseErrorMessage(new Error("boom"), w)).toBeNull();
  });

  it("counts units in Arabic the way a reader expects", () => {
    expect(w.licenseErrQuantityExceeds(1)).toContain("وحدة واحدة");
    expect(w.licenseErrQuantityExceeds(2)).toContain("وحدتين");
    expect(w.licenseErrQuantityExceeds(8)).toContain("8 وحدات");
    expect(w.licenseErrQuantityExceeds(12)).toContain("12 وحدة");
  });
});

/**
 * The licence rejections come back in the flat `{ success, message, code, meta }`
 * envelope, not the nested `{ error: { … } }` one. Both must surface as an
 * ApiError with `code` and `meta` intact.
 */
describe("the API client reads the flat 422 envelope", () => {
  const originalUseMock = process.env.NEXT_PUBLIC_USE_MOCK;

  beforeEach(() => {
    process.env.NEXT_PUBLIC_USE_MOCK = "false";
    vi.resetModules();
  });

  afterEach(() => {
    if (originalUseMock === undefined) delete process.env.NEXT_PUBLIC_USE_MOCK;
    else process.env.NEXT_PUBLIC_USE_MOCK = originalUseMock;
    vi.unstubAllGlobals();
  });

  it("surfaces code and meta from a flat envelope", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 422,
        statusText: "Unprocessable Content",
        json: async () => ({
          success: false,
          message: "العدد أكبر من المرخّص",
          code: "QUANTITY_EXCEEDS_LICENSED_UNITS",
          meta: { licensed_units_count: 8 },
        }),
      }),
    );
    const { api, ApiError: FreshApiError } = await import("@/lib/api/client");

    const e = await api.updateUnit("u_1", { licenseType: "tourist_facility", licensedUnitsCount: 9 }).catch((x) => x);
    expect(e).toBeInstanceOf(FreshApiError);
    expect(e.status).toBe(422);
    expect(e.code).toBe("QUANTITY_EXCEEDS_LICENSED_UNITS");
    expect(e.meta).toEqual({ licensed_units_count: 8 });
  });

  it("still reads the nested envelope", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 409,
        statusText: "Conflict",
        json: async () => ({ error: { code: "COMPANY_DOCS_INCOMPLETE", message: "بيانات الشركة غير مكتملة." } }),
      }),
    );
    const { api } = await import("@/lib/api/client");

    const e = await api.submitUnit("u_1").catch((x) => x);
    expect(e.code).toBe("COMPANY_DOCS_INCOMPLETE");
    expect(e.message).toBe("بيانات الشركة غير مكتملة.");
    expect(e.meta).toBeUndefined();
  });
});

/**
 * FE-5 §1 — the count field exists only for a tourist facility licence, and
 * is emptied the moment the type changes to private.
 */
describe("the licence fields in the wizard", () => {
  const draft: Unit = { ...mockUnits[0], status: "draft", licenseType: null, licensedUnitsCount: null };

  // The mock partner is a company; step 1 is also gated on its payout docs, so
  // complete them here and let Next answer for the licence fields alone.
  beforeEach(() => {
    saveMockCompanyDocs({
      cr: "1010101010",
      iban: "SA0380000000608010167519",
      authorizationLetterFileId: "file_auth",
      vatCertificateFileId: "file_vat",
      operatorLicenseFileId: "file_lic",
    });
  });
  afterEach(() => {
    saveMockCompanyDocs({ cr: "", iban: "", authorizationLetterFileId: null, vatCertificateFileId: null, operatorLicenseFileId: null });
  });

  async function openStepOne() {
    render(<PropertyWizard existing={draft} />);
    // Step 1 shows a skeleton until the partner profile loads, and Next stays
    // disabled until the company-docs request after it settles too.
    await screen.findByText(w.tourismLicenseNo);
    await screen.findByText(w.companyDocsComplete);
    const select = screen.getByDisplayValue(w.licenseTypeUnspecified) as HTMLSelectElement;
    return { select };
  }

  it("opens an unclassified unit on the blank option with an informational note, no error or warning", async () => {
    const { select } = await openStepOne();
    expect(select.value).toBe("");
    expect(screen.queryByText(w.licensedUnitsCount)).toBeNull();
    expect(screen.queryByText(w.licenseErrCountRequired)).toBeNull();
    // Item 4: the note is there, and it is not dressed as a warning.
    const note = screen.getByText(w.licenseUnclassifiedNote);
    expect(note.closest("div")?.className).not.toMatch(/status-(pending|rejected)/);
  });

  it("drops the note once a type is chosen, and never shows it on a classified unit", async () => {
    const { select } = await openStepOne();
    fireEvent.change(select, { target: { value: "private_hospitality" } });
    expect(screen.queryByText(w.licenseUnclassifiedNote)).toBeNull();
  });

  it("shows the count only for a tourist facility, blocks Next until it is filled, and clears it on switch to private", async () => {
    const { select } = await openStepOne();
    const next = screen.getByRole("button", { name: new RegExp(dict.ar.common.next) }) as HTMLButtonElement;

    fireEvent.change(select, { target: { value: "tourist_facility" } });
    expect(screen.getByText(w.licensedUnitsCount)).toBeTruthy();
    expect(screen.getByText(w.licenseErrCountRequired)).toBeTruthy();
    expect(next.disabled).toBe(true);

    const count = screen.getByPlaceholderText("8") as HTMLInputElement;
    fireEvent.change(count, { target: { value: "8" } });
    expect(screen.queryByText(w.licenseErrCountRequired)).toBeNull();
    expect(next.disabled).toBe(false);

    fireEvent.change(select, { target: { value: "private_hospitality" } });
    expect(screen.queryByText(w.licensedUnitsCount)).toBeNull();
    expect(screen.queryByText(w.licenseErrCountNotApplicable)).toBeNull();
    expect(next.disabled).toBe(false);

    // Back to tourist: the count was really cleared, not just hidden.
    fireEvent.change(select, { target: { value: "tourist_facility" } });
    expect((screen.getByPlaceholderText("8") as HTMLInputElement).value).toBe("");
  });

  it("pre-fills a classified unit", async () => {
    render(<PropertyWizard existing={{ ...draft, licenseType: "tourist_facility", licensedUnitsCount: 8 }} />);
    await screen.findByText(w.tourismLicenseNo);
    expect((screen.getByPlaceholderText("8") as HTMLInputElement).value).toBe("8");
    expect(screen.queryByText(w.licenseErrCountRequired)).toBeNull();
    expect(screen.queryByText(w.licenseUnclassifiedNote)).toBeNull();
  });
});
