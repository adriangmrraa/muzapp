import { tool } from "ai";
import { z } from "zod";
import { sendImage, sendDocument } from "@/lib/ycloud";

const BASE_URL =
  process.env.RENDER_EXTERNAL_URL?.replace(/\/$/, "") ||
  "https://muzapp.onrender.com";

/**
 * Tool: enviar imagen genérica al cliente (comprobantes, capturas, fotos).
 */
export function createSendImageTool(customerPhone: string) {
  return tool({
    description:
      "Envía una imagen al cliente desde una URL pública. Usar cuando el cliente pide una foto de un producto que no está en el menú, un comprobante, o cualquier imagen que no sea del menú.",
    inputSchema: z.object({
      imageUrl: z.string().url().describe("URL pública de la imagen a enviar"),
      caption: z.string().optional().describe("Texto opcional que acompaña la imagen"),
    }),
    execute: async ({ imageUrl, caption }) => {
      const result = await sendImage(customerPhone, imageUrl, caption);
      if (!result.ok) {
        console.warn("[sendImageTool] Failed:", result.error);
        return `No pude enviar la imagen. Error: ${result.error}`;
      }
      return `Imagen enviada${caption ? `: ${caption}` : ""} 📸`;
    },
  });
}

/**
 * Tool: enviar documento PDF al cliente.
 */
export function createSendDocumentTool(customerPhone: string) {
  return tool({
    description:
      "Envía un documento PDF al cliente desde una URL pública. Usar para enviar menús en PDF, facturas, listas de precios, etc.",
    inputSchema: z.object({
      documentUrl: z.string().url().describe("URL pública del documento PDF a enviar"),
      caption: z.string().optional().describe("Texto opcional que acompaña el documento"),
      fileName: z.string().optional().describe("Nombre del archivo que verá el cliente (ej: menu-muzzarella.pdf)"),
    }),
    execute: async ({ documentUrl, caption, fileName }) => {
      const result = await sendDocument(customerPhone, documentUrl, caption, fileName);
      if (!result.ok) {
        console.warn("[sendDocumentTool] Failed:", result.error);
        return `No pude enviar el documento. Error: ${result.error}`;
      }
      return `Documento enviado${caption ? `: ${caption}` : ""} 📄`;
    },
  });
}
