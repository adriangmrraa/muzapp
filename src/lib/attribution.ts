// ─── Ref Code Utilities ───────────────────────────────────────────────────────

export interface RefCodeParams {
  campaign?: string;
  source?: string;
  content?: string;
}

/**
 * Builds a ref code string from attribution params.
 * Format: "slug" or "slug:content"
 */
export function buildRefCode({ campaign, source, content }: RefCodeParams): string {
  const slug = campaign ?? source ?? "organic";
  if (content) return `${slug}:${content}`;
  return slug;
}

/**
 * Appends a [REF:code] marker at the end of a WhatsApp message.
 */
export function appendRefToMessage(message: string, refCode: string): string {
  return `${message} [REF:${refCode}]`;
}

/**
 * Extracts the ref code from a message containing [REF:...].
 * Returns null if no ref code found.
 */
export function extractRefCode(message: string): string | null {
  const match = message.match(/\[REF:([^\]]+)\]/);
  return match ? match[1] : null;
}

/**
 * Parses a ref code string into campaign and content parts.
 * Format: "slug" or "slug:content"
 */
export function parseRefCode(refCode: string): { campaign: string; content: string | null } {
  const colonIdx = refCode.indexOf(":");
  if (colonIdx === -1) {
    return { campaign: refCode, content: null };
  }
  return {
    campaign: refCode.slice(0, colonIdx),
    content: refCode.slice(colonIdx + 1),
  };
}

// ─── UTM Parsing ─────────────────────────────────────────────────────────────

export interface UTMParams {
  source: string | null;
  medium: string | null;
  campaign: string | null;
  content: string | null;
  term: string | null;
}

/**
 * Parses UTM params from a URLSearchParams (or any object with .get()).
 */
export function parseUTMParams(searchParams: URLSearchParams): UTMParams {
  return {
    source: searchParams.get("utm_source"),
    medium: searchParams.get("utm_medium"),
    campaign: searchParams.get("utm_campaign"),
    content: searchParams.get("utm_content"),
    term: searchParams.get("utm_term"),
  };
}
