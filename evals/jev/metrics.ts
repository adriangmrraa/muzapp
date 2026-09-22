export type Counts = { tp: number; tn: number; fp: number; fn: number };
export function metrics(records: { expected: boolean; actual: boolean }[]): Counts & { precision: number; recall: number } {
  const c: Counts = { tp: 0, tn: 0, fp: 0, fn: 0 };
  for (const r of records) c[r.expected ? r.actual ? "tp" : "fn" : r.actual ? "fp" : "tn"]++;
  return { ...c, precision: c.tp + c.fp ? c.tp / (c.tp + c.fp) : 0,
    recall: c.tp + c.fn ? c.tp / (c.tp + c.fn) : 0 };
}
