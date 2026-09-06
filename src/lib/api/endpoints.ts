/**
 * Backend route table. Paths are RELATIVE to the API base (`/api/proxy` in
 * dev, `NEXT_PUBLIC_API_BASE_URL` otherwise) — they carry no `/api/v1` prefix
 * because the partner routes live at the domain root behind the `dashboard`
 * guard.
 *
 * Older routes are still written inline in `client.ts`; new ones go here so a
 * path is spelled once and the client only assembles the request around it.
 */
export const endpoints = {
  complaints: {
    /** `GET` → `{ items: PartnerComplaintRow[] }`. Whole list, no pagination. */
    list: "/me/complaints",
    /** `GET` → `PartnerComplaintDetail`. 404 `NOT_FOUND` when the complaint is not on one of this partner's units. */
    detail: (id: string) => `/me/complaints/${id}`,
  },
} as const;
