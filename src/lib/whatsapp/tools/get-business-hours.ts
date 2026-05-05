import { tool } from "ai";
import { z } from "zod";
import { db } from "@/db";
import { agentConfig } from "@/db/schema";
import { eq } from "drizzle-orm";

interface BusinessHourDay {
  day: string;
  open: boolean;
  openTime: string;
  closeTime: string;
}

export const getBusinessHoursTool = tool({
  description: "Consulta los horarios de atención del local y si está abierto ahora",
  inputSchema: z.object({}),
  execute: async () => {
    const [config] = await db
      .select({ businessHours: agentConfig.businessHours })
      .from(agentConfig)
      .where(eq(agentConfig.id, 1));

    if (!config?.businessHours) return "No tengo información de horarios configurada.";

    const hours = config.businessHours as BusinessHourDay[];
    const now = new Date();
    const days = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
    const todayName = days[now.getDay()];
    const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

    const today = hours.find(h => h.day === todayName);
    const isOpenNow = today?.open && currentTime >= today.openTime && currentTime <= today.closeTime;

    const schedule = hours
      .filter(h => h.open)
      .map(h => `${h.day}: ${h.openTime} – ${h.closeTime}`)
      .join("\n");

    return `${isOpenNow ? "🟢 Estamos ABIERTOS ahora." : "🔴 Estamos CERRADOS en este momento."}\n\nHorarios:\n${schedule}`;
  },
});
