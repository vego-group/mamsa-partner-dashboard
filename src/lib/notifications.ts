/**
 * Notification link handling (§8 + docs/booking-notifications-super-admin.md).
 *
 * `href` comes from the backend. This dashboard is served at the domain root
 * (`partner.mamsaa.com/units/...`), but the backend prefixes hrefs with
 * `/partner` (`/partner/units/19/edit`) — which matches no route here and
 * hard-404s. Normalize before navigating: drop an absolute origin, strip a
 * leading `/partner`, map the backend's `dashboard` home to `/overview`, and
 * turn a booking deep-link into `/bookings?booking=<id>` — booking detail is a
 * modal, not a route, so the id travels as a query param and the bookings page
 * opens the modal for it. Reported to backend to align the hrefs too.
 */

/** Query param the bookings page reads to auto-open a booking's detail modal. */
export const BOOKING_PARAM = "booking";

export function normalizeNotificationHref(href: string): string {
  let path = href || "/overview";
  if (/^https?:\/\//i.test(path)) {
    try {
      path = new URL(path).pathname;
    } catch {
      /* keep as-is */
    }
  }
  path = path.replace(/^\/partner(?=\/|$)/, ""); // strip the /partner prefix
  path = path.replace(/^\/dashboard(?=\/|$)/, "/overview"); // backend "dashboard" home = our /overview

  // `new_booking` (and host-cancellation) deep-links point at a booking detail.
  const booking = path.match(/^\/bookings\/([^/?#]+)(?:[?#].*)?$/);
  if (booking) return `/bookings?${BOOKING_PARAM}=${encodeURIComponent(booking[1])}`;

  return path || "/overview";
}
