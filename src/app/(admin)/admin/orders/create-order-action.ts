"use server";

import { db } from "@/db";
import { orders, leads } from "@/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { notifyNewOrder } from "@/lib/telegram/notifier";

export async function createManualOrder(
  data: {
    customerName: string;
    customerPhone: string;
    orderType: "hamburguesas" | "pan_mayorista";
    items: { name: string; quantity: number; unitPrice: number }[];
    address?: string | null;
    notes?: string | null;
    deliveryFee?: number;
    paymentStatus?: string;
    paymentMethod?: string;
  }
): Promise<{ success: boolean; orderId?: number; error?: string }> {
  const session = await auth();
  if (!session) return { success: false, error: "No autorizado" };

  try {
    const subtotal = data.items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0);
    const delivery = data.deliveryFee || 0;
    const total = subtotal + delivery;

    // Vincular con lead si existe
    let leadId: number | null = null;
    try {
      const [lead] = await db
        .select({ id: leads.id, status: leads.status })
        .from(leads)
        .where(eq(leads.phone, data.customerPhone))
        .limit(1);
      if (lead) {
        leadId = lead.id;
        if (data.address) {
          await db.update(leads).set({ address: data.address }).where(eq(leads.id, lead.id));
        }
        // Si era un lead sin pedidos, pasa a cliente
        if (lead.status === "new" || lead.status === "contacted") {
          await db.update(leads).set({ status: "converted" }).where(eq(leads.id, lead.id));
        }
        if (data.customerName) {
          await db.update(leads).set({ name: data.customerName }).where(eq(leads.id, lead.id));
        }
      }
    } catch {}

    const [order] = await db
      .insert(orders)
      .values({
        leadId,
        phoneNumber: data.customerPhone,
        customerName: data.customerName,
        address: data.address || null,
        orderType: data.orderType,
        items: data.items,
        notes: data.notes || null,
        deliveryFee: data.deliveryFee ? String(data.deliveryFee) : "0",
        paymentStatus: data.paymentStatus || "pending",
        paymentMethod: data.paymentMethod || null,
        status: "pending",
      })
      .returning({ id: orders.id });

    // Notificar a Telegram
    notifyNewOrder({
      id: order.id,
      customerName: data.customerName,
      orderType: data.orderType,
      items: data.items,
      total,
      status: "pending",
      phoneNumber: data.customerPhone,
      notes: data.notes || null,
    }).catch(() => {});

    revalidatePath("/admin/orders");
    return { success: true, orderId: order.id };
  } catch (e) {
    console.error("[createManualOrder]", e);
    return { success: false, error: "Error al crear pedido" };
  }
}
