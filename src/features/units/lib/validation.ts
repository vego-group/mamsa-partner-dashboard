/** Cleaning fee: optional — blank is treated as 0; if provided, must be >= 0. */
export function isValidCleaningFee(value: string): boolean {
  return value.trim() === "" || Number(value) >= 0;
}
