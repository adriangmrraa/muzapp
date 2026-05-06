import { NextRequest, NextResponse } from "next/server";
import {
  handleTelegramUpdate,
} from "@/lib/telegram/handler";
import {
  getTelegramConfigFromEnv,
  type TelegramUpdate,
} from "@/lib/telegram/bot";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
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

    // ── Parsear el update de Telegram ──
    const update: TelegramUpdate = await request.json();

    // ── Procesar con el agente interno ──
    const result = await handleTelegramUpdate(update, config);

    if (!result.ok) {
      console.error("[telegram-webhook] Handler error:", result.error);
    }

    // Telegram espera 200 OK siempre (incluso si ignoramos el update)
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[telegram-webhook] Error:", error);
    return NextResponse.json({ ok: false, error: "Internal error" }, { status: 500 });
  }
}
