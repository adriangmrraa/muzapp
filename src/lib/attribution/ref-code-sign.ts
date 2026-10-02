// Server-only — never import from "use client" code (uses Node crypto).
import { createHmac, timingSafeEqual } from "crypto";
import type { RefCodeData } from "./ref-code";

const SIG_LEN = 16;

function getSecret(): string {
  return process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET ?? "";
}

function sign(payload: string): string {
  return createHmac("sha256", getSecret()).update(payload).digest("hex").slice(0, SIG_LEN);
}

/**
 * Signed ref format: `ref:{campaignId}_{adsetId}_{adId}_{ts36}_{hmac16}`
 * Extends the legacy 4-part code with an HMAC so attribution data carried in
 * public wa.me links cannot be tampered with without detection.
 */
export function signRefCode(data: RefCodeData): string {
  const payload = `${data.campaignId}_${data.adsetId}_${data.adId}_${data.timestamp.toString(36)}`;
  return `ref:${payload}_${sign(payload)}`;
}

/**
 * Returns true when `code` is a 5-part signed ref whose signature is valid.
 */
export function verifyRefCodeSignature(code: string): boolean {
  const stripped = code.startsWith("ref:") ? code.slice(4) : code;
  const parts = stripped.split("_");
  if (parts.length !== 5) return false;
  const payload = parts.slice(0, 4).join("_");
  const expected = sign(payload);
  const given = parts[4];
  if (given.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(given), Buffer.from(expected));
}
