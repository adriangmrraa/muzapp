import { tool } from "ai";
import { z } from "zod";
import { db } from "@/db";
import { conversations } from "@/db/schema";
import { eq } from "drizzle-orm";

export function createTransferToHumanTool(conversationId: number) {
  return tool({
    description: "Transfiere la conversación a un humano cuando el cliente lo pide o cuando no podés resolver su consulta",
    inputSchema: z.object({
      reason: z.string().describe("Motivo de la transferencia"),
    }),
    execute: async ({ reason }) => {
      await db
        .update(conversations)
        .set({ status: "closed" })
        .where(eq(conversations.id, conversationId));

      return `He transferido tu consulta a nuestro equipo (escalada a humano). Motivo: ${reason}. Te van a contactar a la brevedad. ¡Gracias por tu paciencia!`;
    },
  });
}
