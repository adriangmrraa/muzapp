"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { agentConfig } from "@/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { auth } from "@/auth";

// ─── Types ──────────────────────────────────────────────────────────────────────

export type PhoneIdEntry = {
  name: string;
  phone: string;
};

export type AgentConfigState = {
  success: boolean;
  message: string;
};

// ─── Schemas ────────────────────────────────────────────────────────────────────

const businessHourSchema = z.object({
  day: z.string(),
  open: z.boolean(),
  openTime: z.string().regex(/^\d{2}:\d{2}$/, "Formato HH:MM requerido"),
  closeTime: z.string().regex(/^\d{2}:\d{2}$/, "Formato HH:MM requerido"),
});

const phoneIdSchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio"),
  phone: z.string().min(1, "El teléfono es obligatorio"),
});

const zonaDeliverySchema = z.object({
  zona: z.string(),
  disponible: z.boolean(),
  tiempo: z.string(),
  costo: z.number(),
});

const agentConfigSchema = z.object({
  systemPrompt: z.string().optional().default(""),
  phoneNumber: z.string().min(1, "El número de teléfono es obligatorio"),
  enabled: z.boolean(),
  businessHours: z.array(businessHourSchema),
  ycloudApiKey: z.string().optional(),
  whatsappBotNumber: z.string().optional(),
  allowedPhoneIds: z.array(phoneIdSchema),
  autoReply24h: z.boolean(),
  autoReply24hMessage: z.string().optional(),
  trainBotContext: z.string().optional(),
  whatsappSystemPrompt: z.string().optional(),
  whatsappInstrucciones: z.string().optional(),
  whatsappPromociones: z.string().optional(),
  whatsappZonasDelivery: z.array(zonaDeliverySchema).optional().default([]),
  isCooking: z.boolean(),
  stockPanDocenas: z.number().int().min(0).optional().default(0),
  aliasB2c: z.string().optional(),
  aliasB2b: z.string().optional(),
});

// ─── Actions ────────────────────────────────────────────────────────────────────

