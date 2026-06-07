import { tool } from "ai";
import { z } from "zod";
import { db } from "@/db";
import { agentConfig } from "@/db/schema";
import { eq } from "drizzle-orm";
import { broadcastText, getBroadcastRecipients } from "@/lib/whatsapp/broadcast";
import type { BroadcastFilter } from "@/lib/whatsapp/broadcast";

// ─── WhatsApp Tools ──────────────────────────────────────────────────────

// sendWhatsAppMessage - Enviar WhatsApp a un cliente específico
export const sendWhatsAppMessage = tool({
  description:
    "Envía un mensaje de WhatsApp a un número de teléfono específico. Preguntas: 'mandar mensaje a cliente', 'enviar WhatsApp', 'notificar por WhatsApp'",
  inputSchema: z.object({
    to: z.string().describe("Número de teléfono del destinatario (ej: 5493705868421)"),
    message: z.string().describe("Texto del mensaje a enviar"),
  }),
  execute: async ({ to, message }) => {
    const phone = to.startsWith("+") ? to : `+${to}`;

    // Enviar WhatsApp
    const { sendText } = await import("@/lib/ycloud");
    const result = await sendText(phone, message);

    if (!result.ok) {
      return `Error al enviar WhatsApp a ${to}: ${result.error}`;
    }

    // Guardar en chat_messages
    try {
      const { findOrCreateConversation, insertMessage } = await import("@/lib/channels/router");
      const conv = await findOrCreateConversation("whatsapp", phone, undefined, to);
      await insertMessage(conv.id, "assistant", message, undefined, result.wamid);
    } catch (err) {
      console.warn("[sendWhatsAppMessage] No se pudo guardar en DB:", err);
    }

    return `✅ Mensaje enviado a ${to}`;
  },
});

// ─── broadcastWhatsApp ────────────────────────────────────────────────────
// Envía mensajes masivos con filtros inteligentes

const filterDescriptions = `
Filtros disponibles:
- "todos" → Todos los leads registrados
- "b2b" → Solo clientes mayoristas
- "b2c" → Solo clientes consumidor final (hamburguesas)
- "24h" → Solo los que tienen la ventana de 24h activa (mensaje gratuito)
- "con-pedido" → Solo los que ya hicieron algún pedido
- "buscar: TEXTO" → Busca por nombre o teléfono (ej: "buscar: hector")
`;

export const broadcastWhatsApp = tool({
  description:
    `Envía un mensaje MASIVO de WhatsApp a múltiples clientes con filtros inteligentes. Los mensajes se guardan automáticamente en el historial de chats.\n${filterDescriptions}`,
  inputSchema: z.object({
    filter: z.string().describe(
      "Filtro: 'todos', 'b2b', 'b2c', '24h', 'con-pedido', o 'buscar: TEXTO'"
    ),
    message: z.string().describe("Texto del mensaje a enviar a TODOS los destinatarios"),
    maxRecipients: z
      .number()
      .int()
      .min(1)
      .max(50)
      .optional()
      .default(10)
      .describe("Máximo de destinatarios (default 10, máximo 50)"),
    attachMenu: z
      .boolean()
      .optional()
      .default(false)
      .describe("Si es true, adjunta el menú de hamburguesas al mensaje"),
  }),
  execute: async ({ filter, message, maxRecipients, attachMenu }) => {
    // 1. Resolver filtro
    let broadcastFilter: BroadcastFilter;

    if (filter === "todos") {
      broadcastFilter = { type: "all" };
    } else if (filter === "b2b") {
      broadcastFilter = { type: "b2b" };
    } else if (filter === "b2c") {
      broadcastFilter = { type: "b2c" };
    } else if (filter === "24h") {
      broadcastFilter = { type: "24h-window" };
    } else if (filter === "con-pedido") {
      broadcastFilter = { type: "has-ordered" };
    } else if (filter.startsWith("buscar:")) {
      const query = filter.slice("buscar:".length).trim();
      if (!query) return "Usá 'buscar: TEXTO' con un término de búsqueda.";
      broadcastFilter = { type: "search", query };
    } else {
      return `Filtro no válido. Usá uno de: todos, b2b, b2c, 24h, con-pedido, buscar: TEXTO`;
    }

    // 2. Obtener destinatarios
    const recipients = await getBroadcastRecipients(broadcastFilter, maxRecipients);

    if (recipients.length === 0) {
      return `No se encontraron destinatarios para el filtro "${filter}".`;
    }

    // 3. Obtener URL del menú si attachMenu
    let imageUrl: string | undefined;
    if (attachMenu) {
      try {
        const [cfg] = await db
          .select({ urls: agentConfig.menuImageUrlsHamburguesas })
          .from(agentConfig)
          .where(eq(agentConfig.id, 1))
          .limit(1);
        imageUrl = (cfg?.urls && cfg.urls.length > 0) ? cfg.urls[0] : undefined;
      } catch {
        // non-fatal
      }
    }

    // 4. Enviar broadcast
    const { results, sent, failed } = await broadcastText(
      recipients,
      message,
      undefined,
      imageUrl,
    );

    // 5. Armar resumen
    const lines: string[] = [
      `📨 Broadcast completado:`,
      `✅ Enviados: ${sent}`,
      `❌ Fallaron: ${failed}`,
      `👥 Destinatarios: ${recipients.length}`,
      ``,
      `Detalle:`,
    ];

    for (const r of results.slice(0, 20)) {
      const icon = r.success ? "✅" : "❌";
      lines.push(`${icon} ${r.name || "—"} (${r.phone})${r.error ? `: ${r.error}` : ""}`);
    }

    if (results.length > 20) {
      lines.push(`... y ${results.length - 20} más`);
    }

    return lines.join("\n");
  },
});

// Exportar todas las herramientas WhatsApp
export const whatsAppTools = {
  sendWhatsAppMessage,
  broadcastWhatsApp,
};