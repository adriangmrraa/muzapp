import { tool } from "ai";
import { z } from "zod";
import { db } from "@/db";
import { agentConfig } from "@/db/schema";
import { eq } from "drizzle-orm";

// ─── checkKitchenStatus ─────────────────────────────────────────────────────
// Consulta si la cocina está operativa (is_cooking)
export const checkKitchenStatusTool = tool({
  description:
    "Verifica si la cocina está operativa. Si isCooking=false, el local NO está cocinando hoy.",
  inputSchema: z.object({}),
  execute: async () => {
    try {
      const rows = await db
        .select({ isCooking: agentConfig.isCooking })
        .from(agentConfig)
        .where(eq(agentConfig.id, 1))
        .limit(1);

      const cooking = rows[0]?.isCooking ?? true;
      return { isCooking: cooking };
    } catch {
      return { isCooking: true }; // fallback: asumir que sí
    }
  },
});

// ─── checkPanStock ──────────────────────────────────────────────────────────
// Consulta stock de pan al por mayor en docenas
export const checkPanStockTool = tool({
  description:
    "Consulta el stock de pan al por mayor disponible (en docenas). Usar cuando pidan pan para negocio.",
  inputSchema: z.object({}),
  execute: async () => {
    try {
      const rows = await db
        .select({ stock: agentConfig.stockPanDocenas })
        .from(agentConfig)
        .where(eq(agentConfig.id, 1))
        .limit(1);

      const stock = rows[0]?.stock ?? 0;
      return { docenasDisponibles: stock };
    } catch {
      return { docenasDisponibles: 0 };
    }
  },
});

// ─── getPaymentAlias ────────────────────────────────────────────────────────
// Obtiene el alias de pago según tipo: b2c (hamburguesas) o b2b (pan mayorista)
export const getPaymentAliasTool = tool({
  description:
    "Obtiene el alias de Mercado Pago para transferencias. Usar b2c para hamburguesas, b2b para pan mayorista.",
  inputSchema: z.object({
    tipo: z
      .enum(["b2c", "b2b"])
      .describe("b2c = hamburguesas (alias particular), b2b = pan mayorista (alias negocio)"),
  }),
  execute: async ({ tipo }) => {
    try {
      const rows = await db
        .select({
          aliasB2c: agentConfig.aliasB2c,
          aliasB2b: agentConfig.aliasB2b,
        })
        .from(agentConfig)
        .where(eq(agentConfig.id, 1))
        .limit(1);

      const config = rows[0];
      const alias = tipo === "b2b" ? config?.aliasB2b : config?.aliasB2c;

      if (!alias) {
        return { tieneAlias: false, tipo, mensaje: `No hay alias configurado para ${tipo}.` };
      }
      return { tieneAlias: true, tipo, alias };
    } catch {
      return { tieneAlias: false, mensaje: "Error al consultar alias." };
    }
  },
});
