import { tool } from "ai";
import { z } from "zod";
import { db } from "@/db";
import { products } from "@/db/schema";
import { eq, asc } from "drizzle-orm";

// ─── manageProduct: Herramientas de gestión de productos ──────────────────────

// getAllProducts - Ver todos los productos
export const getAllProducts = tool({
  description:
    "Lista todos los productos disponibles. Preguntas: 'qué productos tienen', 'menú completo'",
  inputSchema: z.object({}).optional(),
  execute: async () => {
    const rows = await db
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
      .where(eq(products.available, true))
      .orderBy(asc(products.sortOrder));

    const byCategory: Record<string, { name: string; price: string }[]> = {};

    for (const row of rows) {
      const cat = row.category ?? "otro";
      if (!byCategory[cat]) {
        byCategory[cat] = [];
      }
      byCategory[cat].push({
        name: row.name,
        price: `$${row.price}`,
      });
    }

    return {
      count: rows.length,
      products: rows.map((p) => ({
        id: p.id,
        name: p.name,
        price: p.price,
        category: p.category,
      })),
      byCategory,
    };
  },
});

// getProductsByCategory - Ver productos por categoría
export const getProductsByCategory = tool({
  description:
    "Lista productos por categoría. Preguntas: 'hamburguesas', 'acompañamientos', 'pan al por mayor'",
  inputSchema: z.object({
    category: z
      .enum(["hamburguesa", "acompanamiento", "pan_mayorista"])
      .describe("Categoría a listar"),
  }),
  execute: async ({ category }) => {
    const rows = await db
      .select({
        id: products.id,
        name: products.name,
        description: products.description,
        price: products.price,
        line: products.line,
        available: products.available,
      })
      .from(products)
      .where(eq(products.category, category))
      .orderBy(asc(products.sortOrder));

    const categoryLabels: Record<string, string> = {
      hamburguesa: "Hamburguesas",
      acompañamiento: "Acompañamientos",
      pan_mayorista: "Pan al Por Mayor",
    };

    return {
      category: categoryLabels[category] ?? category,
      count: rows.length,
      products: rows.map((p) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        price: p.price,
        line: p.line,
      })),
    };
  },
});

// getProductById - Ver un producto específico
export const getProductById = tool({
  description: "Consulta un producto por su ID. Preguntas: 'detalle del producto 5'",
  inputSchema: z.object({
    productId: z.number().describe("ID del producto"),
  }),
  execute: async ({ productId }) => {
    const [row] = await db
      .select({
        id: products.id,
        name: products.name,
        description: products.description,
        price: products.price,
        category: products.category,
        line: products.line,
        available: products.available,
        imageUrl: products.imageUrl,
      })
      .from(products)
      .where(eq(products.id, productId))
      .limit(1);

    if (!row) {
      return { error: "Producto no encontrado" };
    }

    return {
      id: row.id,
      name: row.name,
      description: row.description,
      price: row.price,
      category: row.category,
      line: row.line,
      available: row.available,
      image: row.imageUrl,
    };
  },
});

// searchProducts - Buscar productos
export const searchProducts = tool({
  description:
    "Busca productos por nombre. Preguntas: 'busca hamburguesa crispy', 'tiene vegetariano?'",
  inputSchema: z.object({
    query: z.string().describe("Término de búsqueda"),
  }),
  execute: async ({ query }) => {
    const rows = await db
      .select({
        id: products.id,
        name: products.name,
        description: products.description,
        price: products.price,
        category: products.category,
        available: products.available,
      })
      .from(products)
      .orderBy(asc(products.sortOrder));

    // Filtrar en memoria (contiene)
    const q = query.toLowerCase();
    const filtered = rows.filter(
      (p) =>
        p.name?.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q)
    );

    return {
      query,
      count: filtered.length,
      products: filtered.map((p) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        price: p.price,
        category: p.category,
      })),
    };
  },
});

// getProductAvailability - Ver disponibilidad
export const getProductAvailability = tool({
  description:
    "Verifica si un producto está disponible. Preguntas: 'tienen stock de X', 'hay crispy?'",
  inputSchema: z.object({
    productName: z.string().describe("Nombre del producto"),
  }),
  execute: async ({ productName }) => {
    const rows = await db
      .select({
        id: products.id,
        name: products.name,
        available: products.available,
        comingSoon: products.comingSoon,
      })
      .from(products);

    const q = productName.toLowerCase();
    const found = rows.find(
      (p) => p.name?.toLowerCase().includes(q)
    );

    if (!found) {
      return { available: false, message: "Producto no encontrado" };
    }

    if (!found.available) {
      return {
        available: false,
        message: found.comingSoon ? "Próximamente" : "Sin stock",
      };
    }

    return {
      available: true,
      name: found.name,
      message: "Disponible",
    };
  },
});

// Export all manageProduct tools
export const manageProductTools = {
  getAllProducts,
  getProductsByCategory,
  getProductById,
  searchProducts,
  getProductAvailability,
};