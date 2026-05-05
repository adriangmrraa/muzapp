"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { agentConfig } from "@/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { auth } from "@/auth";

const businessHourSchema = z.object({
  day: z.string(),
  open: z.boolean(),
  openTime: z.string().regex(/^\d{2}:\d{2}$/, "Formato HH:MM requerido"),
  closeTime: z.string().regex(/^\d{2}:\d{2}$/, "Formato HH:MM requerido"),
});

const agentConfigSchema = z.object({
  systemPrompt: z.string().min(1, "El prompt del sistema es obligatorio"),
  phoneNumber: z.string().min(1, "El número de teléfono es obligatorio"),
  enabled: z.boolean(),
  businessHours: z.array(businessHourSchema),
});

export type AgentConfigState = {
  success: boolean;
  message: string;
};

export async function saveAgentConfig(
  _prevState: AgentConfigState,
  formData: FormData
): Promise<AgentConfigState> {
  const session = await auth();
  if (!session) {
    return { success: false, message: "No autorizado" };
  }

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

  const raw = {
    systemPrompt: formData.get("systemPrompt"),
    phoneNumber: formData.get("phoneNumber"),
    enabled: formData.get("enabled") === "true",
    businessHours: rawBusinessHours,
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

    if (existing.length > 0) {
      await db
        .update(agentConfig)
        .set({
          systemPrompt: parsed.data.systemPrompt,
          phoneNumber: parsed.data.phoneNumber,
          enabled: parsed.data.enabled,
          businessHours: parsed.data.businessHours,
          updatedAt: new Date(),
        })
        .where(eq(agentConfig.id, 1));
    } else {
      await db.insert(agentConfig).values({
        id: 1,
        systemPrompt: parsed.data.systemPrompt,
        phoneNumber: parsed.data.phoneNumber,
        enabled: parsed.data.enabled,
        businessHours: parsed.data.businessHours,
      });
    }

    revalidatePath("/admin/agent");
    return { success: true, message: "Configuración guardada" };
  } catch {
    return { success: false, message: "Error al guardar la configuración" };
  }
}
