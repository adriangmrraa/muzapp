import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import {
  sendTelegramMessage,
  type TelegramUpdate,
  type TelegramConfig,
  isChatAuthorized,
} from "./bot";
import { internalAgentTools } from "./tools";
import { INTERNAL_AGENT_SYSTEM_PROMPT } from "./system-prompt";

export type HandleResult =
  | { ok: true; replied: boolean }
  | { ok: false; error: string };

/**
 * Procesa un update entrante de Telegram.
 * 1. Verifica que el chat_id esté autorizado
 * 2. Si no hay texto, ignora
 * 3. Ejecuta el agente interno con tools
 * 4. Envía la respuesta
 */
export async function handleTelegramUpdate(
  update: TelegramUpdate,
  config: TelegramConfig
): Promise<HandleResult> {
  const message = update.message;
  if (!message) {
    return { ok: true, replied: false }; // non-message update, ignore
  }

  const chatId = message.chat.id;
  const text = message.text?.trim();

  // ── Solo procesar mensajes de texto ──
  if (!text) {
    return { ok: true, replied: false };
  }

  // ── Verificar autorización ──
  if (!isChatAuthorized(chatId, config.allowedChatIds)) {
    await sendTelegramMessage(
      config.botToken,
      chatId,
      "❌ No autorizado. No tengo instrucciones de responder en este chat."
    );
    return { ok: true, replied: true };
  }

  try {
    const result = await generateText({
      model: openai("gpt-5-mini"),
      system: INTERNAL_AGENT_SYSTEM_PROMPT,
      messages: [{ role: "user", content: text }],
      tools: internalAgentTools,
    });

    const reply = result.text || "Disculpá, no pude procesar eso.";

    await sendTelegramMessage(config.botToken, chatId, reply);

    return { ok: true, replied: true };
  } catch (error) {
    console.error("[telegram-handler] Error:", error);
    await sendTelegramMessage(
      config.botToken,
      chatId,
      "❌ Tuve un error interno. Mandale 'hola' de nuevo si querés."
    );
    return { ok: true, replied: true };
  }
}
