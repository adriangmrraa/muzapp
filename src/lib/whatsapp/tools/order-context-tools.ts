import { tool } from "ai";
import { z } from "zod";
import { db } from "@/db";
import { agentConfig } from "@/db/schema";
import { eq } from "drizzle-orm";
import { addOrderContextItem, getOrderContextSummary, confirmOrderContext, formatOrderSummary } from "@/lib/order-context";
import { getCustomerAddresses, formatAddressesForPrompt } from "@/lib/addresses";

export function createAddOrderItemTool(conversationId: number, phone: string) {
  return tool({
    description: "Agrega un producto al pedido actual del cliente. Usá esto cuando el cliente pida un producto específico para no olvidarlo.",
    inputSchema: z.object({
      productName: z.string().describe("Nombre del producto (ej: Genesis, Deli Deli)"),
      productPrice: z.string().optional().describe("Precio del producto (ej: 4000)"),
      quantity: z.number().int().positive().optional().default(1).describe("Cantidad"),
      variant: z.string().optional().describe("Variante si aplica (ej: Con Crema, Sin Crema)"),
      notes: z.string().optional().describe("Notas del cliente (ej: sin cebolla, punto jugoso)"),
    }),
    execute: async ({ productName, productPrice, quantity, variant, notes }) => {
      // ─── Verificar si hay stock de hamburguesas ──────────────────────────
      try {
        const [cfg] = await db
          .select({ sinStock: agentConfig.hamburguesasSinStock })
          .from(agentConfig)
          .where(eq(agentConfig.id, 1))
          .limit(1);
        if (cfg?.sinStock) {
          const burgerKeywords = ["hamburguesa", "bookbinder", "genesis", "deli", "crispy", "classic", "especiale", "italiano", "torro", "smash", "cheddar", "bacon", "bbq"];
          const isBurger = burgerKeywords.some(k => productName.toLowerCase().includes(k));
          if (isBurger) {
            return "No estamos vendiendo hamburguesas hoy. Solo tenemos pan mayorista. Disculpá.";
          }
        }
      } catch {
        // non-fatal
      }

      await addOrderContextItem(conversationId, phone, productName, productPrice, quantity, variant, notes);
      const summary = await getOrderContextSummary(conversationId);
      return `✅ Agregado: ${quantity}x ${productName}${variant ? ` (${variant})` : ""}. Llevás ${summary.length} producto(s).`;
    },
  });
}

export function createGetOrderSummaryTool(conversationId: number) {
  return tool({
    description: "Obtené el resumen de todo lo que pidió el cliente hasta ahora en esta conversación.",
    inputSchema: z.object({}),
    execute: async () => {
      const items = await getOrderContextSummary(conversationId);
      if (items.length === 0) return "El cliente todavía no pidió nada en esta conversación.";
      return formatOrderSummary(items);
    },
  });
}

export function createConfirmOrderTool(conversationId: number, phone: string) {
  return tool({
    description: "CONFIRMA TODO el pedido. Llamá a esto DESPUÉS de que el cliente confirmó. Marca los items como pedidos y ejecuta createOrder.",
    inputSchema: z.object({}),
    execute: async () => {
      await confirmOrderContext(conversationId);
      return `✅ Pedido confirmado.`;
    },
  });
}

export function createGetAddressesTool(phone: string) {
  return tool({
    description: "Mostrá las direcciones guardadas del cliente para preguntarle a cuál enviar el pedido.",
    inputSchema: z.object({}),
    execute: async () => {
      const addresses = await getCustomerAddresses(phone);
      if (addresses.length === 0) return "El cliente no tiene direcciones guardadas.";
      return formatAddressesForPrompt(addresses);
    },
  });
}
