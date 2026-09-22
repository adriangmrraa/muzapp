/** A fuzzy search is only a candidate: link an order automatically when the
 * operator's name is an exact name or an unambiguous first-name prefix. */
export function isSafeCustomerNameMatch(requested: string, stored: string | null): boolean {
  if (!stored) return false;
  const normalized = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().replace(/\s+/g, " ").toLowerCase();
  const input = normalized(requested);
  const name = normalized(stored);
  return input.length >= 3 && (input === name || name.startsWith(`${input} `));
}
