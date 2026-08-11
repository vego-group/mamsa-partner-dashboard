import { describe, it, expect } from "vitest";
import { normalizeNotificationHref } from "@/lib/notifications";

describe("normalizeNotificationHref", () => {
  it("strips the backend's /partner prefix", () => {
    expect(normalizeNotificationHref("/partner/units/19/edit")).toBe("/units/19/edit");
    expect(normalizeNotificationHref("/partner")).toBe("/overview");
  });

  it("keeps hrefs that already match a route", () => {
    expect(normalizeNotificationHref("/calendar")).toBe("/calendar");
    expect(normalizeNotificationHref("/units/u_4")).toBe("/units/u_4");
  });

  it("reduces an absolute URL to its path", () => {
    expect(normalizeNotificationHref("https://partner.mamsaa.com/calendar")).toBe("/calendar");
  });

  it("maps the backend's dashboard home to /overview", () => {
    expect(normalizeNotificationHref("/partner/dashboard")).toBe("/overview");
    expect(normalizeNotificationHref("/dashboard")).toBe("/overview");
  });

  it("turns a booking deep-link into a bookings query param (detail is a modal)", () => {
    expect(normalizeNotificationHref("/bookings/482")).toBe("/bookings?booking=482");
    expect(normalizeNotificationHref("/partner/bookings/482")).toBe("/bookings?booking=482");
    expect(normalizeNotificationHref("https://partner.mamsaa.com/bookings/b_1")).toBe("/bookings?booking=b_1");
  });

  it("leaves the bookings list itself alone", () => {
    expect(normalizeNotificationHref("/bookings")).toBe("/bookings");
  });

  it("falls back to /overview for an empty href", () => {
    expect(normalizeNotificationHref("")).toBe("/overview");
  });
});
