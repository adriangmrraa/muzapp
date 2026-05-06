import { tool } from "ai";
import { z } from "zod";
import { db } from "@/db";
import { products } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export const getMenuTool = tool({
  description: "Obtiene el menú de productos disponibles. Puede filtrar por categoría: hamburguesa, acompanamiento, pan_mayorista",
  inputSchema: z.object({
    category: z.enum(["hamburguesa", "acompanamiento", "pan_mayorista"]).optional()
      .describe("Categoría para filtrar. Si no se especifica, devuelve todo el menú"),
  }),
  execute: async ({ category }) => {
    const conditions = [eq(products.available, true)];
    if (category) conditions.push(eq(products.category, category));

    const items = await db
      .select({
        name: products.name,
        description: products.description,
        price: products.price,
        category: products.category,
        line: products.line,
      })
      .from(products)
      .where(and(...conditions))
      .orderBy(products.sortOrder);

    if (items.length === 0) return "No hay productos disponibles en este momento.";

    return items.map(i => `• ${i.name} (${i.line}) - $${i.price}${i.description ? ` — ${i.description}` : ""}`).join("\n");
  },
});
