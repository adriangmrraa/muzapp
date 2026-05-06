import { tool } from "ai";
import { z } from "zod";
import { sendText } from "@/lib/ycloud";

// ─── WhatsApp Tools: Herramientas de comunicación por WhatsApp ───────────────

// sendWhatsAppMessage - Enviar mensaje de WhatsApp a un cliente
export const sendWhatsAppMessage = tool({
  description:
    "Envía un mensaje de WhatsApp a un número de teléfono. Preguntas: 'mandar mensaje a cliente', 'enviar WhatsApp', 'notificar por WhatsApp'",
  inputSchema: z.object({
    to: z.string().describe("Número de teléfono del destinatario (con código de país, ej: 5491112345678)"),
    message: z.string().describe("Texto del mensaje a enviar"),
  }),
  execute: async ({ to, message }) => {
    const result = await sendText(to, message);

    if (!result.ok) {
      return {
        success: false,
        message: `Error al enviar WhatsApp: ${result.error}`,
      };
    }

    return {
      success: true,
      message: `Mensaje enviado correctamente a ${to}`,
    };
  },
});

// Export all WhatsApp tools
export const whatsAppTools = {
  sendWhatsAppMessage,
};
