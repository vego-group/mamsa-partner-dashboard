import { describe, it, expect, afterEach, beforeEach, vi } from "vitest";
import { render, screen, cleanup, fireEvent, waitFor } from "@testing-library/react";
import { api, ApiError } from "@/lib/api/client";
import {
  expansionErrorMessage,
  expansionPlanLine,
  expansionResultMessage,
  groupSizeOf,
  planExpansion,
} from "@/features/units/lib/building";
import { BuildingCard } from "@/features/units/components/building-card";
import { mockUnits } from "@/mocks/data";
import { dict } from "@/lib/i18n";
import type { Unit } from "@/types";

const t = dict.ar;
const b = t.building;

afterEach(cleanup);

const building: Unit = { ...mockUnits[1], licenseType: "tourist_facility", licensedUnitsCount: 8, groupSize: 5 };

/**
 * FE-7 — `count` is the building's total afterwards, never an increment. The
 * plan is what the live line and the button are built from.
 */
describe("planExpansion", () => {
  const plan = (target: string | number | null, licensed: number | null = 8) => planExpansion({ current: 5, target, licensed });

  it("adds the difference to the current size, not the number itself", () => {
    expect(plan("8")).toEqual({ kind: "grow", added: 3 });
    expect(plan(6)).toEqual({ kind: "grow", added: 1 });
  });

  it("refuses the current size and anything below it", () => {
    expect(plan("5")).toEqual({ kind: "same" });
    expect(plan("3")).toEqual({ kind: "shrink" });
    expect(plan("1")).toEqual({ kind: "shrink" });
  });

  it("refuses a total above the licence before any request, and ignores the cap when the count is unknown", () => {
    expect(plan("9")).toEqual({ kind: "exceeds_license", licensed: 8 });
    expect(plan("8")).toEqual({ kind: "grow", added: 3 });
    expect(plan("40", null)).toEqual({ kind: "grow", added: 35 });
  });

  it("treats nothing typed, decimals and zero as their own cases", () => {
    expect(plan("")).toEqual({ kind: "empty" });
    expect(plan(null)).toEqual({ kind: "empty" });
    expect(plan("   ")).toEqual({ kind: "empty" });
    expect(plan("7.5")).toEqual({ kind: "invalid" });
    expect(plan("0")).toEqual({ kind: "invalid" });
    expect(plan("abc")).toEqual({ kind: "invalid" });
  });

  it("reads a standalone unit as one, with or without the field", () => {
    expect(groupSizeOf({ groupSize: 1 })).toBe(1);
    expect(groupSizeOf({})).toBe(1);
    expect(groupSizeOf({ groupSize: 0 })).toBe(1);
    expect(groupSizeOf({ groupSize: 5 })).toBe(5);
  });
});

describe("the live line", () => {
  it("states the current size, the typed total and the difference", () => {
    expect(expansionPlanLine({ kind: "grow", added: 3 }, 5, 8, b)).toBe("مبناك فيه 5 الآن. إدخال 8 يضيف 3.");
    expect(expansionPlanLine({ kind: "same" }, 5, 5, b)).toBe(b.noChange);
    expect(expansionPlanLine({ kind: "shrink" }, 5, 3, b)).toBe(b.shrinkBlocked);
    expect(expansionPlanLine({ kind: "exceeds_license", licensed: 8 }, 5, 9, b)).toBe(b.exceedsLicense(8));
    expect(expansionPlanLine({ kind: "empty" }, 5, 0, b)).toBe(b.currentLine(5));
  });

  it("counts apartments in Arabic the way a reader expects", () => {
    expect(b.summary(5)).toBe("مبنى — 5 شقق");
    expect(b.summary(2)).toContain("شقتين");
    expect(b.summary(12)).toContain("12 شقة");
    expect(b.successAdded(1, 6)).toContain("شقة واحدة");
    expect(b.exceedsLicense(8)).toBe("تصريحك يغطي 8 وحدات فقط.");
  });
});

/**
 * Two envelopes, two meanings. A 400 `VALIDATION` is about the field; a 422
 * licence code is about the permit. Neither the server's Arabic message nor
 * the English code ever reaches the screen.
 */
