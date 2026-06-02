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
  description: "Consulta los horarios de atención. Cuando el cliente pregunte: 'hasta qué hora están?', 'abren los domingos?', 'a qué hora cierran?', 'trabajan los sábados?', 'a la tarde están?', 'qué días abren?', 'están ahora?'",
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

    const today = hours.find(h => h.day === todayName);
    // Soporte para horarios que cruzan medianoche (ej: 06:00 a 04:00)
    let isOpenNow = false;
    if (today?.open) {
      const nowHour = now.getHours();
      const openHour = parseInt(today.openTime.split(":")[0], 10);
      const closeHour = parseInt(today.closeTime.split(":")[0], 10);
      if (closeHour < openHour) {
        // Cruza medianoche: abierto si hora >= apertura O hora < cierre
        isOpenNow = nowHour >= openHour || nowHour < closeHour;
      } else {
        // Horario normal
        isOpenNow = nowHour >= openHour && nowHour < closeHour;
      }
    }

    const schedule = hours
      .filter(h => h.open)
      .map(h => `${h.day}: ${h.openTime} – ${h.closeTime}`)
      .join("\n");

    return `${isOpenNow ? "🟢 Estamos ABIERTOS ahora." : "🔴 Estamos CERRADOS en este momento."}\n\nHorarios:\n${schedule}`;
  },
});
