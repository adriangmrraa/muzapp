import { tool } from "ai";
import { z } from "zod";
import { sendText } from "@/lib/ycloud";
import { db } from "@/db";
import { leads } from "@/db/schema";
import { eq, ilike, or, desc } from "drizzle-orm";

// ─── WhatsApp Tools: Herramientas de comunicación por WhatsApp ───────────────

// sendWhatsAppMessage - Enviar mensaje de WhatsApp a un cliente
export const sendWhatsAppMessage = tool({
  description:
    "Envía un mensaje de WhatsApp a un número de teléfono. Preguntas: 'mandar mensaje a cliente', 'enviar WhatsApp', 'notificar por WhatsApp'",
  inputSchema: z.object({
    to: z.string().describe("Número de teléfono del destinatario (con código de país, ej: 5491112345678)"),
    message: z.string().describe("Texto del mensaje a enviar"),
  }),
  execute: async ({ to, message }) => {
    const result = await sendText(to, message);

    if (!result.ok) {
      return `Error al enviar WhatsApp: ${result.error}`;
    }

    return `Mensaje enviado correctamente a ${to}`;
  },
});

// ─── batchSendWhatsApp ───────────────────────────────────────────────────────
// Envía el mismo mensaje a múltiples clientes filtrados por nombre o teléfono
export const batchSendWhatsApp = tool({
  description:
    "Envía el MISMO mensaje de WhatsApp a VARIOS clientes. Busca clientes por nombre o teléfono (coincidencia parcial) y les manda el mensaje a cada uno. Preguntas: 'mandales a todos los clientes', 'avisale a los leads nuevos', 'notificá a los que pidieron pan'",
  inputSchema: z.object({
    filter: z.string().describe("Texto para filtrar clientes. Se busca por nombre o teléfono. Ej: 'Hector', 'lead', 'pan'"),
    message: z.string().describe("Texto del mensaje a enviar a TODOS los clientes encontrados"),
    maxRecipients: z.number().int().min(1).max(20).optional().default(5).describe("Máximo de destinatarios (para no spamear)"),
  }),
  execute: async ({ filter, message, maxRecipients }) => {
    const clients = await db
      .select({ name: leads.name, phone: leads.phone })
      .from(leads)
      .where(or(
        ilike(leads.name, `%${filter}%`),
        ilike(leads.phone, `%${filter}%`)
      ))
      .orderBy(desc(leads.createdAt))
      .limit(maxRecipients);

    if (clients.length === 0) return `No encontré clientes que coincidan con "${filter}".`;

    const results: string[] = [];
    for (const c of clients) {
      if (!c.phone) continue;
      const r = await sendText(c.phone, message);
      results.push(`${c.name || c.phone}: ${r.ok ? "✅" : "❌ " + r.error}`);
    }

    return `📨 Mensaje enviado a ${results.length} cliente(s):\n${results.join("\n")}`;
  },
});

// Export all WhatsApp tools
export const whatsAppTools = {
  sendWhatsAppMessage,
  batchSendWhatsApp,
};
