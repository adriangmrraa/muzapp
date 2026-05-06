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
} from "@/lib/channels/router";
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

    // ── Only process text messages ──
    const message = update.message;
    if (!message?.text?.trim()) {
      // Non-text updates — ack immediately
      return NextResponse.json({ ok: true });
    }

    const chatId = message.chat.id;
    const text = message.text.trim();
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
    await insertMessage(convId, "user", text, undefined, messageId);

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

      // Run the internal agent with combined text
      const result = await generateText({
        model: openai("gpt-5.4-mini"),
        system: INTERNAL_AGENT_SYSTEM_PROMPT,
        messages: [{ role: "user", content: combinedText }],
        tools: internalAgentTools,
        stopWhen: stepCountIs(5),
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
