import { db } from "@/db";
import { products } from "@/db/schema";
import { eq } from "drizzle-orm";
import { normalizePhone, isValidPhone as normalizedIsValid } from "@/lib/phone-utils";

type InputItem = { name: string; quantity: number; price?: number; unitPrice?: number };
type ResolvedItem = { name: string; quantity: number; price: number; unitPrice: number };

// FIX CRITICAL: resolveItems() IGNORA item.price e item.unitPrice del LLM.
// Solo usa precios reales de la DB. Si no hay match en DB, unitPrice = 0.
// Ver: docs/aprendizaje-chats-dueno.md + sdd/rediseno-bot-ventas/

// ─── Validar teléfono Argentino ────────────────────────────────────────
/**
 * @deprecated Usar `normalizePhone()` de `@/lib/phone-utils` en nuevos desarrollos.
 * Esta función se mantiene por retrocompatibilidad.
 */
export function cleanPhone(phone: string): string {
  return normalizePhone(phone);
}

/**
 * @deprecated Usar `isValidPhone()` de `@/lib/phone-utils` en nuevos desarrollos.
 */
export function isValidPhone(phone: string): boolean {
  return normalizedIsValid(phone);
}

/**
 * Resuelve items contra productos reales de la DB.
 * Busca el nombre más parecido en la DB y devuelve el nombre + precio REAL.
 * Si no encuentra match, devuelve el item original con price y unitPrice normalizados.
 */
export async function resolveItems(items: InputItem[]): Promise<ResolvedItem[]> {
  try {
    const dbProducts = await db
      .select({ name: products.name, price: products.price })
      .from(products)
      .where(eq(products.available, true));

    return items.map((item) => {
      const input = item.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
      const match = dbProducts.find((p) => {
        const pName = p.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
        return pName === input || pName.includes(input) || input.includes(pName);
      });

      if (match) {
        const realPrice = Number(match.price);
        return {
          name: match.name,
          quantity: item.quantity,
          price: realPrice,       // ✅ SIEMPRE precio real de DB
          unitPrice: realPrice,   // ✅ IGNORA item.unitPrice del LLM
        };
      }

      return {
        name: item.name,
        quantity: item.quantity,
        price: 0,                 // Sin match → 0 (admin lo corrige)
        unitPrice: 0,
      };
    });
  } catch {
    return items.map((item) => ({
      name: item.name,
      quantity: item.quantity,
      price: 0,                   // DB caída → 0 (admin lo corrige)
      unitPrice: 0,
    }));
  }
}
