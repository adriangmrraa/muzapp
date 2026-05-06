"use server";

import { auth } from "@/auth";
import { getMetaConfig, getMetaAccessToken } from "@/lib/meta/config";

export type MetaConfigState = {
  success: boolean;
  message: string;
};

export type MetaConnectionStatus = {
  pixelConfigured: boolean;
  serverConfigured: boolean;
  pixelId: string | null;
  appId: string | null;
};

/**
 * Obtiene el estado actual de la conexión Meta
 */
export async function getMetaStatus(): Promise<MetaConnectionStatus> {
  const session = await auth();
  if (!session) {
    return {
      pixelConfigured: false,
      serverConfigured: false,
      pixelId: null,
      appId: null,
    };
  }

  const cfg = getMetaConfig();
  return {
    pixelConfigured: cfg.hasPixel,
    serverConfigured: cfg.hasServerConfig,
    pixelId: cfg.pixelId ?? null,
    appId: cfg.appId ?? null,
  };
}

/**
 * Testea la conexión con Meta Conversion API
 */
export async function testMetaConnection(): Promise<MetaConfigState> {
  const session = await auth();
  if (!session) {
    return { success: false, message: "No autorizado" };
  }

  const cfg = getMetaConfig();

  if (!cfg.hasServerConfig) {
    return {
      success: false,
      message:
        "Meta no está configurado. Agregá META_APP_ID y META_APP_SECRET en las variables de entorno de Render.",
    };
  }

  if (!cfg.hasPixel) {
    return {
      success: false,
      message:
        "Meta Pixel no está configurado. Agregá NEXT_PUBLIC_META_PIXEL_ID en las variables de entorno de Render.",
    };
  }

  try {
    // Probar la conexión haciendo un request a la Graph API de Meta
    const token = getMetaAccessToken();
    const res = await fetch(
      `https://graph.facebook.com/v22.0/${cfg.appId}/ads?access_token=${token}&limit=1`,
      { method: "GET", signal: AbortSignal.timeout(10000) }
    );

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      return {
        success: false,
        message: `Error de conexión: ${body?.error?.message ?? res.statusText}`,
      };
    }

    return {
      success: true,
      message:
        "Conexión exitosa con Meta. App ID y Pixel ID verificados correctamente.",
    };
  } catch (err) {
    return {
      success: false,
      message: `Error al conectar con Meta: ${err instanceof Error ? err.message : "desconocido"}`,
    };
  }
}
