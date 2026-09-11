/**
 * `NEXT_PUBLIC_USE_MOCK`, read strictly.
 *
 * The old check was `!== "false"`, so `False`, `0`, `true1` and an empty value
 * all silently switched the mock on while the developer believed they had
 * turned it off — and a "verified against staging" result was the mock
 * answering. Same failure shape as a wrong-but-plausible number: no error,
 * wrong result. So this accepts exactly `true` or `false` (trimmed,
 * case-insensitive) and refuses to boot on anything else, naming the variable
 * and the value it got. A misconfigured env is not something to default.
 */
export function parseMockFlag(raw: string | undefined, name = "NEXT_PUBLIC_USE_MOCK"): boolean {
  const v = raw?.trim().toLowerCase();
  if (v === "true") return true;
  if (v === "false") return false;
  const got = raw === undefined ? "nothing (the variable is unset)" : JSON.stringify(raw);
  throw new Error(
    `${name} must be exactly "true" or "false" (case-insensitive, whitespace ignored); got ${got}. ` +
      `Refusing to start rather than guess which data you would be looking at.`,
  );
}

/** Whether every API call is answered by `src/mocks/data.ts` instead of the server. */
export const IS_MOCK = parseMockFlag(process.env.NEXT_PUBLIC_USE_MOCK);

/**
 * The on-screen mock badge is for dev builds only: production either has the
 * mock off or has a misconfiguration that the parser above already refused.
 */
export function shouldShowMockBadge(nodeEnv: string | undefined, isMock: boolean): boolean {
  return nodeEnv === "development" && isMock;
}
