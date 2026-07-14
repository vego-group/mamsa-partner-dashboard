# Mamsa Partner Dashboard — Backend API Requirements

**Version: v1.2** — 14/07/2026

> **Changelog v1.2:** أضيف `thisMonthRevenue` + `occupancyRate` للـ overview (§3.1) ·
> أضيف `bathrooms`/`rating`/`reviewsCount` (optional) للـ Unit (§4) ·
> توضيح أن الإشعارات 5 types حصريًا بنصوص عربية والتجميع frontend-side (§8) ·
> تأكيد: كل الـ deltas/sparklines تُشتق في الفرونت — لا تُضاف للـ API.

**المستند ده هو العقد الكامل بين الفرونت إند (لوحة الشركاء) والباك إند.**
الفرونت جاهز وشغّال على mock layer بنفس الـ signatures دي بالظبط — أي endpoint يتنفذ بالشكل الموصوف هنا هيشتغل مع الفرونت من غير أي تعديل (`NEXT_PUBLIC_USE_MOCK=false`).

- Base URL (production): `https://api.mamsaa.com`
- Staging: `https://staging.mamsaa.com` (or api.staging — align with DevOps)
- Spec reference: SRS v1.1

---

## 0. Global Conventions (تنطبق على كل الـ endpoints)

### 0.1 Auth
- **Session token in an httpOnly, Secure, SameSite=Lax cookie** — never in response body / localStorage.
- All endpoints below (except `/auth/*`) require an authenticated **partner** session.
- Frontend always sends `credentials: "include"`.

### 0.2 Ownership (CRITICAL)
- A partner can **only** read/write their OWN units / bookings / calendar / feeds / notifications.
- Accessing another partner's resource → **404** (preferred, don't leak existence) or **403**. Must be enforced **server-side on every resource endpoint** — the UI is not a security layer.
- QA will run a two-account IDOR test on every `:id` endpoint before launch.

### 0.3 Locale / Formats
- Currency: **SAR only** — all money fields are integers (halalas not needed; whole SAR) or decimal — pick one and document it. Frontend assumes whole SAR numbers.
- Dates: **ISO 8601 UTC** in JSON (`2026-07-20T15:00:00Z`). Frontend formats to DD/MM/YYYY Gregorian.
- Phones: stored/returned as **E.164** `+9665XXXXXXXX` (Saudi only).
- IDs: opaque strings.

### 0.4 Error envelope (موحّد)
```json
{ "error": { "code": "UNIT_NOT_FOUND", "message": "الوحدة غير موجودة" } }
```
- `message` in Arabic (user-facing), `code` stable machine-readable.
- Validation errors:
```json
{ "error": { "code": "VALIDATION", "fields": { "pricePerNight": "السعر يجب أن يكون أكبر من صفر" } } }
```

### 0.5 Pagination (lists)
`GET ...?page=1&limit=20` → 
```json
{ "data": [...], "meta": { "page": 1, "limit": 20, "total": 57 } }
```

### 0.6 Rate limiting
- OTP request: max **3 per phone per 10 min**, max 10/day.
- General API: sensible per-IP/per-session limits; 429 with `Retry-After`.

---

## 1. Auth — OTP only (لا يوجد باسورد في المنظومة كلها)

### 1.1 `POST /auth/otp/request`
Body: `{ "phone": "5XXXXXXXX" }` (9 digits, starts with 5; server prepends +966)

Behavior:
- Validate Saudi mobile format.
- Generate **6-digit** OTP, validity **60s**, max **3 verify attempts** per code.
- Send via SMS provider.
- **Never log the OTP. Never return it in the response.** (The `123456` debug hint exists ONLY in the frontend mock — production backend must not have any static/debug code. This is a launch blocker check.)

Responses:
- `200 { "ok": true }`
- `400 VALIDATION` (bad phone) · `429 RATE_LIMITED`

### 1.2 `POST /auth/otp/verify`
Body: `{ "phone": "5XXXXXXXX", "code": "123456" }`

