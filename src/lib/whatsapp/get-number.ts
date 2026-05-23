"use server";

import { db } from "@/db";
import { agentConfig } from "@/db/schema";
import { eq } from "drizzle-orm";

/**
 * Obtiene el número de WhatsApp configurado desde el panel admin (DB).
 * Prioridad:
 * 1. agentConfig.phoneNumber (campo principal del admin)
 * 2. agentConfig.whatsappBotNumber (número del bot)
 * 3. process.env.WHATSAPP_PHONE_NUMBER (variable de entorno)
 * 4. Fallback estático (constants.ts)
 */
export async function getWhatsAppNumber(): Promise<string> {
  try {
    const [config] = await db
      .select()
      .from(agentConfig)
      .where(eq(agentConfig.id, 1))
      .limit(1);

    return (
      config?.phoneNumber ||
      config?.whatsappBotNumber ||
      process.env.WHATSAPP_PHONE_NUMBER ||
      "5493705115020"
    );
  } catch (error) {
    console.error("[getWhatsAppNumber] Error reading from DB:", error);
    return process.env.WHATSAPP_PHONE_NUMBER || "5493705115020";
  }
}