describe("expansionErrorMessage", () => {
  const SERVER_MSG = "نص عربي من السيرفر";
  const err = (status: number, code: string, meta?: Record<string, unknown>) =>
    new ApiError(status, SERVER_MSG, code, undefined, meta);

  it("routes a 400 VALIDATION to the field, not to a licence message", () => {
    const e = expansionErrorMessage(new ApiError(400, SERVER_MSG, "VALIDATION", { count: "مطلوب" }), t);
    expect(e).toEqual({ scope: "field", text: b.invalidCount });
    expect(e.text).not.toBe(t.wiz.licenseErrMultiUnitRequiresFacility);
  });

  it("gives the three licence codes three distinct form messages", () => {
    const codes = ["MULTI_UNIT_REQUIRES_FACILITY_LICENSE", "QUANTITY_EXCEEDS_LICENSED_UNITS", "MULTI_UNIT_DISABLED"];
    const out = codes.map((c) => expansionErrorMessage(err(422, c, { licensed_units_count: 8 }), t));
    for (const [i, e] of out.entries()) {
      expect(e.scope, codes[i]).toBe("form");
      expect(e.text).not.toContain(codes[i]);
      expect(e.text).not.toContain(SERVER_MSG);
    }
    expect(new Set(out.map((e) => e.text)).size).toBe(3);
  });

  it("puts the licensed count from meta into the quantity message", () => {
    expect(expansionErrorMessage(err(422, "QUANTITY_EXCEEDS_LICENSED_UNITS", { licensed_units_count: 8 }), t).text).toBe(
      t.wiz.licenseErrQuantityExceeds(8),
    );
    expect(expansionErrorMessage(err(422, "QUANTITY_EXCEEDS_LICENSED_UNITS"), t).text).toBe(
      t.wiz.licenseErrQuantityExceeds(null),
    );
  });

  it("names a missing unit and falls back to a generic line for anything else", () => {
    expect(expansionErrorMessage(err(404, "NOT_FOUND"), t).text).toBe(b.errNotFound);
    expect(expansionErrorMessage(err(500, "HTTP_500"), t).text).toBe(b.errGeneric);
    expect(expansionErrorMessage(new Error("boom"), t).text).toBe(b.errGeneric);
  });

  it("makes added = 0 a different sentence from a real addition", () => {
    expect(expansionResultMessage({ groupSize: 8, added: 3 }, b)).toBe("تمت إضافة 3 شقق. مبناك الآن 8 شقق.");
    expect(expansionResultMessage({ groupSize: 8, added: 0 }, b)).toBe("لم يطرأ تغيير — مبناك بالفعل 8 شقق.");
  });
});

/**
 * The route answers in the nested `{ error: { code } }` envelope — a 400 for
 * the body, a 422 for the licence — and the success body carries fields the
 * dashboard must ignore. All of that is read in one place in the client.
 */
describe("the API client on POST /units/:id/apartments", () => {
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

  function stubFetch(status: number, body: unknown) {
    const fetchMock = vi.fn().mockResolvedValue({ ok: status < 400, status, statusText: "x", json: async () => body });
    vi.stubGlobal("fetch", fetchMock);
    return fetchMock;
  }

  it("sends { count } as the body and keeps only groupSize and added from the response", async () => {
    const fetchMock = stubFetch(200, {
      groupId: "01K",
      groupSize: 8,
      added: 3,
      units: [{ id: "u_30", apartmentNo: "1", status: "approved" }],
      message: "تمت إضافة 3 وحدة إلى المبنى",
    });
    const { api: fresh } = await import("@/lib/api/client");
    const res = await fresh.expandBuilding("u_2", 8);
    expect(res).toEqual({ groupSize: 8, added: 3 });
    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toMatch(/\/units\/u_2\/apartments$/);
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body)).toEqual({ count: 8 });
  });

  it("surfaces a 400 VALIDATION from the nested envelope with its fields", async () => {
    stubFetch(400, { error: { code: "VALIDATION", message: "بيانات غير صالحة", fields: { count: "مطلوب" } } });
    const { api: fresh } = await import("@/lib/api/client");
    const e = await fresh.expandBuilding("u_2", 8).catch((x) => x);
    expect(e.status).toBe(400);
    expect(e.code).toBe("VALIDATION");
    expect(e.fields).toEqual({ count: "مطلوب" });
  });

  it("surfaces a 422 licence code from the nested envelope, with meta inside error or beside it", async () => {
    stubFetch(422, { error: { code: "QUANTITY_EXCEEDS_LICENSED_UNITS", message: "x", meta: { licensed_units_count: 8 } } });
    let { api: fresh } = await import("@/lib/api/client");
    let e = await fresh.expandBuilding("u_2", 9).catch((x) => x);
    expect(e.status).toBe(422);
    expect(e.code).toBe("QUANTITY_EXCEEDS_LICENSED_UNITS");
    expect(e.meta).toEqual({ licensed_units_count: 8 });

    vi.resetModules();
    stubFetch(422, { error: { code: "QUANTITY_EXCEEDS_LICENSED_UNITS", message: "x" }, meta: { licensed_units_count: 8 } });
    ({ api: fresh } = await import("@/lib/api/client"));
    e = await fresh.expandBuilding("u_2", 9).catch((x) => x);
    expect(e.meta).toEqual({ licensed_units_count: 8 });
  });

  it("refuses a success body without the two numbers instead of rendering blanks", async () => {
    stubFetch(200, { message: "ok" });
    const { api: fresh } = await import("@/lib/api/client");
    const e = await fresh.expandBuilding("u_2", 8).catch((x) => x);
    expect(e.code).toBe("MALFORMED_RESPONSE");
  });
});