Behavior & account gate:
- Wrong code → `401 { code: "OTP_WRONG" }` (decrement attempts)
- Expired → `401 { code: "OTP_EXPIRED" }`
- Attempts exhausted → `429 { code: "OTP_LOCKED" }` (require re-request)
- Phone not a registered partner → `404 { code: "PARTNER_NOT_FOUND" }`
- Partner exists but account state:
  - `pending` (registration under review) → `403 { code: "ACCOUNT_PENDING" }`
  - `suspended` → `403 { code: "ACCOUNT_SUSPENDED" }`
- Success → set httpOnly session cookie, `200 { "ok": true }`

### 1.3 `POST /auth/logout`
Invalidates session, clears cookie. `200`.

### 1.4 `POST /auth/otp/resend` *(optional — can reuse 1.1)*
Same rate limits.

---

## 2. Partner Profile

### 2.1 `GET /me`
```json
{
  "id": "p_1",
  "name": "منصور القاسمي",
  "email": "partner@example.com",
  "phone": "+966501234567",
  "accountType": "individual" | "company",
  "verificationId": "1010101010",      // National ID (individual) or CR (company) — READ ONLY
  "accountState": "approved" | "pending" | "suspended",
  "hostCancellationsLast12m": 0,        // §8.5 reliability
  "flagged": false,                      // true when host-cancellations exceed threshold
  "memberSince": "2022-01-15T00:00:00Z"
}
```

### 2.2 `PATCH /me`
Editable: `name`, `email` only.
**Not editable via this endpoint:** `phone` (OTP flow below), `accountType`, `verificationId` (identity docs — admin-managed).

### 2.3 Phone change (OTP-verified)
- `POST /me/phone/request` `{ "newPhone": "5XXXXXXXX" }` → OTP to the NEW number.
- `POST /me/phone/verify` `{ "newPhone": "...", "code": "..." }` → phone updated.
Same OTP policy as §1.

---

## 3. Overview (Dashboard metrics)

