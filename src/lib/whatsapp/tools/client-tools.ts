import { tool } from "ai";
import { z } from "zod";
import { db } from "@/db";
import { products } from "@/db/schema";
import { eq } from "drizzle-orm";

// checkProductAvailability - Verificar stock
export const checkProductAvailabilityTool = tool({
  description: "Verifica si un producto está disponible actualmente",
  inputSchema: z.object({
    name: z.string().describe("Nombre del producto"),
  }),
  execute: async ({ name }) => {
    const [product] = await db
      .select({
        name: products.name,
        available: products.available,
        comingSoon: products.comingSoon,
      })
      .from(products)
      .where(eq(products.available, true))
      .limit(20);

    const normalizedName = name.toLowerCase();
    const found = product
      ? [product].find((p) => p.name?.toLowerCase().includes(normalizedName))
      : undefined;

    if (!found) {
      return `No tenemos "${name}" disponible en este momento. ¿Querés ver qué tenemos?`;
    }

    return `✅ ${found.name} está disponible!`;
  },
});

// Suggest products based on history
export const suggestProductsTool = tool({
  description: "Sugiere productos basados en el historial de pedidos del cliente",
  inputSchema: z.object({
    phone: z.string().optional().describe("Teléfono del cliente (opcional)"),
  }),
  execute: async ({ phone }) => {
    // If no phone, show popular products
    if (!phone) {
      return "Nuestros más pedidos: Classic Carne, Crispy Pollo, Especiale Italiano. ¿Querés que te recomiende algo en especial?";
    }

    // Get client history
    const { db } = await import("@/db");
    const { orders } = await import("@/db/schema");
    const { eq, desc } = await import("drizzle-orm");

    const recentOrders = await db
      .select({ items: orders.items })
      .from(orders)
      .where(eq(orders.phoneNumber, phone))
      .orderBy(desc(orders.createdAt))
      .limit(5);

    if (recentOrders.length === 0) {
      return "Aún no tienes pedidos registrados. ¿Querés ver el menú?";
    }

    // Extract most ordered products
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