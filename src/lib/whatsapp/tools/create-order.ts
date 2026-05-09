import { tool } from "ai";
import { z } from "zod";
import { db } from "@/db";
import { orders, leads } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notifyNewOrder } from "@/lib/telegram/notifier";

export const createOrderTool = tool({
  description: "Crea un pedido una vez que el cliente confirmó los items. SIEMPRE confirmar con el cliente antes de usar esta herramienta. Preguntá el nombre al cliente si no lo sabés.",
  inputSchema: z.object({
    customerName: z.string().describe("Nombre del cliente (preguntalo si no lo sabés)"),
    orderType: z.enum(["hamburguesas", "pan_mayorista"]).describe("Tipo: hamburguesas (rotisería nocturna) o pan_mayorista (al por mayor)"),
    items: z.array(z.object({
      name: z.string(),
      quantity: z.number().int().positive(),
      unitPrice: z.number().positive(),
    })).describe("Lista de items del pedido con cantidad y precio unitario"),
    customerPhone: z.string().describe("Teléfono del cliente"),
    address: z.string().optional().describe("Dirección de entrega (si es delivery)"),
    notes: z.string().optional().describe("Notas adicionales del pedido"),
  }),
  execute: async ({ customerName, orderType, items, customerPhone, address, notes }) => {
    const total = items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0);

    // Find lead to link order + save address
    let leadId: number | null = null;
    try {
      const [lead] = await db
        .select({ id: leads.id })
        .from(leads)
        .where(eq(leads.phone, customerPhone))
        .limit(1);

      if (lead) {
        leadId = lead.id;
        // Save/update address on the lead if provided
        if (address) {
          await db.update(leads)
            .set({ address })
            .where(eq(leads.id, lead.id));
        }
      }
    } catch {
      // non-fatal
    }

    const [order] = await db.insert(orders).values({
      leadId,
      phoneNumber: customerPhone,
      customerName,
      address: address || null,
      orderType,
      items: items,
      notes: notes || null,
      status: "pending",
    }).returning({ id: orders.id });

    notifyNewOrder({ id: order.id, customerName, orderType, items, total, status: "pending", phoneNumber: customerPhone, notes });

    const typeLabel = orderType === "hamburguesas" ? "🍔 Hamburguesas" : "🍞 Pan Mayorista";

    return `✅ Pedido #${order.id} registrado (${typeLabel}).\n👤 Cliente: ${customerName}\n💰 Total: $${total.toFixed(2)}\n⏱ Estimado: 30-40 minutos.\n¿Necesitás algo más?`;
  },
});