export async function saveAgentConfig(
  _prevState: AgentConfigState,
  formData: FormData
): Promise<AgentConfigState> {
  const session = await auth();
  if (!session) {
    return { success: false, message: "No autorizado" };
  }

  // ─── Business hours ────────────────────────────────────────────────────────
  const rawBusinessHours: unknown[] = [];
  const days = [
    "Lunes",
    "Martes",
    "Miércoles",
    "Jueves",
    "Viernes",
    "Sábado",
    "Domingo",
  ];

  for (const day of days) {
    rawBusinessHours.push({
      day,
      open: formData.get(`businessHours.${day}.open`) === "true",
      openTime: formData.get(`businessHours.${day}.openTime`) ?? "09:00",
      closeTime: formData.get(`businessHours.${day}.closeTime`) ?? "22:00",
    });
  }

  // ─── Allowed phone IDs (JSON string from hidden input) ─────────────────────
  let allowedPhoneIds: PhoneIdEntry[] = [];
  try {
    const raw = formData.get("allowedPhoneIds");
    if (raw && typeof raw === "string") {
      allowedPhoneIds = JSON.parse(raw);
    }
  } catch {
    allowedPhoneIds = [];
  }

  // ─── WhatsApp zonas delivery (JSON string from hidden input) ─────────────
  let whatsappZonasDelivery: unknown[] = [];
  try {
    const rawZonas = formData.get("whatsappZonasDelivery");
    if (rawZonas && typeof rawZonas === "string") {
      whatsappZonasDelivery = JSON.parse(rawZonas);
    }
  } catch {
    whatsappZonasDelivery = [];
  }

  const raw = {
    systemPrompt: formData.get("systemPrompt") || "",
    phoneNumber: formData.get("phoneNumber"),
    enabled: formData.get("enabled") === "true",
    businessHours: rawBusinessHours,
    ycloudApiKey: formData.get("ycloudApiKey") || undefined,
    whatsappBotNumber: formData.get("whatsappBotNumber") || undefined,
    allowedPhoneIds,
    autoReply24h: formData.get("autoReply24h") === "true",
    autoReply24hMessage: formData.get("autoReply24hMessage") || undefined,
    trainBotContext: formData.get("trainBotContext") || undefined,
    whatsappSystemPrompt: formData.get("whatsappSystemPrompt") || undefined,
    whatsappInstrucciones: formData.get("whatsappInstrucciones") || undefined,
    whatsappPromociones: formData.get("whatsappPromociones") || undefined,
    whatsappZonasDelivery,
    isCooking: formData.get("isCooking") === "true",
    stockPanDocenas: Number(formData.get("stockPanDocenas")) || 0,
    aliasB2c: formData.get("aliasB2c") || undefined,
    aliasB2b: formData.get("aliasB2b") || undefined,
  };

  const parsed = agentConfigSchema.safeParse(raw);
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? "Datos inválidos";
    return { success: false, message: firstError };
  }

  try {
    const existing = await db
      .select({ id: agentConfig.id })
      .from(agentConfig)
      .where(eq(agentConfig.id, 1))
      .limit(1);

    const values = {
      systemPrompt: parsed.data.systemPrompt,
      phoneNumber: parsed.data.phoneNumber,
      enabled: parsed.data.enabled,
      businessHours: parsed.data.businessHours,
      ycloudApiKey: parsed.data.ycloudApiKey ?? null,
      whatsappBotNumber: parsed.data.whatsappBotNumber ?? null,
      allowedPhoneIds: parsed.data.allowedPhoneIds,
      autoReply24h: parsed.data.autoReply24h,
      autoReply24hMessage: parsed.data.autoReply24hMessage ?? null,
      trainBotContext: parsed.data.trainBotContext ?? null,
      whatsappSystemPrompt: parsed.data.whatsappSystemPrompt ?? null,
      whatsappInstrucciones: parsed.data.whatsappInstrucciones ?? null,
      whatsappPromociones: parsed.data.whatsappPromociones ?? null,
      whatsappZonasDelivery: parsed.data.whatsappZonasDelivery ?? null,
      isCooking: parsed.data.isCooking,
      stockPanDocenas: parsed.data.stockPanDocenas ?? 0,
      aliasB2c: parsed.data.aliasB2c ?? null,
      aliasB2b: parsed.data.aliasB2b ?? null,
      updatedAt: new Date(),
    };

    if (existing.length > 0) {
      await db
        .update(agentConfig)
        .set(values)
        .where(eq(agentConfig.id, 1));
    } else {
      await db.insert(agentConfig).values({
        id: 1,
        ...values,
      });
    }

    revalidatePath("/admin/agent");
    return { success: true, message: "Configuración guardada" };
  } catch (e) {
    console.error("[agent-config] Error saving:", e);
    return { success: false, message: `Error al guardar: ${e instanceof Error ? e.message : "desconocido"}` };
  }
}

export async function testAgentConnection(): Promise<{
  success: boolean;
  message: string;
}> {
  const session = await auth();
  if (!session) {
    return { success: false, message: "No autorizado" };
  }

  try {
    // Select all columns - use raw query to avoid Drizzle type issues with new columns
    const rows = await db
      .select()
      .from(agentConfig)
      .where(eq(agentConfig.id, 1))
      .limit(1);

    const cfg = rows[0];
    if (!cfg) {
      return {
        success: false,
        message: "No hay configuración guardada. Guardá la configuración primero.",
      };
    }

    // Access columns dynamically to avoid TS errors with schema type mismatch
    const ycloudApiKey = (cfg as Record<string, unknown>).ycloudApiKey as string | null;
    const whatsappBotNumber = (cfg as Record<string, unknown>).whatsappBotNumber as string | null;
    const systemPrompt = (cfg as Record<string, unknown>).systemPrompt as string | null;
    const enabled = (cfg as Record<string, unknown>).enabled as boolean;

    const checks: string[] = [];
    if (ycloudApiKey) checks.push("✅ YCloud API Key configurada");
    else checks.push("❌ YCloud API Key no configurada");

    if (whatsappBotNumber) checks.push("✅ Número del bot configurado");
    else checks.push("❌ Número del bot no configurado");

    if (systemPrompt) checks.push("✅ Prompt del sistema configurado");
    else checks.push("❌ Prompt del sistema no configurado");

    checks.push(enabled ? "✅ Agente activo" : "⚠️ Agente desactivado");

    const allOk = checks.every((c) => c.startsWith("✅"));
    return {
      success: allOk,
      message: checks.join(" · "),
    };
  } catch (e) {
    return {
      success: false,
      message: `Error al leer configuración: ${e instanceof Error ? e.message : "desconocido"}`,
    };
  }
}
