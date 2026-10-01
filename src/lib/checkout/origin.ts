function firstHeaderValue(value: string | null): string | null {
  return value?.split(",")[0]?.trim() || null;
}

function addConfiguredOrigin(origins: Set<string>, value: string | undefined) {
  if (!value) return;
  try {
    origins.add(new URL(value).origin);
  } catch {
    // A malformed optional deployment URL must not disable the checkout.
  }
}

/**
 * Render terminates TLS before forwarding requests to the Next server. In that
 * setup request.url points at the internal container, while Origin keeps the
 * public domain. Accept only the proxy's reconstructed public origin.
 */
export function isAllowedCheckoutOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return false;

  const allowed = new Set<string>([new URL(request.url).origin]);
  addConfiguredOrigin(allowed, process.env.NEXT_PUBLIC_APP_URL);
  addConfiguredOrigin(allowed, process.env.NEXTAUTH_URL);

  const forwardedHost = firstHeaderValue(request.headers.get("x-forwarded-host"));
  const forwardedProto = firstHeaderValue(request.headers.get("x-forwarded-proto"));
  if (forwardedHost && (forwardedProto === "https" || forwardedProto === "http")) {
    allowed.add(`${forwardedProto}://${forwardedHost}`);
  }

  return allowed.has(origin);
}
