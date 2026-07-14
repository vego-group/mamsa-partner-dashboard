# مَمسَى — لوحة الشركاء (Mamsa Partner Dashboard)

Phase 2 partner dashboard for the Mamsa Saudi residential-booking platform.
Next.js 14 · TypeScript (strict) · TailwindCSS · Zustand · Zod · Vitest.

## Run

```bash
npm install
npm run dev          # http://localhost:3000  → redirects to /overview
```

Login is at `/login`. In mock mode the OTP code is **123456** (any valid
`+966 5XXXXXXXX` phone).

```bash
npm run build        # production build (all 13 routes compile clean)
npm run typecheck    # strict tsc, zero errors
npm run test         # Vitest — SAR / date / phone / commission math
```

## Mock → real backend (single switch)

All data goes through `src/lib/api/client.ts`. To connect the real API, edit
`.env.local` — **no component changes needed**:

```
NEXT_PUBLIC_USE_MOCK=false
NEXT_PUBLIC_API_BASE_URL=https://api.mamsaa.com
```

Auth tokens are expected in an httpOnly cookie (the client sends
`credentials: "include"`); OTP codes are never logged or returned in prod.

## What's implemented

| Screen | Route | Notes |
|---|---|---|
| D-0 Login | `/login` | Phone + 6-digit OTP, resend countdown, change number, pending/suspended states. No password. |
| D-1 Overview | `/overview` | KPIs (SAR, confirmed only), revenue chart, rejected-unit alert, zero-state CTA. |
| D-2 Units | `/units` | Lifecycle filters (Draft/Pending/Approved/Rejected), actions by state. |
| D-3 Add Unit | `/units/new` | 5-step stepper, Individual/Company variant, Saudi cities, ≥1 photo, 24–48h SLA success. |
| D-4 Edit Unit | `/units/[id]/edit` | Draft free-edit · Approved confirm→pending · Rejected reason+resubmit. No status dropdown. |
| D-5 Unit Details | `/units/[id]` | Gallery, data, license, rejected reason + resubmit, approved public link + calendar. |
| D-6 Calendar | `/calendar` | Unit selector, day states + source names, manual block modal, iCal import + export. |
| D-7 Bookings | `/bookings` | Confirmed/Completed/Cancelled (no Pending). |
| D-8 Booking Details | (modal) | 2% / 98% breakdown; two-step host-cancel; 100% guest refund; processing + cancellation details. |
| D-9 Reports | `/reports` | Date ranges, Net Profit = revenue − commission (real SAR). |
| D-10 Account | `/account` | +966 read-only, ID/CR read-only, host-reliability indicator. |
| D-11 Notifications | `/notifications` | Unread, mark-all-read, deep links. |
| D-12 Global | `/not-found`, error | 404 / 500. |

## Locked rules enforced

- **SAR only** — one `formatCurrency()`; zero AED/USD in the codebase.
- **Saudi only** — Saudi cities in mock data; no Dubai/Qatar/UAE.
- **+966** phones, **DD/MM/YYYY** dates, Latin digits, **Arabic RTL** primary with EN toggle.
- **Commission 2% / partner 98%**; **host-cancel refunds the guest 100%**.
- **Company payout docs** (CR + IBAN + auth letter + VAT + operator license) required for
  companies, hidden for individuals — one screen, small variant.
- Booking states **Confirmed/Completed/Cancelled** (no Pending — Moyasar is instant).

## Structure

```
src/
  app/(auth)/login            D-0
  app/(dashboard)/*           D-1…D-11 (sidebar + header shell)
  components/ui               Button / Card / Input / Field / Modal
  components/shared           StatusBadge · Money/Date/Phone · Empty/Loading/Error
  components/layout           sidebar · header · language-toggle
  features/bookings           booking-detail (host-cancel flow)
  lib                         api/client (env swap) · format · i18n · schema · constants
  stores                      locale-store (RTL/LTR)
  mocks                       spec-correct seed data
  types                       domain model
```

## Notes / next steps

This is a runnable scaffold covering every screen in the spec with the core
flows working against mock data. To take it to full production, the natural next
pass (ideal in Claude Code on the repo) is: wire the real backend endpoints,
swap the map placeholder for a Saudi-bounded Leaflet/Google map, real file
uploads, server-side auth middleware + ownership checks, and expand tests.
