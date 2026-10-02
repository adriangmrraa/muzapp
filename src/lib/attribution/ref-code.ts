export interface RefCodeData {
  campaignId: string;
  adsetId: string;
  adId: string;
  timestamp: number;
  /** True for signed 5-part codes — verify with verifyRefCodeSignature (server). */
  signed?: boolean;
}

/**
 * Encodes attribution data into a URL-safe ref code string.
 * Format: ref:{campaignId}_{adsetId}_{adId}_{timestamp_base36}
 * Legacy unsigned format — new links should use signed codes from
 * POST /api/admin/ref-code (this module must stay Node-crypto free).
 */
export function encodeRefCode(data: RefCodeData): string {
  const timestampBase36 = data.timestamp.toString(36);
  return `ref:${data.campaignId}_${data.adsetId}_${data.adId}_${timestampBase36}`;
}

/**
 * Decodes a ref code string back into RefCodeData.
 * Accepts codes with or without the "ref:" prefix.
 * Accepts 4-part legacy codes and 5-part signed codes (signature is NOT
 * verified here — call verifyRefCodeSignature server-side for that).
 * Returns null on malformed input.
 */
export function decodeRefCode(code: string): RefCodeData | null {
  if (!code) return null;

  const stripped = code.startsWith("ref:") ? code.slice(4) : code;
  const parts = stripped.split("_");

  if (parts.length !== 4 && parts.length !== 5) return null;

  const [campaignId, adsetId, adId, timestampBase36] = parts;

  if (!campaignId || !adsetId || !adId || !timestampBase36) return null;

  const timestamp = parseInt(timestampBase36, 36);

  if (isNaN(timestamp)) return null;

  return { campaignId, adsetId, adId, timestamp, signed: parts.length === 5 };
}

/**
 * Builds a WhatsApp deep link with the ref code embedded in the message text.
 */
export function buildWhatsAppLink(
  phone: string,
  refCode: string,
  greeting = "Hola! Vi su anuncio y me interesa"
): string {
  const text = `${greeting} ${refCode}`.trim();
  const encoded = encodeURIComponent(text);
  return `https://wa.me/${phone}?text=${encoded}`;
}