### 3.1 `GET /overview`
```json
{
  "unitsCount": 4,                 // partner's units excluding drafts (or all — confirm; frontend currently excludes drafts)
  "bookingsCount": 3,              // confirmed + completed (NOT cancelled)
  "totalRevenue": 4980,            // SAR — partner share (98%) of confirmed+completed bookings
  "bookingsByMonth": [{ "month": "2025-08", "count": 0 }, ...],   // last 12 months
  "revenueByMonth":  [{ "month": "2025-08", "amount": 0 }, ...],  // last 12 months, SAR
  "thisMonthRevenue": 4200,        // v1.2 — partner share (SAR), current calendar month
  "occupancyRate": 62,             // v1.2 — % booked nights / available nights across approved units, current month
  "hasRejectedUnit": true
}
```
- **Revenue = partner share only** (after Mamsa's 2%), from non-cancelled bookings.
- All deltas, sparklines, and month-over-month comparisons are **frontend-derived** from the 12-month series — do NOT add them to the API.

---

## 4. Units — CRUD + Lifecycle (§7)

### Lifecycle state machine (server-enforced)
```
draft → (submit) → pending → (admin approve) → approved
                          → (admin reject +reason) → rejected → (partner edit & resubmit) → pending
approved → (partner edits) → pending   ← automatic, unit hidden from public site until re-approved
```
- **No manual status set by partner ever.** Status changes only via the transitions above.
- Every state change fires: SMS to partner + in-dashboard notification (§8). Rejection MUST include `rejectionReason`.

### Unit object
```json
{
  "id": "u_1",
  "code": "MRN2401",                    // server-generated, unique, immutable
  "name": "استوديو مرسى العليا",
  "type": "apartment" | "studio" | "villa",
  "status": "draft" | "pending" | "approved" | "rejected",
  "pricePerNight": 320,                 // SAR > 0
  "bedrooms": 1, "capacity": 2,
  "bathrooms": 1,                       // v1.2 — optional
  "rating": 4.7,                        // v1.2 — optional; avg guest rating from the user-website reviews (FR-3). null if no reviews yet
  "reviewsCount": 89,                   // v1.2 — optional; null/0 if none
  "city": "riyadh",                     // MUST be a Saudi city from the agreed enum
  "district": "العليا",
  "description": "…",                   // ≤ 500 chars
  "amenities": ["wifi","ac","kitchen","parking","pool","security","self_checkin","family_friendly"],
  "checkIn": "15:00", "checkOut": "12:00",
  "lat": 24.7136, "lng": 46.6753,       // MUST be inside Saudi bounds (reject otherwise)
  "address": "حي العليا، الرياض",
  "tourismLicenseNumber": "TL-2025-73101",   // PER UNIT — required to submit
  "tourismLicenseFileId": "file_abc",         // uploaded PDF ref — required to submit
  "photos": [{ "id":"ph1", "url":"https://…", "isCover":true }],   // ≥1 to submit
  "rejectionReason": "…",               // present only when status=rejected
  "publicUrl": "https://mamsaa.com/units/MRN2401",  // present only when approved
  "updatedAt": "2026-07-10T09:00:00Z"
}
```

### Endpoints
| Method & path | Purpose | Notes |
|---|---|---|
| `GET /units` | List partner's units | Filters: `?status=draft|pending|approved|rejected`, `?q=` (name/code search), pagination |
| `GET /units/:id` | Unit details | Ownership enforced |
| `POST /units` | Create **draft** | Partial body allowed — drafts don't validate required fields |
| `PATCH /units/:id` | Update | Allowed when `draft`/`rejected`/`approved`. **If status=approved → server sets status=pending + hides from public site.** Blocked (409) when `pending` |
| `POST /units/:id/submit` | Submit draft/rejected → **pending** | Full validation here (below). Success response should include the review SLA copy: "سيصلك إشعار خلال 24–48 ساعة" |
| `DELETE /units/:id` | Delete | **Drafts only.** Others → 409 |

### Submit validation (server-side — reject with field errors)
- name ≥2 chars · type in enum · pricePerNight > 0 · capacity ≥1 · city in Saudi enum
- description 10–500 chars · address present
- lat/lng inside Saudi Arabia bounding box
- `tourismLicenseNumber` + license PDF present (**per unit**)
- ≥1 photo
- **If partner.accountType = company:** company payout docs must be complete on the partner profile (see §9) — otherwise `409 { code: "COMPANY_DOCS_INCOMPLETE" }`. For individuals this check is skipped.

---

## 5. Calendar & Availability (D-6)

### 5.1 `GET /units/:id/calendar?month=2026-07`
Returns every day of the month:
```json
[
  { "date": "2026-07-03", "status": "booked",   "bookingCode": "BK-2401", "bookingId": "b_1" },
  { "date": "2026-07-08", "status": "blocked",  "reason": "صيانة" },
  { "date": "2026-07-17", "status": "external", "source": "Booking.com" },
  { "date": "2026-07-01", "status": "available" }
]
```
- `external` days MUST include the **source name** of the iCal feed.
- Priority when overlapping: booked > external > blocked > available.

### 5.2 `POST /units/:id/calendar/block`
`{ "dates": ["2026-07-08","2026-07-09"], "reason": "صيانة" }` (reason optional)
- Reject (409) any date that is `booked` or `external`.

### 5.3 `POST /units/:id/calendar/unblock`
`{ "dates": [...] }` — only manually-blocked dates can be unblocked.

### 5.4 iCal IMPORT
| Endpoint | Purpose |
|---|---|
| `GET /units/:id/ical` | List feeds: `[{ id, source, url, status: "synced"|"error", lastSync }]` |
| `POST /units/:id/ical` | Add feed `{ "source": "Airbnb", "url": "https://…ics" }` — validate URL fetches valid iCal |
| `DELETE /units/:id/ical/:feedId` | Remove feed |
| `POST /units/:id/ical/:feedId/sync` | "مزامنة الآن" — manual sync, returns updated feed |
- **Auto-sync every 15–30 min** (background job). Failed sync → feed `status="error"` + fires a `sync_failed` notification (§8).

### 5.5 iCal EXPORT
- `GET /units/:id/ical/export` → `{ "url": "https://api.mamsaa.com/ical/{token}.ics" }`
- The public `.ics` URL (unguessable token, read-only) exposes Mamsa bookings + manual blocks for that unit so external platforms can import it. No auth on the .ics itself; token revocable.

---

## 6. Bookings (D-7 / D-8)

> Bookings are **created by the User Website via Moyasar** — payment is instant, so there is **NO "pending" booking state**. Partner dashboard only reads + host-cancels.

### Booking states
`confirmed` → (checkout date passes, background job) → `completed`
`confirmed` → (host cancel OR guest cancel per policy) → `cancelled`

### Booking object
```json
{
  "id": "b_1",
  "code": "BK-2401",
  "unitId": "u_1", "unitName": "استوديو مرسى العليا", "unitThumb": "https://…",
  "guestName": "أحمد الراشدي",
  "guestPhone": "+966502345678",
  "checkIn": "2026-07-20T15:00:00Z", "checkOut": "2026-07-25T12:00:00Z",
  "nights": 5, "guests": 2,
  "status": "confirmed" | "completed" | "cancelled",
  "financials": {
    "total": 1600,          // what the guest paid (SAR)
    "commission": 32,       // Mamsa 2% — rounded, commission + partnerShare === total
    "partnerShare": 1568    // 98%
  },
  "policySnapshot": { "name": "flexible", "rules": "…" },   // FROZEN at booking time (FR-036) — never re-read from the unit's current policy
  "notes": "طلب تسجيل دخول مبكر",
  "cancellation": {          // present only when cancelled
    "type": "host" | "guest",
    "reason": "…",
    "date": "2026-07-14T10:00:00Z",
    "refundAmount": 1600,
    "refundStatus": "processing" | "completed"
  }
}
```

### Endpoints
| Method & path | Purpose |
|---|---|
| `GET /bookings` | Partner's bookings. Filters: `?status=`, `?unitId=`, `?from=&to=` (date range), `?q=` (booking code). Paginated |
| `GET /bookings/:id` | Details (ownership enforced) |
| `POST /bookings/:id/host-cancel` | "تعذّر استضافة الحجز" — see below |

### 6.1 Host-cancel (`POST /bookings/:id/host-cancel`) — أهم endpoint
Body: `{ "reason": "الوحدة محجوزة في منصة أخرى" }` (required, non-empty)

Preconditions (else 409):
- booking.status === `confirmed`
- check-in date is in the future

Atomic side-effects (all-or-nothing, **no admin approval step**):
1. Set status `cancelled`, cancellation.type=`host`, store reason + timestamp.
2. **Refund the guest 100% of `total` via Moyasar** (auto — Moyasar refunds without manual admin approval). `refundStatus: processing → completed` via webhook.
   - ⚠️ Refund = **full total**, NOT total minus commission. Partner loses the 98% share; Mamsa loses its 2%. (This was a designer bug — locked decision.)
3. Send apology **SMS to the guest**.
4. **Block those dates** on the unit's calendar (so they don't get rebooked instantly).
5. Increment partner's `hostCancellationsLast12m`; if over threshold → set `flagged=true` (§8.5 — threshold: business decision, suggest 3/12mo, confirm with Ahmed).
6. Fire `host_cancellation` notification (§8).

