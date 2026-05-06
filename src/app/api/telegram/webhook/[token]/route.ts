import { NextRequest, NextResponse } from "next/server";
import {
  handleTelegramUpdate,
} from "@/lib/telegram/handler";
import {
  getTelegramConfigFromEnv,
  type TelegramUpdate,
} from "@/lib/telegram/bot";
import {
  checkIdempotency,
  setIdempotency,
  createIdempotencyKey,
} from "@/lib/idempotency";
import { createCorrelationId, createLogger, logRequestReceived } from "@/lib/logger";
import { checkRateLimit, getRateLimitHeaders } from "@/lib/infra/rate-limit";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const correlationId = createCorrelationId();
  const logger = createLogger(correlationId);
  
  try {
    const { token } = await params;

    // ── Verificar access token ──
    const config = getTelegramConfigFromEnv();
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

    // ── Procesar con el agente interno ──
    const result = await handleTelegramUpdate(update, config);

    if (!result.ok) {
      logger.error({ event: "handler_error", error: result.error }, "Handler error");
    }

    // Telegram espera 200 OK siempre (incluso si ignoramos el update)
    return NextResponse.json({ ok: true });
  } catch (error) {
    logger.error({ event: "request_error", error: error instanceof Error ? error.message : "Unknown" }, "Request error");
    return NextResponse.json({ ok: false, error: "Internal error" }, { status: 500 });
  }
}
