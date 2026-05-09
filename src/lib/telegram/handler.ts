import { generateText, stepCountIs } from "ai";
import { openai } from "@ai-sdk/openai";
import {
  sendTelegramMessage,
  downloadTelegramFile,
  type TelegramUpdate,
  type TelegramConfig,
  isChatAuthorized,
} from "./bot";
import { internalAgentTools } from "./tools";
import { INTERNAL_AGENT_SYSTEM_PROMPT } from "./system-prompt";
import { transcribeAudio } from "@/lib/media/transcription";

export type HandleResult =
  | { ok: true; replied: boolean; replyText?: string }
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
  let text = message.text?.trim() || "";

  // ── Audio/Voice → transcribir con Whisper ──
  const voiceOrAudio = message.voice || message.audio;
  if (!text && voiceOrAudio) {
    const file = await downloadTelegramFile(config.botToken, voiceOrAudio.file_id);
    if (file) {
      const transcription = await transcribeAudio(file.buffer, file.filePath);
      text = `[Audio]: ${transcription}`;
      console.log(`[telegram-handler] Audio transcribed: ${transcription.slice(0, 100)}`);
    } else {
      text = "[Audio sin transcripción]";
    }
  }

  // ── Nada que procesar ──
  if (!text) {
    return { ok: true, replied: false };
  }

  // ── Verificar autorización ──
  if (!isChatAuthorized(chatId, config.allowedChatIds)) {
    const unauthorizedReply =
      "❌ No autorizado. No tengo instrucciones de responder en este chat.";
    await sendTelegramMessage(config.botToken, chatId, unauthorizedReply);
    return { ok: true, replied: true, replyText: unauthorizedReply };
  }

  try {
    const result = await generateText({
      model: openai("gpt-5.4-mini"),
      system: INTERNAL_AGENT_SYSTEM_PROMPT,
      messages: [{ role: "user", content: text }],
      tools: internalAgentTools,
      stopWhen: stepCountIs(5),
    });

    const reply = result.text || "Disculpá, no pude procesar eso.";

    await sendTelegramMessage(config.botToken, chatId, reply);

    return { ok: true, replied: true, replyText: reply };
  } catch (error) {
    console.error("[telegram-handler] Error:", error);
    const errorReply =
      "❌ Tuve un error interno. Mandale 'hola' de nuevo si querés.";
    await sendTelegramMessage(config.botToken, chatId, errorReply);
    return { ok: true, replied: true, replyText: errorReply };
  }
}