describe("the building card", () => {
  it("renders nothing for a standalone unit on a private licence — the answer there is a definite no", () => {
    const { container } = render(
      <BuildingCard unit={{ ...building, groupSize: 1, licenseType: "private_hospitality", licensedUnitsCount: null }} onChange={vi.fn()} />,
    );
    expect(container.innerHTML).toBe("");
  });

  it("points an unclassified standalone unit at the licence type, quietly, with no button", () => {
    render(<BuildingCard unit={{ ...building, groupSize: undefined, licenseType: null, licensedUnitsCount: null }} onChange={vi.fn()} />);
    const note = screen.getByText(b.classifyFirst);
    expect(note.className).not.toMatch(/status-(pending|rejected)/);
    expect(screen.queryByRole("button")).toBeNull();
    expect(screen.queryByText(/مبنى —/)).toBeNull();
    expect(screen.queryByText(b.requiresFacility)).toBeNull();
  });

  it("keeps the licence line, not the classify hint, on an unclassified building", () => {
    render(<BuildingCard unit={{ ...building, licenseType: null, licensedUnitsCount: null }} onChange={vi.fn()} />);
    expect(screen.getByText("مبنى — 5 شقق")).toBeTruthy();
    expect(screen.getByText(b.requiresFacility)).toBeTruthy();
    expect(screen.queryByText(b.classifyFirst)).toBeNull();
  });

  it("shows the size and the licensed share of a building, with the button", () => {
    render(<BuildingCard unit={building} onChange={vi.fn()} />);
    expect(screen.getByText("مبنى — 5 شقق")).toBeTruthy();
    expect(screen.getByText(/5 من 8 مرخّصة/)).toBeTruthy();
    expect(screen.getByRole("button", { name: new RegExp(b.addApartments) })).toBeTruthy();
    expect(screen.queryByText(b.requiresFacility)).toBeNull();
  });

  it("hides the licensed share when the count is unknown", () => {
    render(<BuildingCard unit={{ ...building, licensedUnitsCount: null }} onChange={vi.fn()} />);
    expect(screen.getByText("مبنى — 5 شقق")).toBeTruthy();
    expect(screen.queryByText(/مرخّصة/)).toBeNull();
  });

  it("replaces the button with the licence line on a building without a facility licence", () => {
    render(<BuildingCard unit={{ ...building, licenseType: "private_hospitality", licensedUnitsCount: null }} onChange={vi.fn()} />);
    expect(screen.getByText("مبنى — 5 شقق")).toBeTruthy();
    expect(screen.getByText(b.requiresFacility)).toBeTruthy();
    expect(screen.queryByRole("button", { name: new RegExp(b.addApartments) })).toBeNull();
  });

  it("offers the button on a licensed standalone unit without calling it a building", () => {
    render(<BuildingCard unit={{ ...building, groupSize: 1 }} onChange={vi.fn()} />);
    expect(screen.queryByText(/مبنى —/)).toBeNull();
    expect(screen.getByRole("button", { name: new RegExp(b.addApartments) })).toBeTruthy();
  });

  it("says the licence is fully used instead of offering a button that can only be refused", () => {
    render(<BuildingCard unit={{ ...building, groupSize: 8 }} onChange={vi.fn()} />);
    expect(screen.getByText(b.capReached(8))).toBeTruthy();
    expect(screen.queryByRole("button", { name: new RegExp(b.addApartments) })).toBeNull();
  });
});

