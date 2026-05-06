import { tool } from "ai";
import { z } from "zod";
import { db } from "@/db";
import { conversations, chatMessages } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { sendEscalationEmail } from "./escalation-email";

export function createTransferToHumanTool(conversationId: number) {
  return tool({
    description:
      "Deriva la conversación a un humano. Usá esto cuando: no podés resolver, el cliente lo pide explícitamente, hay reclamo grave, tema legal, alergia/salud, pedido B2B complejo, o cualquier situación que requiera intervención humana.",
    inputSchema: z.object({
      reason: z.string().describe("Motivo claro de la derivación"),
      category: z
        .enum([
          "reclamo",
          "salud_alergia",
          "pedido_b2b",
          "facturacion",
          "legal",
          "no_puede_resolver",
          "solicitud_cliente",
          "otro",
        ])
        .describe("Categoría de la derivación"),
      conversationSummary: z
        .string()
        .describe("Resumen breve de la conversación hasta ahora"),
    }),
    execute: async ({ reason, category, conversationSummary }) => {
      // 1. Mark conversation for human attention
      await db
        .update(conversations)
        .set({
          humanOverrideUntil: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h
        })
        .where(eq(conversations.id, conversationId));

      // 2. Get conversation details
      const [conv] = await db
        .select({
          customerName: conversations.customerName,
          customerPhone: conversations.customerPhone,
        })
        .from(conversations)
        .where(eq(conversations.id, conversationId))
        .limit(1);

      // 3. Get last messages for context
      const lastMsgs = await db
        .select({ role: chatMessages.role, content: chatMessages.content })
        .from(chatMessages)
        .where(eq(chatMessages.conversationId, conversationId))
        .orderBy(desc(chatMessages.createdAt))
        .limit(8);

      const lastMessages = lastMsgs
        .reverse()
        .map((m) => `${m.role === "user" ? "Cliente" : "Bot"}: ${m.content.slice(0, 120)}`);

      // 4. Send escalation notification
      await sendEscalationEmail({
        customerName: conv?.customerName || "Desconocido",
        customerPhone: conv?.customerPhone || "N/A",
        reason,
        category,
        conversationSummary,
        lastMessages,
      });

      return "Listo, ya le avisé al equipo. Te van a contactar a la brevedad. Cualquier cosa mientras tanto, acá estoy.";
    },
  });
}
