import { tool } from "ai";
import { z } from "zod";
import { db } from "@/db";
import { orders } from "@/db/schema";

export const createOrderTool = tool({
  description: "Crea un pedido una vez que el cliente confirmó los items. SIEMPRE confirmar con el cliente antes de usar esta herramienta.",
  inputSchema: z.object({
    items: z.array(z.object({
      name: z.string(),
      quantity: z.number().int().positive(),
      unitPrice: z.number().positive(),
    })).describe("Lista de items del pedido con cantidad y precio unitario"),
    customerPhone: z.string().describe("Teléfono del cliente"),
    notes: z.string().optional().describe("Notas adicionales del pedido"),
  }),
  execute: async ({ items, customerPhone, notes }) => {
    const total = items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0);

    const [order] = await db.insert(orders).values({
      phoneNumber: customerPhone,
      items: items,
      notes: notes || null,
      status: "pending",
    }).returning({ id: orders.id });

    return `Pedido #${order.id} creado exitosamente.\nTotal: $${total.toFixed(2)}\nEstimado: 30-40 minutos.\n¿Necesitás algo más?`;
  },
});
