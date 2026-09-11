/**
 * Why a complaint attachment failed to render.
 *
 * The URLs in `GET /me/complaints/{id}` are signed for ~15 minutes, so a
 * `403 FORBIDDEN` is ROUTINE on a page left open — not an outage — and gets
 * a calm "link expired, reload" rather than an error. A `404 NOT_FOUND` is a
 * different thing to the partner (the file is gone), and everything else is
 * the generic failure.
 */
export type AttachmentFailure = "expired" | "missing" | "broken";

/** Past this age a failure with no readable status is assumed to be expiry. */
export const EXPIRY_GRACE_MS = 60_000;

/**
 * Classify by HTTP status when the probe could read one, otherwise by how old
 * the signed URL is. `status: null` means the probe itself failed — typically
 * a CORS-opaque response — and the age heuristic is the only signal left.
 */
export function classifyAttachmentFailure({ status, ageMs }: { status: number | null; ageMs: number }): AttachmentFailure {
  if (status === 403) return "expired";
  if (status === 404) return "missing";
  if (status === null) return ageMs > EXPIRY_GRACE_MS ? "expired" : "broken";
  return "broken";
}

/**
 * Re-request the failed URL to read its status. `<img onError>` carries no
 * status, and the API host is on the CORS allowlist, so one plain GET tells
 * 403 from 404. Resolves `null` when the response can't be read at all.
 */
export async function probeAttachment(url: string, fetchImpl: typeof fetch = fetch): Promise<number | null> {
  try {
    const res = await fetchImpl(url, { cache: "no-store" });
    return res.status;
  } catch {
    return null;
  }
}
