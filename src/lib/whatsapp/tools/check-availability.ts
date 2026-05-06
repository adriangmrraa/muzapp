import { tool } from "ai";
import { z } from "zod";
import { db } from "@/db";
import { products } from "@/db/schema";
import { ilike } from "drizzle-orm";

export const checkAvailabilityTool = tool({
  description: "Verifica si un producto específico está disponible para pedido",
  inputSchema: z.object({
    productName: z.string().describe("Nombre del producto a consultar"),
  }),
  execute: async ({ productName }) => {
    const results = await db
      .select({
        name: products.name,
        available: products.available,
        comingSoon: products.comingSoon,
        price: products.price,
      })
      .from(products)
      .where(ilike(products.name, `%${productName}%`));

    if (results.length === 0) return `No encontré "${productName}" en nuestro menú. ¿Querés ver el menú completo?`;

    const item = results[0];
    if (!item.available) return `"${item.name}" no está disponible en este momento.`;
    if (item.comingSoon) return `"${item.name}" estará disponible próximamente.`;
    return `"${item.name}" está disponible — $${item.price}. Tiempo estimado: 30-40 minutos.`;
  },
});
