import { sendWhatsAppMessage } from "@/lib/whatsapp/ycloud-client";
import { sendTelegramMessage } from "@/lib/telegram/bot";

const MAX_BUBBLE_CHARS = 400;
const DELAY_BETWEEN_BUBBLES_MS = 2_500; // 2.5s feels natural

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Split text into bubbles: first by paragraphs, then by sentences if too long
export function splitIntoBubbles(text: string): string[] {
  if (text.length <= MAX_BUBBLE_CHARS) return [text];

  const paragraphs = text.split(/\n\n+/).filter((p) => p.trim());
  const bubbles: string[] = [];

  for (const para of paragraphs) {
    if (para.length <= MAX_BUBBLE_CHARS) {
      bubbles.push(para.trim());
      continue;
    }

    // Split long paragraph by sentences
    const sentences = para.split(/(?<=[.!?])\s+/).filter((s) => s.trim());
    let current = "";

    for (const sentence of sentences) {
      if (current.length + sentence.length + 1 > MAX_BUBBLE_CHARS) {
        if (current) bubbles.push(current.trim());
        current = sentence;
      } else {
        current = current ? `${current} ${sentence}` : sentence;
      }
    }
    if (current) bubbles.push(current.trim());
  }

  return bubbles.length > 0 ? bubbles : [text.slice(0, MAX_BUBBLE_CHARS)];
}

// Send response as bubbles via WhatsApp (YCloud)
export async function sendWhatsAppBubbles(params: {
  to: string;
  text: string;
  apiKey: string;
  from: string;
}): Promise<void> {
  const bubbles = splitIntoBubbles(params.text);

  for (let i = 0; i < bubbles.length; i++) {
    if (i > 0) {
      // Typing indicator + delay between bubbles
      await sendTypingIndicator("whatsapp", params.to, params.apiKey, params.from);
      await sleep(DELAY_BETWEEN_BUBBLES_MS);
    }

    await sendWhatsAppMessage({
      to: params.to,
      body: bubbles[i],
      apiKey: params.apiKey,
      from: params.from,
    });
  }
}

// Send response as bubbles via Telegram
export async function sendTelegramBubbles(params: {
  botToken: string;
  chatId: number;
  text: string;
}): Promise<void> {
  const bubbles = splitIntoBubbles(params.text);

  for (let i = 0; i < bubbles.length; i++) {
    if (i > 0) {
      await sendTypingIndicator("telegram", String(params.chatId), params.botToken);
      await sleep(DELAY_BETWEEN_BUBBLES_MS);
    }

    await sendTelegramMessage(params.botToken, params.chatId, bubbles[i]);
  }
}

// Send typing indicator per channel
async function sendTypingIndicator(
  channel: "whatsapp" | "telegram",
  userId: string,
  tokenOrApiKey: string,
  from?: string
): Promise<void> {
  try {
    if (channel === "telegram") {
      await fetch(`https://api.telegram.org/bot${tokenOrApiKey}/sendChatAction`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: Number(userId), action: "typing" }),
        signal: AbortSignal.timeout(5_000),
      });
    }
    // YCloud WhatsApp doesn't have a native typing indicator API
    // The delay between bubbles naturally simulates "typing"
    void from; // suppress unused warning
  } catch (err) {
    // Non-fatal — just skip the indicator
    console.warn("[response-sender] Typing indicator failed:", err);
  }
}
