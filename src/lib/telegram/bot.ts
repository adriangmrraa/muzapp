// ─── Types ───────────────────────────────────────────────────────────────────

export type TelegramUpdate = {
  update_id: number;
  message?: {
    message_id: number;
    chat: { id: number; type: string; first_name?: string; username?: string };
    from: { id: number; is_bot: boolean; first_name?: string; username?: string };
    text?: string;
    date: number;
  };
};

export type TelegramConfig = {
  botToken: string;
  webhookToken: string;
  allowedChatIds: number[];
  enabled: boolean;
};

// ─── API helpers ─────────────────────────────────────────────────────────────

const TELEGRAM_API = "https://api.telegram.org/bot";

function apiUrl(token: string, method: string): string {
  return `${TELEGRAM_API}${token}/${method}`;
}

export async function sendTelegramMessage(
  token: string,
  chatId: number,
  text: string,
  parseMode: "HTML" | "Markdown" | null = null
): Promise<{ ok: boolean; error?: string }> {
  try {
    const body: Record<string, unknown> = {
      chat_id: chatId,
      text,
    };
    if (parseMode) body.parse_mode = parseMode;

    const res = await fetch(apiUrl(token, "sendMessage"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      return { ok: false, error: errBody?.description ?? `HTTP ${res.status}` };
    }

    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function setTelegramWebhook(
  token: string,
  webhookUrl: string
): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch(apiUrl(token, "setWebhook"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: webhookUrl }),
    });

    const data = await res.json();
    if (!data.ok) {
      return { ok: false, error: data.description ?? "Error desconocido" };
    }

    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function deleteTelegramWebhook(
  token: string
): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch(apiUrl(token, "deleteWebhook"), {
      method: "POST",
    });

    const data = await res.json();
    if (!data.ok) {
      return { ok: false, error: data.description ?? "Error desconocido" };
    }

    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function getTelegramWebhookInfo(
  token: string
): Promise<{
  ok: boolean;
  url?: string;
  pendingUpdateCount?: number;
  error?: string;
}> {
  try {
    const res = await fetch(apiUrl(token, "getWebhookInfo"));

    const data = await res.json();
    if (!data.ok) {
      return { ok: false, error: data.description ?? "Error desconocido" };
    }

    return {
      ok: true,
      url: data.result.url,
      pendingUpdateCount: data.result.pending_update_count,
    };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function getMe(
  token: string
): Promise<{ ok: boolean; username?: string; error?: string }> {
  try {
    const res = await fetch(apiUrl(token, "getMe"));
    const data = await res.json();
    if (!data.ok) {
      return { ok: false, error: data.description ?? "Error desconocido" };
    }
    return { ok: true, username: data.result.username };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

// ─── Config helpers ──────────────────────────────────────────────────────────

export function getTelegramConfigFromEnv(): TelegramConfig {
  const botToken = process.env.TELEGRAM_BOT_TOKEN ?? "";
  const webhookToken = process.env.TELEGRAM_WEBHOOK_TOKEN ?? "muzapp-telegram-default";
  const rawIds = process.env.TELEGRAM_ALLOWED_CHAT_IDS ?? "";
  const allowedChatIds = rawIds
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .map(Number)
    .filter((n) => !isNaN(n));

  return {
    botToken,
    webhookToken,
    allowedChatIds,
    enabled: botToken.length > 0,
  };
}

export function isChatAuthorized(
  chatId: number,
  allowedChatIds: number[]
): boolean {
  return allowedChatIds.length === 0 || allowedChatIds.includes(chatId);
}
