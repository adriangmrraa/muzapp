/**
 * Meta Ads — Server-side configuration
 *
 * Lee las variables de entorno de Meta Ads y las expone tipadas.
 * META_APP_ID / META_APP_SECRET son SOLO server-side (Conversion API).
 * NEXT_PUBLIC_META_PIXEL_ID se usa en el cliente (fbq).
 */

export interface MetaConfig {
  appId: string | undefined;
  appSecret: string | undefined;
  pixelId: string | undefined;
  /** true si hay appId + appSecret (para Conversion API) */
  hasServerConfig: boolean;
  /** true si hay pixelId (para fbq client-side) */
  hasPixel: boolean;
}

export function getMetaConfig(): MetaConfig {
  const appId = process.env.META_APP_ID;
  const appSecret = process.env.META_APP_SECRET;
  const pixelId =
    typeof process.env.NEXT_PUBLIC_META_PIXEL_ID === "string" &&
    process.env.NEXT_PUBLIC_META_PIXEL_ID.length > 0
      ? process.env.NEXT_PUBLIC_META_PIXEL_ID
      : undefined;

  return {
    appId: appId && appId !== "tu-meta-app-id" ? appId : undefined,
    appSecret:
      appSecret && appSecret !== "tu-meta-app-secret" ? appSecret : undefined,
    pixelId,
    hasServerConfig: !!(
      appId &&
      appSecret &&
      appId !== "tu-meta-app-id" &&
      appSecret !== "tu-meta-app-secret"
    ),
    hasPixel: !!pixelId,
  };
}

/**
 * Genera un Meta Access Token de corta duración usando
 * el Client OAuth flow (appId + appSecret).
 * Útil para hacer llamadas a la Conversion API.
 */
export function getMetaAccessToken(): string | null {
  const cfg = getMetaConfig();
  if (!cfg.hasServerConfig) return null;
  // Meta Access Token = appId|appSecret (client credentials grant)
  return `${cfg.appId}|${cfg.appSecret}`;
}
