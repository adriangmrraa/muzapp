import { tool } from "ai";
import { z } from "zod";
import { sendImage } from "@/lib/ycloud";
import fs from "fs";
import path from "path";

// ─── STICKERS ───────────────────────────────────────────────────────────────
// Stickers de confirmación estilo Ed, Edd y Eddy / Flama
// Se almacenan como imágenes en public/assets/images/stickers/

const STICKER_DIR = path.join(process.cwd(), "public", "assets", "images", "stickers");

const STICKER_MAP: Record<string, { file: string; emoji: string }> = {
  flama: { file: "flama.webp", emoji: "🔥" },
  ok: { file: "ok.webp", emoji: "👍" },
  dale: { file: "dale.webp", emoji: "✅" },
  corazon: { file: "corazon.webp", emoji: "❤️" },
};

type StickerName = keyof typeof STICKER_MAP;

function stickerExists(name: StickerName): boolean {
  try {
    const filePath = path.join(STICKER_DIR, STICKER_MAP[name].file);
    return fs.existsSync(filePath);
  } catch {
    return false;
  }
}

// ─── sendSticker ────────────────────────────────────────────────────────────
export function createSendStickerTool(customerPhone: string) {
  return tool({
    description:
      "Envía un sticker de confirmación al cliente. Usar después de confirmar pedido, pago recibido, o cuando el cliente confirma algo. Stickers: flama (🔥 épico), ok (👍 confirmación), dale (✅ aprobación).",
    inputSchema: z.object({
      sticker: z
        .enum(["flama", "ok", "dale"])
        .describe("Sticker: flama (confirmación épica), ok (okey), dale (dale nomás)"),
    }),
    execute: async ({ sticker }) => {
      const info = STICKER_MAP[sticker as StickerName];
      if (!info) return "No tengo ese sticker.";

      // Si la imagen existe, enviarla
      if (stickerExists(sticker as StickerName)) {
        const baseUrl =
          process.env.RENDER_EXTERNAL_URL?.replace(/\/$/, "") ||
          "https://muzapp.onrender.com";
        const imageUrl = `${baseUrl}/assets/images/stickers/${info.file}`;

        const result = await sendImage(customerPhone, imageUrl, info.emoji);
        if (!result.ok) {
          console.warn("[sticker] Send failed, using emoji fallback:", result.error);
          // Fallback: solo emoji
          return `Sticker no disponible, pero vale lo mismo ${info.emoji}`;
        }
        return `Sticker enviado ${info.emoji}`;
      }

      // Fallback: emoji nomas
      return info.emoji;
    },
  });
}

// ─── sendMenuImage ──────────────────────────────────────────────────────────
export function createSendMenuImageTool(customerPhone: string) {
  return tool({
    description:
      "Envía la foto del menú al cliente. Usar cuando piden 'menu', 'carta', 'que tienen'. El agente no necesita especificar tipo, se detecta automáticamente del contexto.",
    inputSchema: z.object({
      tipo: z
        .enum(["hamburguesas", "pan"])
        .optional()
        .default("hamburguesas")
        .describe("Tipo: hamburguesas (menu completo) o pan (solo panaderia)"),
    }),
    execute: async ({ tipo }) => {
      const baseUrl =
        process.env.RENDER_EXTERNAL_URL?.replace(/\/$/, "") ||
        "https://muzapp.onrender.com";

      // Try to get from DB first (configurable from admin UI)
      try {
        const { db } = await import("@/db");
        const { agentConfig } = await import("@/db/schema");
        const { eq } = await import("drizzle-orm");

        const rows = await db
          .select({
            hamb: agentConfig.menuImageUrlHamburguesas,
            pan: agentConfig.menuImageUrlPan,
          })
          .from(agentConfig)
          .where(eq(agentConfig.id, 1))
          .limit(1);

        const config = rows[0];
        const dbUrl = tipo === "hamburguesas" ? config?.hamb : config?.pan;

        if (dbUrl) {
          const absoluteUrl = dbUrl.startsWith("http") ? dbUrl : `${baseUrl}${dbUrl}`;
          const result = await sendImage(customerPhone, absoluteUrl, "Acá tenés el menú amigo ❤️");
          if (result.ok) return `Te mandé el menú 📸`;
          console.warn("[menuImage] DB URL failed, trying fallback:", result.error);
        }
      } catch (err) {
        console.warn("[menuImage] DB query failed, using fallback:", err);
      }

      // Fallback: archivos estáticos
      const filename = tipo === "hamburguesas" ? "menu-pizzas.jpeg" : "menu-pan.jpeg";
      const imageUrl = `${baseUrl}/assets/images/${filename}`;

      const caption = "Acá tenés el menú amigo ❤️";
      const result = await sendImage(customerPhone, imageUrl, caption);

      if (!result.ok) {
        console.error("[menuImage] Error:", result.error);
        return "No pude mandar la foto, dejamé te digo lo que tenemos.";
      }

      return `Te mandé el menú 📸`;
    },
  });
}
