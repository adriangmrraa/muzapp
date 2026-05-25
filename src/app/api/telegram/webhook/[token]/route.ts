import { NextRequest, NextResponse } from "next/server";
import {
  getTelegramConfigFromDB,
  type TelegramUpdate,
  sendTelegramMessage,
  isChatAuthorized,
} from "@/lib/telegram/bot";
import { sendTelegramBubbles } from "@/lib/buffer/response-sender";
import {
  checkIdempotency,
  setIdempotency,
  createIdempotencyKey,
} from "@/lib/idempotency";
import { createCorrelationId, createLogger, logRequestReceived } from "@/lib/logger";
import { checkRateLimit, getRateLimitHeaders } from "@/lib/infra/rate-limit";
import {
  findOrCreateConversation,
  insertMessage,
  isMessageDuplicate,
  getConversationMessages,
  type MediaAttachment,
} from "@/lib/channels/router";
import { downloadTelegramFile } from "@/lib/telegram/bot";
import { transcribeAudio } from "@/lib/media/transcription";
import { processImageWithVision } from "@/lib/media/vision";
import { saveMediaLocally } from "@/lib/media/downloader";
import { BufferManager } from "@/lib/buffer/manager";
import { scheduleBufferProcessing } from "@/lib/buffer/processor";
import { generateText, stepCountIs } from "ai";
import { openai } from "@ai-sdk/openai";
import { internalAgentTools } from "@/lib/telegram/tools";
import { INTERNAL_AGENT_SYSTEM_PROMPT } from "@/lib/telegram/system-prompt";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const correlationId = createCorrelationId();
  const logger = createLogger(correlationId);

  try {
    const { token } = await params;

    // ── Get config from DB first, fallback to env ──
    const config = await getTelegramConfigFromDB();
    if (token !== config.webhookToken) {
      return NextResponse.json(
        { ok: false, error: "Invalid token" },
        { status: 401 }
      );
    }

    if (!config.enabled) {
      return NextResponse.json(
        { ok: false, error: "Bot disabled" },
        { status: 503 }
      );
    }

    // ── Rate limiting ──
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      request.headers.get("x-real-ip") ??
      "unknown";
    const rateCheck = await checkRateLimit(`telegram:${ip}`);
    if (!rateCheck.success) {
      return NextResponse.json(
        { ok: false, error: "Too many requests" },
        { status: 429, headers: getRateLimitHeaders(false, 0, rateCheck.limit) }
      );
    }

    // ── Parsear el update de Telegram ──
    const update: TelegramUpdate = await request.json();

    // ── Process message: text or media ──
    const message = update.message;
    if (!message) {
      return NextResponse.json({ ok: true });
    }

    let text = message.text?.trim() || "";
    let contentAttributes: MediaAttachment[] | undefined;
    let isMedia = false;

    // ── Voice / Audio → transcribe with Whisper ──
    if (!text && (message.voice || message.audio)) {
      isMedia = true;
      const vFile = message.voice || message.audio;
      if (vFile) {
        try {
          const file = await downloadTelegramFile(config.botToken, vFile.file_id);
          if (file) {
            // Save file using temp conv ID — will be re-attached to real conv later
            const tmpConv = await findOrCreateConversation("telegram", String(message.chat.id), message.from?.first_name);
            const localUrl = await saveMediaLocally(file.buffer, tmpConv.id, vFile.file_id, vFile.mime_type || "audio/ogg");
            const transcription = await transcribeAudio(file.buffer, vFile.file_id, vFile.mime_type);
            text = `[Audio]: ${transcription}`;
            contentAttributes = [{ type: "audio", url: localUrl, mimeType: vFile.mime_type || "audio/ogg", transcription, fileSize: (vFile as { file_size?: number }).file_size }];
          }
        } catch (e) {
          text = "[Audio sin transcripción]";
          console.warn("[tg] Audio processing failed:", e);
        }
      }
    }

    // ── Photo → Vision analysis ──
    if (!text && message.photo && message.photo.length > 0) {
      isMedia = true;
      const photo = message.photo[message.photo.length - 1];
      const caption = message.caption?.trim() || "";
      try {
        const file = await downloadTelegramFile(config.botToken, photo.file_id);
        if (file) {
          const tmpConv = await findOrCreateConversation("telegram", String(message.chat.id), message.from?.first_name);
          const localUrl = await saveMediaLocally(file.buffer, tmpConv.id, photo.file_id, "image/jpeg");
          const visionResult = await processImageWithVision(file.buffer, "image/jpeg", 0, 0, caption);
          text = caption ? `[Imagen "${caption}"]: ${visionResult.agentText}` : `[Imagen]: ${visionResult.agentText}`;
          contentAttributes = [{ type: "image", url: localUrl, caption, description: visionResult.agentText }];
        }
      } catch (e) {
        text = caption ? `[Imagen]: ${caption}` : "[Imagen sin descripción]";
        console.warn("[tg] Photo processing failed:", e);
      }
    }

    // ── Document / Video ──
    if (!text && (message.document || message.video)) {
      isMedia = true;
      const doc = message.document;
      const vid = message.video;
      const mediaItem = (doc || vid)!;
      const mediaType = doc ? "documento" : "video";
      const attType: MediaAttachment["type"] = doc ? "document" : "video";
      const caption = message.caption?.trim() || "";
      const fileName = doc?.file_name || vid?.file_id || "archivo";
      const mimeType = doc?.mime_type || vid?.mime_type || "application/octet-stream";
      const isImageType = doc?.mime_type?.startsWith("image/") ?? false;
      try {
        const file = await downloadTelegramFile(config.botToken, mediaItem.file_id);
        if (file) {
          const tmpConv = await findOrCreateConversation("telegram", String(message.chat.id), message.from?.first_name);
          const localUrl = await saveMediaLocally(file.buffer, tmpConv.id, fileName, mimeType);
          if (doc && isImageType) {
            const visionResult = await processImageWithVision(file.buffer, mimeType, 0, 0, caption);
            text = caption ? `[Imagen "${fileName}"]: ${visionResult.agentText}` : `[Imagen]: ${visionResult.agentText}`;
            contentAttributes = [{ type: "image", url: localUrl, fileName, mimeType, caption, description: visionResult.agentText, fileSize: mediaItem.file_size }];
          } else {
            text = caption ? `[${mediaType} "${fileName}"]: ${caption}` : `[${mediaType}]: ${fileName}`;
            contentAttributes = [{ type: attType, url: localUrl, fileName, mimeType, caption, fileSize: mediaItem.file_size }];
          }
        }
      } catch (e) {
        text = caption ? `[${mediaType}]: ${caption}` : `[${mediaType}]: ${fileName}`;
        console.warn(`[tg] ${mediaType} processing failed:`, e);
      }
    }

    // If still no text, skip
    if (!text) {
      return NextResponse.json({ ok: true });
    }

    const chatId = message.chat.id;
    const messageId = String(message.message_id);
    const senderName =
      message.from?.first_name ||
      message.from?.username ||
      String(chatId);

    // ── Idempotency check ──
    const idempotencyKey = createIdempotencyKey(message.chat.id, message.date);
    if (checkIdempotency(idempotencyKey)) {
      return NextResponse.json({ ok: true, duplicate: true });
    }
    setIdempotency(idempotencyKey);

    // Structured log
    logRequestReceived(logger, {
      messageId: correlationId,
      chatId,
      text: text.slice(0, 50),
    });

    // ── Authorization check ──
    if (!isChatAuthorized(chatId, config.allowedChatIds)) {
      const unauthorizedReply =
        "❌ No autorizado. No tengo instrucciones de responder en este chat.";
      await sendTelegramMessage(config.botToken, chatId, unauthorizedReply);
      return NextResponse.json({ ok: true });
    }

    // ── DB-level deduplication ──
    const duplicate = await isMessageDuplicate(messageId);
    if (duplicate) {
      return NextResponse.json({ ok: true, duplicate: true });
    }

    // ── Persistir conversación y mensaje entrante ──
    const conv = await findOrCreateConversation(
      "telegram",
      String(chatId),
      senderName
    );
    const convId = conv.id;
    await insertMessage(convId, "user", text, contentAttributes, messageId);

    // ── Enqueue message into buffer and schedule deferred processing ──
    await BufferManager.enqueue("telegram", String(chatId), {
      content: text,
      messageId,
      timestamp: Date.now(),
    });

    // Capture config values for the closure
    const botToken = config.botToken;

    // Fire-and-forget: webhook returns 200 immediately, processing happens in background
    scheduleBufferProcessing("telegram", String(chatId), async (bufferedMessages) => {
      // Concatenate all buffered messages
      const combinedText = bufferedMessages.map((m) => m.content).join("\n");

      // Get conversation history for persistent context (last 6 messages)
      const history = await getConversationMessages(convId, 6);
      const aiMessages = history
        .filter((m) => m.role === "user" || m.role === "assistant")
        .map((m) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        }));

      // If buffer had multiple messages, replace last user turn with combined text
      if (bufferedMessages.length > 1) {
        const lastUserIdx = [...aiMessages].reverse().findIndex((m) => m.role === "user");
        if (lastUserIdx !== -1) {
          const realIdx = aiMessages.length - 1 - lastUserIdx;
          aiMessages[realIdx] = { role: "user", content: combinedText };
        }
      }

      // Run the internal agent with full conversation history
      const result = await generateText({
        model: openai("gpt-4o-mini"),
        system: INTERNAL_AGENT_SYSTEM_PROMPT,
        messages: aiMessages,
        tools: internalAgentTools,
        stopWhen: stepCountIs(10),
      });

      const reply = result.text || "Disculpá, no pude procesar eso.";

      // Persist assistant response
      await insertMessage(convId, "assistant", reply);

      // Send reply via Telegram (split into bubbles for natural UX)
      await sendTelegramBubbles({ botToken, chatId: Number(chatId), text: reply });
    }).catch((err) => {
      logger.error({ event: "buffer_processing_error", error: err instanceof Error ? err.message : String(err) }, "Buffer processing error");
    });

    // Telegram espera 200 OK siempre (incluso si ignoramos el update)
    return NextResponse.json({ ok: true });
  } catch (error) {
    logger.error({ event: "request_error", error: error instanceof Error ? error.message : "Unknown" }, "Request error");
    return NextResponse.json({ ok: false, error: "Internal error" }, { status: 500 });
  }
}
