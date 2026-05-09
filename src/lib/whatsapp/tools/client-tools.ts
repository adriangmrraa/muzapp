import { tool } from "ai";
import { z } from "zod";
import { db } from "@/db";
import { products, orders, leads } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

// checkProductAvailability - Verificar stock
export const checkProductAvailabilityTool = tool({
  description: "Verifica si un producto está disponible actualmente",
  inputSchema: z.object({
    name: z.string().describe("Nombre del producto"),
  }),
  execute: async ({ name }) => {
    const allProducts = await db
      .select({
        name: products.name,
        available: products.available,
      })
      .from(products);

    const normalizedName = name.toLowerCase();
    const found = allProducts.find((p) =>
      p.name?.toLowerCase().includes(normalizedName)
    );

    if (!found) {
      return `No encontré "${name}" en nuestro menú. ¿Querés ver qué tenemos?`;
    }

    if (!found.available) {
      return `${found.name} no está disponible en este momento. ¿Querés ver otras opciones?`;
    }

    return `✅ ${found.name} está disponible!`;
  },
});

// suggestProducts - Sugerir según historial
export const suggestProductsTool = tool({
  description: "Sugiere productos basados en el historial de pedidos del cliente",
  inputSchema: z.object({
    phone: z.string().optional().describe("Teléfono del cliente (opcional)"),
  }),
  execute: async ({ phone }) => {
    if (!phone) {
      return "Nuestros más pedidos: Classic Carne, Crispy Pollo, Especiale Italiano. ¿Querés que te recomiende algo en especial?";
    }

    const recentOrders = await db
      .select({ items: orders.items })
      .from(orders)
      .where(eq(orders.phoneNumber, phone))
      .orderBy(desc(orders.createdAt))
      .limit(5);

    if (recentOrders.length === 0) {
      return "Aún no tenés pedidos registrados. ¿Querés ver el menú?";
    }

    const productCounts: Record<string, number> = {};
    for (const order of recentOrders) {
      const items = order.items as { name: string }[];
      if (Array.isArray(items)) {
        for (const item of items) {
          productCounts[item.name] = (productCounts[item.name] || 0) + 1;
        }
      }
    }

    const topProducts = Object.entries(productCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([name]) => name);

    return `Basado en tus pedidos anteriores: ${topProducts.join(", ")}. ¿Querés pedir algo de eso?`;
  },
});

// ─── getClientHistory ───────────────────────────────────────────────────────
export const getClientHistoryTool = tool({
  description:
    "Obtiene el historial completo de un cliente: pedidos anteriores, lead info, frecuencia. Usar para venta consultiva.",
  inputSchema: z.object({
    phone: z.string().describe("Teléfono del cliente"),
  }),
  execute: async ({ phone }) => {
    // Buscar lead
    const leadRows = await db
      .select({
        name: leads.name,
        phone: leads.phone,
        address: leads.address,
        status: leads.status,
        tags: leads.tags,
        firstMessage: leads.firstMessage,
        createdAt: leads.createdAt,
      })
      .from(leads)
      .where(eq(leads.phone, phone))
      .limit(1);

    // Buscar pedidos
    const orderRows = await db
      .select({
        id: orders.id,
        items: orders.items,
        status: orders.status,
        orderType: orders.orderType,
        createdAt: orders.createdAt,
      })
      .from(orders)
      .where(eq(orders.phoneNumber, phone))
      .orderBy(desc(orders.createdAt))
      .limit(10);

    const lead = leadRows[0];
    const parts: string[] = [];

    if (lead) {
      parts.push(
        `👤 ${lead.name || "Sin nombre"} (${lead.status})`,
        `📞 ${lead.phone}`,
        `📅 Cliente desde: ${lead.createdAt ? new Date(lead.createdAt).toLocaleDateString("es-AR") : "desconocido"}`
      );
      if (lead.address) parts.push(`📍 Direccion guardada: ${lead.address}`);
      const tags = lead.tags as string[] | null;
      if (tags?.length) parts.push(`🏷️ Tags: ${tags.join(", ")}`);
    } else {
      parts.push("👤 Cliente no registrado como lead");
    }

    if (orderRows.length === 0) {
      parts.push("\n📦 Sin pedidos anteriores");
    } else {
      parts.push(`\n📦 ${orderRows.length} pedido(s):`);
      for (const o of orderRows.slice(0, 5)) {
        const items = o.items as { name: string; quantity: number }[];
        const itemSummary = Array.isArray(items)
          ? items.map((i) => `${i.quantity}x ${i.name}`).join(", ")
          : "sin detalle";
        const date = o.createdAt
          ? new Date(o.createdAt).toLocaleDateString("es-AR")
          : "";
        parts.push(`  #${o.id} (${o.status}) ${date}: ${itemSummary}`);
      }
    }

    return parts.join("\n");
  },
});