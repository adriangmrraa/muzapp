import { NextRequest, NextResponse } from "next/server";
import { handleTelegramUpdate } from "@/lib/telegram/handler";
import {
  getTelegramConfigFromDB,
  type TelegramUpdate,
} from "@/lib/telegram/bot";
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

    // ── Idempotency check ──
    const message = update.message;
    if (message) {
      const key = createIdempotencyKey(message.chat.id, message.date);
      if (checkIdempotency(key)) {
        return NextResponse.json({ ok: true, duplicate: true });
      }
      setIdempotency(key);

      // Structured log
      logRequestReceived(logger, {
        messageId: correlationId,
        chatId: message.chat.id,
        text: message.text?.slice(0, 50),
      });
    }

    // ── Persistir conversación y mensaje entrante ──
    let convId: number | null = null;
    if (message?.text?.trim()) {
      const chatId = message.chat.id;
      const text = message.text.trim();
      const messageId = String(message.message_id);
      const senderName =
        message.from?.first_name ||
        message.from?.username ||
        String(chatId);

      // DB-level deduplication (complementa el in-memory check)
      const duplicate = await isMessageDuplicate(messageId);
      if (!duplicate) {
        const conv = await findOrCreateConversation(
          "telegram",
          String(chatId),
          senderName
        );
        convId = conv.id;
        await insertMessage(conv.id, "user", text, undefined, messageId);
      }
    }

    // ── Procesar con el agente interno ──
    const result = await handleTelegramUpdate(update, config);

    if (!result.ok) {
      logger.error({ event: "handler_error", error: result.error }, "Handler error");
    }

    // ── Persistir respuesta del bot ──
    if (convId !== null && result.ok && result.replyText) {
      await insertMessage(convId, "assistant", result.replyText);
    }

    // Telegram espera 200 OK siempre (incluso si ignoramos el update)
    return NextResponse.json({ ok: true });
  } catch (error) {
    logger.error({ event: "request_error", error: error instanceof Error ? error.message : "Unknown" }, "Request error");
    return NextResponse.json({ ok: false, error: "Internal error" }, { status: 500 });
  }
}
