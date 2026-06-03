// Argentina timezone helper (UTC-3, no DST since 2009)
// En producción (Vercel/Cloudflare) el runtime usa UTC, así que
// new Date().getHours() devuelve hora UTC, no Argentina.
// Este helper siempre devuelve la hora local Argentina correcta.

const AR_OFFSET_MS = -3 * 60 * 60 * 1000; // UTC-3

export function nowArgentina(): Date {
  return new Date(Date.now() + AR_OFFSET_MS);
}

export function getArgentinaMinutes(): number {
  const ar = nowArgentina();
  return ar.getUTCHours() * 60 + ar.getUTCMinutes();
}

export function getArgentinaDayIndex(): number {
  return nowArgentina().getUTCDay(); // 0=Sunday
}

export function getArgentinaHour(): number {
  return nowArgentina().getUTCHours();
}

export function getArgentinaDayName(days: string[]): string {
  return days[getArgentinaDayIndex()];
}
