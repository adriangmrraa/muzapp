import { tool } from "ai";
import { z } from "zod";
import { db } from "@/db";
import { products } from "@/db/schema";
import { eq } from "drizzle-orm";

// getProductDetails - Ver detalles de un producto
export const getProductDetailsTool = tool({
  description: "Obtiene los detalles completos de un producto específico: nombre, descripción, precio, línea, categoría",
  inputSchema: z.object({
    name: z.string().describe("Nombre del producto a buscar"),
  }),
  execute: async ({ name }) => {
    const items = await db
      .select({
        id: products.id,
        name: products.name,
        description: products.description,
        price: products.price,
        category: products.category,
        line: products.line,
        available: products.available,
      })
      .from(products)
      .orderBy(products.sortOrder);

    const normalizedName = name.toLowerCase();
    const found = items.find(
      (p) => p.name?.toLowerCase().includes(normalizedName)
    );

    if (!found) {
      return "No encontré ese producto. ¿Querés que te muestre el menú completo?";
    }

    if (!found.available) {
      return `${found.name} no está disponible actualmente. ¿Querés ver qué otras opciones tenemos?`;
    }

    const categoryLabel: Record<string, string> = {
      hamburguesa: "Hamburguesa",
      acompañamiento: "Acompañamiento",
      pan_mayorista: "Pan al Por Mayor",
    };

    const lineLabel: Record<string, string> = {
      pollo: "Pollo",
      carne: "Carne",
      clasica: "Clásica",
      pan: "Pan",
    };

    return `🍔 ${found.name}
${found.description || "Sin descripción"}
💰 $${found.price}
📦 Categoría: ${categoryLabel[found.category ?? ""] ?? found.category}
🐔 Línea: ${lineLabel[found.line ?? ""] ?? found.line}`;
  },
});

// getProductPrice - Ver precio de un producto
export const getProductPriceTool = tool({
  description: "Obtiene el precio de un producto específico",
  inputSchema: z.object({
    name: z.string().describe("Nombre del producto"),
  }),
  execute: async ({ name }) => {
    const items = await db
      .select({ name: products.name, price: products.price, available: products.available })
      .from(products)
      .where(eq(products.available, true));

    const normalizedName = name.toLowerCase();
    const found = items.find((p) => p.name?.toLowerCase().includes(normalizedName));

    if (!found) {
      return "No encontré ese producto en el menú.";
    }

    return `💰 ${found.name}: $${found.price}`;
  },
});

// searchProducts - Buscar productos
export const searchProductsTool = tool({
  description: "Busca productos por nombre o descripción",
  inputSchema: z.object({
    query: z.string().describe("Término de búsqueda"),
  }),
  execute: async ({ query }) => {
    const items = await db
      .select({
        name: products.name,
        description: products.description,
        price: products.price,
        available: products.available,
      })
      .from(products)
      .where(eq(products.available, true));

    const normalizedQuery = query.toLowerCase();
    const filtered = items.filter(
      (p) =>
        p.name?.toLowerCase().includes(normalizedQuery) ||
        p.description?.toLowerCase().includes(normalizedQuery)
    );

    if (filtered.length === 0) {
      return `No encontré productos que coincidan con "${query}". ¿Querés ver el menú completo?`;
    }

    return filtered
      .map((p) => `• ${p.name} - $${p.price}${p.description ? ` — ${p.description}` : ""}`)
      .join("\n");
  },
});