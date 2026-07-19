/** Case-insensitive substring match against any of the given fields. Empty query always matches. */
export function matchesQuery(query: string, ...fields: (string | undefined)[]): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return fields.some((f) => f?.toLowerCase().includes(q));
}
