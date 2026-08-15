import { IBAN_REGEX } from "@/lib/constants";

/**
 * IBAN validation. A regex only proves the shape — `SA` plus 22 digits — so a
 * single mistyped digit inside the account number passes it and then fails at
 * the bank, days later, as a silently missed payout. The mod-97 checksum
 * (ISO 13616 / ISO 7064) is what actually catches that typo at the keyboard.
 */

/** Uppercase, whitespace-stripped. Partners paste IBANs with spaces from bank apps. */
export function normalizeIban(iban: string): string {
  return iban.replace(/\s+/g, "").toUpperCase();
}

/**
 * ISO 7064 mod-97-10: move the first 4 chars to the end, map letters to
 * numbers (A=10 … Z=35), and the resulting integer must be ≡ 1 (mod 97).
 *
 * The rearranged Saudi IBAN is a 26-digit number — well past Number.MAX_SAFE_INTEGER
 * — so it is reduced in chunks rather than parsed whole.
 */
function mod97(rearranged: string): number {
  let remainder = 0;
  for (const char of rearranged) {
    const code = char.charCodeAt(0);
    // A–Z → 10–35 (two digits), 0–9 → 0–9 (one digit).
    const mapped =
      code >= 65 && code <= 90 ? String(code - 55)
      : code >= 48 && code <= 57 ? char
      : null;
    if (mapped === null) return NaN;
    remainder = Number(`${remainder}${mapped}`) % 97;
  }
  return remainder;
}

/**
 * True only for a structurally valid Saudi IBAN whose checksum also holds.
 * Input is normalized first, so lowercase and spaced input is accepted.
 */
export function isValidIban(iban: string): boolean {
  const normalized = normalizeIban(iban);
  if (!IBAN_REGEX.test(normalized)) return false;
  return mod97(normalized.slice(4) + normalized.slice(0, 4)) === 1;
}

/*
 * There is deliberately NO bank-name lookup here. The server derives `bankName`
 * and returns it on GET and PUT; a client-side SAMA code table would be a
 * second source of truth that silently disagrees with it. `bankName` is
 * nullable, so the UI renders a neutral state and never blocks on it.
 */

/** Display form — the last 4 digits only. The partner never gets a full IBAN back. */
export function maskIban(iban: string): string {
  const normalized = normalizeIban(iban);
  return normalized.length < 4 ? "" : `••••${normalized.slice(-4)}`;
}
