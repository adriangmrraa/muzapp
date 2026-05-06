"use server";

import { auth } from "@/auth";
import {
  getTelegramConfigFromDB,
  getMe,
  setTelegramWebhook,
  deleteTelegramWebhook as removeTelegramWebhook,
  getTelegramWebhookInfo,
} from "@/lib/telegram/bot";
import { db } from "@/db";
import { eq } from "drizzle-orm";
import { agentConfig } from "@/db/schema";
import { encrypt, maskToken as maskTokenUtil } from "@/lib/encryption";

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

  // Get from DB first, fallback to env
  const config = await getTelegramConfigFromDB();
  const host =
    process.env.AUTH_URL ??
    process.env.RENDER_EXTERNAL_URL ??
    "https://muzapp.onrender.com";

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
    botToken: config.botToken ? maskTokenUtil(config.botToken) : "",
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

  const config = await getTelegramConfigFromDB();
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

  const config = await getTelegramConfigFromDB();
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

  const config = await getTelegramConfigFromDB();
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

/**
 * Save Telegram Bot config to DB (encrypted)
 */
export async function saveTelegramConfigAction(
  botToken: string,
  chatId: string,
  enabled: boolean
): Promise<TelegramActionState> {
  const session = await auth();
  if (!session) {
    return { success: false, message: "No autorizado" };
  }

  if (!botToken) {
    return { success: false, message: "Bot Token es requerido" };
  }

  try {
    // Import DB and encryption
    const { db } = await import("@/db");
    const { eq } = await import("drizzle-orm");
    const { agentConfig } = await import("@/db/schema");
    const { encrypt, decrypt } = await import("@/lib/encryption");

    // Verify token works by getting bot info
    const { getMe } = await import("@/lib/telegram/bot");
    const me = await getMe(botToken);
    if (!me.ok || !me.username) {
      return { success: false, message: "Token inválido. No se pudo obtener info del bot." };
    }

    // Encrypt token before storing
    const encryptedToken = encrypt(botToken);

    // Save to DB
    await db
      .update(agentConfig)
      .set({
        telegramBotToken: encryptedToken,
        telegramChatId: chatId || null,
        telegramEnabled: enabled,
        updatedAt: new Date(),
      })
      .where(eq(agentConfig.id, 1));

    return {
      success: true,
      message: `Bot @${me.username} configurado correctamente${enabled ? "" : " (deshabilitado)"}`,
    };
  } catch (error) {
    console.error("[telegram] Save config error:", error);
    return {
      success: false,
      message: `Error al guardar: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
}