Response: the updated Booking object (with `cancellation`).
**Idempotency:** accept an `Idempotency-Key` header — double-click must not double-refund.

### 6.2 Moyasar refund webhook
`POST /webhooks/moyasar` (signature-verified) → updates `refundStatus` to `completed`.

---

## 7. Reports (D-9)

### 7.1 `GET /reports/summary?from=2026-01-01&to=2026-07-14`
```json
{
  "grossRevenue": 8280,        // sum of totals (non-cancelled, in range)
  "bookingsCount": 3,
  "commission": 166,           // 2%
  "netProfit": 8114,           // grossRevenue - commission  ← a real SAR amount, NOT a count
  "revenueByMonth": [...], "bookingsByMonth": [...],
  "perUnit": [{ "unitId":"u_1", "unitName":"…", "bookings": 2, "revenue": 2880 }]
}
```
Shortcuts are frontend-side; backend just takes from/to.

### 7.2 `GET /reports/export?from=&to=&format=pdf|xlsx`
Returns the file (or a signed URL). PDF first; leave xlsx in the contract.

---

## 8. Notifications (D-11)

### Types (exactly these)
| type | Trigger | Deep link |
|---|---|---|
| `unit_approved` | Admin approves unit | `/units/:id` |
| `unit_rejected` | Admin rejects (body MUST include reason) | `/units/:id` |
| `new_booking` | Booking created on partner's unit | `/bookings` (or `/bookings/:id`) |
| `sync_failed` | iCal feed sync error | `/calendar` |
| `host_cancellation` | Host-cancel recorded on the account | `/bookings/:id` |

