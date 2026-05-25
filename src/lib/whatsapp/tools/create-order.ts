import { tool } from "ai";
import { z } from "zod";
import { db } from "@/db";
import { orders, leads, agentConfig, addresses } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { notifyNewOrder } from "@/lib/telegram/notifier";
import { resolveItems } from "@/lib/order-utils";

async function notifyDeliveryOrder(
  customerName: string,
  customerPhone: string,
  address: string | null,
  items: { name: string; quantity: number; unitPrice: number }[],
  total: number,
  orderId: number
): Promise<void> {
  try {
    const [cfg] = await db.select().from(agentConfig).where(eq(agentConfig.id, 1)).limit(1);
    const deliveryPhone = cfg?.deliveryPhoneNumber?.trim();
    if (!deliveryPhone) return;

    const { sendWhatsAppMessage } = await import("@/lib/whatsapp/ycloud-client");
    const apiKey = process.env.YCLOUD_API_KEY || cfg?.ycloudApiKey || "";
    const from = process.env.WHATSAPP_PHONE_NUMBER || cfg?.phoneNumber || "";
    if (!apiKey || !from) return;

    // Buscar el maps link más reciente del cliente
    const [lastAddr] = await db
      .select({ mapsLink: addresses.mapsLink })
      .from(addresses)
      .where(eq(addresses.phone, customerPhone))
      .orderBy(desc(addresses.lastUsedAt))
      .limit(1);

    const itemLines = items.map(i => `• ${i.quantity}x ${i.name} — $${(i.quantity * i.unitPrice).toLocaleString("es-AR")}`).join("\n");

    const message = [
      `🚚 NUEVO PEDIDO #${orderId} PARA DELIVERY`,
      ``,
      `👤 ${customerName}`,
      `📱 ${customerPhone}`,
      address ? `📍 ${address}` : "",
      lastAddr?.mapsLink ? `🗺️ ${lastAddr.mapsLink}` : "",
      ``,
      `${itemLines}`,
      ``,
      `💰 Total: $${total.toLocaleString("es-AR")}`,
    ].filter(Boolean).join("\n");

    await sendWhatsAppMessage({ to: deliveryPhone, body: message, apiKey, from });
    console.log(`[delivery] Order #${orderId} notified to ${deliveryPhone}`);
  } catch (err) {
    console.warn("[delivery] Failed to notify delivery:", err);
  }
}

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
    deliveryFee: z.number().min(0).optional().describe("Costo de delivery (0 si no aplica)"),
    paymentStatus: z.enum(["pending", "paid"]).optional().describe("Estado de pago: pending (pendiente), paid (pagado)"),
    paymentMethod: z.string().optional().describe("Método de pago: efectivo, alias, etc."),
    notes: z.string().optional().describe("Notas adicionales del pedido"),
  }),
  execute: async ({ customerName, orderType, items, customerPhone, address, deliveryFee, paymentStatus, paymentMethod, notes }) => {
    // Resolver items contra productos reales de la DB
    const resolvedItems = await resolveItems(items);
    const subtotal = resolvedItems.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0);
    const delivery = deliveryFee || 0;
    const total = subtotal + delivery;

    // Find lead to link order + save address
    let leadId: number | null = null;
    try {
      const [lead] = await db
        .select({ id: leads.id, status: leads.status })
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
        // Set client type based on order type
        const clientType = orderType === "pan_mayorista" ? "b2b" : "b2c";
        await db.update(leads)
          .set({ type: clientType })
          .where(eq(leads.id, lead.id));
        // Si era un lead sin pedidos, actualizar a "converted" (cliente)
        if (lead.status === "new" || lead.status === "contacted") {
          await db.update(leads)
            .set({ status: "converted" })
            .where(eq(leads.id, lead.id));
        }
        // Actualizar nombre
        if (customerName) {
          await db.update(leads)
            .set({ name: customerName })
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
      items: resolvedItems,
      deliveryFee: delivery ? String(delivery) : "0",
      paymentStatus: paymentStatus || "pending",
      paymentMethod: paymentMethod || null,
      notes: notes || null,
      status: "pending",
    }).returning({ id: orders.id });

    notifyNewOrder({ id: order.id, customerName, orderType, items: resolvedItems, total, status: "pending", phoneNumber: customerPhone, notes });

    // Notificar al delivery con pedido + dirección
    if (address) {
      notifyDeliveryOrder(customerName, customerPhone, address, resolvedItems, total, order.id);
    }

    const typeLabel = orderType === "hamburguesas" ? "🍔 Hamburguesas" : "🍞 Pan Mayorista";

    return `✅ Pedido #${order.id} registrado (${typeLabel}).\n👤 Cliente: ${customerName}\n💰 Total: $${total.toFixed(2)}\n⏱ Estimado: 30-40 minutos.\n¿Necesitás algo más?`;
  },
});
