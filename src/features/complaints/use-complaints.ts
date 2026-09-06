"use client";

import { api } from "@/lib/api/client";
import { useAsync } from "@/lib/use-async";

/**
 * The full complaints list — one request, no pagination. Shared by the list
 * screen and by the wallet ledger, which matches its refund rows against it.
 */
export function useComplaints() {
  return useAsync(() => api.listComplaints());
}

/**
 * One complaint. Re-run `reload` rather than caching the result anywhere
 * long-lived: the attachment URLs inside are signed for ~15 minutes.
 */
export function useComplaint(id: string) {
  return useAsync(() => api.getComplaint(id), [id]);
}