Every notification also triggers an **SMS** to the partner (per §7 lifecycle + booking events).

**v1.2 clarifications (بعد مراجعة الفرونت):**
- الـ 5 types دول **حصريًا** — لا يوجد إشعارات تقييمات، ولا "دفعة جزئية" (الدفع فوري كامل عبر Moyasar)، ولا "بانتظار موافقتك" (لا توجد موافقة شريك على الحجوزات — قاعدة مقفولة #6).
- `title`/`body` strings عربية جاهزة — الباك إند لا يبعت bilingual objects.
- تجميع الإشعارات (اليوم/أمس/سابقًا) والـ time labels = **frontend presentation** تُحسب من `createdAt` — لا تُضاف للـ API.
- لا يوجد delete/dismiss endpoint — فقط read / read-all.

### Endpoints
| Method & path | Purpose |
|---|---|
| `GET /notifications` | Paginated, newest first: `[{ id, type, title, body, read, createdAt, href }]` |
| `GET /notifications/unread-count` | `{ "count": 2 }` (for the header bell — cheap endpoint, polled) |
| `POST /notifications/:id/read` | Mark one read |
| `POST /notifications/read-all` | "تحديد الكل كمقروء" |

---

## 9. File Uploads & Company Docs

### 9.1 Upload flow (presigned)
1. `POST /uploads/presign` `{ "kind": "unit_photo"|"license_pdf"|"company_doc", "fileName": "x.pdf", "mimeType": "application/pdf", "size": 1048576 }`
2. → `{ "uploadUrl": "…", "fileId": "file_abc" }` — client PUTs the file, then references `fileId`.

**Server-side validation (never trust client MIME):**
- `unit_photo`: PNG/JPG only, ≤ **10MB**, verify magic bytes.
- `license_pdf` / `company_doc`: PDF only, ≤ 10MB, verify magic bytes.
- Virus scan if infra allows.

### 9.2 Company payout docs (per partner, one-time — REQUIRED for companies)
`GET /me/company-docs` / `PUT /me/company-docs`
```json
{
  "cr": "2050123456",                    // 10 digits
  "iban": "SA0380000000608010167519",    // SA + 22 digits — validated
  "authorizationLetterFileId": "file_1",
  "vatCertificateFileId": "file_2",
  "operatorLicenseFileId": "file_3",
  "complete": true                        // server-computed
}
```
- All five are **required** before a company can submit a unit (checked in §4 submit).
- Individuals: this whole section is N/A (National ID captured at registration).

---

## 10. Security Requirements (non-negotiable)

1. httpOnly Secure cookies; server-side sessions; CSRF protection on all mutations.
2. Ownership check on EVERY `:id` route (404 for foreign resources). IDOR two-account test will be run pre-launch.
3. OTP: 6 digits, 60s TTL, 3 attempts, rate-limited, never logged, never in responses. **No debug/static OTP code in any production build.**
4. Zod-equivalent server validation on every input (National ID `^1\d{9}$`, CR `^\d{10}$`, IBAN `^SA\d{22}$`, phone `^5\d{8}$`, price>0, Saudi-bounds lat/lng, city enum).
5. Sanitize all stored user strings (unit names, descriptions, reasons, guest names) — they render in dashboards AND in generated emails/SMS. (XSS in booking-confirmation was flagged H-1 on the user site — same class of bug.)
6. Uploads: type+size validated server-side by magic bytes.
7. Moyasar keys & SMS provider creds server-side only; webhook signatures verified.
8. Host-cancel is idempotent (Idempotency-Key) — refunds must never double-fire.

---

## 11. Locked Business Rules (لا تُناقش — قرارات إدارة)

| # | Rule |
|---|---|
| 1 | Currency SAR only; Saudi cities only; phones +966 |
| 2 | Auth = OTP only (6-digit). No passwords anywhere |
| 3 | Commission **2%** Mamsa / **98%** partner — `commission + partnerShare === total` always |
| 4 | Host-cancel refund = **100% of total** to guest, auto via Moyasar, no admin approval |
| 5 | Review SLA = **24–48 hours** (verbatim in notifications) |
| 6 | Booking states: Confirmed / Completed / Cancelled — **no Pending** |
| 7 | Unit lifecycle: Draft → Pending → Approved / Rejected (edit approved → back to Pending) |
| 8 | Tourism license is **per unit**; company payout docs (CR+IBAN+auth letter+VAT+operator license) required per company |
| 9 | Cancellation policy **snapshot frozen at booking time** (`policySnapshot` on the booking — FR-036) |
| 10 | Dates Gregorian; Arabic primary |

---

## 12. Endpoint Index (quick reference)

```
POST   /auth/otp/request
POST   /auth/otp/verify
POST   /auth/logout
GET    /me
PATCH  /me
POST   /me/phone/request
POST   /me/phone/verify
GET    /me/company-docs
PUT    /me/company-docs
GET    /overview
GET    /units
POST   /units
GET    /units/:id
PATCH  /units/:id
DELETE /units/:id
POST   /units/:id/submit
GET    /units/:id/calendar?month=
POST   /units/:id/calendar/block
POST   /units/:id/calendar/unblock
GET    /units/:id/ical
POST   /units/:id/ical
DELETE /units/:id/ical/:feedId
POST   /units/:id/ical/:feedId/sync
GET    /units/:id/ical/export
GET    /bookings
GET    /bookings/:id
POST   /bookings/:id/host-cancel
GET    /reports/summary?from=&to=
GET    /reports/export?from=&to=&format=
GET    /notifications
GET    /notifications/unread-count
POST   /notifications/:id/read
POST   /notifications/read-all
POST   /uploads/presign
POST   /webhooks/moyasar
```

**Background jobs:** iCal auto-sync (15–30 min) · booking auto-complete after checkout · hostCancellations 12-month rolling window.

---

## 13. Delivery Checklist للباك إند

- [ ] All endpoints in §12 implemented with the exact shapes above
- [ ] Ownership enforced everywhere (passes two-account IDOR test)
- [ ] OTP policy per §1; zero debug codes in production
- [ ] Host-cancel: atomic, idempotent, 100% refund, dates blocked, §8.5 recorded
- [ ] Financials: `commission + partnerShare === total` on every booking
- [ ] `policySnapshot` frozen on booking (FR-036)
- [ ] Notifications + SMS fire on: approve / reject(+reason) / new booking / sync fail / host cancel
- [ ] iCal import (auto 15–30 min + manual) & export .ics live
- [ ] Uploads validated by magic bytes, ≤10MB
- [ ] Error envelope + pagination per §0
- [ ] Staging deployed at staging URL with seeded test data
