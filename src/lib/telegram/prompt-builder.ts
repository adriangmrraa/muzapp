import { db } from "@/db";
import { products, agentConfig } from "@/db/schema";
import { eq, and } from "drizzle-orm";

/**
 * Construye el system prompt del bot de Telegram con datos vivos de la DB:
 * - Promociones activas
 * - Menú de productos actualizado
 * - Estado de la cocina, stock, alias MP
 */
export async function buildTelegramPrompt(): Promise<string> {
  const { INTERNAL_AGENT_SYSTEM_PROMPT } = await import("./system-prompt");

  const sections: string[] = [];

  // ── Info del negocio (cocina, stock, alias) ──
  try {
    const config = await db.query.agentConfig.findFirst({
      where: (c) => eq(c.id, 1),
    });

    if (config) {
      const infoLines: string[] = [];
      infoLines.push(`ESTADO COCINA: ${config.isCooking ? "Abierta" : "Cerrada"}`);
      if (config.hamburguesasSinStock === true) {
        infoLines.push("HAMBURGUESAS SIN STOCK: No se están vendiendo hamburguesas. Solo pan mayorista.");
      } else {
        infoLines.push("HAMBURGUESAS: Con stock — se pueden vender");
      }
      if (typeof config.stockPanDocenas === "number") {
        infoLines.push(`STOCK PAN: ${config.stockPanDocenas} docenas`);
      }
      const alias: string[] = [];
      if (config.aliasB2c) alias.push(`Hamburguesas: ${config.aliasB2c}`);
      if (config.aliasB2b) alias.push(`Pan: ${config.aliasB2b}`);
      if (alias.length > 0) infoLines.push(`ALIAS MP: ${alias.join(" | ")}`);
      if (config.tiempoEspera) infoLines.push(`TIEMPO ESTIMADO: ${config.tiempoEspera}`);

      sections.push(`═══ INFO DEL NEGOCIO ═══\n${infoLines.join("\n")}`);
    }
  } catch {
    // non-fatal
  }

  // ── Promociones activas ──
  try {
    const config = await db.query.agentConfig.findFirst({
      where: (c) => eq(c.id, 1),
    });
    if (config?.whatsappPromociones && config.whatsappPromociones.trim()) {
      sections.push(`═══ PROMOCIONES ACTIVAS ═══\n${config.whatsappPromociones.trim()}`);
    }
  } catch {
    // non-fatal
  }

  // ── Menú de productos ──
  try {
    const items = await db
      .select({
        name: products.name,
        price: products.price,
        description: products.description,
        line: products.line,
        category: products.category,
      })
      .from(products)
      .where(and(eq(products.available, true), eq(products.comingSoon, false)))
      .orderBy(products.sortOrder);

    if (items.length > 0) {
      let menu = "═══ MENÚ ═══\n";
      const byLine: Record<string, string[]> = {};
      for (const item of items) {
        const line = item.line || "otros";
        const price = item.price ? `$${Number(item.price).toLocaleString("es-AR")}` : "a consultar";
        if (!byLine[line]) byLine[line] = [];
        byLine[line].push(`${item.name} (${price})`);
      }
      for (const [line, prods] of Object.entries(byLine)) {
        menu += `${line}: ${prods.join(", ")}\n`;
      }
      sections.push(menu);
    }
  } catch {
    // non-fatal
  }

  return sections.length > 0
    ? `${INTERNAL_AGENT_SYSTEM_PROMPT}\n\n${sections.join("\n\n")}`
    : INTERNAL_AGENT_SYSTEM_PROMPT;
}