describe("the add-apartments dialog", () => {
  const originalGroupSize = mockUnits[1].groupSize;
  afterEach(() => {
    mockUnits[1].groupSize = originalGroupSize;
    vi.restoreAllMocks();
  });

  function openDialog(unit: Unit = building) {
    const onChange = vi.fn();
    render(<BuildingCard unit={unit} onChange={onChange} />);
    fireEvent.click(screen.getByRole("button", { name: new RegExp(b.addApartments) }));
    const input = screen.getByLabelText(b.totalLabel) as HTMLInputElement;
    const submit = screen.getByRole("button", { name: b.submit }) as HTMLButtonElement;
    const line = () => screen.getByTestId("expansion-line").textContent;
    return { input, submit, line, onChange };
  }

  it("labels the field as the building's total and recomputes the line on every change", () => {
    const { input, submit, line } = openDialog();
    expect(screen.getByText(b.totalLabel)).toBeTruthy();
    expect(line()).toBe(b.currentLine(5));
    expect(submit.disabled).toBe(true);

    fireEvent.change(input, { target: { value: "8" } });
    expect(line()).toBe("مبناك فيه 5 الآن. إدخال 8 يضيف 3.");
    expect(submit.disabled).toBe(false);

    fireEvent.change(input, { target: { value: "6" } });
    expect(line()).toBe("مبناك فيه 5 الآن. إدخال 6 يضيف 1.");
  });

  it("locks the button on the current size, below it, and above the licence — and sends nothing", () => {
    const spy = vi.spyOn(api, "expandBuilding");
    const { input, submit, line } = openDialog();

    fireEvent.change(input, { target: { value: "5" } });
    expect(line()).toBe(b.noChange);
    expect(submit.disabled).toBe(true);

    fireEvent.change(input, { target: { value: "3" } });
    expect(line()).toBe(b.shrinkBlocked);
    expect(submit.disabled).toBe(true);

    fireEvent.change(input, { target: { value: "9" } });
    expect(line()).toBe(b.exceedsLicense(8));
    expect(submit.disabled).toBe(true);

    fireEvent.click(submit);
    fireEvent.submit(input.closest("form") as HTMLFormElement);
    expect(spy).not.toHaveBeenCalled();
  });

  it("grows the mock building, reports the real number added, and hands the new size back", async () => {
    const { input, submit, onChange } = openDialog();
    fireEvent.change(input, { target: { value: "8" } });
    fireEvent.click(submit);
    const status = await screen.findByRole("status");
    expect(status.textContent).toBe("تمت إضافة 3 شقق. مبناك الآن 8 شقق.");
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ id: building.id, groupSize: 8 }));
    // The server's own Arabic message is not what the partner reads.
    expect(screen.queryByText(/وحدة إلى المبنى/)).toBeNull();
    expect(mockUnits[1].groupSize).toBe(8);
  });

  it("says nothing changed when the server adds zero, even though the request was sent", async () => {
    vi.spyOn(api, "expandBuilding").mockResolvedValue({ groupSize: 8, added: 0 });
    const { input, submit } = openDialog();
    fireEvent.change(input, { target: { value: "8" } });
    fireEvent.click(submit);
    const status = await screen.findByRole("status");
    expect(status.textContent).toBe("لم يطرأ تغيير — مبناك بالفعل 8 شقق.");
  });

  it("puts a 400 on the field and a 422 on the form", async () => {
    const spy = vi
      .spyOn(api, "expandBuilding")
      .mockRejectedValueOnce(new ApiError(400, "x", "VALIDATION", { count: "x" }))
      .mockRejectedValueOnce(new ApiError(422, "x", "QUANTITY_EXCEEDS_LICENSED_UNITS", undefined, { licensed_units_count: 6 }));
    const { input, submit, line } = openDialog({ ...building, licensedUnitsCount: null });

    fireEvent.change(input, { target: { value: "8" } });
    fireEvent.click(submit);
    await waitFor(() => expect(line()).toBe(b.invalidCount));
    expect(screen.queryByRole("alert")).toBeNull();

    fireEvent.change(input, { target: { value: "9" } });
    fireEvent.click(submit);
    const alert = await screen.findByRole("alert");
    expect(alert.textContent).toBe(t.wiz.licenseErrQuantityExceeds(6));
    expect(alert.textContent).not.toContain("QUANTITY_EXCEEDS");
    expect(spy).toHaveBeenCalledTimes(2);
    expect(spy).toHaveBeenLastCalledWith(building.id, 9);
  });
});
