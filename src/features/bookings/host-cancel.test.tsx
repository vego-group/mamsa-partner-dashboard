import { describe, it, expect, afterEach, vi } from "vitest";
import { render, screen, waitFor, cleanup, fireEvent } from "@testing-library/react";
import { BookingDetail } from "@/features/bookings/components/booking-detail";
import { api, ApiError } from "@/lib/api/client";
import { dict } from "@/lib/i18n";
import { formatCurrency } from "@/lib/format";
import type { Booking } from "@/types";

const b = dict.ar.bookings;
const money = (n: number) => formatCurrency(n, "ar");

const inDays = (n: number) => new Date(Date.now() + n * 86_400_000).toISOString();

/** 900 SAR total — the same figure the backend note works through end to end. */
const booking = (patch: Partial<Booking> = {}): Booking => ({
  id: "b_test",
  code: "BK-9001",
  unitId: "u_1",
  unitName: "شقة تجريبية",
  unitThumb: "",
  guestName: "ضيف تجريبي",
  guestPhone: "+966500000000",
  checkIn: inDays(10),
  checkOut: inDays(13),
  nights: 3,
  guests: 2,
  status: "confirmed",
  financials: { total: 900, netBase: 782.61, vat: 117.39, commission: 15.65, partnerShare: 766.96 },
  ...patch,
});

const noop = () => {};
const open = (props: Partial<Parameters<typeof BookingDetail>[0]> = {}) =>
  render(<BookingDetail booking={booking()} onClose={noop} onCancelled={noop} {...props} />);

const cancelControl = () => screen.queryByRole("button", { name: new RegExp(b.unableToHost) });
const continueButton = () => screen.getByRole("button", { name: b.continue }) as HTMLButtonElement;
const confirmButton = () => screen.getByRole("button", { name: b.confirmCancellation });
const reasonBox = () => screen.getByPlaceholderText(b.reasonPlaceholder);

/** details → reason → confirm, with `text` as the guest-facing reason. */
function walkToConfirm(text = "الوحدة تعرضت لتسريب مياه") {
  fireEvent.click(cancelControl()!);
  fireEvent.change(reasonBox(), { target: { value: text } });
  fireEvent.click(continueButton());
}

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

/**
 * §2 — the API refuses anything else (409 CHECKIN_PASSED / BOOKING_NOT_CANCELLABLE).
 * Letting the partner discover a correct refusal as an error is worse than
 * never offering the control.
 */
describe("the cancel control is offered only where it can succeed", () => {
  it("shows it for a confirmed booking whose check-in is still ahead", () => {
    open();
    expect(cancelControl()).not.toBeNull();
  });

  it("hides it once check-in has passed", () => {
    open({ booking: booking({ checkIn: inDays(-1), checkOut: inDays(2) }) });
    expect(cancelControl()).toBeNull();
  });

  it("hides it on an unpaid booking — there is no money to return", () => {
    open({ booking: booking({ status: "pending_payment" }) });
    expect(cancelControl()).toBeNull();
  });
});

/**
 * §3 — the partner is about to give up money. Each of these is a fact they
 * cannot recover from, and all three must be on screen BEFORE they type.
 */
describe("the confirmation names the cost before the partner commits", () => {
  it("states the exact refund, that the partner gets nothing, and that it is final", () => {
    open();
    fireEvent.click(cancelControl()!);

    expect(screen.getByText(b.refundFullNotice(money(900)))).toBeDefined();
    expect(screen.getByText(b.partnerGetsNothing)).toBeDefined();
    expect(screen.getByText(b.irreversible)).toBeDefined();
  });

  it("puts the partner's take at a flat zero, not a deduction", () => {
    open();
    walkToConfirm();

    const earnings = screen.getByText(b.yourEarnings).parentElement!;
    expect(earnings.textContent).toContain(money(0));
    // The partner's share is forfeited whole — showing it here would read as
    // "this is what you still get".
    expect(earnings.textContent).not.toContain(money(766.96));
  });
});

/**
 * §3 — the reason is REQUIRED and reaches the guest, so it is free text the
 * partner writes, and it must arrive at the API exactly as typed.
 */
describe("the cancellation reason", () => {
  it("keeps the flow shut until the reason has real content", () => {
    open();
    fireEvent.click(cancelControl()!);
    expect(continueButton().disabled).toBe(true);

    fireEvent.change(reasonBox(), { target: { value: "لا" } });
    expect(continueButton().disabled).toBe(true);

    fireEvent.change(reasonBox(), { target: { value: "صيانة طارئة" } });
    expect(continueButton().disabled).toBe(false);
  });

  it("sends the partner's own wording verbatim", async () => {
    const spy = vi.spyOn(api, "hostCancel").mockResolvedValue(cancelledResponse());
    open();
    walkToConfirm("انفجرت ماسورة المياه في الوحدة");
    fireEvent.click(confirmButton());

    await waitFor(() => expect(spy).toHaveBeenCalled());
    expect(spy.mock.calls[0][1]).toBe("انفجرت ماسورة المياه في الوحدة");
  });
});

