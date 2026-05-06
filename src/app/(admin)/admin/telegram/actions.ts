"use server";

import { auth } from "@/auth";
import {
  getTelegramConfigFromEnv,
  getMe,
  setTelegramWebhook,
  deleteTelegramWebhook as removeTelegramWebhook,
  getTelegramWebhookInfo,
} from "@/lib/telegram/bot";

export type TelegramStatus = {
  configured: boolean;
  botUsername: string | null;
  botToken: string;
  webhookToken: string;
  webhookUrl: string;
  allowedChatIds: number[];
  enabled: boolean;
};

export type WebhookInfo = {
  url: string;
  pendingUpdateCount: number;
};

export type TelegramActionState = {
  success: boolean;
  message: string;
};

/**
 * Obtiene el estado actual de la configuración de Telegram
 */
export async function getTelegramStatus(): Promise<TelegramStatus> {
  const session = await auth();
  if (!session) {
    return {
      configured: false,
      botUsername: null,
      botToken: "",
      webhookToken: "",
      webhookUrl: "",
      allowedChatIds: [],
      enabled: false,
    };
  }

  const config = getTelegramConfigFromEnv();
  const host =
    process.env.AUTH_URL ??
    process.env.RENDER_EXTERNAL_URL ??
    "https://muzzarella.onrender.com";

  // Intentar obtener info del bot
  let botUsername: string | null = null;
  if (config.botToken) {
    const me = await getMe(config.botToken);
    if (me.ok && me.username) {
      botUsername = `@${me.username}`;
    }
  }

  return {
    configured: config.enabled,
    botUsername,
    botToken: config.botToken ? maskToken(config.botToken) : "",
    webhookToken: config.webhookToken,
    webhookUrl: `${host}/api/telegram/webhook/${config.webhookToken}`,
    allowedChatIds: config.allowedChatIds,
    enabled: config.enabled,
  };
}

/**
 * Configura el webhook en Telegram
 */
export async function setTelegramWebhookAction(): Promise<TelegramActionState> {
  const session = await auth();
  if (!session) {
    return { success: false, message: "No autorizado" };
  }

  const config = getTelegramConfigFromEnv();
  if (!config.botToken) {
    return {
      success: false,
      message:
        "TELEGRAM_BOT_TOKEN no está configurado. Agregalo en las variables de entorno.",
    };
  }

  const host =
    process.env.AUTH_URL ??
    process.env.RENDER_EXTERNAL_URL ??
    "https://muzzarella.onrender.com";
  const webhookUrl = `${host}/api/telegram/webhook/${config.webhookToken}`;

  const result = await setTelegramWebhook(config.botToken, webhookUrl);
  if (!result.ok) {
    return {
      success: false,
      message: `Error al configurar webhook: ${result.error}`,
    };
  }

  return {
    success: true,
    message: `Webhook configurado correctamente → ${webhookUrl}`,
  };
}

/**
 * Elimina el webhook de Telegram
 */
export async function deleteTelegramWebhookAction(): Promise<TelegramActionState> {
  const session = await auth();
  if (!session) {
    return { success: false, message: "No autorizado" };
  }

  const config = getTelegramConfigFromEnv();
  if (!config.botToken) {
    return { success: false, message: "TELEGRAM_BOT_TOKEN no está configurado." };
  }

  const result = await removeTelegramWebhook(config.botToken);
  if (!result.ok) {
    return {
      success: false,
      message: `Error al eliminar webhook: ${result.error}`,
    };
  }

  return { success: true, message: "Webhook eliminado correctamente" };
}

/**
 * Obtiene información del webhook actual
 */
export async function getTelegramWebhookInfoAction(): Promise<
  WebhookInfo | TelegramActionState
> {
  const session = await auth();
  if (!session) {
    return { success: false, message: "No autorizado" };
  }

  const config = getTelegramConfigFromEnv();
  if (!config.botToken) {
    return { success: false, message: "TELEGRAM_BOT_TOKEN no está configurado." };
  }

  const info = await getTelegramWebhookInfo(config.botToken);
  if (!info.ok) {
    return {
      success: false,
      message: `Error al obtener info del webhook: ${info.error}`,
    };
  }

  return {
    url: info.url ?? "",
    pendingUpdateCount: info.pendingUpdateCount ?? 0,
  };
}

function maskToken(token: string): string {
  if (token.length <= 8) return "****";
  return token.slice(0, 4) + "****" + token.slice(-4);
}