/** §1.1 — one key per attempt, reused across retries of that attempt. */
describe("idempotency", () => {
  it("retries the same attempt under the same key, so no second refund is issued", async () => {
    const spy = vi
      .spyOn(api, "hostCancel")
      .mockRejectedValueOnce(new ApiError(502, "رفض مزود الدفع الاسترداد.", "REFUND_FAILED"))
      .mockResolvedValueOnce(cancelledResponse());

    open();
    walkToConfirm();
    fireEvent.click(confirmButton());

    const retry = await screen.findByRole("button", { name: dict.ar.common.retry });
    fireEvent.click(retry);

    await waitFor(() => expect(spy).toHaveBeenCalledTimes(2));
    const [firstKey, secondKey] = spy.mock.calls.map((c) => c[2]);
    expect(firstKey).toBeTruthy();
    expect(secondKey).toBe(firstKey);
  });
});

/**
 * §5 — the API names the cause precisely, in Arabic, for the partner. A generic
 * "try again" over the top of it cost a debugging round on the Vue app.
 */
describe("errors", () => {
  it("renders REFUND_FAILED's own message and offers a retry — never a cancel-anyway", async () => {
    const onCancelled = vi.fn();
    vi.spyOn(api, "hostCancel").mockRejectedValue(
      new ApiError(502, "تعذّر تنفيذ الاسترداد لدى مزود الدفع.", "REFUND_FAILED"),
    );

    open({ onCancelled });
    walkToConfirm();
    fireEvent.click(confirmButton());

    expect(await screen.findByText("تعذّر تنفيذ الاسترداد لدى مزود الدفع.")).toBeDefined();
    expect(screen.getByText(b.refundFailedHint)).toBeDefined();
    expect(screen.getByRole("button", { name: dict.ar.common.retry })).toBeDefined();
    // Nothing was cancelled and no money moved — the booking must not be
    // reported back as cancelled.
    expect(onCancelled).not.toHaveBeenCalled();
  });

  it("treats a booking that moved on as unretryable and refetches the list", async () => {
    const onStale = vi.fn();
    vi.spyOn(api, "hostCancel").mockRejectedValue(
      new ApiError(409, "لم يعد هذا الحجز قابلاً للإلغاء.", "BOOKING_NOT_CANCELLABLE"),
    );

    open({ onStale });
    walkToConfirm();
    fireEvent.click(confirmButton());

    expect(await screen.findByText("لم يعد هذا الحجز قابلاً للإلغاء.")).toBeDefined();
    await waitFor(() => expect(onStale).toHaveBeenCalled());
    // Retrying a 409 only reproduces it.
    expect(screen.queryByRole("button", { name: dict.ar.common.retry })).toBeNull();
  });

  it("puts a VALIDATION message inline on the field that caused it", async () => {
    vi.spyOn(api, "hostCancel").mockRejectedValue(
      new ApiError(400, "خطأ في البيانات", "VALIDATION", { reason: "سبب الإلغاء طويل جدًا." }),
    );

    open();
    walkToConfirm();
    fireEvent.click(confirmButton());

    expect(await screen.findByText("سبب الإلغاء طويل جدًا.")).toBeDefined();
    // Back on the reason step, with what they wrote still there to edit.
    expect((reasonBox() as HTMLTextAreaElement).value).toBe("الوحدة تعرضت لتسريب مياه");
  });
});

/**
 * §4 — `processing` is the normal, healthy first state: the gateway took the
 * refund and settles asynchronously. Rendering it as a warning tells the
 * partner something went wrong when nothing did.
 */
describe("the refund result", () => {
  it("reads a processing refund as success", async () => {
    vi.spyOn(api, "hostCancel").mockResolvedValue(cancelledResponse());

    open();
    walkToConfirm();
    fireEvent.click(confirmButton());

    expect(await screen.findByText(b.cancelledTitle)).toBeDefined();
    expect(screen.getByText(b.refundProcessingNotice(money(900)))).toBeDefined();
    expect(screen.getByText(b.refundBankTiming)).toBeDefined();
  });

  it("shows the API's refund amount, never one recomputed from the booking", async () => {
    // A partial capture: the API refunds what is still owed, which need not
    // equal `financials.total`. Any client-side arithmetic shows 900 here.
    vi.spyOn(api, "hostCancel").mockResolvedValue(cancelledResponse({ refundAmount: 640 }));

    open();
    walkToConfirm();
    fireEvent.click(confirmButton());

    expect(await screen.findByText(b.refundProcessingNotice(money(640)))).toBeDefined();
    expect(screen.queryByText(b.refundProcessingNotice(money(900)))).toBeNull();
  });

  it("renders the booking straight from the response, without waiting on a refetch", async () => {
    vi.spyOn(api, "hostCancel").mockResolvedValue(cancelledResponse());
    // The parent never feeds the update back through props here.
    open({ onCancelled: noop });
    walkToConfirm();
    fireEvent.click(confirmButton());

    expect(await screen.findByText(b.cancelledTitle)).toBeDefined();
  });
});

/** The full booking the endpoint returns once it has cancelled and refunded. */
function cancelledResponse(patch: Partial<NonNullable<Booking["cancellation"]>> = {}): Booking {
  return booking({
    status: "cancelled",
    cancellation: {
      type: "host",
      reason: "الوحدة تعرضت لتسريب مياه",
      date: new Date().toISOString(),
      refundAmount: 900,
      refundStatus: "processing",
      ...patch,
    },
  });
}
